import { useEffect, useState } from "react";

export function useScrollMetrics(scrollRef, contentRef) {
  const [m, setM] = useState({
    viewportH: 0,
    contentH: 0,
    scrollTop: 0,
  });

  useEffect(() => {
    const sc = scrollRef.current;
    const ct = contentRef.current;
    if (!sc || !ct) return;

    let raf = 0;
    const commit = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const viewportH = Math.round(sc.clientHeight);
        const contentH = Math.round(ct.scrollHeight || ct.getBoundingClientRect().height);
        const scrollTop = Math.round(sc.scrollTop);
        setM((prev) => {
          if (
            prev.viewportH === viewportH &&
            prev.contentH === contentH &&
            prev.scrollTop === scrollTop
          ) return prev;
          return { viewportH, contentH, scrollTop };
        });
      });
    };

    // Resize: viewport + content
    const ro1 = new ResizeObserver(commit);
    ro1.observe(sc);
    const ro2 = new ResizeObserver(commit);
    ro2.observe(ct);

    // Scroll
    const onScroll = () => commit();
    sc.addEventListener("scroll", onScroll, { passive: true });

    commit();

    return () => {
      cancelAnimationFrame(raf);
      sc.removeEventListener("scroll", onScroll);
      ro1.disconnect();
      ro2.disconnect();
    };
  }, [scrollRef, contentRef]);

  return m;
}
