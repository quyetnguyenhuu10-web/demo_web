// PendingApproval.jsx - Component hiển thị khi user đang pending approval
import { useUser } from "@clerk/clerk-react";

export default function PendingApproval() {
  const { user } = useUser();

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
      background: "var(--bg, #f5f1ea)",
      padding: "2rem",
      zIndex: 9998,
      gap: "1.5rem"
    }}>
      <div style={{
        maxWidth: "500px",
        width: "100%",
        background: "var(--panel, #fbf8f3)",
        border: "1px solid var(--border, rgba(28,26,23,0.10))",
        borderRadius: "12px",
        padding: "2rem",
        boxShadow: "var(--shadow-soft, 0 1px 2px rgba(28,26,23,0.05), 0 10px 26px rgba(28,26,23,0.08))",
        textAlign: "center"
      }}>
        <div style={{
          fontSize: "48px",
          marginBottom: "1rem"
        }}>⏳</div>
        
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "var(--text, #1c1a17)",
          marginBottom: "0.75rem"
        }}>
          Đang chờ phê duyệt
        </h2>
        
        <p style={{
          fontSize: "1rem",
          color: "var(--muted, #6c625a)",
          lineHeight: 1.6,
          marginBottom: "1.5rem"
        }}>
          Tài khoản của bạn đã được xác thực thành công, nhưng cần được quản trị viên phê duyệt trước khi có thể sử dụng tính năng AI.
        </p>

        {user && (
          <div style={{
            fontSize: "0.875rem",
            color: "var(--muted, #6c625a)",
            padding: "0.75rem",
            background: "var(--bg-soft, #f7f3ed)",
            borderRadius: "6px",
            marginTop: "1rem"
          }}>
            <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress || 'N/A'}
          </div>
        )}

        <div style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: "var(--bg-soft, #f7f3ed)",
          borderRadius: "6px",
          fontSize: "0.875rem",
          color: "var(--muted, #6c625a)"
        }}>
          <p style={{ margin: 0 }}>
            Vui lòng liên hệ quản trị viên để được phê duyệt tài khoản.
          </p>
        </div>
      </div>
    </div>
  );
}
