import React, { useState } from "react";
import { useChatCompletion } from "../../../lib/api/ai";

export const ChatPanel: React.FC = () => {
  const [input, setInput] = useState("");
  const { mutateAsync, data, isLoading } = useChatCompletion();

  async function handleSend() {
    if (!input.trim()) return;
    await mutateAsync({ prompt: input });
  }

  return (
    <div style={{ padding: 12, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflow: "auto", marginBottom: 8 }}>
        {isLoading && <div>Thinking…</div>}
        {data && <div>{data.content}</div>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ flex: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask CodexLotus about your rulebook…"
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};
