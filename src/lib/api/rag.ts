import { call } from "./client";

export interface RagHit {
  file_path: string;
  snippet: string;
  score: number;
}

export interface IndexStats {
  chunk_count: number;
  is_indexed: boolean;
}

export async function initializeProjectIndex(projectRoot: string) {
  return call<void>("initialize_project_index", { req: { project_root: projectRoot } });
}

export async function ragQuery(projectRoot: string, query: string) {
  return call<RagHit[]>("rag_query", { req: { project_root: projectRoot, query } });
}

export async function getIndexStats(projectRoot: string) {
    return call<IndexStats>("get_index_stats", { projectRoot });
}
