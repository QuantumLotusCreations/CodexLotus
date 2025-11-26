import React, { useEffect, useState } from "react";
import { createMarkdownProcessor } from "../../../lib/markdown/pipeline";

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    const process = async () => {
      try {
        const processor = createMarkdownProcessor();
        const result = await processor.process(content);
        setHtml(String(result));
      } catch (e) {
        console.error("Markdown processing error", e);
        setHtml("<p style='color:red'>Error rendering markdown</p>");
      }
    };
    process();
  }, [content]);

  return (
    <div 
        className="markdown-body" 
        dangerouslySetInnerHTML={{ __html: html }} 
        style={{ padding: 16, height: "100%", overflowY: "auto" }}
    />
  );
};

