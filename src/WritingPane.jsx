import { useEffect, useMemo, useRef, useState } from "react";
import { useBaselineOffset } from "./useBaselineOffset";
import { useRail } from "./RailContext";
import PaperCard from "./PaperCard";
import PageHeader from "./PageHeader";
import PageBody from "./PageBody";
import PageFooter from "./PageFooter";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { $createParagraphNode } from "lexical";

const LINE_HEIGHT_PX = 24;
const TOTAL_LINES_PER_PAGE = 42;
const HEADER_LINES = 3;
const BODY_LINES = 35; // Giảm từ 37 xuống 35 - chỉ còn 35 dòng để soạn thảo
const FOOTER_LINES = 2;

// Font constants - ưu tiên font hỗ trợ Vietnamese tốt
const FONT_FAMILY = '"Times New Roman", Times, Georgia, ui-serif, serif';
const FONT_SIZE_PX = 16;

// Layout constants
const LINE_NUMBERS_GUTTER_WIDTH = 48;
const TEXT_AREA_LEFT = 64; // Line numbers gutter + gap
const MARGIN_LINE_X = 0; // Relative to text area left

export default function WritingPane() {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const editableRef = useRef(null);
  const paperCardRef = useRef(null);
  const [paperWidth, setPaperWidth] = useState(800);
  const { isFocusMode, handleEditorFocus, handleEditorBlur, handleTyping } = useRail();

  const baselineFromTopPx = useBaselineOffset({
    fontFamily: FONT_FAMILY,
    fontSizePx: FONT_SIZE_PX,
    fontWeight: 200, // Khớp với font-weight của text để baseline chính xác
    fontStyle: "normal",
    lineHeightPx: LINE_HEIGHT_PX,
  });

  // Page dimensions
  const pageHeight = TOTAL_LINES_PER_PAGE * LINE_HEIGHT_PX; // 1008px

  // Measure paper width
  useEffect(() => {
    const updateWidth = () => {
      if (paperCardRef.current) {
        const width = paperCardRef.current.clientWidth;
        if (width > 0) {
          setPaperWidth(width);
        }
      }
    };

    // Initial measurement
    updateWidth();

    // Observe resize
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateWidth);
    });

    const cardEl = paperCardRef.current;
    if (cardEl) {
      resizeObserver.observe(cardEl);
    }

    return () => {
      if (cardEl) {
        resizeObserver.unobserve(cardEl);
      }
      resizeObserver.disconnect();
    };
  }, []);

  // Tắt scroll snapping để scroll mượt và tự nhiên
  // Snap scroll có thể gây giật và cản trở scroll tự nhiên

  // Setup focus/typing detection cho rail system
  useEffect(() => {
    const editableEl = editableRef.current;
    if (!editableEl) return;

    const handleFocus = () => {
      handleEditorFocus();
    };

    const handleBlur = () => {
      handleEditorBlur();
    };

    const handleInput = () => {
      handleTyping();
    };

    editableEl.addEventListener("focus", handleFocus);
    editableEl.addEventListener("blur", handleBlur);
    editableEl.addEventListener("input", handleInput);

    return () => {
      editableEl.removeEventListener("focus", handleFocus);
      editableEl.removeEventListener("blur", handleBlur);
      editableEl.removeEventListener("input", handleInput);
    };
  }, [handleEditorFocus, handleEditorBlur, handleTyping]);

  const styles = useMemo(() => {
    return {
      container: {
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        // Desk base với top wash - dùng CSS variables để hỗ trợ dark mode
        // Dark mode: desk gradient từ #141210 (top) đến #100F0D (bottom)
        background: `
          linear-gradient(to bottom,
            var(--desk-top-wash) 0%,
            var(--desk-top-wash) 20%,
            var(--desk-deep) 100%
          )
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 32px 0 32px", // Bỏ padding top và bottom để scroll chạm đến topbar và đáy
        boxSizing: "border-box",
      },
      scrollArea: {
        position: "absolute",
        top: 0, // Chạm đến topbar (ambient) hoặc đỉnh viewport (focus)
        left: "32px",
        right: "32px",
        bottom: 0, // Chạm đến đáy
        overflow: "auto",
        scrollBehavior: "auto", // Scroll tự nhiên, không snap
        // Tắt scroll-snap để tránh giật và đảm bảo scroll được hết cỡ
        WebkitOverflowScrolling: "touch", // Smooth scrolling trên iOS
        // Mask để fade shadow của paper khi đi vào rail
        maskImage: "linear-gradient(to right, black 0%, black calc(100% - 10px), transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, black 0%, black calc(100% - 10px), transparent 100%)",
        // System Rail v1.5 - Mở rộng hết cỡ khi focus
        transition: "top 140ms ease-out",
      },
      paperWrapper: {
        position: "relative",
        width: "100%",
        maxWidth: "800px", // A4-like aspect ratio
        minHeight: `${pageHeight}px`,
        height: `${pageHeight}px`, // Đảm bảo height cố định để scroll được hết cỡ
        // System Rail v1.5 - Điều chỉnh margin dựa trên focus mode
        // Ambient mode: 20px từ top (air gap)
        // Focus mode: dịch lên nhẹ (12px) nhưng vẫn giữ air gap
        margin: isFocusMode ? "12px auto 0 auto" : "20px auto 0 auto",
        transition: "margin 140ms ease-out",
      },
    };
  }, [pageHeight, isFocusMode]);

  // Plugin để khởi tạo editor với đủ 37 dòng trống để có thể click vào bất kỳ dòng nào
  function InitializeEmptyLinesPlugin() {
    const [editor] = useLexicalComposerContext();
    const initializedRef = useRef(false);
    
    useEffect(() => {
      if (initializedRef.current) return;
      
      editor.update(() => {
        const root = $getRoot();
        const children = root.getChildren();
        
        // Nếu editor trống hoặc có ít dòng, tạo đủ 35 dòng trống
        if (children.length < BODY_LINES) {
          // Xóa tất cả children hiện tại
          root.clear();
          // Tạo đủ 35 dòng trống (mỗi dòng là một paragraph)
          const emptyLines = Array(BODY_LINES).fill(null).map(() => $createParagraphNode());
          root.append(...emptyLines);
        }
      }, { discrete: true });
      
      initializedRef.current = true;
    }, [editor]);
    
    return null;
  }

  const initialConfig = useMemo(
    () => ({
      namespace: "WritingPane",
      onError(error) {
        console.error(error);
      },
      nodes: [],
    }),
    []
  );

  const editableStyle = useMemo(() => {
    // Để có thể click và soạn thảo ở bất kỳ dòng nào:
    // - Text area phải có đủ chiều cao để cover tất cả 37 dòng
    // - Cho phép click vào bất kỳ đâu trong text area
    // - Cursor có thể đặt ở bất kỳ vị trí nào
    return {
      width: "100%",
      minHeight: `${BODY_LINES * LINE_HEIGHT_PX}px`,
      height: `${BODY_LINES * LINE_HEIGHT_PX}px`, // Đảm bảo đủ chiều cao để click vào tất cả dòng
      outline: "none",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      lineHeight: `${LINE_HEIGHT_PX}px`,
      fontSize: FONT_SIZE_PX,
      fontFamily: FONT_FAMILY,
      /* Color được xử lý bởi ink system (gradient + edge blend) trong CSS */
      userSelect: "text",
      padding: 0,
      margin: 0,
      /* Căn baseline chính xác - text area đã được offset bởi PageBody */
      display: "block",
      // Đảm bảo có thể click vào bất kỳ đâu
      cursor: "text",
      // Vietnamese diacritics support - đảm bảo dấu sắc kết hợp đúng
      textRendering: "optimizeLegibility",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      fontFeatureSettings: "normal",
      fontVariantLigatures: "normal",
      // Quan trọng: đảm bảo Unicode normalization và IME composition
      unicodeBidi: "normal",
      direction: "ltr",
    };
  }, []);

  return (
    <div ref={containerRef} className="writingPane" style={styles.container}>
      {/* Top wash cho rail - ánh sáng ở phần đầu để không bị bệt - dùng CSS variable */}
      <div
        style={{
          position: "absolute",
          top: 0, // Chạm đến topbar
          right: "32px",
          width: "10px", // Width của scrollbar
          height: "18px", // ~12-18px như yêu cầu
          pointerEvents: "none",
          background: `
            linear-gradient(to bottom,
              var(--rail-top-wash) 0%,
              transparent 100%
            )
          `,
          zIndex: 10, // Nằm trên scrollbar
        }}
      />
      <div ref={scrollRef} style={styles.scrollArea}>
        <div ref={paperCardRef} style={styles.paperWrapper}>
          <PaperCard>
            {/* Header (3 lines) */}
            <PageHeader />

            {/* Body (35 lines editable, 37 lines grid) - Line numbers + Grid + Text */}
            <PageBody
              baselineFromTopPx={baselineFromTopPx}
              lineNumbersGutterWidth={LINE_NUMBERS_GUTTER_WIDTH}
              textAreaLeft={TEXT_AREA_LEFT}
              marginLineX={MARGIN_LINE_X}
              containerWidth={paperWidth}
            >
              <LexicalComposer initialConfig={initialConfig}>
                <InitializeEmptyLinesPlugin />
                <PlainTextPlugin
                  contentEditable={
                    <ContentEditable
                      ref={editableRef}
                      className="lp-editor"
                      style={editableStyle}
                      spellCheck={false}
                      suppressContentEditableWarning={true}
                      data-lexical-editor="true"
                    />
                  }
                />
                <HistoryPlugin />
              </LexicalComposer>
            </PageBody>

            {/* Footer (2 lines) */}
            <PageFooter pageNumber={1} />
          </PaperCard>
        </div>
      </div>
    </div>
  );
}
