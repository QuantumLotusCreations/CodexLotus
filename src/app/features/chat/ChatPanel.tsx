import React, { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { useChatCompletion, useInitializeIndex, useIndexStats } from "../../../lib/api/ai";
import { projectRootAtom } from "../../state/atoms/projectAtoms";
import { vars } from "../../theme/tokens.css.ts";
import { MarkdownPreview } from "../../components/markdown/MarkdownPreview";

export const ChatPanel: React.FC = () => {
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<{role: string, content: string}[]>([]);
  
  const projectRoot = useAtomValue(projectRootAtom);
  const { mutateAsync: sendMessage, isLoading: isSending } = useChatCompletion();
  const { mutateAsync: initIndex, isLoading: isIndexing } = useInitializeIndex();
  const { data: stats, refetch: refetchStats } = useIndexStats(projectRoot);

  // Auto-index check
  useEffect(() => {
    if (projectRoot && stats && !stats.is_indexed && !isIndexing) {
        // Auto-index if the project has 0 chunks.
    }
  }, [projectRoot, stats, isIndexing]);

  async function handleSend() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setConversation(prev => [...prev, userMsg]);
    setInput("");

    try {
        const response = await sendMessage({ prompt: input, project_root: projectRoot || undefined });
        setConversation(prev => [...prev, { role: "assistant", content: response.content }]);
    } catch (err) {
        setConversation(prev => [...prev, { role: "system", content: `Error: ${String(err)}` }]);
    }
  }

  async function handleIndexProject() {
    if (!projectRoot) return;
    try {
        await initIndex({ project_root: projectRoot });
        await refetchStats();
    } catch (err) {
        console.error(err);
    }
  }

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", backgroundColor: vars.color.background.panel }}>
      
      {/* Header / Indexing Status */}
      <div style={{ 
          padding: "8px 12px", 
          borderBottom: `1px solid ${vars.color.border.subtle}`,
          fontSize: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: vars.color.background.panelRaised
      }}>
        <div style={{ color: vars.color.text.muted }}>
            {stats?.is_indexed 
                ? `Indexed (${stats.chunk_count} chunks)` 
                : "Project not indexed"}
        </div>
        <button
            onClick={handleIndexProject}
            disabled={isIndexing || !projectRoot}
            style={{
                background: "none",
                border: `1px solid ${vars.color.border.subtle}`,
                color: vars.color.text.secondary,
                borderRadius: 4,
                padding: "2px 8px",
                fontSize: 10,
                cursor: isIndexing ? "wait" : "pointer"
            }}
        >
            {isIndexing ? "Indexing..." : (stats?.is_indexed ? "Re-index" : "Index Now")}
        </button>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 16 }}>
        {conversation.length === 0 && (
            <div style={{ color: vars.color.text.muted, textAlign: "center", marginTop: 40 }}>
                <p>Welcome to CodexLotus.</p>
                <p style={{ fontSize: 12 }}>Ask questions about your rulebook or ask for edits.</p>
            </div>
        )}
        
        {conversation.map((msg, i) => (
            <div key={i} style={{ 
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "95%",
                width: msg.role === "assistant" ? "100%" : "auto",
                backgroundColor: msg.role === "user" ? vars.color.background.panelRaised : "transparent",
                padding: msg.role === "user" ? "8px 12px" : 0,
                borderRadius: 8,
                border: msg.role === "assistant" ? "none" : `1px solid ${vars.color.border.subtle}` // Chat bubbles for user
            }}>
                {msg.role === "assistant" ? (
                    <MarkdownPreview content={msg.content} />
                ) : (
                    <div style={{ 
                        whiteSpace: "pre-wrap", 
                        lineHeight: 1.5,
                        fontSize: 14,
                        color: vars.color.text.primary
                    }}>
                        {msg.content}
                    </div>
                )}
            </div>
        ))}
        
        {isSending && (
            <div style={{ alignSelf: "flex-start", color: vars.color.text.muted, fontSize: 12, marginLeft: 12 }}>
                Thinking...
            </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ padding: 12, borderTop: `1px solid ${vars.color.border.subtle}` }}>
        <div style={{ display: "flex", gap: 8 }}>
            <input
            style={{ 
                flex: 1,
                padding: "8px 12px",
                borderRadius: 4,
                border: `1px solid ${vars.color.border.subtle}`,
                backgroundColor: vars.color.background.base,
                color: vars.color.text.primary
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask..."
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            disabled={isSending}
            />
            <button 
                onClick={handleSend}
                disabled={isSending}
                style={{
                    padding: "8px 16px",
                    borderRadius: 4,
                    border: "none",
                    backgroundColor: vars.color.accent.primary,
                    color: vars.color.text.inverse,
                    fontWeight: 600,
                    cursor: isSending ? "not-allowed" : "pointer",
                    opacity: isSending ? 0.7 : 1
                }}
            >
                Send
            </button>
        </div>
      </div>
    </div>
  );
};
