import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";

import { GlobalLoadingOverlay } from "./components/loading/GlobalLoadingOverlay";
import { GlobalToast } from "./components/toast/GlobalToast";
import { router } from "./routes/paths";
import { persistor, store } from "./services/store";

import "./globalStyles/global.css";

const baseUrl = import.meta.env.BASE_URL || "/";
const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
document.documentElement.style.setProperty("--base-url", normalizedBaseUrl);
document.documentElement.style.setProperty(
  "--signup-desktop-image",
  `url("${normalizedBaseUrl}images/signupDesktopImage.png")`
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GlobalLoadingOverlay />
        <GlobalToast />
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  </StrictMode>
);
