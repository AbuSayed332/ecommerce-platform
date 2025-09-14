import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeStrategy } from './strategies/stripe.strategy';
import { PayPalStrategy } from './strategies/paypal.strategy';

@Module({
  imports: [],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripeStrategy,
    PayPalStrategy,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}