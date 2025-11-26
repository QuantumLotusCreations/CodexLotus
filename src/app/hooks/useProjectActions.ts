import { useAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { open } from "@tauri-apps/api/dialog";
import { join, basename } from "@tauri-apps/api/path";
import { projectRootAtom } from "../state/atoms/projectAtoms";
import { createDirectory, writeFile, copyFile } from "../../lib/api/files";

export function useProjectActions() {
  const [projectRoot, setProjectRoot] = useAtom(projectRootAtom);
  const queryClient = useQueryClient();

  const handleSelectProject = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Project Folder",
      });

      if (selected && typeof selected === "string") {
        setProjectRoot(selected);
      }
    } catch (err) {
      console.error("Failed to open dialog:", err);
      const nextRoot = window.prompt("Set project root path", projectRoot ?? "")?.trim();
      if (nextRoot) {
        setProjectRoot(nextRoot);
      }
    }
  };

  const handleCreateProject = async () => {
    try {
      const parentDir = await open({
        directory: true,
        multiple: false,
        title: "Select Parent Directory for New Project",
      });

      if (!parentDir || typeof parentDir !== "string") return;

      const projectName = window.prompt("Enter new project name:");
      if (!projectName) return;

      const newProjectPath = await join(parentDir, projectName);
      
      // Create directory
      await createDirectory(newProjectPath);
      
      // Create initial README
      const readmePath = await join(newProjectPath, "README.md");
      await writeFile(readmePath, `# ${projectName}\n\nWelcome to your new CodexLotus project.`);

      setProjectRoot(newProjectPath);
      // Invalidate queries to ensure fresh state
      queryClient.invalidateQueries({ queryKey: ["project-files"] });

    } catch (err) {
      console.error("Failed to create project:", err);
      alert("Failed to create project: " + String(err));
    }
  };

  const handleImportFiles = async () => {
    if (!projectRoot) return;
    try {
      const selected = await open({
        multiple: true,
        title: "Import Files",
        filters: [{
          name: "Supported Files",
          extensions: ["md", "markdown", "mdx", "png", "jpg", "jpeg", "gif", "webp", "svg"]
        }]
      });

      if (!selected) return;
      const files = Array.isArray(selected) ? selected : [selected];

      let importedCount = 0;
      for (const srcPath of files) {
        const fileName = await basename(srcPath);
        const destPath = await join(projectRoot, fileName);
        
        if (srcPath === destPath) continue;

        await copyFile(srcPath, destPath);
        importedCount++;
      }

      if (importedCount > 0) {
        queryClient.invalidateQueries({ queryKey: ["project-files"] });
      }
    } catch (err) {
      console.error("Failed to import files:", err);
      alert("Failed to import files: " + String(err));
    }
  };

  return {
    handleSelectProject,
    handleCreateProject,
    handleImportFiles,
    projectRoot,
  };
}

