import { useMemo } from "react";

const LINE_HEIGHT_PX = 24;
const HEADER_LINES = 3;

/**
 * PageHeader - Header 3 lines: Day/Date
 * Dòng 1: Day (left) | Date (right)
 * Dòng 2: (optional) Title/Session (center hoặc left) - nếu không có thì để trống
 * Dòng 3: Spacer (luôn trống)
 */
export default function PageHeader({ day, date, title, children, style = {} }) {
  const today = useMemo(() => {
    const now = new Date();
    return {
      day: now.toLocaleDateString("vi-VN", { weekday: "short" }), // T2, T3...
      date: now.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" }), // DD/MM/YYYY
    };
  }, []);

  const displayDay = day || today.day;
  const displayDate = date || today.date;

  const headerStyle = useMemo(() => ({
    position: "relative",
    width: "100%",
    height: `${HEADER_LINES * LINE_HEIGHT_PX}px`,
    padding: "0 32px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    ...style,
  }), [style]);

  return (
    <div className="pageHeader" style={headerStyle}>
      {/* Header wash - CHỈ trong header, KHÔNG extend xuống body - dùng CSS variables */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: `${HEADER_LINES * LINE_HEIGHT_PX}px`, // Chỉ trong header (72px), không extend xuống
          pointerEvents: "none",
          background: `
            linear-gradient(to bottom,
              var(--header-wash-start) 0%,
              var(--header-wash-mid) 50%,
              transparent 100%
            )
          `,
          zIndex: 0, // Đảm bảo không che content
        }}
      />
      
      {/* Line 1: Day (left) | Date (right) - Neo thị giác tốt hơn */}
      <div
        style={{
          height: `${LINE_HEIGHT_PX}px`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          fontWeight: 700, // Tăng từ 600 → 700 để neo thị giác tốt hơn (CSS không hỗ trợ 650)
          color: "var(--header-text)", // Tăng độ đậm để dễ đọc hơn mà vẫn giữ vẻ thanh mảnh
          lineHeight: `${LINE_HEIGHT_PX}px`,
        }}
      >
        <span>{displayDay}</span>
        <span>{displayDate}</span>
      </div>

      {/* Line 2: Title/Session (optional) hoặc Snapshot button */}
      <div
        style={{
          height: `${LINE_HEIGHT_PX}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: title ? "flex-start" : "flex-end",
          fontSize: "12px",
          fontWeight: 700, // Đồng bộ với Day/Date
          color: "var(--header-text)", // Tăng độ đậm để dễ đọc hơn mà vẫn giữ vẻ thanh mảnh
          lineHeight: `${LINE_HEIGHT_PX}px`,
        }}
      >
        {title || ""}
        {children && <div style={{ marginLeft: "auto" }}>{children}</div>}
      </div>

      {/* Line 3: Spacer (luôn trống) */}
      <div style={{ height: `${LINE_HEIGHT_PX}px` }} />
    </div>
  );
}
