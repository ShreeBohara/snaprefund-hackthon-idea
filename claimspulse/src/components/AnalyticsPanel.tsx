import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { BankPerformance, CashoutTrendPoint } from "../features/payments/types";

interface AnalyticsPanelProps {
  trend: CashoutTrendPoint[];
  bankPerformance: BankPerformance[];
}

export function AnalyticsPanel({ trend, bankPerformance }: AnalyticsPanelProps) {
  return (
    <section className="panel-elevated animate-fade-up p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow">Analytics</p>
          <h2 className="text-lg font-bold text-main">Payment Health Trend</h2>
          <p className="text-sm text-muted">Last 7 days of completions and failures.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="badge status-completed">Completed</span>
          <span className="badge status-failed">Failed</span>
        </div>
      </div>

      <div className="mt-4 h-64 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="dayLabel" tick={{ fontSize: 12, fill: "var(--muted)" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border-strong)",
                background: "var(--surface-elevated)",
                color: "var(--text)"
              }}
            />
            <Line
              type="monotone"
              dataKey="completedCount"
              stroke="var(--success)"
              strokeWidth={3}
              dot={{ r: 3, fill: "var(--success)" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="failedCount"
              stroke="var(--danger)"
              strokeWidth={3}
              dot={{ r: 3, fill: "var(--danger)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-muted">Funding Source Performance</h3>
      <div className="mt-2 space-y-2">
        {bankPerformance.map((source) => (
          <div key={source.fundingSourceId} className="card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-main">
                {source.bankName} ****{source.last4}
              </p>
              <p className="text-xs font-semibold text-main">Success {source.successRate.toFixed(0)}%</p>
            </div>
            <div className="mt-2 h-2 rounded-full" style={{ background: "rgba(157, 176, 207, 0.25)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(4, Math.min(100, source.successRate))}%`,
                  background: "linear-gradient(135deg, var(--primary), var(--success))"
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              {source.completedCount} completed / {source.failedCount} failed ({source.totalCount} total)
            </p>
          </div>
        ))}
        {bankPerformance.length === 0 && <p className="text-sm text-muted">No funding source performance data yet.</p>}
      </div>

      <p className="mt-4 text-xs text-muted">
        Objective: increase conversion on stale pending payouts and reduce failed ACH retries.
      </p>
    </section>
  );
}
