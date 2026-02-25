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
    <section className="panel-elevated animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow">Analytics</p>
          <h2 className="text-lg font-bold text-slate-900">Payment Health Trend</h2>
          <p className="text-sm subtle">Last 7 days of completions and failures.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-900">Completed</span>
          <span className="rounded-full bg-red-100 px-2 py-1 text-red-900">Failed</span>
        </div>
      </div>

      <div className="mt-4 h-64 rounded-xl border border-slate-200 bg-white p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d7e1f1" />
            <XAxis dataKey="dayLabel" tick={{ fontSize: 12, fill: "#475569" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#475569" }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="completedCount"
              stroke="#1b8a5a"
              strokeWidth={3}
              dot={{ r: 3, fill: "#1b8a5a" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="failedCount"
              stroke="#c62828"
              strokeWidth={3}
              dot={{ r: 3, fill: "#c62828" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="mt-5 text-sm font-bold uppercase tracking-wide subtle">Funding Source Performance</h3>
      <div className="mt-2 space-y-2">
        {bankPerformance.map((source) => (
          <div key={source.fundingSourceId} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">
                {source.bankName} ****{source.last4}
              </p>
              <p className="text-xs font-semibold text-slate-700">Success {source.successRate.toFixed(0)}%</p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.max(4, Math.min(100, source.successRate))}%` }}
              />
            </div>
            <p className="mt-1 text-xs subtle">
              {source.completedCount} completed / {source.failedCount} failed ({source.totalCount} total)
            </p>
          </div>
        ))}
        {bankPerformance.length === 0 && <p className="text-sm subtle">No funding source performance data yet.</p>}
      </div>

      <p className="mt-4 text-xs subtle">
        Objective: increase conversion on stale pending payouts and reduce failed ACH retries.
      </p>
    </section>
  );
}
