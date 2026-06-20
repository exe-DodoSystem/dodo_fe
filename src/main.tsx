import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import { NotificationProvider } from "./contexts/NotificationContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
