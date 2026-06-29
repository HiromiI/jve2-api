import { Body, Controller, Delete, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

type AuthenticatedRequest = Request & {
  user: {
    userId: number;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(request.user.userId, createPaymentDto);
  }

  @Delete(':id/cancel-subscription')
  cancelSubscription(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) paymentId: number,
  ) {
    return this.paymentsService.cancelSubscription(request.user.userId, paymentId);
  }
}
