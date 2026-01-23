import { useMemo } from "react";

/**
 * PaperCard - Vật thể giấy với border, shadow, bo góc
 * Tỷ lệ cảm giác A4/manuscript, bo góc 14px
 */
export default function PaperCard({ children, style = {} }) {
  const cardStyle = useMemo(() => ({
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundColor: "var(--paper)", // Dùng CSS variable để hỗ trợ dark mode
    borderRadius: "14px",
    // Bottom shadow mạnh nhất (trọng lực) - dùng CSS variable để hỗ trợ dark mode
    boxShadow: "var(--shadow-paper)",
    // BỎ overflow: hidden để không clip shadow cạnh
    overflow: "visible",
    ...style,
  }), [style]);

  const wrapperStyle = useMemo(() => ({
    position: "relative",
    width: "100%",
    height: "100%",
  }), []);

  return (
    <div style={wrapperStyle}>
      {/* Side ambient shadow - fade dọc: Top 14px = 0, Middle = 0.06, Bottom = 0.10 */}
      {/* Shadow cạnh trái - ambient color với fade dọc */}
      <div
        style={{
          position: "absolute",
          top: "14px", // Dead zone: 0-14px KHÔNG có shadow
          bottom: 0,
          left: "-16px",
          width: "16px",
          pointerEvents: "none",
          background: `
            linear-gradient(to bottom,
              var(--paper-shadow-side-start) 0%,
              var(--paper-shadow-side-15) 15%,
              var(--paper-shadow-side-40) 40%,
              var(--paper-shadow-side-65) 65%,
              var(--paper-shadow-side-85) 85%,
              var(--paper-shadow-side-95) 95%,
              var(--paper-shadow-side-end) 100%
            )
          `,
          filter: "blur(4px)",
          zIndex: 0,
        }}
      />
      {/* Shadow cạnh phải - ambient color với fade dọc + fade mask khi đi vào rail */}
      <div
        style={{
          position: "absolute",
          top: "14px", // Dead zone: 0-14px KHÔNG có shadow
          bottom: 0,
          right: "-16px",
          width: "16px",
          pointerEvents: "none",
          background: `
            linear-gradient(to bottom,
              var(--paper-shadow-side-start) 0%,
              var(--paper-shadow-side-15) 15%,
              var(--paper-shadow-side-40) 40%,
              var(--paper-shadow-side-65) 65%,
              var(--paper-shadow-side-85) 85%,
              var(--paper-shadow-side-95) 95%,
              var(--paper-shadow-side-end) 100%
            )
          `,
          filter: "blur(4px)",
          // Fade mask để shadow yếu đi khi đi vào rail (vùng scrollbar)
          maskImage: "linear-gradient(to right, black 0%, black 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 0%, black 60%, transparent 100%)",
          zIndex: 0,
        }}
      />
      
      <div className="paperCard" style={{ ...cardStyle, zIndex: 1 }}>
      {/* Wrapper để clip content bên trong nhưng không clip shadow */}
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "14px" }}>
      {/* Paper base layers - giấy không đồng nhất màu */}
      {/* Paper inner warm */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 60% 40% at 50% 30%, var(--paper-inner-warm) 0%, transparent 50%)
          `,
          borderRadius: "14px",
        }}
      />
      {/* Paper cool break - phá đều màu */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            linear-gradient(135deg, transparent 0%, var(--paper-cool-break) 30%, transparent 60%)
          `,
          borderRadius: "14px",
          opacity: 0.6,
        }}
      />

      {/* Top edge highlight - CHỈ ở top edge, KHÔNG che content - dùng CSS variables */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "8px", // Giảm từ 12px xuống 8px để không che content
          pointerEvents: "none",
          background: `
            linear-gradient(to bottom,
              var(--paper-top-highlight-start) 0%,
              var(--paper-top-highlight-mid) 50%,
              transparent 100%
            )
          `,
          zIndex: 0, // Đảm bảo không che content
        }}
      />

      {/* Bottom lift highlight - tránh "bệt đen" - dùng CSS variables */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "8px",
          pointerEvents: "none",
          background: `
            linear-gradient(to top,
              var(--paper-bottom-lift) 0%,
              transparent 100%
            )
          `,
          borderRadius: "0 0 14px 14px",
        }}
      />
      {children}
      </div>
      </div>
    </div>
  );
}
