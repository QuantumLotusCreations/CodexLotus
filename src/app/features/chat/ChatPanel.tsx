import React, { useEffect, useState, useRef, useCallback } from "react";
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

interface FileEditBlock {
  path: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

interface ParsedMessageWithMultipleEdits {
  segments: Array<{ type: "text"; content: string } | { type: "file_edit"; path: string; content: string; editIndex: number }>;
  fileEdits: FileEditBlock[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  error?: ChatError;
}

interface ChatError {
  type: "api_error" | "rate_limit" | "refused" | "token_limit" | "network" | "unknown";
  message: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface AIStatus {
  stage: "idle" | "sending" | "thinking" | "generating" | "editing" | "done" | "error" | "stopped";
  message: string;
  startTime?: number;
}

// Parse AI response for ALL file edit blocks (supports multiple)
function parseFileEditBlocksMultiple(content: string): ParsedMessageWithMultipleEdits {
  const regex = /<file_edit\s+path="([^"]+)">\s*([\s\S]*?)\s*<\/file_edit>/g;
  const fileEdits: FileEditBlock[] = [];
  const segments: ParsedMessageWithMultipleEdits["segments"] = [];
  
  let lastIndex = 0;
  let match;
  let editIndex = 0;
  
  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, path, editContent] = match;
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;
    
    // Add text before this file edit
    if (startIndex > lastIndex) {
      const textBefore = content.slice(lastIndex, startIndex).trim();
      if (textBefore) {
        segments.push({ type: "text", content: textBefore });
      }
    }
    
    // Add the file edit
    fileEdits.push({ path, content: editContent.trim(), startIndex, endIndex });
    segments.push({ type: "file_edit", path, content: editContent.trim(), editIndex });
    editIndex++;
    
    lastIndex = endIndex;
  }
  
  // Add any remaining text after the last file edit
  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex).trim();
    if (textAfter) {
      segments.push({ type: "text", content: textAfter });
    }
  }
  
  // If no file edits found, just return the full content as text
  if (segments.length === 0 && content.trim()) {
    segments.push({ type: "text", content: content.trim() });
  }
  
  return { segments, fileEdits };
}

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Parse error to determine type
function parseError(error: unknown): ChatError {
  const errorStr = String(error).toLowerCase();
  
  if (errorStr.includes("rate limit") || errorStr.includes("429") || errorStr.includes("quota")) {
    return { type: "rate_limit", message: "Rate limit reached. Please wait a moment before trying again." };
  }
  if (errorStr.includes("refused") || errorStr.includes("content policy") || errorStr.includes("safety")) {
    return { type: "refused", message: "The AI declined to respond due to content policy restrictions." };
  }
  if (errorStr.includes("token") && (errorStr.includes("limit") || errorStr.includes("exceeded") || errorStr.includes("maximum"))) {
    return { type: "token_limit", message: "Message exceeded the maximum token limit. Try a shorter message or start a new chat." };
  }
  if (errorStr.includes("network") || errorStr.includes("fetch") || errorStr.includes("connection") || errorStr.includes("timeout")) {
    return { type: "network", message: "Network error. Please check your connection and try again." };
  }
  if (errorStr.includes("api") || errorStr.includes("401") || errorStr.includes("403") || errorStr.includes("invalid key")) {
    return { type: "api_error", message: "API error. Please check your API key in Settings." };
  }
  if (errorStr.includes("abort") || errorStr.includes("cancel")) {
    return { type: "unknown", message: "Request was stopped by user." };
  }
  
  return { type: "unknown", message: String(error) };
}

// Estimate token count (rough approximation: ~4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Chat history storage utilities
const CHAT_HISTORY_KEY = "codexlotus_chat_history";

function loadChatHistory(): ChatSession[] {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveChatHistory(sessions: ChatSession[]): void {
  try {
    // Keep only last 50 sessions to prevent localStorage bloat
    const trimmed = sessions.slice(-50);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("Failed to save chat history:", e);
  }
}

function generateSessionTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find(m => m.role === "user");
  if (firstUserMsg) {
    const content = firstUserMsg.content.trim();
    return content.length > 40 ? content.slice(0, 40) + "..." : content;
  }
  return "New Chat";
}

// Copy to clipboard utility
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

// Animated dots component
const AnimatedDots: React.FC = () => {
  const [dots, setDots] = useState(1);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => (d % 3) + 1);
    }, 400);
    return () => clearInterval(interval);
  }, []);
  
  return <span>{".".repeat(dots)}</span>;
};

// Context usage wheel component
const ContextWheel: React.FC<{ usedTokens: number; maxTokens: number }> = ({ usedTokens, maxTokens }) => {
  const percentage = Math.min((usedTokens / maxTokens) * 100, 100);
  const circumference = 2 * Math.PI * 14; // radius = 14
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Color based on usage
  let color = vars.color.state.success;
  if (percentage > 75) color = vars.color.state.danger;
  else if (percentage > 50) color = vars.color.state.warning;
  
  return (
    <div 
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 6,
        padding: "4px 8px",
        borderRadius: 4,
        backgroundColor: vars.color.background.panelRaised,
        border: `1px solid ${vars.color.border.subtle}`
      }}
      title={`Context: ~${usedTokens.toLocaleString()} / ${maxTokens.toLocaleString()} tokens (${percentage.toFixed(0)}%)`}
    >
      <svg width="20" height="20" viewBox="0 0 36 36">
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke={vars.color.border.subtle}
          strokeWidth="3"
        />
        {/* Progress circle */}
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 18 18)"
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <span style={{ fontSize: 10, color: vars.color.text.muted }}>
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
};

// Status indicator component with stop button
const StatusIndicator: React.FC<{ status: AIStatus; onStop?: () => void }> = ({ status, onStop }) => {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    if (status.stage === "idle" || status.stage === "done" || status.stage === "stopped" || !status.startTime) {
      setElapsed(0);
      return;
    }
    
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - status.startTime!) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [status.stage, status.startTime]);
  
  if (status.stage === "idle" || status.stage === "done" || status.stage === "stopped") return null;
  
  const stageIcons: Record<string, string> = {
    sending: "📤",
    thinking: "🧠",
    generating: "✍️",
    editing: "📝",
    error: "❌"
  };
  
  const stageColors: Record<string, string> = {
    sending: vars.color.state.info,
    thinking: vars.color.accent.primary,
    generating: vars.color.state.success,
    editing: vars.color.state.warning,
    error: vars.color.state.danger
  };
  
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      backgroundColor: vars.color.background.panelRaised,
      borderRadius: 8,
      border: `1px solid ${stageColors[status.stage] || vars.color.border.subtle}`,
      marginBottom: 8
    }}>
      {/* Animated spinner */}
      <div style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: `2px solid ${vars.color.border.subtle}`,
        borderTopColor: stageColors[status.stage] || vars.color.accent.primary,
        animation: "spin 1s linear infinite"
      }} />
      
      <div style={{ flex: 1 }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 6,
          color: vars.color.text.primary,
          fontSize: 13,
          fontWeight: 500
        }}>
          <span>{stageIcons[status.stage]}</span>
          <span>{status.message}<AnimatedDots /></span>
        </div>
        {elapsed > 0 && (
          <div style={{ 
            fontSize: 11, 
            color: vars.color.text.muted,
            marginTop: 2 
          }}>
            {elapsed}s elapsed
          </div>
        )}
      </div>
      
      {/* Stop button */}
      {onStop && (
        <button
          onClick={onStop}
          style={{
            padding: "6px 12px",
            borderRadius: 4,
            border: `1px solid ${vars.color.state.danger}`,
            backgroundColor: "transparent",
            color: vars.color.state.danger,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = vars.color.state.danger;
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = vars.color.state.danger;
          }}
        >
          ⏹ Stop
        </button>
      )}
    </div>
  );
};

// Error display component
const ErrorDisplay: React.FC<{ error: ChatError; onRetry?: () => void; onDismiss?: () => void }> = ({ 
  error, 
  onRetry, 
  onDismiss 
}) => {
  const errorIcons: Record<string, string> = {
    rate_limit: "⏱️",
    refused: "🚫",
    token_limit: "📏",
    network: "🌐",
    api_error: "🔑",
    unknown: "⚠️"
  };
  
  const errorTitles: Record<string, string> = {
    rate_limit: "Rate Limit Reached",
    refused: "Response Declined",
    token_limit: "Token Limit Exceeded",
    network: "Connection Error",
    api_error: "API Error",
    unknown: "Error"
  };
  
  return (
    <div style={{
      backgroundColor: `${vars.color.state.danger}15`,
      border: `1px solid ${vars.color.state.danger}40`,
      borderRadius: 8,
      padding: 16,
      marginTop: 8
    }}>
      <div style={{ 
        display: "flex", 
        alignItems: "flex-start", 
        gap: 12 
      }}>
        <span style={{ fontSize: 20 }}>{errorIcons[error.type]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 600, 
            color: vars.color.state.danger,
            marginBottom: 4,
            fontSize: 14
          }}>
            {errorTitles[error.type]}
          </div>
          <div style={{ 
            color: vars.color.text.secondary,
            fontSize: 13,
            lineHeight: 1.5
          }}>
            {error.message}
          </div>
          
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  padding: "6px 12px",
                  borderRadius: 4,
                  border: "none",
                  backgroundColor: vars.color.state.danger,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                style={{
                  padding: "6px 12px",
                  borderRadius: 4,
                  border: `1px solid ${vars.color.border.subtle}`,
                  backgroundColor: "transparent",
                  color: vars.color.text.secondary,
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// File Edit Card component for multiple edits
const FileEditCard: React.FC<{
  edit: FileEditProposal;
  onAccept: () => void;
  onReject: () => void;
}> = ({ edit, onAccept, onReject }) => {
  return (
    <div style={{
      margin: "12px 0",
      border: `1px solid ${vars.color.border.subtle}`,
      borderRadius: 8,
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 12px",
        backgroundColor: edit.status === "accepted"
          ? vars.color.state.success
          : edit.status === "rejected"
            ? vars.color.state.danger
            : vars.color.state.info,
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 13
      }}>
        <span>
          {edit.status === "accepted" ? "✓ " : edit.status === "rejected" ? "✗ " : "📄 "}
          <strong>{edit.path}</strong>
          {edit.status === "pending" && " — Review proposed changes"}
          {edit.status === "accepted" && " — Changes saved"}
          {edit.status === "rejected" && " — Changes discarded"}
        </span>
        {edit.status === "pending" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onReject}
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
              onClick={onAccept}
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
              Accept
            </button>
          </div>
        )}
      </div>
      
      {/* Diff Content */}
      {edit.status === "pending" && (
        <div style={{ height: 300, overflow: "auto" }}>
          <DiffViewer
            original={edit.originalContent || ""}
            modified={edit.newContent}
          />
        </div>
      )}
    </div>
  );
};

// Message component with copy button - now supports multiple file edits
const ChatMessageBubble: React.FC<{
  message: ChatMessage;
  fileEdits: Map<string, FileEditProposal>;
  onAcceptEdit: (editKey: string) => void;
  onRejectEdit: (editKey: string) => void;
  onRetry?: () => void;
  onDismissError?: () => void;
}> = ({ message, fileEdits, onAcceptEdit, onRejectEdit, onRetry, onDismissError }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  
  // Parse message for multiple file edits
  const parsed = message.role === "assistant" ? parseFileEditBlocksMultiple(message.content) : null;
  
  return (
    <div style={{
      alignSelf: isUser ? "flex-end" : "flex-start",
      maxWidth: "95%",
      width: message.role === "assistant" ? "100%" : "auto",
      position: "relative"
    }}>
      {/* Message header with role label and copy button */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
        paddingLeft: isUser ? 0 : 2,
        paddingRight: isUser ? 2 : 0
      }}>
        <span style={{
          fontSize: 10,
          color: vars.color.text.muted,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          {isUser ? "You" : isSystem ? "System" : "Codex"}
        </span>
        
        <button
          onClick={handleCopy}
          title="Copy to clipboard"
          style={{
            background: "none",
            border: "none",
            color: copied ? vars.color.state.success : vars.color.text.muted,
            cursor: "pointer",
            padding: "2px 6px",
            fontSize: 12,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            if (!copied) e.currentTarget.style.color = vars.color.text.primary;
          }}
          onMouseLeave={(e) => {
            if (!copied) e.currentTarget.style.color = vars.color.text.muted;
          }}
        >
          {copied ? "✓ Copied" : "📋 Copy"}
        </button>
      </div>
      
      {/* Message content */}
      <div style={{
        backgroundColor: isUser 
          ? vars.color.background.panelRaised 
          : isSystem 
            ? `${vars.color.state.danger}15` 
            : "transparent",
        padding: isUser || isSystem ? "10px 14px" : 0,
        borderRadius: 8,
        border: isUser 
          ? `1px solid ${vars.color.border.subtle}` 
          : isSystem 
            ? `1px solid ${vars.color.state.danger}40` 
            : "none"
      }}>
        {message.role === "assistant" && parsed ? (
          // Render segments in order - handles multiple file edits properly
          parsed.segments.map((segment, idx) => {
            if (segment.type === "text") {
              return <MarkdownPreview key={idx} content={segment.content} />;
            } else {
              // File edit segment
              const editKey = `${message.id}-${segment.editIndex}`;
              const fileEdit = fileEdits.get(editKey);
              if (fileEdit) {
                return (
                  <FileEditCard
                    key={idx}
                    edit={fileEdit}
                    onAccept={() => onAcceptEdit(editKey)}
                    onReject={() => onRejectEdit(editKey)}
                  />
                );
              }
              return null;
            }
          })
        ) : (
          <div style={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.5,
            fontSize: 14,
            color: isSystem ? vars.color.state.danger : vars.color.text.primary
          }}>
            {message.content}
          </div>
        )}
        
        {/* Error display for messages with errors */}
        {message.error && (
          <ErrorDisplay 
            error={message.error} 
            onRetry={onRetry}
            onDismiss={onDismissError}
          />
        )}
      </div>
      
      {/* Timestamp */}
      <div style={{
        fontSize: 10,
        color: vars.color.text.muted,
        marginTop: 4,
        textAlign: isUser ? "right" : "left",
        paddingLeft: isUser ? 0 : 2,
        paddingRight: isUser ? 2 : 0
      }}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
};

// Chat history sidebar
const ChatHistorySidebar: React.FC<{
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ sessions, currentSessionId, onSelectSession, onDeleteSession, onNewChat, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      display: "flex"
    }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)"
        }}
      />
      
      {/* Sidebar */}
      <div style={{
        position: "relative",
        width: 280,
        height: "100%",
        backgroundColor: vars.color.background.panel,
        borderRight: `1px solid ${vars.color.border.subtle}`,
        display: "flex",
        flexDirection: "column",
        zIndex: 101
      }}>
        {/* Header */}
        <div style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${vars.color.border.subtle}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ fontWeight: 600, color: vars.color.text.primary }}>Chat History</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: vars.color.text.muted,
              cursor: "pointer",
              fontSize: 18,
              padding: 4
            }}
          >
            ✕
          </button>
        </div>
        
        {/* New Chat button */}
        <div style={{ padding: 12 }}>
          <button
            onClick={() => { onNewChat(); onClose(); }}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 6,
              border: `1px dashed ${vars.color.border.strong}`,
              backgroundColor: "transparent",
              color: vars.color.text.secondary,
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            <span style={{ fontSize: 16 }}>+</span>
            New Chat
          </button>
        </div>
        
        {/* Sessions list */}
        <div style={{ flex: 1, overflow: "auto", padding: "0 12px 12px" }}>
          {sessions.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              color: vars.color.text.muted,
              padding: 24,
              fontSize: 13
            }}>
              No chat history yet
            </div>
          ) : (
            sessions.slice().reverse().map(session => (
              <div
                key={session.id}
                onClick={() => { onSelectSession(session); onClose(); }}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  marginBottom: 4,
                  cursor: "pointer",
                  backgroundColor: session.id === currentSessionId 
                    ? vars.color.background.panelRaised 
                    : "transparent",
                  border: session.id === currentSessionId 
                    ? `1px solid ${vars.color.accent.primary}40` 
                    : "1px solid transparent",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  if (session.id !== currentSessionId) {
                    e.currentTarget.style.backgroundColor = vars.color.background.panelRaised;
                  }
                }}
                onMouseLeave={(e) => {
                  if (session.id !== currentSessionId) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start"
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      color: vars.color.text.primary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: 4
                    }}>
                      {session.title}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: vars.color.text.muted
                    }}>
                      {new Date(session.updatedAt).toLocaleDateString()} · {session.messages.length} messages
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: vars.color.text.muted,
                      cursor: "pointer",
                      padding: 4,
                      fontSize: 12,
                      opacity: 0.6
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = vars.color.state.danger; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.color = vars.color.text.muted; }}
                    title="Delete chat"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Maximum context tokens (typical for most models)
const MAX_CONTEXT_TOKENS = 128000;

export const ChatPanel: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fileEdits, setFileEdits] = useState<Map<string, FileEditProposal>>(new Map());
  const [aiStatus, setAiStatus] = useState<AIStatus>({ stage: "idle", message: "" });
  const [isRequestActive, setIsRequestActive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastUserMessageRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const projectRoot = useAtomValue(projectRootAtom);
  const { mutateAsync: sendMessage } = useChatCompletion();
  const { data: stats } = useIndexStats(projectRoot);
  const { triggerIndex, indexingState } = useAutoIndex();

  // Calculate context usage
  const contextTokens = messages.reduce((acc, msg) => acc + estimateTokens(msg.content), 0) + estimateTokens(input);

  // Load chat history on mount
  useEffect(() => {
    const history = loadChatHistory();
    setChatHistory(history);
  }, []);

  // Auto-scroll to bottom when new messages arrive or status changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiStatus]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  // Save current session to history when messages change
  useEffect(() => {
    if (messages.length === 0) return;
    
    const now = Date.now();
    const sessionId = currentSessionId || generateId();
    
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }
    
    const session: ChatSession = {
      id: sessionId,
      title: generateSessionTitle(messages),
      messages,
      createdAt: currentSessionId 
        ? chatHistory.find(s => s.id === sessionId)?.createdAt || now 
        : now,
      updatedAt: now
    };
    
    setChatHistory(prev => {
      const existing = prev.findIndex(s => s.id === sessionId);
      let updated: ChatSession[];
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = session;
      } else {
        updated = [...prev, session];
      }
      saveChatHistory(updated);
      return updated;
    });
  }, [messages, currentSessionId]);

  function joinPath(root: string, relative: string): string {
    if (root.endsWith("/") || root.endsWith("\\")) {
      return root + relative;
    }
    return `${root}/${relative}`;
  }

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRequestActive(false);
    setAiStatus({ stage: "stopped", message: "Request stopped by user" });
  }, []);

  const handleSend = useCallback(async (retryContent?: string) => {
    const messageContent = retryContent || input.trim();
    if (!messageContent) return;

    lastUserMessageRef.current = messageContent;
    
    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: messageContent,
      timestamp: Date.now()
    };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    setIsRequestActive(true);

    // Update AI status
    setAiStatus({ stage: "sending", message: "Sending message", startTime: Date.now() });

    try {
      // Convert to API format
      const conversation = updatedMessages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role, content: m.content }));
      
      setAiStatus({ stage: "thinking", message: "AI is thinking", startTime: Date.now() });
      
        const response = await sendMessage({ 
        prompt: messageContent,
            project_root: projectRoot || undefined,
        conversation
      });
      
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      setAiStatus({ stage: "generating", message: "Generating response", startTime: Date.now() });
      
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: response.content,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      
      // Check if response contains file edit proposals (supports multiple)
      const parsed = parseFileEditBlocksMultiple(response.content);
      if (parsed.fileEdits.length > 0 && projectRoot) {
        setAiStatus({ stage: "editing", message: `Loading ${parsed.fileEdits.length} file(s) for comparison`, startTime: Date.now() });
        
        // Load all files for diff comparison
        for (let i = 0; i < parsed.fileEdits.length; i++) {
          const fileEdit = parsed.fileEdits[i];
          const editKey = `${assistantMsg.id}-${i}`;
          const fullPath = joinPath(projectRoot, fileEdit.path);
          
            try {
                const originalContent = await readFile(fullPath);
            setFileEdits(prev => new Map(prev).set(editKey, {
              path: fileEdit.path,
              newContent: fileEdit.content,
                    originalContent,
                    status: "pending"
                }));
            } catch {
            // File might not exist yet
            setFileEdits(prev => new Map(prev).set(editKey, {
              path: fileEdit.path,
              newContent: fileEdit.content,
                    originalContent: "",
                    status: "pending"
                }));
            }
        }
      }
      
      setAiStatus({ stage: "done", message: "" });
      
    } catch (err) {
      // Don't show error if it was user-initiated abort
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      console.error("Chat error:", err);
      const chatError = parseError(err);
      
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: "system",
        content: `Failed to get response`,
        timestamp: Date.now(),
        error: chatError
      };
      
      setMessages(prev => [...prev, errorMsg]);
      setAiStatus({ stage: "error", message: chatError.message });
    } finally {
      setIsRequestActive(false);
      abortControllerRef.current = null;
    }
  }, [input, messages, projectRoot, sendMessage]);

  const handleRetry = useCallback(() => {
    // Remove the last error message and retry
    setMessages(prev => prev.filter(m => !m.error));
    handleSend(lastUserMessageRef.current);
  }, [handleSend]);

  const handleDismissError = useCallback((msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setAiStatus({ stage: "idle", message: "" });
  }, []);

  async function handleAcceptEdit(editKey: string) {
    const edit = fileEdits.get(editKey);
    if (!edit || !projectRoot) return;
    
    try {
      const fullPath = joinPath(projectRoot, edit.path);
      await writeFile(fullPath, edit.newContent);
      setFileEdits(prev => {
        const newMap = new Map(prev);
        newMap.set(editKey, { ...edit, status: "accepted" });
        return newMap;
      });
      // Trigger re-indexing with status display
      triggerIndex(true, true);
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }

  function handleRejectEdit(editKey: string) {
    const edit = fileEdits.get(editKey);
    if (!edit) return;
    
    setFileEdits(prev => {
      const newMap = new Map(prev);
      newMap.set(editKey, { ...edit, status: "rejected" });
      return newMap;
    });
  }

  function handleNewChat() {
    setMessages([]);
    setFileEdits(new Map());
    setCurrentSessionId(null);
    setAiStatus({ stage: "idle", message: "" });
  }

  function handleSelectSession(session: ChatSession) {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setFileEdits(new Map());
    setAiStatus({ stage: "idle", message: "" });
  }

  function handleDeleteSession(sessionId: string) {
    setChatHistory(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      saveChatHistory(updated);
      return updated;
    });
    
    if (sessionId === currentSessionId) {
      handleNewChat();
    }
  }

  async function handleIndexProject() {
    await triggerIndex(true, true);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ 
      height: "100%", 
      width: "100%", 
      display: "flex", 
      flexDirection: "column", 
      backgroundColor: vars.color.background.panel,
      position: "relative"
    }}>
      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        sessions={chatHistory}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
      
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setShowHistory(true)}
              title="Chat History"
              style={{
                background: "none",
                border: "none",
                color: vars.color.text.secondary,
                cursor: "pointer",
                padding: 4,
                fontSize: 14,
                display: "flex",
                alignItems: "center"
              }}
            >
              📜
            </button>
          <div style={{ color: vars.color.text.muted }}>
              {!projectRoot 
                  ? "No project open"
                  : indexingState.chunkCount !== null
                      ? `Indexed (${indexingState.chunkCount} chunks)`
                      : stats?.is_indexed 
                          ? `Indexed (${stats.chunk_count} chunks)` 
                          : "Project not indexed"}
          </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Context usage wheel */}
            <ContextWheel usedTokens={contextTokens} maxTokens={MAX_CONTEXT_TOKENS} />
            
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
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
                New Chat
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
        {messages.length === 0 && (
            <div style={{ color: vars.color.text.muted, textAlign: "center", marginTop: 40 }}>
                <p>Welcome to CodexLotus.</p>
                <p style={{ fontSize: 12 }}>Ask questions about your rulebook or ask for edits.</p>
                <p style={{ fontSize: 11, marginTop: 8, color: vars.color.text.secondary }}>
                    💡 You can ask me to edit files directly, e.g. "Update combat.md to add flanking rules"
                </p>
            {chatHistory.length > 0 && (
                                              <button 
                onClick={() => setShowHistory(true)}
                                                  style={{
                  marginTop: 16,
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: `1px solid ${vars.color.border.subtle}`,
                  backgroundColor: "transparent",
                  color: vars.color.text.secondary,
                                                      cursor: "pointer",
                                                      fontSize: 12
                                                  }}
                                              >
                📜 View Chat History ({chatHistory.length} conversations)
                                              </button>
                                      )}
                                  </div>
        )}
        
        {messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            fileEdits={fileEdits}
            onAcceptEdit={handleAcceptEdit}
            onRejectEdit={handleRejectEdit}
            onRetry={msg.error ? handleRetry : undefined}
            onDismissError={msg.error ? () => handleDismissError(msg.id) : undefined}
          />
        ))}
        
        {/* AI Status Indicator with Stop button */}
        {isRequestActive && (
          <StatusIndicator 
            status={aiStatus} 
            onStop={handleStop}
          />
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input Area - Now uses textarea */}
      <div style={{ padding: 12, borderTop: `1px solid ${vars.color.border.subtle}` }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            style={{ 
                flex: 1,
              padding: "10px 12px",
              borderRadius: 6,
                border: `1px solid ${vars.color.border.subtle}`,
                backgroundColor: vars.color.background.base,
              color: vars.color.text.primary,
              resize: "none",
              minHeight: 60,
              maxHeight: 150,
              fontFamily: "inherit",
              fontSize: 14,
              lineHeight: 1.5
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message... (Shift+Enter for new line)"
            onKeyDown={handleKeyDown}
            disabled={isRequestActive}
            rows={2}
            />
            <button 
            onClick={() => handleSend()}
            disabled={isRequestActive || !input.trim()}
            title="Send message"
                style={{
              width: 40,
              height: 40,
              borderRadius: 8,
                    border: "none",
                    backgroundColor: vars.color.accent.primary,
                    color: vars.color.text.inverse,
              cursor: isRequestActive || !input.trim() ? "not-allowed" : "pointer",
              opacity: isRequestActive || !input.trim() ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            </button>
        </div>
        <div style={{ 
          fontSize: 10, 
          color: vars.color.text.muted, 
          marginTop: 4,
          display: "flex",
          justifyContent: "space-between"
        }}>
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>~{estimateTokens(input).toLocaleString()} tokens</span>
        </div>
      </div>
    </div>
  );
};
