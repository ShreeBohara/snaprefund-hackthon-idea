import type { PriorityItem, TriageSuggestion } from "../features/payments/types";
import { formatCurrency, formatHours } from "../lib/utils/format";
import { StatusBadge } from "./StatusBadge";

interface PaymentCardProps {
  item: PriorityItem;
  suggestion: TriageSuggestion;
  onResend: (paymentId: string) => void;
  onSwitchBank: (paymentId: string) => void;
  onCreateReplacement: (paymentId: string) => void;
  onGenerateDraft: (paymentId: string) => void;
}

type ActionKey = "resend" | "switch-bank" | "replacement" | "draft";

const bandAccent: Record<PriorityItem["risk"]["priorityBand"], { ring: string; pill: string }> = {
  low: {
    ring: "border-slate-200",
    pill: "border-slate-300 bg-slate-100 text-slate-700"
  },
  medium: {
    ring: "border-amber-300",
    pill: "border-amber-200 bg-amber-100 text-amber-900"
  },
  high: {
    ring: "border-orange-400",
    pill: "border-orange-200 bg-orange-100 text-orange-900"
  },
  critical: {
    ring: "border-red-500",
    pill: "border-red-200 bg-red-100 text-red-900"
  }
};

const recommendationLabel: Record<TriageSuggestion["recommendedAction"], string> = {
  resend: "Resend secure payment link",
  "switch-bank": "Switch funding source and retry",
  retry: "Create replacement pending payment",
  "contact-recipient": "Reach out directly to recipient",
  monitor: "Monitor until next state transition"
};

function getPrimaryActionKey(suggestion: TriageSuggestion): ActionKey {
  switch (suggestion.recommendedAction) {
    case "resend":
      return "resend";
    case "switch-bank":
      return "switch-bank";
    case "retry":
      return "replacement";
    case "contact-recipient":
      return "draft";
    case "monitor":
      return "draft";
    default:
      return "draft";
  }
}

function actionButtonClass(isPrimary: boolean): string {
  if (isPrimary) {
    return "rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow hover:-translate-y-px hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300";
  }

  return "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:-translate-y-px hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100";
}

export function PaymentCard({
  item,
  suggestion,
  onResend,
  onSwitchBank,
  onCreateReplacement,
  onGenerateDraft
}: PaymentCardProps) {
  const { payment, risk } = item;
  const disabled = Boolean(payment.supersededByPaymentId);
  const accent = bandAccent[risk.priorityBand];
  const primaryAction = getPrimaryActionKey(suggestion);

  return (
    <article className={`surface-soft rounded-xl border-2 p-4 ${accent.ring}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-wide text-slate-500">{payment.id}</p>
          <h3 className="text-lg font-bold text-slate-900">{payment.claimId}</h3>
          <p className="text-sm subtle">{payment.recipientEmail}</p>
        </div>

        <div className="space-y-2 text-right">
          <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(payment.amountUsd)}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <StatusBadge status={payment.status} />
            <span className={`rounded-full border px-2 py-1 text-xs font-bold uppercase tracking-wide ${accent.pill}`}>
              {risk.priorityBand}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white/80 p-3">
        <p className="eyebrow">AI Recommendation</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{recommendationLabel[suggestion.recommendedAction]}</p>
        <p className="mt-2 text-sm text-slate-700">{suggestion.rationale}</p>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-3">
        <p className="rounded-md bg-white/80 px-2 py-1">
          <span className="font-semibold">Stale:</span> {formatHours(risk.hoursStale)}
        </p>
        <p className="rounded-md bg-white/80 px-2 py-1">
          <span className="font-semibold">Risk score:</span> {Math.round(risk.riskScore).toLocaleString()}
        </p>
        <p className="rounded-md bg-white/80 px-2 py-1">
          <span className="font-semibold">Status weight:</span> {risk.statusWeight.toFixed(1)}
        </p>
      </div>

      {payment.supersededByPaymentId && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Recovered. This payment was superseded by {payment.supersededByPaymentId}.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className={actionButtonClass(primaryAction === "resend")}
          onClick={() => onResend(payment.id)}
          disabled={disabled}
        >
          Resend Link
        </button>
        <button
          className={actionButtonClass(primaryAction === "switch-bank")}
          onClick={() => onSwitchBank(payment.id)}
          disabled={disabled}
        >
          Switch Bank
        </button>
        <button
          className={actionButtonClass(primaryAction === "replacement")}
          onClick={() => onCreateReplacement(payment.id)}
          disabled={disabled}
        >
          Create Replacement
        </button>
        <button className={actionButtonClass(primaryAction === "draft")} onClick={() => onGenerateDraft(payment.id)}>
          Generate SMS/Email
        </button>
      </div>
    </article>
  );
}
