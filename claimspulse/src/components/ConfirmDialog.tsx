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
    <div className="overlay-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="dialog-surface w-full max-w-md p-5">
        <p className="eyebrow">Confirm Action</p>
        <h3 className="mt-1 text-lg font-bold text-main">{title}</h3>
        <p className="mt-2 text-sm subtle leading-relaxed">{description}</p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button className="btn-secondary px-3 py-2 text-sm" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="btn-primary px-3 py-2 text-sm" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
