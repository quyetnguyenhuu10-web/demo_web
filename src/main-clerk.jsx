// main-clerk.jsx - Entry point với Clerk
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ClerkWrapper from "./ClerkWrapper.jsx";
import App from "./App.jsx";

// Tạo wrapper để mount Clerk UI + React App
function AppWrapper({ clerkKey }) {
  return (
    <ClerkWrapper publishableKey={clerkKey}>
      {/* Mount React App component */}
      <App />
    </ClerkWrapper>
  );
}

// Initialize function
function init() {
  // Kiểm tra xem có Clerk key không
  // Đọc trực tiếp từ import.meta.env để tránh cache issues
  const clerkKey = String(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "").trim();

  // Chỉ log khi cần debug (có thể tắt bằng cách comment)
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_CLERK === "true") {
    console.log("🔍 Checking Clerk configuration...");
    console.log("  - VITE_CLERK_PUBLISHABLE_KEY:", clerkKey ? "[CONFIGURED]" : "❌ NOT FOUND");
  }

  if (!clerkKey) {
    console.warn("⚠️ Clerk Publishable Key chưa được cấu hình. Chạy app không có authentication.");
    console.warn("   Hãy kiểm tra file .env có VITE_CLERK_PUBLISHABLE_KEY không và restart dev server.");
    // Nếu không có Clerk key, hiển thị app ngay (không cần ẩn)
    import("./main.jsx");
  } else {
    // Chỉ log khi debug
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_CLERK === "true") {
      console.log("✅ Clerk key found: [CONFIGURED]");
      console.log("✅ Initializing Clerk authentication...");
    }
    
    // Không ẩn app ở đây - để ClerkWrapper quản lý hoàn toàn
    // ClerkWrapper sẽ ẩn/hiển thị app dựa trên auth state
    
    // Ẩn HTML tĩnh ngay lập tức vì App.jsx sẽ render lại toàn bộ
    const staticTopbar = document.querySelector(".topbar:not([data-react])");
    const staticApp = document.querySelector(".app:not([data-react])");
    if (staticTopbar) {
      staticTopbar.style.display = "none";
      staticTopbar.setAttribute("data-react", "hidden");
    }
    if (staticApp) {
      staticApp.style.display = "none";
      staticApp.setAttribute("data-react", "hidden");
    }
    
    // Mount Clerk wrapper + React App vào body
    // App.jsx sẽ render toàn bộ UI (topbar + app) vào body
    const clerkContainer = document.createElement("div");
    clerkContainer.id = "clerk-root";
    // KHÔNG set position absolute - để App.jsx render vào body tự nhiên
    document.body.appendChild(clerkContainer);

    const clerkRoot = createRoot(clerkContainer);
    clerkRoot.render(
      <StrictMode>
        <AppWrapper clerkKey={clerkKey} />
      </StrictMode>
    );
    
    // KHÔNG import main.jsx nữa - App.jsx sẽ thay thế hoàn toàn
    // App.jsx đã có đầy đủ chức năng (streaming, markdown, etc.)
  }
}

// Chạy init
init();
