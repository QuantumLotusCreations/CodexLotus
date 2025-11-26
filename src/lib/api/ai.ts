import { useMutation, useQuery } from "@tanstack/react-query";
import { call } from "./client";

export interface ChatRequest {
  prompt: string;
  project_root?: string;
}

export interface ChatResponse {
  content: string;
}

export interface FileEditRequest {
    path: string;
    contents: string;
    instruction: string;
}

export interface FileEditResponse {
    updated_contents: string;
}

export interface InitIndexRequest {
  project_root: string;
}

export interface IndexStats {
  chunk_count: number;
  is_indexed: boolean;
}

export function useChatCompletion() {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: (req) => call<ChatResponse>("ai_chat_completion", { req }),
  });
}

export function useFileEdit() {
    return useMutation<FileEditResponse, Error, FileEditRequest>({
        mutationFn: (req) => call<FileEditResponse>("ai_file_edit", { req }),
    });
}

export function useInitializeIndex() {
  return useMutation<void, Error, InitIndexRequest>({
    mutationFn: (req) => call<void>("initialize_project_index", { req }),
  });
}

export function useIndexStats(projectRoot?: string | null) {
  return useQuery<IndexStats>({
    queryKey: ["index_stats", projectRoot],
    queryFn: () => {
      if (!projectRoot) return Promise.resolve({ chunk_count: 0, is_indexed: false });
      return call<IndexStats>("get_index_stats", { projectRoot });
    },
    enabled: !!projectRoot,
  });
}
