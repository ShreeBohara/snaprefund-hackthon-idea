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
    <section className="panel-elevated animate-fade-up h-full p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="eyebrow">Assistant</p>
          <h2 className="text-lg font-bold text-main">Claims Co-Pilot</h2>
          <p className="text-sm text-muted">Structured Q&A for adjusters with deterministic answers.</p>
        </div>
        <button
          className="btn-secondary px-3 py-1 text-xs"
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

      <div className="thin-scrollbar max-h-[390px] space-y-3 overflow-y-auto rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className="max-w-[94%] rounded-xl px-3 py-2 text-sm"
            style={
              message.role === "assistant"
                ? {
                    marginRight: "auto",
                    border: "1px solid var(--border)",
                    background: "var(--surface-soft)",
                    color: "var(--text)"
                  }
                : {
                    marginLeft: "auto",
                    background: "linear-gradient(130deg, var(--primary), var(--accent-cyan))",
                    color: "#041426"
                  }
            }
          >
            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
            {message.warning ? (
              <p className="mt-1 text-xs" style={{ color: "var(--warn)" }}>
                {message.warning}
              </p>
            ) : null}
          </div>
        ))}
        {loading && <p className="text-sm text-muted">Generating response...</p>}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            className="btn-secondary px-3 py-2 text-left text-xs disabled:opacity-60"
            onClick={() => submitPrompt(prompt)}
            disabled={loading}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="card mt-4 px-3 py-2">
        <label className="flex items-center gap-2 text-xs text-main">
          <input
            type="checkbox"
            checked={enhanceWording}
            onChange={(event) => setEnhanceWording(event.target.checked)}
            disabled={!openAiAvailable}
          />
          Enhance wording with OpenAI (facts remain deterministic)
        </label>
        {!openAiAvailable && (
          <p className="mt-1 text-xs" style={{ color: "var(--warn)" }}>
            No API key detected. Running in deterministic mode.
          </p>
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
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--input-border)", background: "var(--input-bg)", color: "var(--text)" }}
          placeholder="Ask payment assistant..."
        />
        <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={loading}>
          Send
        </button>
      </form>
    </section>
  );
}
