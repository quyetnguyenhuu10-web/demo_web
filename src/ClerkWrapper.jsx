// ClerkWrapper.jsx - Wrap app với Clerk authentication + ABAC Authorization
import { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut, useUser, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { checkAuthorization } from "./auth-utils.js";
import { buildApiUrl, buildApiHeaders } from "./config.js";
import PendingApproval from "./PendingApproval.jsx";
import ViewerNotice from "./ViewerNotice.jsx";
import AuthModal from "./AuthModal.jsx";

// Component kiểm tra authorization sau khi đã signed in
function AuthorizationGate({ children }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  
  // Expose token function ngay cả khi đang load (để main.jsx có thể dùng)
  if (typeof window !== 'undefined' && getToken) {
    window.__CLERK_GET_TOKEN__ = async () => {
      try {
        const token = await getToken();
        return token;
      } catch (e) {
        console.error("Failed to get Clerk token:", e);
        return null;
      }
    };
  }
  
  // Chờ Clerk load user data - nhưng không ẩn app, chỉ hiển thị loading overlay nhẹ
  if (!isLoaded) {
    return (
      <>
        <style>{`
          /* Đảm bảo React elements hiển thị khi đang load */
          .app[data-react="true"] { display: flex !important; }
          .topbar[data-react="true"] { display: grid !important; }
          .chat[data-react="true"] { display: flex !important; }
        `}</style>
        {/* Hiển thị app ngay, chỉ có overlay loading nhẹ */}
        {children}
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "rgba(0, 0, 0, 0.3)",
          zIndex: 9998,
          pointerEvents: "none"
        }}>
          <div style={{ 
            fontSize: "1rem", 
            color: "var(--text, #1c1a17)",
            background: "var(--panel, #fbf8f3)",
            padding: "12px 24px",
            borderRadius: "8px",
            pointerEvents: "auto"
          }}>
            Đang tải...
          </div>
        </div>
      </>
    );
  }

  // Kiểm tra authorization state
  const { isAuthorized, state } = checkAuthorization(user);

  // State 0: Unauthenticated (không nên xảy ra vì đã SignedIn)
  if (state === 'unauthenticated') {
    return null; // Clerk sẽ handle
  }

  // State 1: Pending Approval - hiển thị modal overlay, không ẩn app
  if (state === 'pending') {
    return (
      <>
        <style>{`
          /* Đảm bảo React elements hiển thị */
          .app[data-react="true"] { 
            display: flex !important; 
          }
          .topbar[data-react="true"] { 
            display: grid !important; 
          }
          .chat[data-react="true"] {
            display: flex !important;
          }
        `}</style>
        {/* Hiển thị modal pending approval nhưng vẫn cho phép xem web */}
        <PendingApproval />
        {children}
      </>
    );
  }

  // State 2, 3, 4, 5: Authorized - Cho phép truy cập app
  if (isAuthorized) {
    // Expose readonly state và getToken function to window for main.jsx (vanilla JS)
    const { isReadOnly } = checkAuthorization(user);
    if (typeof window !== 'undefined') {
      window.__USER_READONLY__ = isReadOnly;
      // Đảm bảo getToken function luôn được expose
      if (getToken) {
        window.__CLERK_GET_TOKEN__ = async () => {
          try {
            return await getToken();
          } catch (e) {
            console.error("Failed to get Clerk token:", e);
            return null;
          }
        };
      }
    }

    // Auto-initialize user nếu là user mới (chưa có metadata)
    useEffect(() => {
      const initUser = async () => {
        if (!user?.id || !getToken) return;
        
        const publicMetadata = user.publicMetadata || {};
        // Nếu user chưa có authorized và readonly, tự động init
        if (!publicMetadata.authorized && !publicMetadata.readonly) {
          try {
            const token = await getToken();
            if (!token) return;

            const response = await fetch(buildApiUrl("/api/user/init"), {
              method: "POST",
              headers: {
                ...buildApiHeaders(),
                "Authorization": `Bearer ${token}`,
              },
              credentials: "include",
            });

            if (response.ok) {
              // Reload user để lấy metadata mới - dùng window.location.reload() để đảm bảo state được cập nhật
              // Hoặc có thể dùng user.reload() nếu Clerk hỗ trợ
              if (user.reload) {
                await user.reload();
              } else {
                // Fallback: reload page để đảm bảo state được cập nhật
                window.location.reload();
              }
            }
          } catch (e) {
            console.error("Failed to initialize user:", e);
          }
        }
      };

      initUser();
    }, [user?.id, getToken]);

    return (
      <>
        <style>{`
          /* Đảm bảo React elements hiển thị */
          .app[data-react="true"] { 
            display: flex !important; 
          }
          .topbar[data-react="true"] { 
            display: grid !important; 
          }
          .chat[data-react="true"] {
            display: flex !important;
          }
        `}</style>
        {/* Hiển thị ViewerNotice nếu user là readonly */}
        {isReadOnly && <ViewerNotice />}
        {children}
      </>
    );
  }

  // Fallback
  return null;
}

export default function ClerkWrapper({ children, publishableKey }) {
  // Nhận key từ props (truyền từ main-clerk.jsx)
  const clerkKey = String(publishableKey || "").trim();
  
  if (!clerkKey) {
    // Không có Clerk key - render app trực tiếp không có authentication
    // Không log warning để tránh spam console
    return <>{children}</>;
  }

  // Chỉ log khi debug
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_CLERK === "true") {
    console.log("✅ ClerkWrapper: Initializing with key: [CONFIGURED]");
  }

  return (
    <ClerkProvider publishableKey={clerkKey}>
      {/* State 0: Unauthenticated - hiển thị modal đăng nhập ở giữa màn hình */}
      <SignedOut>
        <AuthModal />
        {/* Vẫn hiển thị app nhưng có modal overlay */}
        {children}
      </SignedOut>
      
      {/* State 1 & 2: Authenticated - Kiểm tra authorization */}
      <SignedIn>
        <AuthorizationGate>
          {children}
        </AuthorizationGate>
      </SignedIn>
    </ClerkProvider>
  );
}
