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
  try {
    // Đảm bảo theme được set trước khi render - FORCE light để tránh tối om
    const THEME_KEY = "ui_theme";
    const saved = localStorage.getItem(THEME_KEY);
    // FORCE light mode mặc định (user có thể đổi bằng nút toggle)
    let theme = "light";
    if (saved === "light") {
      theme = "light";
    } else if (saved === "dark") {
      // Nếu đang dark, vẫn force light để tránh tối om
      theme = "light";
      localStorage.setItem(THEME_KEY, "light"); // Update localStorage
    }
    document.documentElement.setAttribute("data-theme", theme);

    const clerkKey = String(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "").trim();
    const rootEl = document.getElementById("root");

    if (!rootEl) {
      console.error("❌ Missing #root in index.html");
      // Fallback: tạo root và thử lại
      const fallbackRoot = document.createElement("div");
      fallbackRoot.id = "root";
      document.body.appendChild(fallbackRoot);
      console.warn("⚠️ Created #root as fallback");
      return init();
    }

    // Nếu không có clerkKey thì render App trực tiếp (no-auth mode)
    const node = clerkKey
      ? <AppWrapper clerkKey={clerkKey} />
      : <App />;

    const root = createRoot(rootEl);
    root.render(
      <StrictMode>
        {node}
      </StrictMode>
    );
    
  } catch (error) {
    console.error("❌ Failed to initialize app:", error);
    // Show error on screen
    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #ff4444; background: #fff;">
          <h1>❌ Error loading app</h1>
          <p>${error.message}</p>
          <pre style="text-align: left; margin-top: 1rem;">${error.stack}</pre>
          <p>Check browser console for details.</p>
        </div>
      `;
    }
  }
}

// Chạy khi DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
