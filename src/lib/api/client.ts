import { invoke } from "@tauri-apps/api/tauri";

export async function call<T>(command: string, payload?: Record<string, unknown>): Promise<T> {
  return invoke<T>(command, payload);
}
