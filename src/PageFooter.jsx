import { useMemo } from "react";

const LINE_HEIGHT_PX = 24;
const FOOTER_LINES = 2;

/**
 * PageFooter - Footer 2 lines: Page number
 * Footer line N-1: spacer (trống)
 * Footer line N: Page number (center)
 * Format: — 12 — (khuyến nghị, đúng chất sách)
 */
export default function PageFooter({ pageNumber = 1, style = {} }) {
  const footerStyle = useMemo(() => ({
    position: "relative",
    width: "100%",
    height: `${FOOTER_LINES * LINE_HEIGHT_PX}px`,
    padding: "0 32px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    ...style,
  }), [style]);

  return (
    <div className="pageFooter" style={footerStyle}>
      {/* Line N-1: Spacer (trống) */}
      <div style={{ height: `${LINE_HEIGHT_PX}px` }} />

      {/* Line N: Page number (center) */}
      <div
        style={{
          height: `${LINE_HEIGHT_PX}px`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--muted-2)",
          lineHeight: `${LINE_HEIGHT_PX}px`,
        }}
      >
        — {pageNumber} —
      </div>
    </div>
  );
}
