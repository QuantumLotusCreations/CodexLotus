import React, { useEffect, useState, useRef } from "react";
import { useAtomValue } from "jotai";
import { useChatCompletion, useIndexStats } from "../../../lib/api/ai";
import { projectRootAtom } from "../../state/atoms/projectAtoms";
import { vars } from "../../theme/tokens.css";
import { MarkdownPreview } from "../../components/markdown/MarkdownPreview";
import { DiffViewer } from "../diff/DiffViewer";
import { readFile, writeFile } from "../../../lib/api/files";
import { useAutoIndex } from "../../hooks/useAutoIndex";

// Types for file edit proposals
interface FileEditProposal {
  path: string;
  newContent: string;
  originalContent?: string;
  status: "pending" | "accepted" | "rejected";
}

interface ParsedMessage {
  textBefore: string;
  fileEdit?: { path: string; content: string };
  textAfter: string;
}

// Parse AI response for file edit blocks
function parseFileEditBlocks(content: string): ParsedMessage {
  const regex = /<file_edit\s+path="([^"]+)">\s*([\s\S]*?)\s*<\/file_edit>/;
  const match = content.match(regex);
  
  if (match) {
    const [fullMatch, path, editContent] = match;
    const startIndex = content.indexOf(fullMatch);
    const endIndex = startIndex + fullMatch.length;
    
    return {
      textBefore: content.slice(0, startIndex).trim(),
      fileEdit: { path, content: editContent.trim() },
      textAfter: content.slice(endIndex).trim()
    };
  }
  
  return { textBefore: content, textAfter: "" };
}

export const ChatPanel: React.FC = () => {
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<{role: string, content: string}[]>([]);
  const [fileEdits, setFileEdits] = useState<Map<number, FileEditProposal>>(new Map());
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const projectRoot = useAtomValue(projectRootAtom);
  const { mutateAsync: sendMessage, isPending: isSending } = useChatCompletion();
  const { data: stats } = useIndexStats(projectRoot);
  const { triggerIndex, indexingState } = useAutoIndex();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  async function handleSend() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    const updatedConversation = [...conversation, userMsg];
    setConversation(updatedConversation);
    setInput("");

    try {
        // Send the full conversation history to the AI
        const response = await sendMessage({ 
            prompt: input, 
            project_root: projectRoot || undefined,
            conversation: updatedConversation.filter(m => m.role !== "system") // Exclude system error messages
        });
        
        const newMsgIndex = updatedConversation.length; // Index of the new assistant message
        setConversation(prev => [...prev, { role: "assistant", content: response.content }]);
        
        // Check if response contains a file edit proposal
        const parsed = parseFileEditBlocks(response.content);
        if (parsed.fileEdit && projectRoot) {
            // Load original file content for diff
            const fullPath = joinPath(projectRoot, parsed.fileEdit.path);
            try {
                const originalContent = await readFile(fullPath);
                setFileEdits(prev => new Map(prev).set(newMsgIndex, {
                    path: parsed.fileEdit!.path,
                    newContent: parsed.fileEdit!.content,
                    originalContent,
                    status: "pending"
                }));
            } catch {
                // File might not exist yet, that's okay
                setFileEdits(prev => new Map(prev).set(newMsgIndex, {
                    path: parsed.fileEdit!.path,
                    newContent: parsed.fileEdit!.content,
                    originalContent: "",
                    status: "pending"
                }));
            }
        }
    } catch (err) {
        setConversation(prev => [...prev, { role: "system", content: `Error: ${String(err)}` }]);
    }
  }

  function joinPath(root: string, relative: string): string {
    if (root.endsWith("/") || root.endsWith("\\")) {
      return root + relative;
    }
    return `${root}/${relative}`;
  }

  async function handleAcceptEdit(msgIndex: number) {
    const edit = fileEdits.get(msgIndex);
    if (!edit || !projectRoot) return;
    
    try {
      const fullPath = joinPath(projectRoot, edit.path);
      await writeFile(fullPath, edit.newContent);
      setFileEdits(prev => {
        const newMap = new Map(prev);
        newMap.set(msgIndex, { ...edit, status: "accepted" });
        return newMap;
      });
      // Trigger re-indexing after file edit is accepted
      triggerIndex();
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }

  function handleRejectEdit(msgIndex: number) {
    const edit = fileEdits.get(msgIndex);
    if (!edit) return;
    
    setFileEdits(prev => {
      const newMap = new Map(prev);
      newMap.set(msgIndex, { ...edit, status: "rejected" });
      return newMap;
    });
  }

  async function handleIndexProject() {
    // Use the shared triggerIndex which handles everything including status updates
    await triggerIndex(true, true); // immediate=true, showStatus=true
  }

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", backgroundColor: vars.color.background.panel }}>
      
      {/* Header / Indexing Status */}
      <div style={{ 
          padding: "8px 12px", 
          borderBottom: `1px solid ${vars.color.border.subtle}`,
          fontSize: 12,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          backgroundColor: vars.color.background.panelRaised
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: vars.color.text.muted }}>
              {!projectRoot 
                  ? "No project open"
                  : indexingState.chunkCount !== null
                      ? `Indexed (${indexingState.chunkCount} chunks)`
                      : stats?.is_indexed 
                          ? `Indexed (${stats.chunk_count} chunks)` 
                          : "Project not indexed"}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {conversation.length > 0 && (
              <button
                  onClick={() => { setConversation([]); setFileEdits(new Map()); }}
                  style={{
                      background: "none",
                      border: `1px solid ${vars.color.border.subtle}`,
                      color: vars.color.text.secondary,
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: 10,
                      cursor: "pointer"
                  }}
              >
                  Clear Chat
              </button>
            )}
            <button
                onClick={handleIndexProject}
                disabled={indexingState.isIndexing}
                style={{
                    background: "none",
                    border: `1px solid ${vars.color.border.subtle}`,
                    color: vars.color.text.secondary,
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 10,
                    cursor: indexingState.isIndexing ? "wait" : "pointer",
                    opacity: indexingState.isIndexing ? 0.6 : 1
                }}
            >
                {indexingState.isIndexing ? "Indexing..." : (stats?.is_indexed ? "Re-index" : "Index Now")}
            </button>
          </div>
        </div>
        {indexingState.message && (
          <div style={{ 
            fontSize: 11, 
            color: indexingState.status === "error" ? vars.color.state.danger : 
                   indexingState.status === "success" ? vars.color.state.success : 
                   vars.color.text.muted 
          }}>
            {indexingState.message}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 16 }}>
        {conversation.length === 0 && (
            <div style={{ color: vars.color.text.muted, textAlign: "center", marginTop: 40 }}>
                <p>Welcome to CodexLotus.</p>
                <p style={{ fontSize: 12 }}>Ask questions about your rulebook or ask for edits.</p>
                <p style={{ fontSize: 11, marginTop: 8, color: vars.color.text.secondary }}>
                    💡 You can ask me to edit files directly, e.g. "Update combat.md to add flanking rules"
                </p>
            </div>
        )}
        
        {conversation.map((msg, i) => {
            const fileEdit = fileEdits.get(i);
            const parsed = msg.role === "assistant" ? parseFileEditBlocks(msg.content) : null;
            
            return (
              <div key={i} style={{ 
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "95%",
                  width: msg.role === "assistant" ? "100%" : "auto",
                  backgroundColor: msg.role === "user" ? vars.color.background.panelRaised : "transparent",
                  padding: msg.role === "user" ? "8px 12px" : 0,
                  borderRadius: 8,
                  border: msg.role === "assistant" ? "none" : `1px solid ${vars.color.border.subtle}`
              }}>
                  {msg.role === "assistant" ? (
                      <>
                          {/* Text before file edit */}
                          {parsed?.textBefore && (
                              <MarkdownPreview content={parsed.textBefore} />
                          )}
                          
                          {/* File Edit Diff Viewer */}
                          {fileEdit && (
                              <div style={{ 
                                  margin: "12px 0",
                                  border: `1px solid ${vars.color.border.subtle}`,
                                  borderRadius: 8,
                                  overflow: "hidden"
                              }}>
                                  {/* Header */}
                                  <div style={{
                                      padding: "8px 12px",
                                      backgroundColor: fileEdit.status === "accepted" 
                                          ? vars.color.state.success 
                                          : fileEdit.status === "rejected"
                                              ? vars.color.state.danger
                                              : vars.color.state.info,
                                      color: "#fff",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      fontSize: 13
                                  }}>
                                      <span>
                                          {fileEdit.status === "accepted" ? "✓ " : fileEdit.status === "rejected" ? "✗ " : ""}
                                          <strong>{fileEdit.path}</strong>
                                          {fileEdit.status === "pending" && " — Review proposed changes"}
                                          {fileEdit.status === "accepted" && " — Changes saved"}
                                          {fileEdit.status === "rejected" && " — Changes discarded"}
                                      </span>
                                      {fileEdit.status === "pending" && (
                                          <div style={{ display: "flex", gap: 8 }}>
                                              <button 
                                                  onClick={() => handleRejectEdit(i)}
                                                  style={{
                                                      padding: "4px 12px",
                                                      borderRadius: 4,
                                                      border: "1px solid rgba(255,255,255,0.3)",
                                                      background: "transparent",
                                                      color: "#fff",
                                                      cursor: "pointer",
                                                      fontSize: 12
                                                  }}
                                              >
                                                  Discard
                                              </button>
                                              <button 
                                                  onClick={() => handleAcceptEdit(i)}
                                                  style={{
                                                      padding: "4px 12px",
                                                      borderRadius: 4,
                                                      border: "none",
                                                      background: "#fff",
                                                      color: vars.color.state.info,
                                                      cursor: "pointer",
                                                      fontWeight: 600,
                                                      fontSize: 12
                                                  }}
                                              >
                                                  Accept Changes
                                              </button>
                                          </div>
                                      )}
                                  </div>
                                  
                                  {/* Diff Content */}
                                  {fileEdit.status === "pending" && (
                                      <div style={{ height: 300, overflow: "auto" }}>
                                          <DiffViewer 
                                              original={fileEdit.originalContent || ""} 
                                              modified={fileEdit.newContent} 
                                          />
                                      </div>
                                  )}
                              </div>
                          )}
                          
                          {/* Text after file edit (explanation) */}
                          {parsed?.textAfter && (
                              <MarkdownPreview content={parsed.textAfter} />
                          )}
                          
                          {/* If no file edit, just show the full content */}
                          {!fileEdit && !parsed?.fileEdit && (
                              <MarkdownPreview content={msg.content} />
                          )}
                      </>
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
            );
        })}
        
        {isSending && (
            <div style={{ alignSelf: "flex-start", color: vars.color.text.muted, fontSize: 12, marginLeft: 12 }}>
                Thinking...
            </div>
        )}
        <div ref={chatEndRef} />
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
