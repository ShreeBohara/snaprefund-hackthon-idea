export type ChatIntent =
  | { type: "attention_now" }
  | { type: "failure_reason"; paymentId: string }
  | { type: "cashout_rate_week" }
  | { type: "failed_last_7_days" }
  | { type: "send_payment_request"; amountUsd: number; recipientEmail: string; claimId: string };

const SEND_PAYMENT_REGEX = /send\s+\$?([\d,]+(?:\.\d{1,2})?)\s+to\s+([^\s]+)\s+for\s+claim\s+([\w-]+)/i;
const FAILURE_REASON_REGEX = /why\s+did\s+payment\s+([\w-]+)\s+fail\??/i;

export function parseChatIntent(input: string): ChatIntent | null {
  const normalized = input.trim();
  if (!normalized) {
    return null;
  }

  const sendMatch = normalized.match(SEND_PAYMENT_REGEX);
  if (sendMatch) {
    const amountUsd = Number(sendMatch[1].replace(/,/g, ""));
    if (Number.isNaN(amountUsd) || amountUsd <= 0) {
      return null;
    }

    return {
      type: "send_payment_request",
      amountUsd,
      recipientEmail: sendMatch[2].toLowerCase(),
      claimId: sendMatch[3].toUpperCase()
    };
  }

  const failureMatch = normalized.match(FAILURE_REASON_REGEX);
  if (failureMatch) {
    return {
      type: "failure_reason",
      paymentId: failureMatch[1]
    };
  }

  if (/need\s+attention|attention\s+right\s+now|priority/i.test(normalized)) {
    return { type: "attention_now" };
  }

  if (/cash-?out\s+rate|cashout\s+rate/i.test(normalized)) {
    return { type: "cashout_rate_week" };
  }

  if (/failed\s+payments?.*(last\s+7\s+days|7\s+days)/i.test(normalized)) {
    return { type: "failed_last_7_days" };
  }

  return null;
}
