import storage from "redux-persist/lib/storage";
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { persistReducer, persistStore } from "redux-persist";
import { rootReducer } from "./rootReducer";
import { configureMiddleware } from "./middleware";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["users", "feed"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    configureMiddleware(getDefaultMiddleware),
  devTools: import.meta.env.VITE_ENVIRONMENT !== "production",
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);

// Export a few types that we'll use in our application
export type AppStore = typeof store;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = AppStore["dispatch"];
