import { Middleware, isRejectedWithValue } from "@reduxjs/toolkit";

import { showToast } from "../components/toast/toastSlice";
import { darbeBaseApi } from "./api/endpoints/darbe.api";

const getErrorMessage = (payload: unknown): string => {
  if (typeof payload === "string") {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return "Something went wrong. Please try again.";
  }

  const errorPayload = payload as {
    data?: { message?: string; error?: string } | string;
    error?: string;
    message?: string;
  };

  if (typeof errorPayload.data === "string") {
    return errorPayload.data;
  }

  return (
    errorPayload.data?.message ||
    errorPayload.data?.error ||
    errorPayload.message ||
    errorPayload.error ||
    "Something went wrong. Please try again."
  );
};

const errorToastMiddleware: Middleware = (store) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    store.dispatch(
      showToast({
        message: getErrorMessage(action.payload),
        type: "error",
      })
    );
  }

  return next(action);
};

export const configureMiddleware = (getDefaultMiddleware: any) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
    },
  }).concat(errorToastMiddleware, darbeBaseApi.middleware);
