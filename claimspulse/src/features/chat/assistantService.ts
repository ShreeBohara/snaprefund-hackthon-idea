import { getDashboardMetrics, selectFailedInLastDays, selectPriorityItems } from "../payments/selectors";
import type { FundingSource, Payment } from "../payments/types";
import { explainAchReturnCode } from "../triage/triageEngine";
import type { ChatIntent } from "./intentParser";

export interface AssistantResponse {
  text: string;
  warning?: string;
}

interface AssistantContext {
  intent: ChatIntent;
  payments: Payment[];
  fundingSources: FundingSource[];
  now?: Date;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value
  );
}

export function buildAssistantResponse({ intent, payments, fundingSources, now = new Date() }: AssistantContext): string {
  const metrics = getDashboardMetrics(payments, now);

  switch (intent.type) {
    case "attention_now": {
      const top = selectPriorityItems(payments, now).slice(0, 3);
      if (top.length === 0) {
        return "No active high-risk payments right now. Monitoring queue is clear.";
      }

      const total = top.reduce((sum, item) => sum + item.payment.amountUsd, 0);
      const lines = top.map(
        (item, idx) =>
          `${idx + 1}) ${item.payment.id} (${item.payment.claimId}) ${formatCurrency(item.payment.amountUsd)} - ${item.payment.status}`
      );

      return `Top priority payments total ${formatCurrency(total)}:\n${lines.join("\n")}`;
    }

    case "failure_reason": {
      const payment = payments.find((item) => item.id.toLowerCase() === intent.paymentId.toLowerCase());
      if (!payment) {
        return `Payment ${intent.paymentId} was not found in the current queue.`;
      }

      if (payment.status !== "failed") {
        return `Payment ${payment.id} is currently ${payment.status}, not failed.`;
      }

      return `Payment ${payment.id} failed with code ${payment.achReturnCode ?? "unknown"}. ${explainAchReturnCode(
        payment.achReturnCode
      )}`;
    }

    case "cashout_rate_week": {
      return `Cash-out rate is ${metrics.cashOutRate.toFixed(1)}% with average completion time ${metrics.avgCashOutHours.toFixed(
        1
      )} hours.`;
    }

    case "failed_last_7_days": {
      const failed = selectFailedInLastDays(payments, 7, now);
      if (failed.length === 0) {
        return "No failed payments in the last 7 days.";
      }

      const amount = failed.reduce((sum, payment) => sum + payment.amountUsd, 0);
      const ids = failed.slice(0, 5).map((payment) => payment.id).join(", ");
      return `${failed.length} failed payments in last 7 days totaling ${formatCurrency(amount)}. IDs: ${ids}.`;
    }

    case "send_payment_request": {
      const preferredSource =
        fundingSources.find((source) => source.status === "active") ?? fundingSources[0];

      return `Preview: send ${formatCurrency(intent.amountUsd)} to ${intent.recipientEmail} for claim ${intent.claimId} using ${
        preferredSource ? `${preferredSource.bankName} ****${preferredSource.last4}` : "default funding source"
      }. Confirm in priority queue before execution.`;
    }

    default:
      return "I can help with payment attention, failure reasons, cash-out rate, failed last 7 days, and send-payment previews.";
  }
}

interface EnhanceRequest {
  baseText: string;
  apiKey: string;
  model?: string;
}

export async function enhanceAssistantWording({ baseText, apiKey, model = "gpt-4o-mini" }: EnhanceRequest): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Rewrite the assistant answer for clarity and brevity. Keep facts unchanged, no extra claims, max 90 words."
        },
        { role: "user", content: baseText }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`LLM rewrite failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const rewritten = payload.choices?.[0]?.message?.content?.trim();
  if (!rewritten) {
    throw new Error("LLM rewrite returned empty content.");
  }

  return rewritten;
}
