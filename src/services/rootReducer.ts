import storage from "redux-persist/lib/storage";
import { Action, combineReducers } from "@reduxjs/toolkit";

import { darbeBaseApi } from "./api/endpoints/darbe.api";
import userReducer from "../features/users/userSlice";
import modalReducer from "../components/modal/modalSlice";
import feedReducer from "../features/feed/feedSlice";

const appReducer = combineReducers({
  [darbeBaseApi.reducerPath]: darbeBaseApi.reducer,
  users: userReducer,
  modal: modalReducer,
  feed: feedReducer,
});

export const rootReducer = (state: any | undefined, action: Action) => {
  if (action.type === "LOGOUT") {
    storage.removeItem("persist:root");
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};
