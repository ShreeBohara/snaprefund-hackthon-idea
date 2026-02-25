import { describe, expect, it } from "vitest";
import { getDashboardMetrics } from "../features/payments/selectors";
import type { Payment } from "../features/payments/types";

const NOW = new Date("2026-02-25T12:00:00.000Z");

const payments: Payment[] = [
  {
    id: "PAY-1",
    claimId: "CLM-1",
    recipientEmail: "one@example.com",
    amountUsd: 5000,
    status: "awaiting-cash-out",
    fundingSourceId: "fs-1",
    createdAt: "2026-02-20T12:00:00.000Z",
    updatedAt: "2026-02-23T10:00:00.000Z"
  },
  {
    id: "PAY-2",
    claimId: "CLM-2",
    recipientEmail: "two@example.com",
    amountUsd: 3000,
    status: "failed",
    fundingSourceId: "fs-1",
    createdAt: "2026-02-24T12:00:00.000Z",
    updatedAt: "2026-02-25T10:00:00.000Z",
    achReturnCode: "R03"
  },
  {
    id: "PAY-3",
    claimId: "CLM-3",
    recipientEmail: "three@example.com",
    amountUsd: 7000,
    status: "completed",
    fundingSourceId: "fs-2",
    createdAt: "2026-02-23T11:00:00.000Z",
    updatedAt: "2026-02-24T11:00:00.000Z"
  },
  {
    id: "PAY-4",
    claimId: "CLM-4",
    recipientEmail: "four@example.com",
    amountUsd: 9000,
    status: "cancelled",
    fundingSourceId: "fs-2",
    createdAt: "2026-02-23T11:00:00.000Z",
    updatedAt: "2026-02-24T11:00:00.000Z"
  }
];

describe("dashboard metrics", () => {
  it("includes stale awaiting + failed in at-risk and excludes completed/cancelled", () => {
    const metrics = getDashboardMetrics(payments, NOW);
    expect(metrics.atRiskUsd).toBe(8000);
    expect(metrics.failedCount).toBe(1);
    expect(metrics.staleCount).toBe(1);
  });
});
