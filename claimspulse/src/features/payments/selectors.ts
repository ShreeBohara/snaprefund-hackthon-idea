import { getRiskBreakdown, hoursSince, isActiveNonFailed, isStaleAwaiting } from "./risk";
import type {
  BankPerformance,
  CashoutTrendPoint,
  DashboardMetrics,
  FundingSource,
  Payment,
  PriorityItem
} from "./types";

function toPercent(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return (numerator / denominator) * 100;
}

export function getDashboardMetrics(payments: Payment[], now: Date = new Date()): DashboardMetrics {
  const activeCount = payments.filter(isActiveNonFailed).length;
  const staleCount = payments.filter((payment) => isStaleAwaiting(payment, now)).length;
  const failedPayments = payments.filter((payment) => payment.status === "failed");
  const failedCount = failedPayments.length;

  const atRiskUsd = payments
    .filter((payment) => payment.status === "failed" || isStaleAwaiting(payment, now))
    .reduce((sum, payment) => sum + payment.amountUsd, 0);

  const baselinePayments = payments.filter((payment) => payment.status !== "cancelled");
  const completedCount = baselinePayments.filter((payment) => payment.status === "completed").length;
  const cashOutRate = toPercent(completedCount, baselinePayments.length);

  const completedPayments = payments.filter((payment) => payment.status === "completed");
  const avgCashOutHours =
    completedPayments.length === 0
      ? 0
      : completedPayments.reduce((sum, payment) => sum + hoursSince(payment.createdAt, new Date(payment.updatedAt)), 0) /
        completedPayments.length;

  return {
    activeCount,
    staleCount,
    failedCount,
    atRiskUsd,
    cashOutRate,
    avgCashOutHours
  };
}

export function selectPriorityItems(payments: Payment[], now: Date = new Date()): PriorityItem[] {
  return payments
    .map((payment) => ({ payment, risk: getRiskBreakdown(payment, now) }))
    .filter(({ payment, risk }) => {
      if (payment.supersededByPaymentId) {
        return false;
      }

      return risk.statusWeight > 0;
    })
    .sort((left, right) => right.risk.riskScore - left.risk.riskScore);
}

export function selectCashoutTrend(payments: Payment[], days = 7, now: Date = new Date()): CashoutTrendPoint[] {
  const points: CashoutTrendPoint[] = [];

  for (let idx = days - 1; idx >= 0; idx -= 1) {
    const pointDate = new Date(now);
    pointDate.setHours(0, 0, 0, 0);
    pointDate.setDate(pointDate.getDate() - idx);

    const nextDate = new Date(pointDate);
    nextDate.setDate(pointDate.getDate() + 1);

    const completedCount = payments.filter((payment) => {
      if (payment.status !== "completed") {
        return false;
      }

      const updated = new Date(payment.updatedAt).getTime();
      return updated >= pointDate.getTime() && updated < nextDate.getTime();
    }).length;

    const failedCount = payments.filter((payment) => {
      if (payment.status !== "failed") {
        return false;
      }

      const updated = new Date(payment.updatedAt).getTime();
      return updated >= pointDate.getTime() && updated < nextDate.getTime();
    }).length;

    points.push({
      dayLabel: pointDate.toLocaleDateString(undefined, { weekday: "short" }),
      completedCount,
      failedCount
    });
  }

  return points;
}

export function selectBankPerformance(
  payments: Payment[],
  fundingSources: FundingSource[]
): BankPerformance[] {
  const sourceById = new Map(fundingSources.map((source) => [source.id, source]));

  const grouped = new Map<
    string,
    { totalCount: number; completedCount: number; failedCount: number; bankName: string; last4: string }
  >();

  payments.forEach((payment) => {
    const source = sourceById.get(payment.fundingSourceId);
    if (!source) {
      return;
    }

    const existing = grouped.get(source.id) ?? {
      totalCount: 0,
      completedCount: 0,
      failedCount: 0,
      bankName: source.bankName,
      last4: source.last4
    };

    existing.totalCount += 1;
    if (payment.status === "completed") {
      existing.completedCount += 1;
    }
    if (payment.status === "failed") {
      existing.failedCount += 1;
    }

    grouped.set(source.id, existing);
  });

  return Array.from(grouped.entries())
    .map(([fundingSourceId, value]) => ({
      fundingSourceId,
      bankName: value.bankName,
      last4: value.last4,
      totalCount: value.totalCount,
      completedCount: value.completedCount,
      failedCount: value.failedCount,
      successRate: toPercent(value.completedCount, Math.max(1, value.completedCount + value.failedCount))
    }))
    .sort((left, right) => right.successRate - left.successRate);
}

export function selectFailedInLastDays(payments: Payment[], days: number, now: Date = new Date()): Payment[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);

  return payments.filter(
    (payment) => payment.status === "failed" && new Date(payment.updatedAt).getTime() >= cutoff.getTime()
  );
}
