import { useMutation } from "@tanstack/react-query";
import { call } from "./client";

export interface ChatRequest {
  prompt: string;
  project_root?: string;
}

export interface ChatResponse {
  content: string;
}

export function useChatCompletion() {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: (req) => call<ChatResponse>("ai_chat_completion", { req }),
  });
}
