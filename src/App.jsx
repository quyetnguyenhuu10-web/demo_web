import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useUser } from "@clerk/clerk-react";
import { UI_CONFIG, buildApiUrl, buildApiHeaders, buildStreamUrl } from "./config.js";
import { requireAuthorization, checkAuthorization } from "./auth-utils.js";
import Toast from "./Toast.jsx";

const FOLLOW_BOTTOM_THRESHOLD_PX = 140;

// Custom Dropdown Component - mở lên trên
const ModelDropdown = ({ models, selectedModel, onSelect, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const selectedLabel = models.find(m => m.value === selectedModel)?.label || "Loading...";

  return (
    <div className="modelSelectorWrapper hasCustomDropdown" style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        type="button"
        className="modelSelector"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{ 
          width: "100%",
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          paddingRight: "28px" // Tạo không gian cho mũi tên
        }}
      >
        {selectedLabel}
        <span 
          className="modelDropdownArrow"
          style={{ 
            position: "absolute", 
            right: "8px", 
            top: "50%", 
            transform: "translateY(-50%)",
            fontSize: "0.7rem",
            opacity: 0.7,
            pointerEvents: "none"
          }}
        >
          {isOpen ? "▲" : "▼"}
        </span>
      </button>
      
      {isOpen && !disabled && (
        <div 
          ref={dropdownRef}
          className="modelDropdownList"
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            marginBottom: "4px",
            background: "var(--panel, #f5f1ea)",
            border: "1px solid var(--border, rgba(28,26,23,0.12))",
            borderRadius: "6px",
            boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto"
          }}
        >
          {models.map((model) => (
            <button
              key={model.value}
              type="button"
              onClick={() => {
                onSelect(model.value);
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                textAlign: "left",
                background: model.value === selectedModel ? "rgba(28,26,23,0.08)" : "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8125rem",
                color: "var(--text, #1c1a17)",
                transition: "background 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (model.value !== selectedModel) {
                  e.target.style.background = "rgba(28,26,23,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (model.value !== selectedModel) {
                  e.target.style.background = "transparent";
                }
              }}
            >
              {model.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Component để render Markdown - với syntax highlighting và copy button
const MarkdownRenderer = ({ content, isStreaming }) => {
  const [copiedCodeBlocks, setCopiedCodeBlocks] = useState({});
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.getAttribute("data-theme") === "dark" ||
           (!document.documentElement.getAttribute("data-theme") && 
            window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  
  // Listen theme changes real-time
  useEffect(() => {
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(theme === "dark" || (!theme && systemDark));
    };
    
    // Check immediately
    updateTheme();
    
    // Listen for theme attribute changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    if (mediaQuery) {
      mediaQuery.addEventListener("change", updateTheme);
    }
    
    return () => {
      observer.disconnect();
      if (mediaQuery) {
        mediaQuery.removeEventListener("change", updateTheme);
      }
    };
  }, []);
  
  // Dùng theme chuẩn của react-syntax-highlighter thay vì tự bịa
  // oneDark và oneLight đã được import sẵn
  
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        // Custom styles cho các elements
        p: ({ children }) => <p style={{ margin: "0 0 0.8em 0" }}>{children}</p>,
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          const codeString = String(children).replace(/\n$/, '');
          
          if (inline) {
            return (
              <code style={{ 
                background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", 
                padding: "3px 6px", 
                borderRadius: "4px",
                fontSize: "0.9em",
                fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
                color: isDark ? "#d4d4d4" : "#1a1a1a",
                border: isDark 
                  ? "1px solid rgba(255,255,255,0.08)" 
                  : "1px solid rgba(0,0,0,0.06)",
                fontWeight: "500"
              }} {...props}>
                {children}
              </code>
            );
          }
          
          // Nếu đang streaming, render code block dạng thô để tránh giật/nhảy
          if (isStreaming) {
            return (
              <pre
                style={{
                  margin: "1em 0",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  maxWidth: "100%",
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.10)"
                    : "1px solid rgba(0,0,0,0.10)",
                  background: isDark ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.04)",
                  color: isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.86)",
                  fontFamily:
                    "'SF Mono','Monaco','Inconsolata','Roboto Mono','Source Code Pro',monospace",
                  fontSize: "0.875rem",
                  lineHeight: "1.55",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {codeString}
              </pre>
            );
          }
          
          // CodeId đơn giản để track copy state
          const codeId = `${language || "text"}-${codeString.substring(0, 20)}`;
          
          return (
            <div 
              style={{ 
                position: "relative", 
                margin: "1em 0",
                borderRadius: "8px",
                border: isDark 
                  ? "1px solid rgba(255,255,255,0.1)" 
                  : "1px solid rgba(0,0,0,0.08)",
                boxShadow: isDark
                  ? "0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)"
                  : "0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
                background: isDark ? "#1e1e1e" : "#f8f8f8"
              }}
            >
              {/* Header bar với language và copy button */}
              <div style={{ 
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: isDark 
                  ? "rgba(255,255,255,0.03)" 
                  : "rgba(0,0,0,0.02)",
                borderBottom: isDark
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid rgba(0,0,0,0.06)",
                minHeight: "36px"
              }}>
                {language && (
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: "500",
                    color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
                    padding: "4px 8px",
                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    borderRadius: "4px",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {language}
                  </span>
                )}
                {!language && <span></span>}
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(codeString);
                      setCopiedCodeBlocks(prev => ({ ...prev, [codeId]: true }));
                      setTimeout(() => {
                        setCopiedCodeBlocks(prev => {
                          const next = { ...prev };
                          delete next[codeId];
                          return next;
                        });
                      }, 2000);
                    } catch (e) {
                      console.error("Failed to copy:", e);
                    }
                  }}
                  style={{
                    background: copiedCodeBlocks[codeId]
                      ? (isDark ? "rgba(76, 175, 80, 0.2)" : "rgba(76, 175, 80, 0.15)")
                      : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: "500",
                    color: copiedCodeBlocks[codeId]
                      ? (isDark ? "#4caf50" : "#2e7d32")
                      : (isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)"),
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  onMouseEnter={(e) => {
                    if (!copiedCodeBlocks[codeId]) {
                      e.target.style.background = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!copiedCodeBlocks[codeId]) {
                      e.target.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
                    }
                  }}
                  title={copiedCodeBlocks[codeId] ? "Copied!" : "Copy code"}
                >
                  {copiedCodeBlocks[codeId] ? (
                    <>
                      <span>✓</span>
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <span>⧉</span>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div
                style={{
                  position: "relative",
                  width: "100%"
                }}
              >
                <SyntaxHighlighter
                  language={language || 'text'}
                  style={isDark ? oneDark : oneLight}
                  showLineNumbers={false}
                  wrapLines={false}
                  wrapLongLines={false}
                  customStyle={{
                    margin: 0,
                    padding: "14px 16px",
                    borderRadius: 0,
                    fontSize: "0.875rem",
                    lineHeight: "1.6",
                    fontFamily: "'SF Mono','Monaco','Inconsolata','Roboto Mono','Source Code Pro',monospace",
                    background: "transparent",
                    fontWeight: 450,
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "break-word"
                  }}
                  PreTag="div"
                  codeTagProps={{
                    style: {
                      fontFamily: "'SF Mono','Monaco','Inconsolata','Roboto Mono','Source Code Pro',monospace",
                      display: "block",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflowWrap: "break-word"
                    }
                  }}
                  {...props}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            </div>
          );
        },
        pre: ({ children }) => {
          // pre tag sẽ được xử lý bởi code component, chỉ cần return children
          return <>{children}</>;
        },
        ul: ({ children }) => <ul style={{ margin: "0.8em 0", paddingLeft: "1.5em" }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ margin: "0.8em 0", paddingLeft: "1.5em" }}>{children}</ol>,
        li: ({ children }) => <li style={{ margin: "0.3em 0" }}>{children}</li>,
        blockquote: ({ children }) => (
          <blockquote style={{ 
            borderLeft: "3px solid rgba(0,0,0,0.2)", 
            paddingLeft: "1em", 
            margin: "0.8em 0",
            fontStyle: "italic"
          }}>
            {children}
          </blockquote>
        ),
        h1: ({ children }) => <h1 style={{ margin: "1em 0 0.5em 0", fontSize: "1.5em", fontWeight: "bold" }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ margin: "1em 0 0.5em 0", fontSize: "1.3em", fontWeight: "bold" }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ margin: "0.8em 0 0.4em 0", fontSize: "1.1em", fontWeight: "bold" }}>{children}</h3>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#0066cc", textDecoration: "underline" }}>
            {children}
          </a>
        ),
        table: ({ children }) => (
          <table style={{ 
            borderCollapse: "collapse", 
            width: "100%", 
            margin: "0.8em 0",
            border: "1px solid rgba(0,0,0,0.1)"
          }}>
            {children}
          </table>
        ),
        th: ({ children }) => (
          <th style={{ 
            border: "1px solid rgba(0,0,0,0.1)", 
            padding: "8px", 
            background: "rgba(0,0,0,0.05)",
            fontWeight: "bold"
          }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td style={{ border: "1px solid rgba(0,0,0,0.1)", padding: "8px" }}>
            {children}
          </td>
        ),
      }}
    >
      {content || " "}
    </ReactMarkdown>
  );
};

// Danh sách model mặc định (sẽ được load từ API)
const DEFAULT_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-5-mini", label: "GPT-5 Mini" },
];

const MODEL_STORAGE_KEY = "ai_agent_selected_model";

export default function App() {
  const { user, getToken: getTokenFromHook } = useUser(); // Clerk hooks
  // Fallback getToken function
  const getToken = getTokenFromHook || (typeof window !== "undefined" && window.__CLERK_GET_TOKEN__ 
    ? async () => await window.__CLERK_GET_TOKEN__() 
    : async () => null);
  const [status, setStatus] = useState("ready"); // ready | creating | streaming | error
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState([]);
  
  // useEffect để tự động reset textarea về kích thước ban đầu khi input empty
  // Chạy ngay khi input thay đổi thành empty
  useEffect(() => {
    if (!input || input.trim() === "") {
      // Dùng nhiều cách để đảm bảo reset chắc chắn
      const resetTextarea = () => {
        const textarea = document.getElementById("ta");
        if (textarea && (!textarea.value || textarea.value.trim() === "")) {
          textarea.style.height = "24px";
        }
      };
      
      // Reset ngay lập tức
      resetTextarea();
      
      // Reset lại sau các frame để đảm bảo
      requestAnimationFrame(() => {
        resetTextarea();
        setTimeout(() => resetTextarea(), 0);
      });
    }
  }, [input]);
  
  // State để track copy button (turnId -> copied)
  const [copiedStates, setCopiedStates] = useState({});

  // Available models state (load từ API)
  const [availableModels, setAvailableModels] = useState(DEFAULT_MODELS);
  const [defaultModel, setDefaultModel] = useState("gpt-4o-mini");
  
  // Clock state
  const [clockTime, setClockTime] = useState("--:--:--");

  // Model selection state
  const [selectedModel, setSelectedModel] = useState(() => {
    // Load từ localStorage hoặc dùng mặc định
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MODEL_STORAGE_KEY);
      if (saved) {
        return saved;
      }
    }
    return "gpt-4o-mini"; // Mặc định
  });

  // Load models từ API khi component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const apiUrl = buildApiUrl("/api/models");
        console.log("Loading models from:", apiUrl);
        
        const resp = await fetch(apiUrl, {
          method: "GET",
          headers: buildApiHeaders(),
          credentials: "include",
        });
        
        if (resp.ok) {
          const data = await resp.json();
          console.log("Models loaded:", data);
          if (data.models && Array.isArray(data.models)) {
            setAvailableModels(data.models);
            if (data.default) {
              setDefaultModel(data.default);
              // Nếu chưa có model được chọn, dùng default
              if (!localStorage.getItem(MODEL_STORAGE_KEY)) {
                setSelectedModel(data.default);
              }
            }
          }
        } else {
          console.warn(`Failed to load models: ${resp.status} ${resp.statusText}`);
          // Giữ nguyên default models
        }
      } catch (e) {
        console.warn("Failed to load models from API, using defaults:", e);
        // Giữ nguyên default models
      }
    };

    loadModels();
  }, []);

  // Kiểm tra readonly state
  const { isReadOnly } = checkAuthorization(user) || { isReadOnly: false };

  // Toast state
  const [toast, setToast] = useState(null);

  const scrollAreaRef = useRef(null);
  const messagesRef = useRef(null);
  const tailPadRef = useRef(null);

  // streaming refs
  const esRef = useRef(null);
  const activeRef = useRef({ turnId: null });
  // Removed renderKeyRef - không cần remount MarkdownRenderer mỗi token

  // scroll behavior refs - đơn giản hóa, chỉ track user scroll
  const userScrollLockedRef = useRef(false);
  const programmaticScrollRef = useRef(false);
  const ignoreScrollUntilRef = useRef(0);
  const userScrollIntentRef = useRef(false);
  const userPointerDownRef = useRef(false);
  const userIntentTimerRef = useRef(null);
  
  // Refs để đảm bảo chỉ init một lần
  const themeInitializedRef = useRef(false);
  const clockInitializedRef = useRef(false);
  const resizersInitializedRef = useRef(false);
  
  // Clock timer refs
  const clockTimerRef = useRef(null);
  const clockIntervalRef = useRef(null);

  const setStatusDom = (s) => setStatus(s || "");

  const stopStream = () => {
    if (esRef.current) {
      try { esRef.current.close(); } catch {}
    }
    esRef.current = null;
  };

  const distanceToBottomPx = () => {
    const sa = scrollAreaRef.current;
    if (!sa) return 0;
    return sa.scrollHeight - sa.scrollTop - sa.clientHeight;
  };

  const markProgrammaticScroll = () => {
    programmaticScrollRef.current = true;
    ignoreScrollUntilRef.current = performance.now() + 80;
    requestAnimationFrame(() => { programmaticScrollRef.current = false; });
  };

  const markUserScrollIntent = () => {
    // Khi user tương tác, dừng auto-scroll
    userScrollLockedRef.current = true;
    
    userScrollIntentRef.current = true;
    if (userIntentTimerRef.current) clearTimeout(userIntentTimerRef.current);
    userIntentTimerRef.current = setTimeout(() => {
      if (!userPointerDownRef.current) userScrollIntentRef.current = false;
    }, 140);
  };

  const scrollToBottomImmediate = () => {
    const sa = scrollAreaRef.current;
    if (!sa) return;
    
    markProgrammaticScroll();
    sa.scrollTop = sa.scrollHeight;
  };

  // Không còn cơ chế đẩy tin nhắn - chỉ reset tail pad khi cần
  const scheduleLayoutUpdate = () => {
    requestAnimationFrame(() => {
      if (tailPadRef.current) tailPadRef.current.style.height = "0px";
    });
  };

  // Hàm để tự động scroll chỉ khi có đủ không gian (gần bottom)
  const autoScrollIfNearBottom = () => {
    // Chỉ scroll nếu user không đang scroll lên và gần bottom
    if (userScrollLockedRef.current) return;
    
    const distance = distanceToBottomPx();
    const threshold = 100; // Chỉ scroll nếu cách bottom < 100px
    
    if (distance <= threshold) {
      requestAnimationFrame(() => {
        if (userScrollLockedRef.current) return;
        scrollToBottomImmediate();
      });
    }
  };

  const createJob = async (message) => {
    // Gatekeeping: Kiểm tra authorization trước khi gọi API
    requireAuthorization(user);

    // Lấy Clerk token để gửi kèm request
    let token = null;
    try {
      if (getToken && typeof getToken === "function") {
        token = await getToken();
      } else if (typeof window !== "undefined" && window.__CLERK_GET_TOKEN__) {
        token = await window.__CLERK_GET_TOKEN__();
      }
    } catch (e) {
      console.warn("Failed to get Clerk token:", e);
    }
    
    const headers = {
      ...buildApiHeaders(),
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const resp = await fetch(buildApiUrl(UI_CONFIG.chatCreatePath), {
      method: "POST",
      headers,
      credentials: "include", // Quan trọng cho Clerk cookies
      body: JSON.stringify({ 
        message, 
        history: [],
        model: selectedModel || defaultModel, // Gửi model được chọn, fallback về default
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(`create_failed ${resp.status}: ${txt}`);
    }

    const data = await resp.json();
    if (!data?.sid) throw new Error("create_failed: missing sid");
    return data.sid;
  };

  const streamJob = async (sid) => {
    // buildStreamUrl là async function, cần await
    const streamUrl = await buildStreamUrl(sid);
    return new Promise((resolve, reject) => {
      const es = new EventSource(streamUrl);
      esRef.current = es;

      let gotToken = false;

      es.addEventListener("meta", () => setStatusDom("streaming"));

      es.addEventListener("token", (ev) => {
        try {
          const p = JSON.parse(ev.data || "{}");
          const tok = typeof p.t === "string" ? p.t : "";
          if (!tok) return;

          gotToken = true;
          const tid = activeRef.current.turnId;
          if (!tid) return;

          // Cập nhật trực tiếp state, không đệm - KHÔNG thêm renderKey
          setTurns((prev) => {
            return prev.map(t => {
              if (t.id === tid) {
                const newText = (t.assistant || "") + tok;
                return { ...t, assistant: newText };
              }
              return t;
            });
          });

          // Chỉ tự động scroll nếu có đủ không gian
          autoScrollIfNearBottom();
        } catch {}
      });

      es.addEventListener("done", () => {
        stopStream();
        setStatusDom("ready");
        resolve({ gotToken });
      });

      es.addEventListener("error", (ev) => {
        let msg = "sse_connection_error";
        try {
          const p = JSON.parse(ev?.data || "{}");
          if (p && p.error) msg = p.error;
        } catch {}
        
        stopStream();
        setStatusDom("error");
        reject(new Error(msg));
      });

      es.onerror = (e) => {
        console.error("EventSource error:", e);
        stopStream();
        setStatusDom("error");
        reject(new Error("EventSource connection error"));
      };
    });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    if (status === "creating" || status === "streaming") return;

    // Kiểm tra readonly trước
    if (isReadOnly) {
      setToast({
        message: "📖 Bạn đang ở chế độ xem. Không thể gửi tin nhắn.",
        duration: 3000,
      });
      return;
    }

    // Gatekeeping: Kiểm tra authorization trước khi gửi message
    try {
      requireAuthorization(user);
    } catch (err) {
      setStatusDom("error");
      setToast({
        message: err.message,
        duration: 3000,
      });
      return;
    }

    // reset lock cho lượt mới
    userScrollLockedRef.current = false;
    userScrollIntentRef.current = false;
    userPointerDownRef.current = false;

    // tạo turn mới (DOM semantics giống app.js: user + ai trong cùng turn)
    const turnId = `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setTurns((prev) => prev.concat([{ id: turnId, user: text, assistant: "" }]));

    setInput("");
    
    // Reset textarea về kích thước ban đầu NGAY LẬP TỨC sau khi gửi tin nhắn
    // Dùng nhiều cách để đảm bảo reset chắc chắn
    const resetTextarea = () => {
      const textarea = document.getElementById("ta");
      if (textarea) {
        textarea.style.height = "24px"; // Reset về kích thước ban đầu
      }
    };
    
    // Reset ngay lập tức
    resetTextarea();
    
    // Reset lại sau các frame để đảm bảo
    requestAnimationFrame(() => {
      resetTextarea();
      setTimeout(() => resetTextarea(), 0);
    });

    // Không tự động scroll khi tạo turn mới - chỉ scroll nếu gần bottom
    requestAnimationFrame(() => {
      autoScrollIfNearBottom();
    });

    setStatusDom("creating");

    // start streaming
    activeRef.current.turnId = turnId;

    try {
      const sid = await createJob(text);
      setStatusDom("streaming");

      const info = await streamJob(sid);

      // Đảm bảo scroll cuối cùng nếu gần bottom
      autoScrollIfNearBottom();

      // nếu không có token
      if (!info.gotToken) {
        setTurns((prev) =>
          prev.map((t) => (t.id === turnId ? { ...t, assistant: "[Không có dữ liệu trả về]" } : t))
        );
      }
    } catch (e) {
      const msg = e?.message || String(e);
      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, assistant: `[Lỗi] ${msg}` } : t))
      );
      setStatusDom("error");
      stopStream();
    }
  };

  // Khởi tạo theme ngay khi component mount
  useEffect(() => {
    const THEME_KEY = "ui_theme";
    // Patch C: Mặc định light (không theo system theme)
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved === "dark" || saved === "light" ? saved : "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);
  
  // Khởi tạo clock - dùng React state với timezone Việt Nam (UTC+7)
  useEffect(() => {
    const formatHHMMSS = () => {
      // Dùng timezone Việt Nam (Asia/Ho_Chi_Minh = UTC+7)
      try {
        // Thử dùng timeZone trước (hỗ trợ tốt hơn)
        return new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Ho_Chi_Minh",
        });
      } catch (e) {
        // Fallback: tính offset thủ công
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const vietnamTime = new Date(utc + (7 * 3600000)); // UTC+7
        return vietnamTime.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      }
    };
    
    const updateClock = () => {
      setClockTime(formatHHMMSS());
    };
    
    // Update ngay lập tức
    updateClock();
    
    // Tính toán delay đến giây tiếp theo
    const now = new Date();
    const msToNextSecond = 1000 - now.getMilliseconds() + 10;
    
    const timer = setTimeout(() => {
      updateClock();
      // Sau đó update mỗi giây
      const interval = setInterval(updateClock, 1000);
      clockIntervalRef.current = interval;
    }, Math.max(40, msToNextSecond));
    
    clockTimerRef.current = timer;
    
    // Update khi tab trở lại visible
    const visibilityHandler = () => {
      if (document.visibilityState === "visible") {
        updateClock();
      }
    };
    document.addEventListener("visibilitychange", visibilityHandler);
    
    return () => {
      if (clockTimerRef.current) clearTimeout(clockTimerRef.current);
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, []);

  useEffect(() => {
    const onResize = () => scheduleLayoutUpdate();
    window.addEventListener("resize", onResize);
    
    // Khởi tạo clock - chỉ init một lần
    const initClock = () => {
      if (clockInitializedRef.current) return;
      const clockTimerRef = { current: null };
      const clockIntervalRef = { current: null };
      const formatHHMMSS = (d) => {
        return d.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      };
      const updateClockNow = () => {
        const el = document.getElementById("clockTime");
        if (!el) return;
        el.textContent = formatHHMMSS(new Date());
      };
      const initClockFunc = () => {
        if (clockTimerRef.current) clearTimeout(clockTimerRef.current);
        if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
        updateClockNow();
        const now = new Date();
        const msToNextSecond = 1000 - now.getMilliseconds() + 10;
        clockTimerRef.current = setTimeout(() => {
          updateClockNow();
          clockIntervalRef.current = setInterval(updateClockNow, 1000);
        }, Math.max(40, msToNextSecond));
        const visibilityHandler = () => {
          if (document.visibilityState === "visible") initClockFunc();
        };
        document.addEventListener("visibilitychange", visibilityHandler);
        clockInitializedRef.current = true;
      };
      initClockFunc();
    };
    
    // ===== Constraint-based lite sizing =====
    const SIZE_KEYS = {
      topbar: "ui_topbar_ideal_rem",
      chat: "ui_chat_ideal_vw",
    };

    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

    function getRemPx() {
      const fs = getComputedStyle(document.documentElement).fontSize;
      const n = parseFloat(fs || "16");
      return Number.isFinite(n) ? n : 16;
    }

    function getVwPx() {
      return window.innerWidth / 100;
    }

    function readNumberLS(key, fallback) {
      const raw = localStorage.getItem(key);
      const n = raw == null ? NaN : parseFloat(raw);
      return Number.isFinite(n) ? n : fallback;
    }

    function writeNumberLS(key, val) {
      localStorage.setItem(key, String(val));
    }

    function applyTopbarFromIdeal(idealRem) {
      const TOPBAR_MIN_PX = 20;
      const TOPBAR_MAX_PX = 56;

      const remPx = getRemPx();
      const idealPx = idealRem * remPx;
      const actualPx = clamp(idealPx, TOPBAR_MIN_PX, TOPBAR_MAX_PX);

      const root = document.documentElement;
      root.style.setProperty("--topbar-h", `${actualPx}px`);
      // pill scale theo actual, không theo px cứng
      const pill = Math.max(16, Math.min(34, Math.round(actualPx * 0.64)));
      root.style.setProperty("--topbar-pill-h", `${pill}px`);
    }

    function applyChatFromIdeal(idealVw) {
      const CHAT_MIN_PX = 280;
      const CHAT_MAX_PX = 560;

      const vwPx = getVwPx();
      const idealPx = idealVw * vwPx;
      const actualPx = clamp(idealPx, CHAT_MIN_PX, CHAT_MAX_PX);

      document.documentElement.style.setProperty("--chat-w", `${actualPx}px`);
    }

    function restoreIdealsAndApply() {
      // Default ideal: topbar ~ 2.0rem, chat ~ 28vw
      const idealTopbarRem = readNumberLS(SIZE_KEYS.topbar, 2.0);
      const idealChatVw = readNumberLS(SIZE_KEYS.chat, 28);

      applyTopbarFromIdeal(idealTopbarRem);
      applyChatFromIdeal(idealChatVw);
    }

    // Khởi tạo topbar và chat resizers
    const initResizers = () => {
      // Topbar resizer
      const TOPBAR_MIN = 20;
      const TOPBAR_MAX = 56;
      
      const initTopbarResizer = () => {
        const grip = document.getElementById("topbarResizer");
        if (!grip) {
          console.warn("⚠️ Topbar resizer element not found");
          return;
        }
        console.log("✅ Initializing topbar resizer");
        
        let dragging = false;
        let startY = 0;
        let startPx = 0;
        let startIdealRem = 2.0;
        let activePointerId = null;
        
        const endDrag = () => {
          if (!dragging) return;
          dragging = false;
          document.documentElement.removeAttribute("data-resizing");
          
          // Remove listeners từ document
          document.removeEventListener("pointermove", handlePointerMove);
          document.removeEventListener("pointerup", handlePointerUp);
          
          try { grip.releasePointerCapture?.(activePointerId); } catch {}
          activePointerId = null;
        };
        
        const handlePointerMove = (e) => {
          if (!dragging || (activePointerId != null && e.pointerId !== activePointerId)) return;
          
          const dy = e.clientY - startY;
          const nextPx = startPx + dy;
          
          const remPx = getRemPx();
          const nextIdealRem = nextPx / remPx;
          
          writeNumberLS(SIZE_KEYS.topbar, nextIdealRem);
          applyTopbarFromIdeal(nextIdealRem);
          
          e.preventDefault();
          e.stopPropagation();
        };
        
        const handlePointerUp = (e) => {
          if (activePointerId != null && e.pointerId !== activePointerId) return;
          endDrag();
          e.preventDefault();
        };
        
        grip.addEventListener("pointerdown", (e) => {
          if (e.isPrimary === false) return;
          console.log("🖱️ Topbar resizer pointerdown");
          dragging = true;
          activePointerId = e.pointerId;
          
          const remPx = getRemPx();
          // lấy actual hiện tại từ CSS var --topbar-h (px)
          const curPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-h")) || 28;
          startPx = curPx;
          startIdealRem = readNumberLS(SIZE_KEYS.topbar, curPx / remPx);
          
          startY = e.clientY;
          document.documentElement.setAttribute("data-resizing", "topbar");
          
          // Attach listeners to document để bắt mọi movement
          document.addEventListener("pointermove", handlePointerMove);
          document.addEventListener("pointerup", handlePointerUp);
          
          try { grip.setPointerCapture(e.pointerId); } catch {}
          e.preventDefault();
        });
        
        grip.addEventListener("pointercancel", endDrag);
        window.addEventListener("blur", endDrag);
      };
      
      // Chat resizer
      const CHAT_MIN = 280;
      const CHAT_MAX = 560;
      
      const initChatResizer = () => {
        const grip = document.getElementById("chatResizer");
        if (!grip) {
          console.warn("⚠️ Chat resizer element not found");
          return;
        }
        console.log("✅ Initializing chat resizer");
        
        let dragging = false;
        let startX = 0;
        let startPx = 380;
        let startIdealVw = 28;
        let activePointerId = null;
        
        const endDrag = () => {
          if (!dragging) return;
          dragging = false;
          document.documentElement.removeAttribute("data-resizing");
          
          // Remove listeners từ document
          document.removeEventListener("pointermove", handlePointerMove);
          document.removeEventListener("pointerup", handlePointerUp);
          
          try { grip.releasePointerCapture?.(activePointerId); } catch {}
          activePointerId = null;
        };
        
        const handlePointerMove = (e) => {
          if (!dragging || (activePointerId != null && e.pointerId !== activePointerId)) return;
          
          const dx = startX - e.clientX;     // logic: kéo trái tăng width
          const nextPx = startPx + dx;
          
          const vwPx = getVwPx();
          const nextIdealVw = nextPx / vwPx;
          
          writeNumberLS(SIZE_KEYS.chat, nextIdealVw);
          applyChatFromIdeal(nextIdealVw);
          
          e.preventDefault();
          e.stopPropagation();
        };
        
        const handlePointerUp = (e) => {
          if (activePointerId != null && e.pointerId !== activePointerId) return;
          endDrag();
          e.preventDefault();
        };
        
        grip.addEventListener("pointerdown", (e) => {
          if (e.isPrimary === false) return;
          console.log("🖱️ Chat resizer pointerdown");
          dragging = true;
          activePointerId = e.pointerId;
          
          const curPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--chat-w")) || 380;
          startPx = curPx;
          
          const vwPx = getVwPx();
          startIdealVw = readNumberLS(SIZE_KEYS.chat, curPx / vwPx);
          
          startX = e.clientX;
          document.documentElement.setAttribute("data-resizing", "chat");
          
          // Attach listeners to document để bắt mọi movement
          document.addEventListener("pointermove", handlePointerMove);
          document.addEventListener("pointerup", handlePointerUp);
          
          try { grip.setPointerCapture(e.pointerId); } catch {}
          e.preventDefault();
        });
        
        grip.addEventListener("pointercancel", endDrag);
        window.addEventListener("blur", endDrag);
      };
      
      // Khởi tạo ideals và apply constraints
      restoreIdealsAndApply();
      
      // Chờ DOM render xong
      setTimeout(() => {
        initTopbarResizer();
        initChatResizer();
      }, 100);
      
      // Re-apply constraints khi resize cửa sổ
      let resizeTimer = null;
      window.addEventListener("resize", () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const idealTopbarRem = readNumberLS(SIZE_KEYS.topbar, 2.0);
          const idealChatVw = readNumberLS(SIZE_KEYS.chat, 28);
          applyTopbarFromIdeal(idealTopbarRem);
          applyChatFromIdeal(idealChatVw);
        }, 100);
      });
    };
    
    // Chờ DOM render xong rồi init - dùng requestAnimationFrame để đảm bảo DOM đã render
    let retryCount = 0;
    const maxRetries = 10;
    
    const initAll = () => {
      // Kiểm tra xem các element đã có chưa
      const themeBtn = document.getElementById("themeToggle");
      const clockEl = document.getElementById("clockTime");
      const topbarResizer = document.getElementById("topbarResizer");
      const chatResizer = document.getElementById("chatResizer");
      
      // Theme toggle đã có onClick handler trực tiếp trong JSX, không cần init
      // Clock đã được init trong useEffect riêng với React state, không cần init ở đây
      
      if (topbarResizer || chatResizer) {
        console.log("✅ Initializing resizers");
        initResizers();
      }
      
      // Nếu chưa có resizers và chưa quá max retries, thử lại sau
      if ((!topbarResizer && !chatResizer) && retryCount < maxRetries) {
        retryCount++;
        console.log(`⏳ Retrying initialization (${retryCount}/${maxRetries})...`);
        setTimeout(initAll, 200);
      } else if (retryCount >= maxRetries) {
        console.error("❌ Failed to initialize resizers after max retries");
      }
    };
    
    // Dùng requestAnimationFrame để đảm bảo DOM đã render
    requestAnimationFrame(() => {
      setTimeout(initAll, 100);
    });
    
    return () => {
      window.removeEventListener("resize", onResize);
      if (userIntentTimerRef.current) clearTimeout(userIntentTimerRef.current);
    };
  }, []);

  return (
    <>
      {/* React App */}
      <div className="topbar">
        {/* Left: Clock */}
        <div className="tbLeft">
          <div id="clockWidget" className="clockWidget" aria-label="Clock">
            <svg className="clockSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" opacity="0.95"></circle>
              <path className="clockHand" d="M12 12 L12 6.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
              <path d="M12 12 L16.2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.65"></path>
            </svg>
            <span id="clockTime" key="clock-time">{clockTime}</span>
          </div>
        </div>

        {/* Center: empty on purpose (no system log) */}
        <div className="tbCenter" aria-hidden="true"></div>

        {/* Right: Cursor-like theme toggle */}
        <div className="tbRight">
          <button 
            id="themeToggle" 
            className="themeToggle" 
            type="button" 
            aria-label="Toggle theme" 
            title="Toggle theme"
            onClick={() => {
              const THEME_KEY = "ui_theme";
              const current = document.documentElement.getAttribute("data-theme") || "light";
              const next = current === "dark" ? "light" : "dark";
              localStorage.setItem(THEME_KEY, next);
              document.documentElement.setAttribute("data-theme", next);
            }}
          >
            <span className="themeThumb" aria-hidden="true"></span>

            {/* Sun (Lucide-like) */}
            <svg className="themeIcon sun" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 2.3v2.2M12 19.5v2.2M4.5 12H2.3M21.7 12h-2.2
                       M5.4 5.4l-1.6-1.6M20.2 20.2l-1.6-1.6
                       M18.6 5.4l1.6-1.6M3.8 20.2l1.6-1.6"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>

            {/* Moon (Lucide-like) */}
            <svg className="themeIcon moon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 13.1A7.6 7.6 0 0 1 10.9 3.0
                       a7.2 7.2 0 1 0 10.1 10.1Z"
                    stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Topbar resizer */}
        <div id="topbarResizer" className="topbarResizer" role="separator" aria-orientation="horizontal" aria-label="Resize topbar"></div>
      </div>

      <div className="app">
        <div className="leftPane">
          <div className="coming">
            <div className="badge">Coming soon</div>
            <h1>Workspace</h1>
            <p>Phần workspace / sidebar để sau. Hiện tập trung làm chat panel.</p>
          </div>
        </div>

        <aside className="chat">
          <div id="chatResizer" className="chatResizer" role="separator" aria-orientation="vertical" aria-label="Resize chat"></div>
          <div className="wrap">
            <div
              className="scrollArea"
              id="scrollArea"
              ref={scrollAreaRef}
              onScroll={() => {
                // Không tự động scroll - chỉ track user scroll intent
                if (
                  programmaticScrollRef.current ||
                  performance.now() < ignoreScrollUntilRef.current
                ) return;

                // Chỉ track để biết user đang scroll, không tự động đẩy
                const nearBottom = distanceToBottomPx() <= FOLLOW_BOTTOM_THRESHOLD_PX;
                if (nearBottom) {
                  // User đã scroll về gần bottom - cho phép auto-scroll nếu có tin nhắn mới
                  userScrollLockedRef.current = false;
                } else {
                  // User đang scroll lên - không tự động scroll
                  userScrollLockedRef.current = true;
                }
              }}
              onWheel={(e) => {
                markUserScrollIntent();
              }}
              onTouchStart={(e) => {
                markUserScrollIntent();
              }}
              onTouchMove={(e) => {
                markUserScrollIntent();
              }}
              onPointerDown={(e) => {
                if (e && e.isPrimary === false) return;
                userPointerDownRef.current = true;
                markUserScrollIntent();
              }}
              onPointerUp={() => { userPointerDownRef.current = false; }}
              onPointerCancel={() => { userPointerDownRef.current = false; }}
              onMouseLeave={() => { userPointerDownRef.current = false; }}
            >
              <div className="messages" id="messages" ref={messagesRef}>
                {turns.map((t) => (
                  <div className="turn" key={t.id} data-turn-id={t.id}>
                    {t.user != null && (
                      <div className="userWrap">
                        <div className="user">
                          <span className="userText">{t.user}</span>
                        </div>
                        <button
                          className="copyBtn"
                          type="button"
                          data-tooltip={copiedStates[t.id] ? "Copied" : "Copy"}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(t.user);
                              setCopiedStates(prev => ({ ...prev, [t.id]: true }));
                              setTimeout(() => {
                                setCopiedStates(prev => {
                                  const next = { ...prev };
                                  delete next[t.id];
                                  return next;
                                });
                              }, 2000);
                            } catch {}
                          }}
                        >
                          {copiedStates[t.id] ? "✓" : "⧉"}
                        </button>
                      </div>
                    )}

                    <div className="ai">
                      {activeRef.current.turnId === t.id && 
                       (status === "creating" || (status === "streaming" && !t.assistant)) ? (
                        <div className="thinkingText">Đang suy nghĩ...</div>
                      ) : (
                        <MarkdownRenderer 
                          key={t.id}
                          content={t.assistant || ""}
                          isStreaming={activeRef.current.turnId === t.id && status === "streaming"}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div id="tailPad" aria-hidden="true" style={{ height: "0px" }} ref={tailPadRef} />
            </div>

            <div className="bar">
              {/* Model selector - bên trên chatComposer */}
              <div className="modelSelectorContainer">
                <ModelDropdown
                  models={availableModels}
                  selectedModel={selectedModel}
                  onSelect={(model) => {
                    setSelectedModel(model);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem(MODEL_STORAGE_KEY, model);
                    }
                  }}
                  disabled={status === "creating" || status === "streaming" || isReadOnly || availableModels.length === 0}
                />
              </div>
              
              <div className="chatComposer">
                <textarea
                  id="ta"
                  className="chatComposerInput"
                  placeholder="Nhập câu hỏi..."
                  spellCheck="false"
                  value={input}
                  rows={1}
                  style={{ 
                    minHeight: "24px",
                    maxHeight: "150px",
                    resize: "none",
                    overflowY: "auto",
                    height: input === "" ? "24px" : "auto", // Tự động về 24px khi empty
                    lineHeight: "1.5",
                    padding: "0",
                    boxSizing: "border-box", // Quan trọng: đảm bảo height tính đúng
                    transition: "none" // Tắt transition để tránh nhảy
                  }}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setInput(newValue);
                    
                    // Auto-resize textarea - TỰ ĐỘNG quay về kích cỡ ban đầu khi không có chữ
                    const textarea = e.target;
                    
                    // Nếu không có chữ (empty hoặc chỉ có whitespace), reset ngay về 24px
                    if (!newValue || newValue.trim() === "") {
                      textarea.style.height = "24px";
                      return;
                    }
                    
                    // Lưu scroll position trước khi resize
                    const scrollTop = textarea.scrollTop;
                    // Reset height về auto để tính lại chính xác
                    textarea.style.height = "auto";
                    // Tính height mới (tối thiểu 24px, tối đa 150px)
                    const newHeight = Math.min(Math.max(textarea.scrollHeight, 24), 150);
                    // Set height mới
                    textarea.style.height = newHeight + "px";
                    // Restore scroll position
                    textarea.scrollTop = scrollTop;
                  }}
                  onBlur={(e) => {
                    // Khi mất focus, nếu không có chữ thì reset về kích thước ban đầu
                    const textarea = e.target;
                    if (!textarea.value || textarea.value.trim() === "") {
                      textarea.style.height = "24px";
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />

                <button
                  id="send"
                  className="chatSend"
                  type="button"
                  aria-label="Send"
                  disabled={status === "creating" || status === "streaming" || input.trim().length === 0}
                  onClick={sendMessage}
                >
                  <svg className="sendIcon" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 12L20 4L13 20L11 13L4 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
      
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
