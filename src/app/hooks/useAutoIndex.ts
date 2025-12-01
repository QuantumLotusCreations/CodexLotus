import { useCallback, useRef } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { projectRootAtom } from "../state/atoms/projectAtoms";
import { initializeProjectIndex, getIndexStats } from "../../lib/api/rag";
import { call } from "../../lib/api/client";

export interface IndexingState {
  isIndexing: boolean;
  status: "idle" | "indexing" | "success" | "error";
  message: string | null;
  chunkCount: number | null;
}

// Shared atom for indexing state across all components
export const indexingStateAtom = atom<IndexingState>({
  isIndexing: false,
  status: "idle",
  message: null,
  chunkCount: null
});

// Ref to track if indexing is in progress (shared across hook instances)
let globalIsIndexing = false;

/**
 * Hook that provides auto-indexing functionality for the project.
 * Includes debouncing to prevent excessive re-indexing on rapid saves.
 */
export function useAutoIndex() {
  const projectRoot = useAtomValue(projectRootAtom);
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Store projectRoot in a ref to avoid stale closures in debounced callbacks
  const projectRootRef = useRef(projectRoot);
  projectRootRef.current = projectRoot;

  const [indexingState, setIndexingState] = useAtom(indexingStateAtom);

  /**
   * Perform the actual indexing operation
   */
  const doIndex = useCallback(async (root: string, showStatus = true) => {
    if (globalIsIndexing) {
      console.log("[AutoIndex] Already indexing, skipping");
      return;
    }

    try {
      // Check if we have an API key
      const hasKey = await call<boolean>("check_api_key");
      if (!hasKey) {
        console.log("[AutoIndex] No API key configured, skipping");
        if (showStatus) {
          setIndexingState({
            isIndexing: false,
            status: "error",
            message: "No API key configured",
            chunkCount: null
          });
        }
        return;
      }

      globalIsIndexing = true;
      console.log("[AutoIndex] Starting index for:", root);
      
      setIndexingState({
        isIndexing: true,
        status: "indexing",
        message: showStatus ? "Indexing project..." : null,
        chunkCount: null
      });
      
      await initializeProjectIndex(root);
      
      // Fetch fresh stats
      const stats = await getIndexStats(root);
      console.log("[AutoIndex] Fresh stats:", stats);
      
      // Invalidate the index stats query to refresh UI
      queryClient.invalidateQueries({ queryKey: ["index_stats", root] });
      
      console.log("[AutoIndex] Indexing complete");
      
      setIndexingState({
        isIndexing: false,
        status: "success",
        message: showStatus ? `✓ Indexed ${stats.chunk_count} files` : null,
        chunkCount: stats.chunk_count
      });
      
      // Clear success message after 5 seconds
      if (showStatus) {
        setTimeout(() => {
          setIndexingState(prev => 
            prev.status === "success" ? { ...prev, status: "idle", message: null } : prev
          );
        }, 5000);
      }
    } catch (err) {
      console.error("[AutoIndex] Indexing failed:", err);
      setIndexingState({
        isIndexing: false,
        status: "error",
        message: showStatus ? `✗ Error: ${String(err)}` : null,
        chunkCount: null
      });
    } finally {
      globalIsIndexing = false;
    }
  }, [queryClient, setIndexingState]);

  /**
   * Trigger a re-index of the current project.
   * Debounced to prevent excessive API calls on rapid saves.
   * @param immediate - If true, index immediately without debounce
   * @param showStatus - If true, show status messages (default true for immediate, false for debounced)
   */
  const triggerIndex = useCallback(async (immediate = false, showStatus?: boolean) => {
    const root = projectRootRef.current;
    if (!root) {
      console.log("[AutoIndex] No project root, skipping");
      return;
    }

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Default: show status for immediate, hide for debounced (background saves)
    const shouldShowStatus = showStatus ?? immediate;

    if (immediate) {
      await doIndex(root, shouldShowStatus);
    } else {
      // Debounce by 2 seconds to batch rapid saves
      // Use ref to get current projectRoot when timer fires
      debounceTimerRef.current = setTimeout(() => {
        const currentRoot = projectRootRef.current;
        if (currentRoot) {
          doIndex(currentRoot, false); // Don't show status for background re-indexes
        }
      }, 2000);
    }
  }, [doIndex]);

  /**
   * Clear the indexing status message
   */
  const clearStatus = useCallback(() => {
    setIndexingState(prev => ({ ...prev, status: "idle", message: null }));
  }, []);

  return {
    triggerIndex,
    indexingState,
    clearStatus,
    projectRoot
  };
}

