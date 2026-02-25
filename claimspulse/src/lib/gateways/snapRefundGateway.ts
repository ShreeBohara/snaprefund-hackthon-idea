import type { FundingSource, Payment } from "../../features/payments/types";
import type { PaymentGateway } from "./paymentGateway";

interface GatewayConfig {
  baseUrl: string;
  token: string;
}

export class SnapRefundGateway implements PaymentGateway {
  private readonly config: GatewayConfig;

  constructor(config: GatewayConfig) {
    this.config = config;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.token}`,
        ...(init?.headers ?? {})
      }
    });

    if (!response.ok) {
      throw new Error(`SnapRefund API request failed (${response.status}) on ${path}`);
    }

    return (await response.json()) as T;
  }

  async listFundingSources(): Promise<FundingSource[]> {
    const payload = await this.request<{ data?: FundingSource[] }>("/api/dwolla/funding-sources/system");
    return payload.data ?? [];
  }

  async getPaymentById(paymentId: string): Promise<Payment> {
    return this.request<Payment>(`/api/payment?paymentId=${encodeURIComponent(paymentId)}`);
  }

  async createPayment(input: {
    claimId: string;
    recipientEmail: string;
    amountUsd: number;
    fundingSourceId: string;
    memo: string;
  }): Promise<Payment> {
    return this.request<Payment>("/api/payment", {
      method: "POST",
      body: JSON.stringify({
        claimId: input.claimId,
        receiverEmail: input.recipientEmail,
        amount: input.amountUsd,
        fundingSourceId: input.fundingSourceId,
        memo: input.memo
      })
    });
  }
}
