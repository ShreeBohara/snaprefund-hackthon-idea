import type { PaymentStatus } from "../features/payments/types";

interface StatusBadgeProps {
  status: PaymentStatus;
}

const statusStyles: Record<PaymentStatus, string> = {
  "awaiting-cash-out": "border-amber-200 bg-amber-100 text-amber-900",
  failed: "border-red-200 bg-red-100 text-red-900",
  completed: "border-emerald-200 bg-emerald-100 text-emerald-900",
  cancelled: "border-slate-300 bg-slate-200 text-slate-700",
  "in-transit": "border-blue-200 bg-blue-100 text-blue-900",
  lock: "border-indigo-200 bg-indigo-100 text-indigo-900"
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
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {labels[status]}
    </span>
  );
}
