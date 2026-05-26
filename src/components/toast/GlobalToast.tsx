import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "../../services/hooks";
import { hideToast } from "./toastSlice";
import styles from "./styles/globalToast.module.css";

export const GlobalToast = () => {
  const dispatch = useAppDispatch();
  const toast = useAppSelector((state) => state.toast);

  useEffect(() => {
    if (!toast.visible) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(hideToast());
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, toast.message, toast.visible]);

  if (!toast.visible || !toast.message) {
    return null;
  }

  return (
    <div
      className={`${styles.globalToast} ${styles[toast.type]}`}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  );
};
