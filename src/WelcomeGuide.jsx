// WelcomeGuide.jsx - Component hiển thị hướng dẫn về snapshot khi user đăng nhập lần đầu
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { buildApiUrl, buildApiHeaders } from "./config";
import { checkAuthorization } from "./auth-utils";

export default function WelcomeGuide() {
  const { user, getToken } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra xem user đã xem hướng dẫn chưa (lưu trong publicMetadata)
  useEffect(() => {
    const checkWelcomeStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Kiểm tra xem user có phải admin hoặc trusted không
        const authState = checkAuthorization(user);
        const { isAdmin, isTrusted } = authState;
        
        // Admin và trusted user không cần xem hướng dẫn
        if (isAdmin || isTrusted) {
          setIsLoading(false);
          return;
        }

        const publicMetadata = user.publicMetadata || {};
        const hasSeenGuide = publicMetadata.hasSeenWelcomeGuide === true;
        
        if (!hasSeenGuide) {
          setIsVisible(true);
        }
      } catch (e) {
        console.error("Failed to check welcome guide status:", e);
      } finally {
        setIsLoading(false);
      }
    };

    checkWelcomeStatus();
  }, [user?.id, user?.publicMetadata]);

  const handleClose = async () => {
    if (!user?.id || !getToken) {
      setIsVisible(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setIsVisible(false);
        return;
      }

      // Update user metadata để đánh dấu đã xem hướng dẫn
      const response = await fetch(buildApiUrl("/api/user/mark-welcome-seen"), {
        method: "POST",
        headers: {
          ...buildApiHeaders(),
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        // Reload user để cập nhật metadata
        if (user.reload) {
          await user.reload();
        }
        setIsVisible(false);
      } else {
        // Nếu API không thành công, vẫn đóng modal và lưu vào localStorage làm fallback
        const key = `welcome_guide_seen_${user.id}`;
        localStorage.setItem(key, "true");
        setIsVisible(false);
      }
    } catch (e) {
      console.error("Failed to mark welcome guide as seen:", e);
      // Fallback: lưu vào localStorage
      const key = `welcome_guide_seen_${user.id}`;
      localStorage.setItem(key, "true");
      setIsVisible(false);
    }
  };

  if (isLoading || !isVisible) {
    return null;
  }

  return (
    <div style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 10000,
      background: "var(--panel, #fbf8f3)",
      border: "1px solid var(--border, rgba(28,26,23,0.10))",
      borderRadius: "12px",
      padding: "2rem",
      boxShadow: "var(--shadow-soft, 0 1px 2px rgba(28,26,23,0.05), 0 10px 26px rgba(28,26,23,0.08))",
      maxWidth: "600px",
      width: "90%",
      maxHeight: "80vh",
      overflowY: "auto",
      animation: "fadeIn 0.3s ease"
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -48%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
      
      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          background: "transparent",
          border: "none",
          fontSize: "1.5rem",
          cursor: "pointer",
          color: "var(--muted, #6c625a)",
          lineHeight: 1,
          padding: "0.25rem",
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          transition: "background 0.2s"
        }}
        onMouseEnter={(e) => e.target.style.background = "var(--bg-soft, #f7f3ed)"}
        onMouseLeave={(e) => e.target.style.background = "transparent"}
        aria-label="Đóng"
      >
        ×
      </button>

      <div style={{
        fontSize: "48px",
        marginBottom: "1rem",
        textAlign: "center"
      }}>
        📸
      </div>
      
      <h2 style={{
        fontSize: "1.5rem",
        fontWeight: 600,
        color: "var(--text, #1c1a17)",
        marginBottom: "1rem",
        textAlign: "center"
      }}>
        Chào mừng bạn đến với hệ thống!
      </h2>
      
      <div style={{
        fontSize: "1rem",
        color: "var(--muted, #6c625a)",
        lineHeight: 1.6,
        marginBottom: "1.5rem"
      }}>
        <p style={{ marginBottom: "1rem" }}>
          Đây là hệ thống hỗ trợ học tập với AI. Để AI có thể hỗ trợ bạn tốt nhất, bạn cần sử dụng tính năng <strong>Snapshot</strong>.
        </p>

        <div style={{
          padding: "1rem",
          background: "var(--bg-soft, #f7f3ed)",
          borderRadius: "6px",
          marginBottom: "1rem"
        }}>
          <h3 style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "var(--text, #1c1a17)",
            marginBottom: "0.5rem"
          }}>
            📸 Tính năng Snapshot
          </h3>
          <p style={{ margin: 0, marginBottom: "0.75rem" }}>
            <strong>Snapshot</strong> cho phép bạn lưu nội dung từ vùng paper (giấy viết) vào hệ thống để AI có thể đọc và hỗ trợ bạn.
          </p>
          <p style={{ margin: 0, marginBottom: "0.75rem" }}>
            <strong>Cách sử dụng:</strong>
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.5rem" }}>
            <li>Viết nội dung vào vùng paper ở giữa màn hình</li>
            <li>Nhấn nút <strong>"📸 Snapshot"</strong> ở thanh chat (bên phải, cạnh model selector)</li>
            <li>Nội dung sẽ được lưu và AI có thể đọc để hỗ trợ bạn</li>
          </ol>
        </div>

        <div style={{
          padding: "1rem",
          background: "var(--bg-soft, #f7f3ed)",
          borderRadius: "6px",
          marginBottom: "1rem"
        }}>
          <h3 style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "var(--text, #1c1a17)",
            marginBottom: "0.5rem"
          }}>
            💬 Tính năng Chat
          </h3>
          <p style={{ margin: 0 }}>
            Hiện tại, tính năng chat đang ở chế độ giới thiệu. Bạn có thể nhắn tin để tìm hiểu thêm về các tính năng của hệ thống web này.
          </p>
        </div>

        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted-2, #8a8278)", textAlign: "center" }}>
          Nhấn nút đóng để bắt đầu sử dụng hệ thống.
        </p>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "1.5rem"
      }}>
        <button
          onClick={handleClose}
          style={{
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            fontWeight: 500,
            color: "var(--text, #1c1a17)",
            background: "var(--bg-soft, #f7f3ed)",
            border: "1px solid var(--border, rgba(28,26,23,0.10))",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "background 0.2s, border-color 0.2s"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "var(--hover, #ede8df)";
            e.target.style.borderColor = "var(--border-strong, rgba(28,26,23,0.20))";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "var(--bg-soft, #f7f3ed)";
            e.target.style.borderColor = "var(--border, rgba(28,26,23,0.10))";
          }}
        >
          Đã hiểu, bắt đầu sử dụng
        </button>
      </div>
    </div>
  );
}
