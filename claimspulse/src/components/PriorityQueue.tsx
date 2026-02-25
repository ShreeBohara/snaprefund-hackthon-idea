import type { PriorityItem, TriageSuggestion } from "../features/payments/types";
import { PaymentCard } from "./PaymentCard";

interface PriorityQueueProps {
  items: PriorityItem[];
  suggestionById: Map<string, TriageSuggestion>;
  onResend: (paymentId: string) => void;
  onSwitchBank: (paymentId: string) => void;
  onCreateReplacement: (paymentId: string) => void;
  onGenerateDraft: (paymentId: string) => void;
}

export function PriorityQueue({
  items,
  suggestionById,
  onResend,
  onSwitchBank,
  onCreateReplacement,
  onGenerateDraft
}: PriorityQueueProps) {
  if (items.length === 0) {
    return (
      <section className="panel-elevated animate-fade-up p-4">
        <p className="eyebrow">Priority Queue</p>
        <h2 className="mt-1 text-lg font-bold text-main">No active risks right now</h2>
        <p className="mt-2 text-sm text-muted">
          All actionable payments are clear. Keep monitoring for new failures or stale payouts.
        </p>
      </section>
    );
  }

  return (
    <section className="panel-elevated animate-fade-up p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="eyebrow">Priority Queue</p>
          <h2 className="text-lg font-bold text-main">Immediate Action List</h2>
          <p className="text-sm text-muted">Sorted by risk score so adjusters can act in order.</p>
        </div>
        <p className="soft-pill">{items.length} actionable payments</p>
      </div>

      <div className="thin-scrollbar max-h-[860px] space-y-3 overflow-y-auto pr-1">
        {items.map((item) => {
          const suggestion = suggestionById.get(item.payment.id);
          if (!suggestion) {
            return null;
          }

          return (
            <PaymentCard
              key={item.payment.id}
              item={item}
              suggestion={suggestion}
              onResend={onResend}
              onSwitchBank={onSwitchBank}
              onCreateReplacement={onCreateReplacement}
              onGenerateDraft={onGenerateDraft}
            />
          );
        })}
      </div>
    </section>
  );
}
