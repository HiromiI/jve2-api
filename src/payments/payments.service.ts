import {
  BadRequestException,
  Logger,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './entities/payment.entity';

type PagarmeTokenResponse = {
  id?: string;
  name?: string;
  number?: string;
  security_code?: string;
  card?: {
    id?: string;
    holder_name?: string;
    holder_document?: string;
    cvv?: string;
  };
  [key: string]: unknown;
};

type PagarmeErrorResponse = {
  message?: string;
  errors?: Record<string, unknown>;
  request?: Record<string, unknown>;
  gateway_response?: {
    code?: string;
    errors?: Array<{
      message?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type PagarmeCancelSubscriptionResponse = {
  id?: string;
  status?: string;
  [key: string]: unknown;
};

type PagarmeSubscriptionResponse = {
  id?: string;
  status?: string;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    document?: string;
  };
  [key: string]: unknown;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: number, createPaymentDto: CreatePaymentDto) {
    const [course, user] = await Promise.all([
      this.findEligibleCourse(createPaymentDto.courseId),
      this.findActiveUser(userId),
    ]);

    const attemptId = this.createAttemptId(user.id, course.id);
    const pagarmeEmail = this.resolvePagarmeEmail(user);

    const tokenResponse = await this.createCardToken(createPaymentDto, attemptId);
    const subscriptionResponse = await this.createSubscription({
      attemptId,
      course,
      user,
      pagarmeEmail,
      createPaymentDto,
      tokenResponse,
    });
    const savedPayment = await this.paymentsRepository.save(
      this.paymentsRepository.create({
        userId: user.id,
        courseId: course.id,
        planCode: course.planCode?.trim() ?? '',
        paymentMethod: 'credit_card',
        installments: 1,
        amount: course.price ?? '0.00',
        pagarmeTokenId: tokenResponse.id ?? null,
        pagarmeSubscriptionId: subscriptionResponse.id ?? null,
        active: 'Y',
        gatewayResponse: JSON.stringify({
          subscription: subscriptionResponse,
        }),
      }),
    );

    return {
      message: 'Pagamento realizado com sucesso!',
      paymentId: savedPayment.id,
    };
  }

  async cancelSubscription(userId: number, paymentId: number) {
    const payment = await this.paymentsRepository.findOne({
      where: {
        id: paymentId,
        userId,
        active: 'Y',
        deletedAt: IsNull(),
      },
    });

    if (!payment) {
      throw new NotFoundException('Assinatura não encontrada.');
    }

    if (!payment.pagarmeSubscriptionId?.trim()) {
      this.logger.error(`Payment ${payment.id} is missing pagarmeSubscriptionId.`);
      throw new BadRequestException({
        code: 'PAGARME_SUBSCRIPTION_CANCEL_ERROR',
        message: 'Não foi possível cancelar a assinatura. Tente novamente.',
      });
    }

    const cancelResponse = await this.cancelSubscriptionOnPagarme(payment.pagarmeSubscriptionId);

    payment.deletedAt = new Date();
    payment.active = 'N';
    payment.gatewayResponse = this.mergeGatewayResponse(payment.gatewayResponse, {
      cancel: cancelResponse,
    });

    await this.paymentsRepository.save(payment);

    return {
      message: 'Assinatura cancelada com sucesso!',
      paymentId: payment.id,
    };
  }

  async cancelActiveSubscriptionsForUser(userId: number) {
    const payments = await this.paymentsRepository.find({
      where: {
        userId,
        active: 'Y',
        deletedAt: IsNull(),
      },
      order: {
        createdAt: 'ASC',
      },
    });

    for (const payment of payments) {
      if (!payment.pagarmeSubscriptionId?.trim()) {
        this.logger.error(`Payment ${payment.id} is missing pagarmeSubscriptionId.`);
        throw new BadRequestException({
          code: 'PAGARME_SUBSCRIPTION_CANCEL_ERROR',
          message: 'Não foi possível excluir a conta. Tente novamente.',
        });
      }

      await this.cancelSubscriptionOnPagarme(payment.pagarmeSubscriptionId);
    }

    return payments;
  }

  async archivePayments(payments: Payment[], deletedAt: Date) {
    if (payments.length === 0) {
      return [];
    }

    payments.forEach((payment) => {
      payment.active = 'N';
      payment.deletedAt = deletedAt;
    });

    return this.paymentsRepository.save(payments);
  }

  private async findEligibleCourse(courseId: number) {
    const course = await this.coursesRepository.findOne({
      where: {
        id: courseId,
        deletedAt: IsNull(),
      },
    });

    if (!course || !course.planCode?.trim() || !course.price) {
      throw new NotFoundException('Curso não encontrado para contratação.');
    }

    return course;
  }

  private async findActiveUser(userId: number) {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
        active: true,
        deletedAt: IsNull(),
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  private async createCardToken(createPaymentDto: CreatePaymentDto, attemptId: string) {
    const publicKey = this.configService.get<string>('PAGARME_PUBLIC_KEY')?.trim();

    if (!publicKey) {
      throw new InternalServerErrorException('Chave pública do PagarMe não configurada.');
    }

    const expirationMonth = Number(createPaymentDto.cardExpirationDate.slice(0, 2));
    const expirationYear = Number(`20${createPaymentDto.cardExpirationDate.slice(2, 4)}`);

    const response = await fetch(
      `https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(publicKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'card',
          card: {
            number: createPaymentDto.cardNumber,
            holder_name: createPaymentDto.cardHolderName,
            holder_document: createPaymentDto.cardHolderDocument,
            exp_month: expirationMonth,
            exp_year: expirationYear,
            cvv: createPaymentDto.cardSecurityCode,
          },
        }),
      },
    );

    const responseBody = await response.text();

    if (!response.ok) {
      this.logPagarmeFailure('token', response.status, responseBody, {
        attemptId,
        cardBin: this.extractCardBin(createPaymentDto.cardNumber),
        cardEnding: createPaymentDto.cardNumber.slice(-4),
        expMonth: expirationMonth,
        expYear: expirationYear,
        publicKey: this.maskSecret(publicKey),
      });
      throw this.buildTokenError();
    }

    const tokenResponse = responseBody ? (JSON.parse(responseBody) as PagarmeTokenResponse) : {};
    const tokenId = this.extractTokenId(tokenResponse);
    const securityCode = this.extractTokenSecurityCode(tokenResponse, createPaymentDto.cardSecurityCode);
    const document = this.extractTokenDocument(tokenResponse, createPaymentDto.cardHolderDocument);
    const name = this.extractTokenName(tokenResponse, createPaymentDto.cardHolderName);

    if (!tokenId || !securityCode || !document || !name) {
      this.logger.error(
        `PagarMe token response missing required fields. tokenId=${Boolean(tokenId)}, securityCode=${Boolean(
          securityCode,
        )}, document=${Boolean(document)}, name=${Boolean(name)}; body=${responseBody}`,
      );
      throw this.buildTokenError();
    }

    return {
      id: tokenId,
      name,
      number: document,
      security_code: securityCode,
    };
  }

  private async createSubscription(args: {
    attemptId: string;
    course: Course;
    user: User;
    pagarmeEmail: string;
    createPaymentDto: CreatePaymentDto;
    tokenResponse: {
      id: string;
      name: string;
      number: string;
      security_code: string;
    };
  }) {
    const secretKey = this.configService.get<string>('PAGARME_SECRET_KEY')?.trim();

    if (!secretKey) {
      throw new InternalServerErrorException('Chave secreta do PagarMe não configurada.');
    }

    const phoneDigits = args.createPaymentDto.phone;
    const areaCode = phoneDigits.slice(0, 2);
    const number = phoneDigits.slice(2);
    const subscriptionData = {
      payment_method: 'credit_card',
      plan_id: args.course.planCode?.trim(),
      installments: 1,
      customer: {
        name: args.tokenResponse.name,
        document_type: 'CPF',
        document: args.tokenResponse.number,
        type: 'individual',
        phones: {
          home_phone: {
            country_code: '55',
            area_code: areaCode,
            number,
          },
        },
        address: this.buildSubscriptionAddress(args.createPaymentDto),
        email: args.pagarmeEmail,
      },
      card: {
        billing_address: this.buildSubscriptionAddress(args.createPaymentDto),
        cvv: args.tokenResponse.security_code,
      },
      card_token: args.tokenResponse.id,
    };

    const response = await fetch('https://api.pagar.me/core/v5/subscriptions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
      },
      body: JSON.stringify(subscriptionData),
    });

    const responseBody = await response.text();

    if (!response.ok) {
      this.logPagarmeFailure('subscription', response.status, responseBody, {
        attemptId: args.attemptId,
        tokenId: args.tokenResponse.id,
        planId: args.course.planCode?.trim(),
      });
      throw this.buildSubscriptionError();
    }

    const subscriptionResponse = responseBody ? (JSON.parse(responseBody) as PagarmeSubscriptionResponse) : {};

    if (!subscriptionResponse.id) {
      this.logger.error(`PagarMe subscription response missing id. body=${responseBody}`);
      throw this.buildSubscriptionError();
    }

    return subscriptionResponse;
  }

  private async cancelSubscriptionOnPagarme(subscriptionId: string) {
    const secretKey = this.configService.get<string>('PAGARME_SECRET_KEY')?.trim();

    if (!secretKey) {
      throw new InternalServerErrorException('Chave secreta do PagarMe não configurada.');
    }

    const response = await fetch(`https://api.pagar.me/core/v5/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
      },
    });

    const responseBody = await response.text();

    if (!response.ok) {
      this.logger.error(
        `PagarMe subscription cancel request failed. subscriptionId=${subscriptionId}; status=${response.status}; body=${responseBody}`,
      );
      throw new BadRequestException({
        code: 'PAGARME_SUBSCRIPTION_CANCEL_ERROR',
        message: 'Não foi possível cancelar a assinatura. Tente novamente.',
      });
    }

    let cancelResponse: PagarmeCancelSubscriptionResponse = {};

    if (responseBody) {
      try {
        cancelResponse = JSON.parse(responseBody) as PagarmeCancelSubscriptionResponse;

        if (!cancelResponse.id) {
          this.logger.warn(
            `PagarMe subscription cancel response missing id. subscriptionId=${subscriptionId}; body=${responseBody}`,
          );
        }
      } catch {
        this.logger.warn(
          `PagarMe subscription cancel response could not be parsed. subscriptionId=${subscriptionId}; body=${responseBody}`,
        );
      }
    }

    return cancelResponse;
  }

  private buildSubscriptionAddress(createPaymentDto: CreatePaymentDto) {
    return {
      country: 'BR',
      state: createPaymentDto.state,
      city: createPaymentDto.city,
      zip_code: createPaymentDto.cep,
      line_1: createPaymentDto.address,
      line_2: createPaymentDto.number,
    };
  }

  private resolvePagarmeEmail(user: User) {
    if (typeof user.email === 'string' && user.email.trim()) {
      return user.email.trim().toLowerCase();
    }

    const phoneDigits = user.phone.replace(/\D/g, '');

    return `student-${user.id}-${phoneDigits || 'no-phone'}@jve.example.com`;
  }

  private createAttemptId(userId: number, courseId: number) {
    return `${userId}-${courseId}-${Date.now()}`;
  }

  private extractCardBin(cardNumber: string) {
    return cardNumber.slice(0, 6);
  }

  private maskSecret(value: string) {
    if (value.length <= 8) {
      return '***';
    }

    return `${value.slice(0, 4)}***${value.slice(-4)}`;
  }

  private parsePagarmeErrorResponse(responseBody: string) {
    try {
      return JSON.parse(responseBody) as PagarmeErrorResponse;
    } catch {
      return null;
    }
  }

  private summarizePagarmeErrors(errors: Record<string, unknown> | undefined) {
    if (!errors) {
      return null;
    }

    return Object.entries(errors)
      .flatMap(([field, value]) => {
        if (!Array.isArray(value)) {
          return [];
        }

        return value
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((message) => `${field}: ${message}`);
      })
      .slice(0, 5)
      .join(' | ');
  }

  private buildPagarmeHint(stage: 'token' | 'customer' | 'card' | 'subscription', status: number, parsedBody: PagarmeErrorResponse | null) {
    if (stage === 'token' && status === 422) {
      const summarizedErrors = this.summarizePagarmeErrors(parsedBody?.errors);

      if (summarizedErrors?.includes('not a valid card number')) {
        return 'The card number is being rejected before token creation. Use a card number valid for the generic tokenization endpoint, not a 3DS-only sandbox number.';
      }
    }

    if (stage === 'card' && status === 412) {
      return 'PagarMe documents this error on card creation when card verification is active and verification fails. Review account verification settings, sandbox compatibility, and whether the card is valid for customer/card creation.';
    }

    if (stage === 'subscription' && status === 412) {
      return 'This direct subscription flow mirrors the legacy working integration. If the subscription still returns 412, review account-level card verification settings and whether the test card is accepted for recurring subscriptions in this account.';
    }

    if (stage === 'token') {
      return 'PagarMe tokenization docs require appId with public key, only the Content-Type header, and a registered domain for tokenizecard.js/client tokenization.';
    }

    return null;
  }

  private logPagarmeFailure(
    stage: 'token' | 'customer' | 'card' | 'subscription',
    status: number,
    responseBody: string,
    context: Record<string, unknown>,
  ) {
    const parsedBody = this.parsePagarmeErrorResponse(responseBody);
    const summarizedErrors = this.summarizePagarmeErrors(parsedBody?.errors);
    const gatewayErrors = parsedBody?.gateway_response?.errors
      ?.map((error) => error.message)
      .filter((message): message is string => typeof message === 'string' && message.trim().length > 0)
      .join(' | ');
    const hint = this.buildPagarmeHint(stage, status, parsedBody);

    this.logger.error(
      `PagarMe ${stage} request failed. status=${status}; context=${JSON.stringify(context)}; message=${parsedBody?.message ?? 'unknown'}; errors=${summarizedErrors ?? 'n/a'}; gatewayErrors=${gatewayErrors ?? 'n/a'}; hint=${hint ?? 'n/a'}; body=${responseBody}`,
    );
  }

  private mergeGatewayResponse(currentValue: string | null, nextValue: Record<string, unknown>) {
    if (!currentValue) {
      return JSON.stringify(nextValue);
    }

    try {
      const parsedCurrentValue = JSON.parse(currentValue) as Record<string, unknown>;
      return JSON.stringify({
        ...parsedCurrentValue,
        ...nextValue,
      });
    } catch {
      return JSON.stringify({
        previous: currentValue,
        ...nextValue,
      });
    }
  }

  private buildTokenError() {
    return new BadRequestException({
      code: 'PAGARME_TOKEN_ERROR',
      message:
        'Não foi possível criar o token de pagamento. Verifique se os dados do cartão estão corretos e tente novamente.',
    });
  }

  private buildSubscriptionError() {
    return new BadRequestException({
      code: 'PAGARME_SUBSCRIPTION_ERROR',
      message: 'Não foi possível concluir a contratação do Curso. Tente novamente.',
    });
  }

  private extractTokenId(tokenResponse: PagarmeTokenResponse) {
    return tokenResponse.id ?? tokenResponse.card?.id ?? null;
  }

  private extractTokenName(tokenResponse: PagarmeTokenResponse, fallback: string) {
    const candidate = tokenResponse.name ?? tokenResponse.card?.holder_name ?? fallback;
    return typeof candidate === 'string' && candidate.trim() ? candidate.trim().toUpperCase() : null;
  }

  private extractTokenDocument(tokenResponse: PagarmeTokenResponse, fallback: string) {
    const candidate = tokenResponse.number ?? tokenResponse.card?.holder_document ?? fallback;
    return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
  }

  private extractTokenSecurityCode(tokenResponse: PagarmeTokenResponse, fallback: string) {
    const candidate = tokenResponse.security_code ?? tokenResponse.card?.cvv ?? fallback;
    return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
  }
}
