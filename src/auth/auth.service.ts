import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions } from 'express';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.validateUserByEmail(loginDto.email, loginDto.password);

    return this.buildAuthResponse(user);
  }

  async loginWithPhone(phone: string, password: string) {
    const user = await this.validateUserByPhone(phone, password);

    return this.buildAuthResponse(user);
  }

  async signUpStudent(payload: {
    name: string;
    email?: string;
    phone: string;
    password: string;
  }) {
    return this.usersService.create({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      active: true,
      role: UserRole.STUDENT,
    });
  }

  async sendForgotPasswordCode(phone: string) {
    const user = await this.usersService.findByPhone(phone);

    if (!user) {
      throw new NotFoundException({
        code: 'PHONE_NOT_FOUND',
        message: 'Telefone não encontrado. Tente novamente.',
      });
    }

    const generatedPassword = this.generateRecoveryPassword();
    await this.sendClickSendSms(user.phone, generatedPassword);
    await this.usersService.updatePasswordByPhone(user.phone, generatedPassword);

    return {
      message: 'Código enviado com sucesso.',
    };
  }

  async validateForgotPasswordCode(phone: string, code: string) {
    const user = await this.usersService.findByPhone(phone);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const codeMatches = await bcrypt.compare(code, user.password);

    if (!codeMatches) {
      throw new UnauthorizedException({
        code: 'INVALID_RESET_CODE',
        message: 'Código incorreto.',
      });
    }

    return {
      message: 'Código validado com sucesso.',
    };
  }

  async resetForgotPassword(phone: string, code: string, password: string) {
    const user = await this.usersService.findByPhone(phone);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const codeMatches = await bcrypt.compare(code, user.password);

    if (!codeMatches) {
      throw new UnauthorizedException({
        code: 'INVALID_RESET_CODE',
        message: 'Código incorreto.',
      });
    }

    if (!this.isStrongPassword(password)) {
      throw new BadRequestException('A senha informada é inválida.');
    }

    await this.usersService.updatePasswordByPhone(user.phone, password);

    return {
      message: 'Senha recuperada com sucesso!',
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não informado.');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'change_this_refresh_secret',
        ),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    const user = await this.usersService.findEntityById(payload.sub);

    if (!user.active) {
      throw new UnauthorizedException('Usuário inativo.');
    }

    return this.buildAuthResponse(user);
  }

  async getAuthenticatedUser(userId: number) {
    const user = await this.usersService.findEntityById(userId);

    if (!user.active) {
      throw new UnauthorizedException('Usuário inativo.');
    }

    return this.usersService.toPublicUser(user);
  }

  getRefreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      path: '/auth',
    };
  }

  getRefreshCookieMaxAge() {
    return Number(
      this.configService.get<string>('JWT_REFRESH_COOKIE_MAX_AGE_MS', '604800000'),
    );
  }

  private async validateUserByEmail(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado.',
      });
    }

    if (!user.active) {
      throw new ForbiddenException({
        code: 'INACTIVE_USER',
        message: 'Usuário inativo.',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException({
        code: 'INVALID_PASSWORD',
        message: 'Senha incorreta.',
      });
    }

    return user;
  }

  private async validateUserByPhone(phone: string, password: string) {
    const user = await this.usersService.findByPhone(phone);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado.',
      });
    }

    if (!user.active || user.role !== UserRole.STUDENT) {
      throw new ForbiddenException({
        code: 'INACTIVE_USER',
        message: 'Usuário inativo.',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException({
        code: 'INVALID_PASSWORD',
        message: 'Senha incorreta.',
      });
    }

    return user;
  }

  private async buildAuthResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '60s',
    );
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'change_this_access_secret',
      ),
      expiresIn: accessExpiresIn,
    });
    const refreshToken = await this.jwtService.signAsync(
      {
        ...payload,
        type: 'refresh',
      },
      {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'change_this_refresh_secret',
        ),
        expiresIn: refreshExpiresIn,
      },
    );

    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.toSeconds(accessExpiresIn),
      user: await this.usersService.toPublicUser(user),
    };
  }

  private generateRecoveryPassword(length = 12) {
    const lowercaseCharacters = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numericCharacters = '0123456789';
    const specialCharacters = '!@#$%&*_-+=?';
    const allCharacters = `${lowercaseCharacters}${uppercaseCharacters}${numericCharacters}${specialCharacters}`;

    const pickCharacter = (characters: string) => characters[randomInt(0, characters.length)];
    const passwordCharacters = [
      pickCharacter(lowercaseCharacters),
      pickCharacter(uppercaseCharacters),
      pickCharacter(specialCharacters),
    ];

    while (passwordCharacters.length < length) {
      passwordCharacters.push(pickCharacter(allCharacters));
    }

    for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(0, index + 1);
      [passwordCharacters[index], passwordCharacters[swapIndex]] = [
        passwordCharacters[swapIndex],
        passwordCharacters[index],
      ];
    }

    return passwordCharacters.join('');
  }

  private isStrongPassword(password: string) {
    return (
      password.length >= 8 &&
      password.length <= 72 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  private async sendClickSendSms(phone: string, code: string) {
    const username = this.configService.get<string>('CLICKSEND_USERNAME');
    const apiKey = this.configService.get<string>('CLICKSEND_API_KEY');

    if (!username || !apiKey) {
      throw new ServiceUnavailableException('Integração com SMS indisponível.');
    }

    await this.sendClickSendSmsMessage(phone, 'Seu código de recuperação de senha do app JVE Vestibulinho é:');
    await this.sleep(500);
    await this.sendClickSendSmsMessage(phone, code);
  }

  private async sendClickSendSmsMessage(phone: string, body: string) {
    const username = this.configService.get<string>('CLICKSEND_USERNAME');
    const apiKey = this.configService.get<string>('CLICKSEND_API_KEY');

    if (!username || !apiKey) {
      throw new ServiceUnavailableException('Integração com SMS indisponível.');
    }

    const response = await fetch('https://rest.clicksend.com/v3/sms/send', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            source: 'JVE Vestibulinho',
            body,
            to: `+55${phone}`,
          },
        ],
      }),
    });

    const responseData = (await response.json().catch(() => null)) as
      | { http_code?: number; response_code?: string; response_msg?: string }
      | null;

    if (!response.ok || responseData?.response_code !== 'SUCCESS') {
      throw new ServiceUnavailableException(
        responseData?.response_msg ?? 'Não foi possível enviar a mensagem de recuperação.',
      );
    }
  }

  private async sleep(milliseconds: number) {
    await new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  private toSeconds(value: string) {
    if (/^\d+$/.test(value)) {
      return Number(value);
    }

    const amount = Number(value.slice(0, -1));
    const unit = value.slice(-1);

    if (Number.isNaN(amount)) {
      return 60;
    }

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        return 60;
    }
  }
}
