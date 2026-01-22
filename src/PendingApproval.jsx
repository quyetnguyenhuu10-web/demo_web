// PendingApproval.jsx - Component hiển thị khi user đang pending approval
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";

export default function PendingApproval() {
  const { user } = useUser();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect theme
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(theme === 'dark');
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    return () => observer.disconnect();
  }, []);

  // Nếu đã dismiss, không hiển thị modal
  if (isDismissed) {
    return null;
  }

  // Overlay background phù hợp với theme
  const overlayBg = isDarkMode 
    ? "rgba(0, 0, 0, 0.6)" 
    : "rgba(28, 26, 23, 0.4)";

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: overlayBg,
      padding: "2rem",
      zIndex: 9999,
      gap: "1.5rem",
      backdropFilter: "blur(4px)"
    }}>
      <div style={{
        maxWidth: "500px",
        width: "100%",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "2rem",
        boxShadow: isDarkMode 
          ? "0 4px 16px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(0, 0, 0, 0.5)"
          : "0 4px 16px rgba(28, 26, 23, 0.12), 0 8px 32px rgba(28, 26, 23, 0.08)",
        textAlign: "center",
        position: "relative"
      }}>
        {/* Nút X để đóng */}
        <button
          onClick={() => setIsDismissed(true)}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text)",
            fontSize: "24px",
            fontWeight: "400",
            lineHeight: "1",
            transition: "opacity 0.2s ease",
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = "0.6";
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = "1";
          }}
        >
          ×
        </button>
        
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: "0.75rem",
          marginTop: 0
        }}>
          Đang chờ phê duyệt
        </h2>
        
        <p style={{
          fontSize: "1rem",
          color: "var(--muted)",
          lineHeight: 1.6,
          marginBottom: "1.5rem"
        }}>
          Tài khoản của bạn đã được xác thực thành công, nhưng cần được quản trị viên phê duyệt trước khi có thể sử dụng tính năng AI.
        </p>

        {user && (
          <div style={{
            fontSize: "0.875rem",
            color: "var(--muted)",
            padding: "0.75rem",
            background: "var(--bg-soft)",
            borderRadius: "6px",
            marginTop: "1rem"
          }}>
            <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress || 'N/A'}
          </div>
        )}

        <div style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: "var(--bg-soft)",
          borderRadius: "6px",
          fontSize: "0.875rem",
          color: "var(--muted)"
        }}>
          <p style={{ margin: 0, marginBottom: "0.5rem" }}>
            Vui lòng liên hệ quản trị viên để được phê duyệt tài khoản.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Email quản trị viên:</strong>{" "}
            <a 
              href="mailto:quyetnguyenhuu10@gmail.com"
              style={{
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.target.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.target.style.textDecoration = "none";
              }}
            >
              quyetnguyenhuu10@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
