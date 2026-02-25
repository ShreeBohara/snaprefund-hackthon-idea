import { describe, expect, it } from "vitest";
import { buildAssistantResponse } from "../features/chat/assistantService";
import { parseChatIntent } from "../features/chat/intentParser";
import type { FundingSource, Payment } from "../features/payments/types";

const payments: Payment[] = [
  {
    id: "PAY-1043",
    claimId: "CLM-9087",
    recipientEmail: "leo.gray@example.com",
    amountUsd: 2100,
    status: "failed",
    fundingSourceId: "fs-1",
    createdAt: "2026-02-25T02:00:00.000Z",
    updatedAt: "2026-02-25T08:00:00.000Z",
    achReturnCode: "R03"
  }
];

const fundingSources: FundingSource[] = [
  {
    id: "fs-1",
    bankName: "Chase",
    last4: "4521",
    status: "active"
  }
];

describe("assistant", () => {
  it("parses payment failure query and explains return code", () => {
    const intent = parseChatIntent("Why did payment PAY-1043 fail?");
    expect(intent?.type).toBe("failure_reason");

    if (!intent || intent.type !== "failure_reason") {
      throw new Error("intent parsing failed");
    }

    const text = buildAssistantResponse({
      intent,
      payments,
      fundingSources,
      now: new Date("2026-02-25T12:00:00.000Z")
    });

    expect(text).toContain("R03");
    expect(text.toLowerCase()).toContain("account");
  });
});
