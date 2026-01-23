import { useEffect, useState } from "react";

/**
 * ResizeObserver + rAF throttle:
 * - ổn định hơn setState liên tục
 * - không phụ thuộc layout timing
 */
export function useElementSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId = 0;

    const commit = (w, h) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setSize((prev) => {
          // tránh re-render nếu không đổi
          if (prev.width === w && prev.height === h) return prev;
          return { width: w, height: h };
        });
      });
    };

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const cr = entry.contentRect;
      commit(Math.round(cr.width), Math.round(cr.height));
    });

    ro.observe(el);

    // initial measure (trong trường hợp RO chưa fire ngay)
    const rect = el.getBoundingClientRect();
    commit(Math.round(rect.width), Math.round(rect.height));

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [ref]);

  return size;
}
