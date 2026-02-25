import type { CSSProperties } from "react";
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

interface AccentStyle {
  borderColor: string;
  pill: CSSProperties;
}

const bandAccent: Record<PriorityItem["risk"]["priorityBand"], AccentStyle> = {
  low: {
    borderColor: "var(--border)",
    pill: {
      background: "rgba(157, 176, 207, 0.18)",
      borderColor: "rgba(157, 176, 207, 0.42)",
      color: "var(--text)"
    }
  },
  medium: {
    borderColor: "rgba(241, 187, 98, 0.54)",
    pill: {
      background: "rgba(241, 187, 98, 0.17)",
      borderColor: "rgba(241, 187, 98, 0.5)",
      color: "var(--text)"
    }
  },
  high: {
    borderColor: "rgba(77, 163, 255, 0.56)",
    pill: {
      background: "rgba(77, 163, 255, 0.18)",
      borderColor: "rgba(77, 163, 255, 0.48)",
      color: "var(--text)"
    }
  },
  critical: {
    borderColor: "rgba(255, 110, 127, 0.62)",
    pill: {
      background: "rgba(255, 110, 127, 0.17)",
      borderColor: "rgba(255, 110, 127, 0.52)",
      color: "var(--text)"
    }
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
    return "btn-primary px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50";
  }

  return "btn-secondary px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-45";
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
    <article className="card-strong p-4" style={{ borderColor: accent.borderColor }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">{payment.id}</p>
          <h3 className="text-lg font-bold text-main">{payment.claimId}</h3>
          <p className="text-sm text-muted">{payment.recipientEmail}</p>
        </div>

        <div className="space-y-2 text-right">
          <p className="text-2xl font-extrabold text-main">{formatCurrency(payment.amountUsd)}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <StatusBadge status={payment.status} />
            <span className="badge border uppercase" style={accent.pill}>
              {risk.priorityBand}
            </span>
          </div>
        </div>
      </div>

      <div className="card mt-4 p-3">
        <p className="eyebrow">AI Recommendation</p>
        <p className="mt-1 text-sm font-semibold text-main">{recommendationLabel[suggestion.recommendedAction]}</p>
        <p className="mt-2 text-sm text-muted">{suggestion.rationale}</p>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-main sm:grid-cols-3">
        <p className="card px-2 py-1">
          <span className="font-semibold">Stale:</span> {formatHours(risk.hoursStale)}
        </p>
        <p className="card px-2 py-1">
          <span className="font-semibold">Risk score:</span> {Math.round(risk.riskScore).toLocaleString()}
        </p>
        <p className="card px-2 py-1">
          <span className="font-semibold">Status weight:</span> {risk.statusWeight.toFixed(1)}
        </p>
      </div>

      {payment.supersededByPaymentId && (
        <p
          className="mt-3 rounded-lg border px-3 py-2 text-sm"
          style={{
            background: "rgba(45, 207, 159, 0.14)",
            borderColor: "rgba(45, 207, 159, 0.44)",
            color: "var(--text)"
          }}
        >
          Recovered. This payment was superseded by {payment.supersededByPaymentId}.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className={actionButtonClass(primaryAction === "resend")}
          onClick={() => onResend(payment.id)}
          disabled={disabled}
          type="button"
        >
          Resend Link
        </button>
        <button
          className={actionButtonClass(primaryAction === "switch-bank")}
          onClick={() => onSwitchBank(payment.id)}
          disabled={disabled}
          type="button"
        >
          Switch Bank
        </button>
        <button
          className={actionButtonClass(primaryAction === "replacement")}
          onClick={() => onCreateReplacement(payment.id)}
          disabled={disabled}
          type="button"
        >
          Create Replacement
        </button>
        <button
          className={actionButtonClass(primaryAction === "draft")}
          onClick={() => onGenerateDraft(payment.id)}
          type="button"
        >
          Generate SMS/Email
        </button>
      </div>
    </article>
  );
}
