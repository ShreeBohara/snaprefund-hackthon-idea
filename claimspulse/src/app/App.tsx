import { useEffect, useMemo, useState } from "react";
import { AnalyticsPanel } from "../components/AnalyticsPanel";
import { AssistantPanel } from "../components/AssistantPanel";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { KpiCard } from "../components/KpiCard";
import { PriorityQueue } from "../components/PriorityQueue";
import { mockFundingSources } from "../data/mockFundingSources";
import { mockPayments } from "../data/mockPayments";
import { buildAssistantResponse, enhanceAssistantWording } from "../features/chat/assistantService";
import { parseChatIntent } from "../features/chat/intentParser";
import {
  createReplacementPayment,
  resendLink,
  switchBankAndResend
} from "../features/payments/actions";
import {
  getDashboardMetrics,
  selectBankPerformance,
  selectCashoutTrend,
  selectPriorityItems
} from "../features/payments/selectors";
import { buildTriageSuggestion } from "../features/triage/triageEngine";
import type { FundingSource, Payment } from "../features/payments/types";
import { MockGateway } from "../lib/gateways/mockGateway";
import type { PaymentGateway } from "../lib/gateways/paymentGateway";
import { SnapRefundGateway } from "../lib/gateways/snapRefundGateway";
import { formatCurrency } from "../lib/utils/format";
import { useTheme } from "../theme/ThemeProvider";

interface Notice {
  tone: "info" | "error" | "success";
  text: string;
}

interface DraftPreview {
  paymentId: string;
  sms: string;
  email: string;
}

type PendingActionType = "resend" | "switch-bank" | "replacement";

interface PendingAction {
  type: PendingActionType;
  paymentId: string;
}

function clonePayments(seed: Payment[]): Payment[] {
  return JSON.parse(JSON.stringify(seed)) as Payment[];
}

function getPendingActionMeta(action: PendingAction): { title: string; description: string; confirmLabel: string } {
  switch (action.type) {
    case "resend":
      return {
        title: "Resend payment link?",
        description:
          "This creates a replacement pending payment and marks the original as superseded. Continue if the original is still unresolved.",
        confirmLabel: "Create Resend"
      };
    case "switch-bank":
      return {
        title: "Switch bank and resend?",
        description:
          "This creates a replacement pending payment using an alternate active funding source.",
        confirmLabel: "Switch & Resend"
      };
    case "replacement":
      return {
        title: "Create replacement payment?",
        description: "Use this when the original payment failed and a clean retry is needed.",
        confirmLabel: "Create Replacement"
      };
    default:
      return {
        title: "Confirm action",
        description: "Confirm this payment action.",
        confirmLabel: "Confirm"
      };
  }
}

export function App() {
  const configuredMode =
    String(import.meta.env.VITE_DATA_MODE ?? "mock").toLowerCase() === "live" ? "live" : "mock";
  const openAiApiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const { mode, toggle } = useTheme();

  const liveBaseUrl = import.meta.env.VITE_SNAPREFUND_BASE_URL as string | undefined;
  const liveToken = import.meta.env.VITE_SNAPREFUND_TOKEN as string | undefined;

  const gateway: PaymentGateway = useMemo(() => {
    if (configuredMode === "live" && liveBaseUrl && liveToken) {
      return new SnapRefundGateway({ baseUrl: liveBaseUrl, token: liveToken });
    }

    return new MockGateway(mockPayments);
  }, [configuredMode, liveBaseUrl, liveToken]);

  const [payments, setPayments] = useState<Payment[]>(() => clonePayments(mockPayments));
  const [fundingSources, setFundingSources] = useState<FundingSource[]>(mockFundingSources);
  const [loadingSources, setLoadingSources] = useState<boolean>(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [draftPreview, setDraftPreview] = useState<DraftPreview | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFundingSources() {
      setLoadingSources(true);
      try {
        const sources = await gateway.listFundingSources();
        if (!cancelled) {
          setFundingSources(sources.length > 0 ? sources : mockFundingSources);
          if (configuredMode === "live" && (!liveBaseUrl || !liveToken)) {
            setNotice({
              tone: "info",
              text: "Live mode requested but credentials are missing. Running in mock adapter mode."
            });
          }
        }
      } catch (error) {
        if (!cancelled) {
          setFundingSources(mockFundingSources);
          setNotice({
            tone: "error",
            text: `Funding sources failed to load from gateway: ${error instanceof Error ? error.message : "Unknown error"}. Using fallback mock data.`
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingSources(false);
        }
      }
    }

    void loadFundingSources();

    return () => {
      cancelled = true;
    };
  }, [gateway, configuredMode, liveBaseUrl, liveToken]);

  const metrics = useMemo(() => getDashboardMetrics(payments, now), [payments, now]);
  const priorityItems = useMemo(() => selectPriorityItems(payments, now), [payments, now]);
  const trend = useMemo(() => selectCashoutTrend(payments, 7, now), [payments, now]);
  const bankPerformance = useMemo(
    () => selectBankPerformance(payments, fundingSources),
    [payments, fundingSources]
  );

  const suggestionById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildTriageSuggestion>>();
    priorityItems.forEach((item) => {
      map.set(item.payment.id, buildTriageSuggestion(item.payment, item.risk));
    });

    return map;
  }, [priorityItems]);

  const visiblePriorityItems = priorityItems.slice(0, 8);
  const topPriority = visiblePriorityItems[0];
  const actionableExposure = visiblePriorityItems.reduce((sum, item) => sum + item.payment.amountUsd, 0);

  function resetDemoData() {
    setPayments(clonePayments(mockPayments));
    setNotice({ tone: "success", text: "Demo data reset complete." });
  }

  function queueAction(type: PendingActionType, paymentId: string) {
    setPendingAction({ type, paymentId });
  }

  function runConfirmedAction() {
    if (!pendingAction) {
      return;
    }

    const nowIso = new Date().toISOString();
    const result =
      pendingAction.type === "resend"
        ? resendLink(payments, pendingAction.paymentId, nowIso)
        : pendingAction.type === "switch-bank"
          ? switchBankAndResend(payments, fundingSources, pendingAction.paymentId, nowIso)
          : createReplacementPayment(payments, pendingAction.paymentId, nowIso);

    setPendingAction(null);
    setPayments(result.payments);

    if (result.ok) {
      setNotice({ tone: "success", text: result.message });
      return;
    }

    setNotice({ tone: "error", text: result.message });
  }

  function openDraftPreview(paymentId: string) {
    const item = priorityItems.find((entry) => entry.payment.id === paymentId);
    if (!item) {
      setNotice({ tone: "error", text: `Unable to find payment ${paymentId} for draft generation.` });
      return;
    }

    const suggestion = buildTriageSuggestion(item.payment, item.risk);
    setDraftPreview({
      paymentId,
      sms: suggestion.smsDraft,
      email: suggestion.emailDraft
    });
  }

  async function handleAssistantAsk(prompt: string, enhanceWording: boolean) {
    const intent = parseChatIntent(prompt);
    if (!intent) {
      return {
        text: "I can help with: priorities, failure reasons, cash-out rate, failed in last 7 days, and send-payment preview commands."
      };
    }

    const deterministic = buildAssistantResponse({
      intent,
      payments,
      fundingSources,
      now
    });

    if (enhanceWording && openAiApiKey) {
      try {
        const rewritten = await enhanceAssistantWording({
          baseText: deterministic,
          apiKey: openAiApiKey
        });

        return { text: rewritten };
      } catch {
        return {
          text: deterministic,
          warning: "OpenAI wording enhancement failed. Showing deterministic result."
        };
      }
    }

    return { text: deterministic };
  }

  const pendingMeta = pendingAction ? getPendingActionMeta(pendingAction) : null;

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-5 md:px-6 md:py-8">
      <header className="panel-elevated animate-fade-up mb-4 overflow-hidden p-0">
        <div className="grid gap-4 p-5 lg:grid-cols-[2.2fr_1fr] lg:p-6">
          <div>
            <p className="eyebrow">Claims Intelligence</p>
            <h1 className="mt-1 text-3xl font-extrabold text-main md:text-4xl">ClaimsPulse</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
              Detect stale and failed claim payouts, prioritize high-impact recoveries, and guide next best action in a
              single command center.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="soft-pill">Mode: {configuredMode === "live" ? "Live Adapter" : "Mock Adapter"}</span>
              <span className="soft-pill">{loadingSources ? "Loading sources..." : `${fundingSources.length} funding sources`}</span>
              <span className="soft-pill">Updated {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <button className="btn-secondary px-3 py-1 text-xs" onClick={toggle} type="button">
                Theme: {mode === "dark" ? "Dark" : "Light"}
              </button>
            </div>
          </div>

          <div className="card p-4">
            <p className="eyebrow">Now</p>
            <p className="mt-1 text-sm font-semibold text-main">
              {topPriority
                ? `Top risk: ${topPriority.payment.claimId} ${formatCurrency(topPriority.payment.amountUsd)}`
                : "No active critical queue"}
            </p>
            <p className="mt-2 text-sm text-muted">Actionable exposure (top 8): {formatCurrency(actionableExposure)}</p>
            <button
              onClick={resetDemoData}
              className="btn-primary mt-4 px-3 py-2 text-sm"
              type="button"
            >
              Reset Demo Data
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div
          className={`notice mb-4 flex items-center justify-between gap-3 ${
            notice.tone === "error"
              ? "notice-error"
              : notice.tone === "success"
                ? "notice-success"
                : "notice-info"
          }`}
        >
          <p>{notice.text}</p>
          <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setNotice(null)} type="button">
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Active Payments"
          value={metrics.activeCount.toString()}
          hint="Awaiting, lock, and in-transit"
          chip="Live"
        />
        <KpiCard
          title="Stale > 24h"
          value={metrics.staleCount.toString()}
          hint="Awaiting-cash-out only"
          tone="warn"
          chip="Needs Follow-up"
        />
        <KpiCard
          title="Failed"
          value={metrics.failedCount.toString()}
          hint="Immediate attention queue"
          tone="danger"
          chip="Urgent"
        />
        <KpiCard
          title="At-Risk Volume"
          value={formatCurrency(metrics.atRiskUsd)}
          hint={`Cash-out rate ${metrics.cashOutRate.toFixed(1)}%`}
          tone="success"
          chip="Recovered Focus"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <PriorityQueue
          items={visiblePriorityItems}
          suggestionById={suggestionById}
          onResend={(paymentId) => queueAction("resend", paymentId)}
          onSwitchBank={(paymentId) => queueAction("switch-bank", paymentId)}
          onCreateReplacement={(paymentId) => queueAction("replacement", paymentId)}
          onGenerateDraft={openDraftPreview}
        />
        <AssistantPanel openAiAvailable={Boolean(openAiApiKey)} onAsk={handleAssistantAsk} />
      </div>

      <div className="mt-4">
        <AnalyticsPanel trend={trend} bankPerformance={bankPerformance} />
      </div>

      {draftPreview && (
        <div className="overlay-backdrop fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="dialog-surface w-full max-w-3xl p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="eyebrow">Generated Outreach</p>
                <h3 className="text-lg font-bold text-main">Follow-up Drafts ({draftPreview.paymentId})</h3>
                <p className="text-sm text-muted">Copy-ready templates for SMS and email outreach.</p>
              </div>
              <button className="btn-secondary px-3 py-1 text-sm" onClick={() => setDraftPreview(null)} type="button">
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="card p-3">
                <p className="eyebrow">SMS Draft</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-main">{draftPreview.sms}</p>
              </div>
              <div className="card p-3">
                <p className="eyebrow">Email Draft</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-main">{draftPreview.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction && pendingMeta)}
        title={pendingMeta?.title ?? "Confirm Action"}
        description={pendingMeta?.description ?? "Review action"}
        confirmLabel={pendingMeta?.confirmLabel ?? "Confirm"}
        onCancel={() => setPendingAction(null)}
        onConfirm={runConfirmedAction}
      />
    </div>
  );
}
