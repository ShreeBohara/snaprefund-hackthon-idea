interface KpiCardProps {
  title: string;
  value: string;
  hint: string;
  tone?: "default" | "warn" | "danger" | "success";
  chip?: string;
}

const toneStyles: Record<NonNullable<KpiCardProps["tone"]>, { card: string; value: string; chip: string }> = {
  default: {
    card: "from-white to-slate-50",
    value: "text-slate-900",
    chip: "border-slate-300 bg-white text-slate-700"
  },
  warn: {
    card: "from-amber-50 to-white",
    value: "text-amber-900",
    chip: "border-amber-200 bg-amber-100 text-amber-900"
  },
  danger: {
    card: "from-red-50 to-white",
    value: "text-red-900",
    chip: "border-red-200 bg-red-100 text-red-900"
  },
  success: {
    card: "from-emerald-50 to-white",
    value: "text-emerald-900",
    chip: "border-emerald-200 bg-emerald-100 text-emerald-900"
  }
};

export function KpiCard({ title, value, hint, tone = "default", chip }: KpiCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className={`panel-elevated animate-fade-up bg-gradient-to-br ${styles.card}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{title}</p>
        {chip ? <span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${styles.chip}`}>{chip}</span> : null}
      </div>
      <p className={`mt-2 text-3xl font-extrabold ${styles.value}`}>{value}</p>
      <p className="mt-1 text-sm subtle">{hint}</p>
    </div>
  );
}
