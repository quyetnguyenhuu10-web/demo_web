import { useState } from "react";
import { $getRoot } from "lexical";
import { buildApiUrl, buildApiHeaders } from "./config";

const BODY_LINES = 35;
const PAGE_NUMBER = 1;

/**
 * PaperSnapshotButton - Button để snapshot dữ liệu từ paper editor
 * Đọc từ DOM element của Lexical editor (không cần LexicalComposer context)
 */
export default function PaperSnapshotButton() {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const handleSnapshot = async () => {
    try {
      setIsSaving(true);

      // Tìm Lexical editor từ DOM
      const editorElement = document.querySelector('[data-lexical-editor="true"]');
      if (!editorElement) {
        throw new Error("Không tìm thấy editor. Vui lòng mở vùng paper trước.");
      }

      // Tìm editor instance từ React fiber hoặc từ Lexical's internal storage
      let editor = null;
      
      // Cách 1: Tìm từ React fiber
      const reactFiberKey = Object.keys(editorElement).find(key => 
        key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
      );
      
      if (reactFiberKey) {
        let fiber = editorElement[reactFiberKey];
        // Tìm editor trong React tree - LexicalComposerContext lưu editor trong memoizedState
        while (fiber) {
          if (fiber.memoizedState) {
            // memoizedState có thể là array hoặc object
            const states = Array.isArray(fiber.memoizedState) ? fiber.memoizedState : [fiber.memoizedState];
            for (const state of states) {
              if (state && state.memoizedState) {
                const innerStates = Array.isArray(state.memoizedState) ? state.memoizedState : [state.memoizedState];
                for (const innerState of innerStates) {
                  if (innerState && innerState[0] && typeof innerState[0].getEditorState === 'function') {
                    editor = innerState[0];
                    break;
                  }
                }
              }
              if (state && state[0] && typeof state[0].getEditorState === 'function') {
                editor = state[0];
                break;
              }
            }
            if (editor) break;
          }
          fiber = fiber.return || fiber._owner;
        }
      }

      // Fallback: đọc text trực tiếp từ DOM nếu không tìm thấy editor instance
      // Lexical render text trong các <p> elements
      let content = "";
      let lineCount = 0;
      
      if (!editor) {
        // Đọc từ DOM structure của Lexical
        const paragraphs = editorElement.querySelectorAll('p');
        const lines = [];
        
        if (paragraphs.length > 0) {
          paragraphs.forEach((p, index) => {
            if (index >= BODY_LINES) return; // Giới hạn số dòng
            const text = p.textContent || "";
            lines.push(text);
            lineCount++;
          });
          
          // Đảm bảo có đủ BODY_LINES dòng (thêm dòng trống nếu thiếu)
          while (lines.length < BODY_LINES) {
            lines.push("");
            lineCount++;
          }
        } else {
          // Fallback: split theo newline
          const textContent = editorElement.textContent || editorElement.innerText || "";
          const splitLines = textContent.split('\n');
          lines.push(...splitLines.slice(0, BODY_LINES));
          lineCount = lines.length;
          
          // Đảm bảo có đủ BODY_LINES dòng
          while (lines.length < BODY_LINES) {
            lines.push("");
            lineCount++;
          }
        }
        
        content = lines.slice(0, BODY_LINES).join("\n");
        lineCount = lines.slice(0, BODY_LINES).length;
      } else {
        // Lấy text từ Lexical editor instance
        await editor.getEditorState().read(() => {
          const root = $getRoot();
          const children = root.getChildren();
          
          // Lấy text từ tất cả paragraphs và đếm số dòng
          const lines = [];
          children.forEach((node) => {
            const text = node.getTextContent();
            if (text.trim()) {
              lines.push(text);
              lineCount++;
            } else {
              // Đếm cả dòng trống
              lines.push("");
              lineCount++;
            }
          });

          // Giới hạn số dòng theo BODY_LINES
          const limitedLines = lines.slice(0, BODY_LINES);
          content = limitedLines.join("\n");
          lineCount = limitedLines.length;
        });
      }

      // Gửi request
      await sendSnapshotRequest(content, lineCount);
    } catch (error) {
      console.error("❌ Failed to snapshot paper:", error);
      alert(`Lỗi khi lưu snapshot: ${error.message}`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const sendSnapshotRequest = async (content, lineCount) => {
    // Lấy Clerk token nếu có
    let headers = {
      ...buildApiHeaders(),
      "Content-Type": "application/json",
    };

    // Thêm Clerk token vào headers nếu có
    if (typeof window !== "undefined" && window.__CLERK_GET_TOKEN__) {
      try {
        const token = await window.__CLERK_GET_TOKEN__();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      } catch (e) {
        console.warn("Failed to get Clerk token for snapshot:", e);
      }
    }

    // Gửi request lên server
    const url = buildApiUrl("/api/paper/snapshot");
    console.log("📸 Snapshot URL:", url);
    console.log("📸 Snapshot data:", { 
      contentLength: content.length, 
      lineCount, 
      pageNumber: PAGE_NUMBER 
    });
    
    const requestBody = {
      content,
      lineCount,
      pageNumber: PAGE_NUMBER,
    };
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(requestBody),
    });

    // Kiểm tra content-type để đảm bảo response là JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Server returned non-JSON response:", text.substring(0, 200));
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
        console.error("❌ Server error response:", error);
      } catch (e) {
        const text = await response.text();
        console.error("❌ Failed to parse error response:", text.substring(0, 200));
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      throw new Error(error.message || error.error || "Failed to save snapshot");
    }

    const result = await response.json();
    setLastSaved(new Date());
    
    // Hiển thị thông báo thành công
    console.log("✅ Snapshot saved:", result.filename);
    
    return result;
  };

  return (
    <button
      onClick={handleSnapshot}
      disabled={isSaving}
      style={{
        padding: "4px 12px",
        fontSize: "11px",
        fontWeight: 500,
        color: "var(--muted-2)",
        background: "transparent",
        border: "1px solid var(--border-soft)",
        borderRadius: "4px",
        cursor: isSaving ? "not-allowed" : "pointer",
        opacity: isSaving ? 0.5 : 1,
        transition: "opacity 0.2s ease, background 0.2s ease",
        marginRight: "10px", // Cách mép 10px
      }}
      onMouseEnter={(e) => {
        if (!isSaving) {
          e.target.style.background = "var(--hover)";
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.background = "transparent";
      }}
      title={lastSaved ? `Đã lưu lúc ${lastSaved.toLocaleTimeString("vi-VN")}` : "Lưu snapshot vào content_for_AI"}
    >
      {isSaving ? "Đang lưu..." : "📸 Snapshot"}
    </button>
  );
}
