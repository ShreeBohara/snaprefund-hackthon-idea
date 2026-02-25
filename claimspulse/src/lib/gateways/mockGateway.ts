import { mockFundingSources } from "../../data/mockFundingSources";
import { mockPayments } from "../../data/mockPayments";
import type { Payment } from "../../features/payments/types";
import type { PaymentGateway } from "./paymentGateway";

function randomLatency(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 150 + Math.floor(Math.random() * 100));
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class MockGateway implements PaymentGateway {
  private readonly payments: Payment[];

  constructor(seedPayments: Payment[] = mockPayments) {
    this.payments = clone(seedPayments);
  }

  async listFundingSources() {
    await randomLatency();
    return clone(mockFundingSources);
  }

  async getPaymentById(paymentId: string) {
    await randomLatency();
    const found = this.payments.find((payment) => payment.id.toLowerCase() === paymentId.toLowerCase());

    if (!found) {
      throw new Error(`Payment ${paymentId} not found.`);
    }

    return clone(found);
  }

  async createPayment(input: {
    claimId: string;
    recipientEmail: string;
    amountUsd: number;
    fundingSourceId: string;
    memo: string;
  }) {
    await randomLatency();
    void input.memo;

    const numericMax = this.payments.reduce((max, payment) => {
      const parsed = Number(payment.id.replace(/\D/g, ""));
      return Number.isNaN(parsed) ? max : Math.max(max, parsed);
    }, 1000);

    const nowIso = new Date().toISOString();
    const created: Payment = {
      id: `PAY-${numericMax + 1}`,
      claimId: input.claimId,
      recipientEmail: input.recipientEmail,
      amountUsd: input.amountUsd,
      status: "awaiting-cash-out",
      fundingSourceId: input.fundingSourceId,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.payments.unshift(created);
    return clone(created);
  }
}
