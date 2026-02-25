interface KpiCardProps {
  title: string;
  value: string;
  hint: string;
  tone?: "default" | "warn" | "danger" | "success";
  chip?: string;
}

const toneStyles: Record<
  NonNullable<KpiCardProps["tone"]>,
  { card: string; value: string; chip: string }
> = {
  default: {
    card: "kpi-tone-default",
    value: "kpi-value-default",
    chip: "kpi-chip-default"
  },
  warn: {
    card: "kpi-tone-warn",
    value: "kpi-value-warn",
    chip: "kpi-chip-warn"
  },
  danger: {
    card: "kpi-tone-danger",
    value: "kpi-value-danger",
    chip: "kpi-chip-danger"
  },
  success: {
    card: "kpi-tone-success",
    value: "kpi-value-success",
    chip: "kpi-chip-success"
  }
};

export function KpiCard({ title, value, hint, tone = "default", chip }: KpiCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className={`panel-elevated animate-fade-up p-4 ${styles.card}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{title}</p>
        {chip ? <span className={`badge ${styles.chip}`}>{chip}</span> : null}
      </div>
      <p className={`mt-2 text-3xl font-extrabold ${styles.value}`}>{value}</p>
      <p className="mt-1 text-sm subtle">{hint}</p>
    </div>
  );
}
