import { useEffect, useMemo, useState } from "react";
import { CircularProgress } from "@mui/material";

import { darbeBaseApi } from "../../services/api/endpoints/darbe.api";
import { useAppSelector } from "../../services/hooks";

import styles from "./styles/globalLoadingOverlay.module.css";

const LOADING_DELAY_MS = 500;

type QuerySubState = {
  status?: string;
};

type ApiSubState = {
  queries?: Record<string, QuerySubState | undefined>;
  mutations?: Record<string, QuerySubState | undefined>;
};

export const GlobalLoadingOverlay = () => {
  const apiState = useAppSelector(
    (state) => state[darbeBaseApi.reducerPath] as ApiSubState | undefined
  );
  const [shouldShow, setShouldShow] = useState(false);

  const hasPendingRequest = useMemo(() => {
    const pendingQueries = Object.values(apiState?.queries ?? {}).some(
      (query) => query?.status === "pending"
    );
    const pendingMutations = Object.values(apiState?.mutations ?? {}).some(
      (mutation) => mutation?.status === "pending"
    );

    return pendingQueries || pendingMutations;
  }, [apiState?.queries, apiState?.mutations]);

  useEffect(() => {
    if (!hasPendingRequest) {
      setShouldShow(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldShow(true);
    }, LOADING_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [hasPendingRequest]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      className={styles.globalLoadingOverlay}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className={styles.globalLoadingSpinner}>
        <CircularProgress size={44} thickness={4} />
      </div>
    </div>
  );
};
