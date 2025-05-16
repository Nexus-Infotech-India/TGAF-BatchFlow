import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { syncRoutePermissions } from "./hooks/Route/sync.ts";

const queryClient = new QueryClient();

const initializeApp = async () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    // If logged in, sync permissions
    await syncRoutePermissions();
  }
};

// Initialize the app
initializeApp().catch(console.error);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);