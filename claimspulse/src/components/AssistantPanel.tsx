import { useState } from "react";
import type { AssistantResponse } from "../features/chat/assistantService";

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
  warning?: string;
}

interface AssistantPanelProps {
  openAiAvailable: boolean;
  onAsk: (prompt: string, enhanceWording: boolean) => Promise<AssistantResponse>;
}

const SUGGESTED_PROMPTS = [
  "Which payments need attention right now?",
  "Why did payment PAY-1043 fail?",
  "What's our cash-out rate this week?",
  "Show failed payments from the last 7 days",
  "Send $2,000 to john@gmail.com for claim CLM-98765"
];

export function AssistantPanel({ openAiAvailable, onAsk }: AssistantPanelProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [enhanceWording, setEnhanceWording] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Ask about priority payments, ACH failures, weekly cash-out rate, or preview a payment command."
    }
  ]);

  async function submitPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || loading) {
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const response = await onAsk(trimmed, enhanceWording);
      setMessages((prev) => [...prev, { role: "assistant", text: response.text, warning: response.warning }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel-elevated animate-fade-up h-full">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="eyebrow">Assistant</p>
          <h2 className="text-lg font-bold text-slate-900">Claims Co-Pilot</h2>
          <p className="text-sm subtle">Structured Q&A for adjusters with deterministic answers.</p>
        </div>
        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
          onClick={() =>
            setMessages([
              {
                role: "assistant",
                text: "Chat reset. Ask about priorities, failures, or send-payment preview."
              }
            ])
          }
          type="button"
        >
          Clear Chat
        </button>
      </div>

      <div className="thin-scrollbar max-h-[390px] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[94%] rounded-xl px-3 py-2 text-sm ${
              message.role === "assistant"
                ? "mr-auto border border-slate-200 bg-white text-slate-800"
                : "ml-auto bg-blue-600 text-white"
            }`}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
            {message.warning ? <p className="mt-1 text-xs text-amber-700">{message.warning}</p> : null}
          </div>
        ))}
        {loading && <p className="text-sm subtle">Generating response...</p>}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:-translate-y-px hover:border-slate-400 disabled:opacity-60"
            onClick={() => submitPrompt(prompt)}
            disabled={loading}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={enhanceWording}
            onChange={(event) => setEnhanceWording(event.target.checked)}
            disabled={!openAiAvailable}
          />
          Enhance wording with OpenAI (facts remain deterministic)
        </label>
        {!openAiAvailable && (
          <p className="mt-1 text-xs text-amber-700">No API key detected. Running in deterministic mode.</p>
        )}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          await submitPrompt(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          placeholder="Ask payment assistant..."
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-px hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={loading}
        >
          Send
        </button>
      </form>
    </section>
  );
}
