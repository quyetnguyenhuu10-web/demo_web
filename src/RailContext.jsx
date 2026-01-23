import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const RailContext = createContext(null);

export function RailProvider({ children }) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const typingTimeoutRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Enter focus mode (ẩn rail)
  const enterFocusMode = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsFocusMode(true);
  }, []);

  // Exit focus mode (hiện rail)
  const exitFocusMode = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsFocusMode(false);
  }, []);

  // Handle typing - enter focus mode ngay lập tức
  const handleTyping = useCallback(() => {
    enterFocusMode();
    // Clear timeout cũ nếu có
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [enterFocusMode]);

  // Handle editor focus - enter focus mode sau 1-2s nếu không có hover ở rail
  const handleEditorFocus = useCallback(() => {
    // Delay nhẹ để cho phép hover ở rail
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      enterFocusMode();
    }, 1500); // 1.5s delay
  }, [enterFocusMode]);

  // Handle editor blur - exit focus mode
  const handleEditorBlur = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    exitFocusMode();
  }, [exitFocusMode]);

  // Handle mouse ở mép trên viewport - reveal rail
  const handleTopEdgeHover = useCallback(() => {
    // Clear typing timeout nếu có
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    exitFocusMode();
  }, [exitFocusMode]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    isFocusMode,
    enterFocusMode,
    exitFocusMode,
    handleTyping,
    handleEditorFocus,
    handleEditorBlur,
    handleTopEdgeHover,
  };

  return <RailContext.Provider value={value}>{children}</RailContext.Provider>;
}

export function useRail() {
  const context = useContext(RailContext);
  if (!context) {
    throw new Error("useRail must be used within RailProvider");
  }
  return context;
}
