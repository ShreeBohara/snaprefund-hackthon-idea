import type { PaymentStatus } from "../features/payments/types";

interface StatusBadgeProps {
  status: PaymentStatus;
}

const statusStyles: Record<PaymentStatus, string> = {
  "awaiting-cash-out": "status-awaiting",
  failed: "status-failed",
  completed: "status-completed",
  cancelled: "status-cancelled",
  "in-transit": "status-transit",
  lock: "status-lock"
};

const labels: Record<PaymentStatus, string> = {
  "awaiting-cash-out": "Awaiting Cash-Out",
  failed: "Failed",
  completed: "Completed",
  cancelled: "Cancelled",
  "in-transit": "In Transit",
  lock: "Lock"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`badge ${statusStyles[status]}`}>{labels[status]}</span>;
}
