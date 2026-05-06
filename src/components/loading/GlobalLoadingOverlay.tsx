import { useEffect, useMemo, useState } from "react";
import { CircularProgress } from "@mui/material";

import { darbeBaseApi } from "../../services/api/endpoints/darbe.api";
import { useAppSelector } from "../../services/hooks";
import { MATCH_ROUTE } from "../../routes/route.constants";

import styles from "./styles/globalLoadingOverlay.module.css";

const LOADING_DELAY_MS = 500;
const LOCAL_SPINNER_SELECTOR = '[role="progressbar"]';
const GLOBAL_LOADING_OVERLAY_ATTR = "data-global-loading-overlay";

type QuerySubState = {
  status?: string;
};

type ApiSubState = {
  queries?: Record<string, QuerySubState | undefined>;
  mutations?: Record<string, QuerySubState | undefined>;
};

const hasPageSpinner = () =>
  Array.from(document.querySelectorAll(LOCAL_SPINNER_SELECTOR)).some(
    (spinner) => !spinner.closest(`[${GLOBAL_LOADING_OVERLAY_ATTR}="true"]`)
  );

const isMatchRoute = () => window.location.pathname.endsWith(MATCH_ROUTE);

export const GlobalLoadingOverlay = () => {
  const apiState = useAppSelector(
    (state) => state[darbeBaseApi.reducerPath] as ApiSubState | undefined
  );
  const [shouldShow, setShouldShow] = useState(false);
  const [hasLocalSpinner, setHasLocalSpinner] = useState(false);

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
    if (!hasPendingRequest || isMatchRoute()) {
      setHasLocalSpinner(false);
      return;
    }

    const updateLocalSpinnerStatus = () => {
      const nextHasLocalSpinner = hasPageSpinner();
      setHasLocalSpinner((currentHasLocalSpinner) =>
        currentHasLocalSpinner === nextHasLocalSpinner
          ? currentHasLocalSpinner
          : nextHasLocalSpinner
      );
    };

    updateLocalSpinnerStatus();

    const observer = new MutationObserver(updateLocalSpinnerStatus);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [hasPendingRequest]);

  useEffect(() => {
    if (!hasPendingRequest || hasLocalSpinner || isMatchRoute()) {
      setShouldShow(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldShow(!hasPageSpinner());
    }, LOADING_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [hasPendingRequest, hasLocalSpinner]);

  if (!shouldShow || isMatchRoute()) {
    return null;
  }

  return (
    <div
      className={styles.globalLoadingOverlay}
      role="status"
      aria-live="polite"
      aria-label="Loading"
      data-global-loading-overlay="true"
    >
      <div className={styles.globalLoadingSpinner}>
        <CircularProgress size={44} thickness={4} />
      </div>
    </div>
  );
};
