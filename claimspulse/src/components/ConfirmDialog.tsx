interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="surface-soft w-full max-w-md rounded-2xl border border-slate-200 p-5 shadow-2xl">
        <p className="eyebrow">Confirm Action</p>
        <h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm subtle leading-relaxed">{description}</p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow hover:-translate-y-px hover:shadow-md"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
