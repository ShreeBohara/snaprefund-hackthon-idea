import type { FundingSource, Payment } from "../../features/payments/types";

export interface PaymentGateway {
  listFundingSources(): Promise<FundingSource[]>;
  getPaymentById(paymentId: string): Promise<Payment>;
  createPayment(input: {
    claimId: string;
    recipientEmail: string;
    amountUsd: number;
    fundingSourceId: string;
    memo: string;
  }): Promise<Payment>;
}
