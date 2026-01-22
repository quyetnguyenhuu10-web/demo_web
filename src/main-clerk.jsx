// main-clerk.jsx - Entry point với Clerk
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Import CSS để Vite inject vào
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

  // Tìm hoặc tạo root element
  let rootEl = document.getElementById("root");
  if (!rootEl) {
    // Nếu không có #root, tạo mới
    rootEl = document.createElement("div");
    rootEl.id = "root";
    document.body.appendChild(rootEl);
  }

  // Luôn render với ClerkWrapper để SidebarMenu có thể dùng Clerk hooks
  // ClerkWrapper sẽ xử lý trường hợp không có key bằng dummy key
  const root = createRoot(rootEl);
  root.render(
    <StrictMode>
      <AppWrapper clerkKey={clerkKey} />
    </StrictMode>
  );
}

// Chạy init
init();
