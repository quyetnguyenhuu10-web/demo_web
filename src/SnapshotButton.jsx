import { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { buildApiUrl, buildApiHeaders } from "./config";

const BODY_LINES = 35;
const PAGE_NUMBER = 1;

/**
 * SnapshotButton - Button để snapshot dữ liệu từ paper editor
 */
export default function SnapshotButton() {
  const [editor] = useLexicalComposerContext();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const handleSnapshot = async () => {
    try {
      setIsSaving(true);

      // Lấy text từ Lexical editor
      let content = "";
      let lineCount = 0;

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
    } catch (error) {
      console.error("❌ Failed to snapshot paper:", error);
      alert(`Lỗi khi lưu snapshot: ${error.message}`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: "absolute",
      top: "-36px", // Đặt phía trên PageBody, ngay dưới header
      right: "32px",
      zIndex: 10,
    }}>
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
    </div>
  );
}
