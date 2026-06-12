import styles from "./confirmDialog.module.css";

interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  title,
  message,
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <div className={styles.confirmOverlay}>
    <div
      className={styles.confirmDialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <h2 id="confirm-dialog-title">{title}</h2>
      {message ? <p>{message}</p> : null}
      <div className={styles.confirmActions}>
        <button
          type="button"
          className={styles.confirmButton}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  </div>
);
