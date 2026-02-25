export type PaymentStatus =
  | "awaiting-cash-out"
  | "lock"
  | "in-transit"
  | "completed"
  | "failed"
  | "cancelled";

export interface Payment {
  id: string;
  claimId: string;
  recipientEmail: string;
  amountUsd: number;
  status: PaymentStatus;
  fundingSourceId: string;
  createdAt: string;
  updatedAt: string;
  achReturnCode?: string;
  openedAt?: string;
  supersededByPaymentId?: string;
}

export interface FundingSource {
  id: string;
  bankName: string;
  last4: string;
  status: "active" | "inactive";
}

export interface RiskBreakdown {
  timeFactor: number;
  statusWeight: number;
  riskScore: number;
  hoursStale: number;
  priorityBand: "low" | "medium" | "high" | "critical";
}

export interface TriageSuggestion {
  paymentId: string;
  title: string;
  rationale: string;
  recommendedAction: "resend" | "switch-bank" | "retry" | "contact-recipient" | "monitor";
  smsDraft: string;
  emailDraft: string;
}

export interface DashboardMetrics {
  activeCount: number;
  staleCount: number;
  failedCount: number;
  atRiskUsd: number;
  cashOutRate: number;
  avgCashOutHours: number;
}

export interface PriorityItem {
  payment: Payment;
  risk: RiskBreakdown;
}

export interface CashoutTrendPoint {
  dayLabel: string;
  completedCount: number;
  failedCount: number;
}

export interface BankPerformance {
  fundingSourceId: string;
  bankName: string;
  last4: string;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  successRate: number;
}
