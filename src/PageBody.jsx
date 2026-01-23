import { useMemo } from "react";
import LineGridLayer from "./LineGridLayer";

const LINE_HEIGHT_PX = 24;
const BODY_LINES = 37; // Giữ 37 để grid vẫn render đủ
const EDITABLE_LINES = 35; // Chỉ 35 dòng để soạn thảo (bỏ số dòng 36, 37)

/**
 * PageBody - Body 37 lines với line numbers và grid
 * Layout: Line No. | Writing Text | (blank margin)
 * Chỉ hiển thị số dòng 1-35, nhưng grid vẫn có đủ 37 dòng
 */
export default function PageBody({
  children,
  baselineFromTopPx,
  lineNumbersGutterWidth = 48,
  textAreaLeft = 64,
  marginLineX = 0,
  containerWidth = 800,
  style = {},
}) {
  const bodyHeight = BODY_LINES * LINE_HEIGHT_PX;

  const bodyStyle = useMemo(() => ({
    position: "relative",
    width: "100%",
    height: `${bodyHeight}px`,
    boxSizing: "border-box",
    ...style,
  }), [bodyHeight, style]);

  const lineNumbersStyle = useMemo(() => ({
    position: "absolute",
    left: 0,
    top: 0,
    width: `${lineNumbersGutterWidth}px`,
    height: "100%",
    paddingLeft: "32px",
    boxSizing: "border-box",
    pointerEvents: "none",
  }), [lineNumbersGutterWidth]);

  const textAreaStyle = useMemo(() => ({
    position: "absolute",
    left: `${textAreaLeft}px`,
    right: "32px",
    top: 0,
    height: "100%",
    boxSizing: "border-box",
  }), [textAreaLeft]);

  const lineNumbers = useMemo(() => {
    const numbers = [];
    // Chỉ render số dòng 1-35 (bỏ 36, 37)
    for (let i = 1; i <= EDITABLE_LINES; i++) {
      numbers.push(i);
    }
    return numbers;
  }, []);

  return (
    <div className="pageBody" style={bodyStyle}>
      {/* Khoảng trống trên & dưới body - BỎ gradient trên để không che content */}
      {/* Gradient dưới giữ lại */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: `${LINE_HEIGHT_PX * 0.5}px`, // 0.5 line height
          background: `linear-gradient(to top, 
            var(--paper) 0%, 
            transparent 100%
          )`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: `${LINE_HEIGHT_PX * 0.5}px`, // 0.5 line height
          background: `linear-gradient(to top, 
            var(--paper) 0%, 
            transparent 100%
          )`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      
      {/* Grid Layer - chỉ kẻ trong body (37 lines) */}
      <LineGridLayer
        widthPx={containerWidth}
        heightPx={bodyHeight}
        lineHeightPx={LINE_HEIGHT_PX}
        topOffsetPx={0}
        baselineFromTopPx={baselineFromTopPx} // Grid line được vẽ ở baseline của mỗi dòng
        stroke="var(--grid)"
        showMarginLine={true}
        marginLineX={marginLineX}
        marginStroke="var(--margin)"
        leftInsetPx={textAreaLeft}
        rightInsetPx={32}
      />

      {/* Line Numbers Layer - canh đúng baseline mỗi dòng, gần như "vô hình" khi không cần */}
      <div 
        className="lineNumbers" 
        style={{
          ...lineNumbersStyle,
          transition: "opacity 0.2s ease",
        }}
      >
        {lineNumbers.map((num) => (
          <div
            key={num}
            className="lineNumber"
            style={{
              height: `${LINE_HEIGHT_PX}px`,
              display: "flex",
              alignItems: "baseline",
              // Điều chỉnh để số dòng ngang tầm với grid line
              // Grid line ở: topOffsetPx + (num-1) * LINE_HEIGHT_PX + baselineFromTopPx - 1
              // Số dòng cần ở cùng vị trí baseline, giảm 1px để khớp với grid line
              paddingTop: `${baselineFromTopPx - 1}px`,
              fontSize: "11px",
              fontVariantNumeric: "tabular-nums",
              color: "var(--muted-2)",
              opacity: 0.30, // Giảm từ 0.4 → 0.30 (giảm 10%) - gần như vô hình
              lineHeight: `${LINE_HEIGHT_PX}px`,
              transition: "opacity 0.15s ease",
            }}
          >
            {num}
          </div>
        ))}
      </div>

      {/* Text Area */}
      <div className="textArea" style={textAreaStyle}>
        {children}
      </div>
    </div>
  );
}
