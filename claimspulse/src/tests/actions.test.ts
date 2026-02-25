import { describe, expect, it } from "vitest";
import { resendLink } from "../features/payments/actions";
import type { Payment } from "../features/payments/types";

const seed: Payment[] = [
  {
    id: "PAY-100",
    claimId: "CLM-100",
    recipientEmail: "seed@example.com",
    amountUsd: 4200,
    status: "awaiting-cash-out",
    fundingSourceId: "fs-1",
    createdAt: "2026-02-24T10:00:00.000Z",
    updatedAt: "2026-02-24T10:00:00.000Z"
  }
];

describe("payment actions", () => {
  it("resendLink creates a new payment and supersedes original", () => {
    const result = resendLink(seed, "PAY-100", "2026-02-25T12:00:00.000Z");

    expect(result.ok).toBe(true);
    expect(result.payments[0].id).not.toBe("PAY-100");

    const original = result.payments.find((payment) => payment.id === "PAY-100");
    expect(original?.supersededByPaymentId).toBe(result.payments[0].id);
  });
});
