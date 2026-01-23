import { useEffect, useMemo, useState } from "react";

function measureFontMetrics(fontCss) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.font = fontCss;

  // Chuỗi có cả ascender + descender để đo ổn định
  const sample = "HgÁyjpqQ()[]{}|";
  const m = ctx.measureText(sample);

  // Các field này được hỗ trợ tốt trên Chrome/Edge/Firefox hiện đại
  const A = m.actualBoundingBoxAscent ?? null;
  const D = m.actualBoundingBoxDescent ?? null;
  if (A == null || D == null) return null;

  return { ascent: A, descent: D, height: A + D };
}

export function useBaselineOffset({
  fontFamily,
  fontSizePx,
  fontWeight = 400,
  fontStyle = "normal",
  lineHeightPx,
}) {
  const [baselineFromTop, setBaselineFromTop] = useState(Math.round(lineHeightPx * 0.75));

  const fontCss = useMemo(() => {
    // Canvas font syntax: "style weight size family"
    return `${fontStyle} ${fontWeight} ${fontSizePx}px ${fontFamily}`;
  }, [fontStyle, fontWeight, fontSizePx, fontFamily]);

  useEffect(() => {
    const metrics = measureFontMetrics(fontCss);
    if (!metrics) return;

    const H = metrics.height;
    const A = metrics.ascent;

    // Baseline position within a line box of height L
    const L = lineHeightPx;
    const baseline = (L - H) / 2 + A;

    // Clamp để tránh trường hợp metric lạ
    const clamped = Math.max(0, Math.min(L, baseline));

    setBaselineFromTop(Math.round(clamped));
  }, [fontCss, lineHeightPx]);

  return baselineFromTop;
}
