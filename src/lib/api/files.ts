import { call } from "./client";

export interface FileEntry {
  path: string;
}

export async function listMarkdownFiles(projectRoot: string) {
  return call<FileEntry[]>("list_markdown_files", { project_root: projectRoot });
}

export async function readFile(path: string) {
  return call<string>("read_file", { path });
}

export async function writeFile(path: string, contents: string) {
  return call<void>("write_file", { path, contents });
}
