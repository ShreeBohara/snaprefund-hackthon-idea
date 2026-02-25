import type { Payment, RiskBreakdown, TriageSuggestion } from "../payments/types";

const RETURN_CODE_GUIDANCE: Record<string, string> = {
  R01: "Sender funding source may be short on funds. Verify balance or retry later.",
  R02: "Recipient account appears closed. Ask recipient to re-enter banking details.",
  R03: "Account could not be located. Re-send as pending so recipient can re-enter details.",
  R04: "Invalid account number likely entered. Send a corrected pending link.",
  R08: "Payment was stopped by recipient. Contact them to confirm intent.",
  R10: "Recipient reported unauthorized debit. Verify identity before retry.",
  R29: "Corporate authorization issue. Request company-level authorization update."
};

function defaultDrafts(payment: Payment): Pick<TriageSuggestion, "smsDraft" | "emailDraft"> {
  return {
    smsDraft: `Hi, this is your claims team. We still have a payment for claim ${payment.claimId}. Reply if you want us to resend your secure payout link.`,
    emailDraft: `Subject: Action needed to receive your claim payment\n\nHi,\n\nWe noticed your payment for claim ${payment.claimId} still needs your confirmation. We can resend a secure payout link right away.\n\nReply to this email or contact your adjuster and we will help you complete it.\n\nThanks,\nClaims Team`
  };
}

export function buildTriageSuggestion(payment: Payment, risk: RiskBreakdown): TriageSuggestion {
  const drafts = defaultDrafts(payment);

  if (payment.status === "failed") {
    const achReason = payment.achReturnCode ? RETURN_CODE_GUIDANCE[payment.achReturnCode] : undefined;

    return {
      paymentId: payment.id,
      title: `Failed payment ${payment.id}`,
      rationale:
        achReason ??
        "Payment failed without a return code. Create a replacement payment and confirm recipient details.",
      recommendedAction: payment.achReturnCode === "R03" || payment.achReturnCode === "R04" ? "retry" : "switch-bank",
      smsDraft: `We attempted your claim payment for ${payment.claimId}, but it failed (${payment.achReturnCode ?? "unknown reason"}). We can send a fresh secure link now.`,
      emailDraft: `Subject: We need to retry your claim payment\n\nHi,\n\nYour recent payment for claim ${payment.claimId} did not complete (${payment.achReturnCode ?? "no return code"}). ${
        achReason ?? "We can retry as soon as we confirm your details."
      }\n\nReply to this message and we will resend the payment link.\n\nThanks,\nClaims Team`
    };
  }

  if (payment.status === "awaiting-cash-out" && risk.hoursStale > 72 && payment.amountUsd >= 10_000) {
    return {
      paymentId: payment.id,
      title: `High-value stale payment ${payment.id}`,
      rationale:
        "Large payout has been awaiting cash-out for over 72 hours. Direct outreach is likely faster than repeated email reminders.",
      recommendedAction: "contact-recipient",
      ...drafts
    };
  }

  if (payment.status === "awaiting-cash-out" && risk.hoursStale > 24) {
    return {
      paymentId: payment.id,
      title: `Stale payment ${payment.id}`,
      rationale:
        "Payment has been awaiting action for more than 24 hours. Resend reminder and confirm recipient trust signals.",
      recommendedAction: "resend",
      ...drafts
    };
  }

  if (payment.status === "lock") {
    return {
      paymentId: payment.id,
      title: `Processing delay ${payment.id}`,
      rationale: "Payment is in lock/processing state. Continue monitoring for transition before retrying.",
      recommendedAction: "monitor",
      ...drafts
    };
  }

  if (payment.status === "in-transit") {
    return {
      paymentId: payment.id,
      title: `Payment moving ${payment.id}`,
      rationale: "Funds are in transit. No immediate intervention required unless status stalls.",
      recommendedAction: "monitor",
      ...drafts
    };
  }

  return {
    paymentId: payment.id,
    title: `Monitor payment ${payment.id}`,
    rationale: "No immediate intervention needed.",
    recommendedAction: "monitor",
    ...drafts
  };
}

export function explainAchReturnCode(code?: string): string {
  if (!code) {
    return "No ACH return code was attached to this payment.";
  }

  return RETURN_CODE_GUIDANCE[code] ?? `Return code ${code} is not in the configured guidance list.`;
}
