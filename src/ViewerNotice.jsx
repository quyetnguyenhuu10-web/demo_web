// ViewerNotice.jsx - Component hiển thị thông báo cho readonly user
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";

export default function ViewerNotice() {
  const { user } = useUser();
  const [isVisible, setIsVisible] = useState(true);
  const [hasSeenNotice, setHasSeenNotice] = useState(false);

  // Kiểm tra xem user đã xem thông báo chưa (lưu trong localStorage)
  useEffect(() => {
    if (user?.id) {
      const key = `viewer_notice_seen_${user.id}`;
      const seen = localStorage.getItem(key) === "true";
      setHasSeenNotice(seen);
      setIsVisible(!seen);
    }
  }, [user?.id]);

  const handleClose = () => {
    if (user?.id) {
      const key = `viewer_notice_seen_${user.id}`;
      localStorage.setItem(key, "true");
      setHasSeenNotice(true);
      setIsVisible(false);
    }
  };

  if (!isVisible || hasSeenNotice) {
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
      maxWidth: "500px",
      width: "90%",
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
        📖
      </div>
      
      <h2 style={{
        fontSize: "1.5rem",
        fontWeight: 600,
        color: "var(--text, #1c1a17)",
        marginBottom: "0.75rem",
        textAlign: "center"
      }}>
        Chế độ xem
      </h2>
      
      <p style={{
        fontSize: "1rem",
        color: "var(--muted, #6c625a)",
        lineHeight: 1.6,
        marginBottom: "1.5rem",
        textAlign: "center"
      }}>
        Tài khoản của bạn hiện đang ở <strong>chế độ xem</strong>. Bạn có thể xem nội dung nhưng không thể gửi tin nhắn hoặc tương tác với AI.
      </p>

      <div style={{
        padding: "1rem",
        background: "var(--bg-soft, #f7f3ed)",
        borderRadius: "6px",
        fontSize: "0.875rem",
        color: "var(--muted, #6c625a)",
        textAlign: "center"
      }}>
        <p style={{ margin: 0 }}>
          Để được nâng cấp quyền, vui lòng liên hệ quản trị viên.
        </p>
      </div>
    </div>
  );
}
