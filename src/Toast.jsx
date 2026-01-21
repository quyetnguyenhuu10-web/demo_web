// Toast.jsx - Component hiển thị thông báo nhỏ (toast notification)
import { useEffect, useState } from "react";

export default function Toast({ message, duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Đợi animation xong
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: "fixed",
      bottom: "100px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10001,
      background: "var(--panel, #fbf8f3)",
      border: "1px solid var(--border, rgba(28,26,23,0.10))",
      borderRadius: "8px",
      padding: "0.75rem 1.25rem",
      boxShadow: "var(--shadow-soft, 0 1px 2px rgba(28,26,23,0.05), 0 10px 26px rgba(28,26,23,0.08))",
      fontSize: "0.875rem",
      color: "var(--text, #1c1a17)",
      maxWidth: "400px",
      textAlign: "center",
      animation: "toastSlideIn 0.3s ease, toastSlideOut 0.3s ease 2.7s"
    }}>
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @keyframes toastSlideOut {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
        }
      `}</style>
      {message}
    </div>
  );
}
