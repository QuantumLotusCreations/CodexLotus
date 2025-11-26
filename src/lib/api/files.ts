import { call } from "./client";

export interface FileEntry {
  path: string;
}

export async function listMarkdownFiles(projectRoot: string) {
  return call<FileEntry[]>("list_markdown_files", { projectRoot });
}

export async function readFile(path: string) {
  return call<string>("read_file", { path });
}

export async function writeFile(path: string, contents: String) {
  return call<void>("write_file", { path, contents });
}

export async function createDirectory(path: string) {
  return call<void>("create_directory", { path });
}

export async function copyFile(source: string, destination: string) {
  return call<void>("copy_file", { source, destination });
}


