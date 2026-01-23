import { useMemo } from "react";

/**
 * LineGridLayer v1
 * - lines là dữ liệu logic: (index, yPx)
 * - render bằng DOM div để ổn định (không dùng background gradient)
 */
export default function LineGridLayer({
  widthPx,
  heightPx,
  lineHeightPx = 24,
  topOffsetPx = 24,
  baselineFromTopPx = 18, // fallback
  leftInsetPx = 0,          // khoảng chừa bên trái (để trùng padding editor)
  rightInsetPx = 0,
  stroke = "var(--grid)", // Dùng CSS variable để hỗ trợ dark mode
  showMarginLine = true,
  marginLineX = 0,          // nếu showMarginLine: x = leftInsetPx + marginLineX
  marginStroke = "var(--margin)", // Dùng CSS variable để hỗ trợ dark mode
}) {
  const model = useMemo(() => {
    const usable = Math.max(0, heightPx - topOffsetPx);
    const totalLines = Math.max(0, Math.floor(usable / lineHeightPx) + 1);

    const lines = new Array(totalLines);
    for (let i = 0; i < totalLines; i++) {
      lines[i] = {
        index: i,
        // Grid line ở baseline của mỗi dòng
        // Dòng đầu tiên (i=0): baselineFromTopPx từ top của container
        // Các dòng tiếp theo: cách nhau lineHeightPx
        // Text baseline sẽ tự nhiên khớp với grid line do line-height
        // Điều chỉnh nhẹ để khớp với text baseline thực tế (có thể cần fine-tune)
        yPx: topOffsetPx + i * lineHeightPx + baselineFromTopPx - 1, // Giảm 1px để khớp với text baseline
      };
    }

    return {
      version: 1,
      lineHeightPx,
      topOffsetPx,
      baselineFromTopPx,
      totalLines,
      lines,
    };
  }, [heightPx, lineHeightPx, topOffsetPx, baselineFromTopPx]);

  // Nếu container chưa đo được size
  if (!widthPx || !heightPx) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Margin line (lề trái) */}
      {showMarginLine && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: leftInsetPx + marginLineX,
            width: 1,
            background: marginStroke,
          }}
        />
      )}

      {/* Horizontal lines - Grid rhythm: mỗi 5 dòng đậm hơn 1 nấc (opacity +3-4%) */}
      {model.lines.map((l) => {
        // Mỗi 5 dòng (0, 5, 10, 15, ...) đậm hơn - dùng --grid-strong
        const isStrongLine = l.index % 5 === 0;
        const lineStroke = isStrongLine ? "var(--grid-strong)" : stroke;
        
        return (
          <div
            key={l.index}
            style={{
              position: "absolute",
              left: leftInsetPx,
              right: rightInsetPx,
              top: l.yPx,
              height: "0.5px", // Giảm height từ 1px xuống 0.5px để grid line mỏng hơn
              background: lineStroke,
            }}
          />
        );
      })}
    </div>
  );
}
