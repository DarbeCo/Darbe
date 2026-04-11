import { darbeBaseApi } from "./api/endpoints/darbe.api";

export const configureMiddleware = (getDefaultMiddleware: any) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
    },
  }).concat(darbeBaseApi.middleware);
