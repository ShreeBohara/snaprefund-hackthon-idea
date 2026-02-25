import type { Payment, PaymentStatus, RiskBreakdown } from "./types";

const HOURS_IN_MS = 1000 * 60 * 60;

export function hoursSince(isoTimestamp: string, now: Date = new Date()): number {
  return Math.max(0, (now.getTime() - new Date(isoTimestamp).getTime()) / HOURS_IN_MS);
}

export function getTimeFactor(hoursStale: number): number {
  if (hoursStale < 12) return 1.0;
  if (hoursStale < 24) return 1.5;
  if (hoursStale < 48) return 2.5;
  if (hoursStale < 72) return 4.0;
  return 6.0;
}

export function getStatusWeight(status: PaymentStatus): number {
  switch (status) {
    case "awaiting-cash-out":
      return 1.0;
    case "failed":
      return 5.0;
    case "lock":
      return 0.5;
    case "in-transit":
      return 0.2;
    case "completed":
    case "cancelled":
      return 0;
    default:
      return 0;
  }
}

export function getPriorityBand(riskScore: number): RiskBreakdown["priorityBand"] {
  if (riskScore < 3_000) return "low";
  if (riskScore < 15_000) return "medium";
  if (riskScore < 60_000) return "high";
  return "critical";
}

export function getRiskBreakdown(payment: Payment, now: Date = new Date()): RiskBreakdown {
  const hoursStale = hoursSince(payment.updatedAt, now);
  const timeFactor = getTimeFactor(hoursStale);
  const statusWeight = getStatusWeight(payment.status);
  const riskScore = payment.amountUsd * timeFactor * statusWeight;

  return {
    hoursStale,
    timeFactor,
    statusWeight,
    riskScore,
    priorityBand: getPriorityBand(riskScore)
  };
}

export function isStaleAwaiting(payment: Payment, now: Date = new Date()): boolean {
  return payment.status === "awaiting-cash-out" && hoursSince(payment.updatedAt, now) > 24;
}

export function isTerminal(payment: Payment): boolean {
  return payment.status === "completed" || payment.status === "cancelled";
}

export function isActiveNonFailed(payment: Payment): boolean {
  return (
    payment.status === "awaiting-cash-out" || payment.status === "lock" || payment.status === "in-transit"
  );
}
