import { describe, expect, it } from "vitest";
import { getRiskBreakdown, isStaleAwaiting } from "../features/payments/risk";
import type { Payment } from "../features/payments/types";

const NOW = new Date("2026-02-25T12:00:00.000Z");

function payment(overrides: Partial<Payment>): Payment {
  return {
    id: "PAY-1",
    claimId: "CLM-1",
    recipientEmail: "test@example.com",
    amountUsd: 1000,
    status: "awaiting-cash-out",
    fundingSourceId: "fs-1",
    createdAt: "2026-02-24T12:00:00.000Z",
    updatedAt: "2026-02-24T12:00:00.000Z",
    ...overrides
  };
}

describe("risk scoring", () => {
  it("ranks large stale awaiting payment above small recent failed payment", () => {
    const staleHighAmount = payment({ id: "PAY-A", amountUsd: 52000, updatedAt: "2026-02-22T06:00:00.000Z" });
    const smallFailed = payment({
      id: "PAY-B",
      amountUsd: 2100,
      status: "failed",
      updatedAt: "2026-02-25T11:00:00.000Z"
    });

    const staleRisk = getRiskBreakdown(staleHighAmount, NOW).riskScore;
    const failedRisk = getRiskBreakdown(smallFailed, NOW).riskScore;

    expect(staleRisk).toBeGreaterThan(failedRisk);
  });

  it("treats exactly 24h awaiting as not stale", () => {
    const boundary = payment({ updatedAt: "2026-02-24T12:00:00.000Z" });
    expect(isStaleAwaiting(boundary, NOW)).toBe(false);
  });
});
