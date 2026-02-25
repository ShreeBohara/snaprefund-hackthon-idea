import type { FundingSource, Payment } from "./types";

export interface RecoveryResult {
  ok: boolean;
  message: string;
  payments: Payment[];
  newPayment?: Payment;
}

function createNextPaymentId(payments: Payment[]): string {
  const maxNumericId = payments.reduce((max, payment) => {
    const parsed = Number(payment.id.replace(/\D/g, ""));
    if (Number.isNaN(parsed)) {
      return max;
    }

    return Math.max(max, parsed);
  }, 1000);

  return `PAY-${maxNumericId + 1}`;
}

function findPayment(payments: Payment[], paymentId: string): Payment | undefined {
  return payments.find((payment) => payment.id.toLowerCase() === paymentId.toLowerCase());
}

function canCreateFollowUp(payment: Payment): { allowed: true } | { allowed: false; reason: string } {
  if (payment.status === "completed") {
    return { allowed: false, reason: "Payment is already completed. Creating a replacement is blocked." };
  }

  if (payment.status === "cancelled") {
    return { allowed: false, reason: "Payment is cancelled and no longer actionable." };
  }

  if (payment.supersededByPaymentId) {
    return {
      allowed: false,
      reason: `Payment was already superseded by ${payment.supersededByPaymentId}.`
    };
  }

  return { allowed: true };
}

function buildReplacementPayment(payment: Payment, nowIso: string, fundingSourceId: string): Payment {
  return {
    id: "",
    claimId: payment.claimId,
    recipientEmail: payment.recipientEmail,
    amountUsd: payment.amountUsd,
    status: "awaiting-cash-out",
    fundingSourceId,
    createdAt: nowIso,
    updatedAt: nowIso,
    openedAt: undefined
  };
}

export function resendLink(payments: Payment[], paymentId: string, nowIso: string): RecoveryResult {
  const payment = findPayment(payments, paymentId);
  if (!payment) {
    return { ok: false, message: `Payment ${paymentId} was not found.`, payments };
  }

  const guard = canCreateFollowUp(payment);
  if (!guard.allowed) {
    return { ok: false, message: guard.reason, payments };
  }

  const replacementBase = buildReplacementPayment(payment, nowIso, payment.fundingSourceId);
  const newPayment: Payment = {
    ...replacementBase,
    id: createNextPaymentId(payments)
  };

  const nextPayments = payments.map((item) =>
    item.id === payment.id
      ? {
          ...item,
          supersededByPaymentId: newPayment.id,
          updatedAt: nowIso
        }
      : item
  );

  return {
    ok: true,
    message: `Created replacement ${newPayment.id} for ${payment.id}.`,
    payments: [newPayment, ...nextPayments],
    newPayment
  };
}

export function switchBankAndResend(
  payments: Payment[],
  fundingSources: FundingSource[],
  paymentId: string,
  nowIso: string
): RecoveryResult {
  const payment = findPayment(payments, paymentId);
  if (!payment) {
    return { ok: false, message: `Payment ${paymentId} was not found.`, payments };
  }

  const guard = canCreateFollowUp(payment);
  if (!guard.allowed) {
    return { ok: false, message: guard.reason, payments };
  }

  const alternate = fundingSources.find(
    (source) => source.status === "active" && source.id !== payment.fundingSourceId
  );

  if (!alternate) {
    return {
      ok: false,
      message: "No alternate active funding source is available.",
      payments
    };
  }

  const replacementBase = buildReplacementPayment(payment, nowIso, alternate.id);
  const newPayment: Payment = {
    ...replacementBase,
    id: createNextPaymentId(payments)
  };

  const nextPayments = payments.map((item) =>
    item.id === payment.id
      ? {
          ...item,
          supersededByPaymentId: newPayment.id,
          updatedAt: nowIso
        }
      : item
  );

  return {
    ok: true,
    message: `Switched to ${alternate.bankName} ****${alternate.last4} and created ${newPayment.id}.`,
    payments: [newPayment, ...nextPayments],
    newPayment
  };
}

export function createReplacementPayment(payments: Payment[], paymentId: string, nowIso: string): RecoveryResult {
  const payment = findPayment(payments, paymentId);
  if (!payment) {
    return { ok: false, message: `Payment ${paymentId} was not found.`, payments };
  }

  const guard = canCreateFollowUp(payment);
  if (!guard.allowed) {
    return { ok: false, message: guard.reason, payments };
  }

  const replacementBase = buildReplacementPayment(payment, nowIso, payment.fundingSourceId);
  const newPayment: Payment = {
    ...replacementBase,
    id: createNextPaymentId(payments)
  };

  const nextPayments = payments.map((item) =>
    item.id === payment.id
      ? {
          ...item,
          supersededByPaymentId: newPayment.id,
          updatedAt: nowIso
        }
      : item
  );

  return {
    ok: true,
    message: `Created replacement payment ${newPayment.id} for failed payment ${payment.id}.`,
    payments: [newPayment, ...nextPayments],
    newPayment
  };
}
