import { useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { buildApiUrl, buildApiHeaders } from "./config";

const BODY_LINES = 35; // Số dòng editable
const PAGE_NUMBER = 1; // Page number mặc định

/**
 * Hook để snapshot dữ liệu từ paper editor
 * Lấy text từ Lexical editor và gửi lên server để lưu vào file txt
 */
export function usePaperSnapshot() {
  const [editor] = useLexicalComposerContext();

  const snapshot = useCallback(async () => {
    try {
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

      // Gửi request lên server
      const response = await fetch(buildApiUrl("/api/paper/snapshot"), {
        method: "POST",
        headers: {
          ...buildApiHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content,
          lineCount,
          pageNumber: PAGE_NUMBER,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save snapshot");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to snapshot paper:", error);
      throw error;
    }
  }, [editor]);

  return { snapshot };
}
