import React, { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { createMarkdownProcessor } from "../../../lib/markdown/pipeline";
import { settingsAtom } from "../../state/atoms/settingsAtoms";

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  const [html, setHtml] = useState<string>("");
  const settings = useAtomValue(settingsAtom);

  useEffect(() => {
    const process = async () => {
      try {
        const processor = createMarkdownProcessor({
            bgColor: settings.statblock_bg_color || undefined,
            fontColor: settings.statblock_font_color || undefined
        });
        const result = await processor.process(content);
        setHtml(String(result));
      } catch (e) {
        console.error("Markdown processing error", e);
        setHtml("<p style='color:red'>Error rendering markdown</p>");
      }
    };
    process();
  }, [content, settings]);

  return (
    <div 
        className="markdown-body" 
        dangerouslySetInnerHTML={{ __html: html }} 
        style={{ padding: 16, height: "100%", overflowY: "auto" }}
    />
  );
};

