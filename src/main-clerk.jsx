// main-clerk.jsx - Entry point với Clerk (SSOT mount)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Import CSS để Vite inject vào
import ClerkWrapper from "./ClerkWrapper.jsx";
import App from "./App.jsx";

function AppWrapper({ clerkKey }) {
  return (
    <ClerkWrapper publishableKey={clerkKey}>
      <App />
    </ClerkWrapper>
  );
}

function init() {
  const clerkKey = String(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "").trim();
  const rootEl = document.getElementById("root");

  if (!rootEl) {
    console.error("❌ Missing #root in index.html");
    return;
  }

  // Nếu không có clerkKey thì vẫn mount App bình thường (dev/no-auth)
  const node = clerkKey ? (
    <AppWrapper clerkKey={clerkKey} />
  ) : (
    <App />
  );

  createRoot(rootEl).render(
    <StrictMode>
      {node}
    </StrictMode>
  );
}

init();
