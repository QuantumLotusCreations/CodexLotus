import { listMarkdownFiles, readFile, writeFile, FileEntry } from "../../../lib/api/files";

export interface TagSuggestion {
  file: string; // relative path
  currentTags: string[];
  suggestedTags: string[];
}

// Helper to get base filename without extension
function getBaseName(path: string): string {
    const parts = path.replace(/\\/g, "/").split("/");
    return parts[parts.length - 1].replace(/\.md$/i, "");
}

// Helper to extract existing tags from content
function extractTags(content: string): string[] {
    const tags = new Set<string>();
    const tagRegex = /(?<=^|\s)(#[a-zA-Z][\w-]*)/g;
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
        tags.add(match[1].toLowerCase());
    }
    return Array.from(tags);
}

export async function scanForTags(projectRoot: string): Promise<TagSuggestion[]> {
    const files = await listMarkdownFiles(projectRoot);
    
    // 1. Build a dictionary of "Keywords" based on file names
    // e.g. "Wizard.md" -> Keyword "wizard"
    // We filter out common words or very short ones to avoid noise
    const keywordMap = new Map<string, string>(); // keyword (lower) -> Tag Name (#Wizard)
    
    files.forEach(f => {
        const name = getBaseName(f.path);
        if (name.length > 3) { // Skip short names like "Map", "NPC" might be too generic?
            keywordMap.set(name.toLowerCase(), `#${name.toLowerCase()}`);
        }
    });

    // 2. Scan each file
    const results: TagSuggestion[] = [];

    // Parallel read
    const fileContents = await Promise.all(
        files.map(async (f) => ({
            path: f.path,
            content: await readFile(f.path).catch(() => "")
        }))
    );

    fileContents.forEach(({ path, content }) => {
        const currentTags = extractTags(content);
        const suggestedTags = new Set<string>();
        const lowerContent = content.toLowerCase();

        // Check for keywords in content
        keywordMap.forEach((tag, keyword) => {
            // Simple inclusion check (could be improved with regex for word boundaries)
            // We check if the keyword appears, but the tag is NOT already there
            if (lowerContent.includes(keyword) && !currentTags.includes(tag)) {
                // Don't suggest self-tagging (e.g. Wizard.md containing "wizard")
                const selfName = getBaseName(path).toLowerCase();
                if (keyword !== selfName) {
                    suggestedTags.add(tag);
                }
            }
        });

        if (suggestedTags.size > 0) {
            results.push({
                file: path,
                currentTags: currentTags,
                suggestedTags: Array.from(suggestedTags)
            });
        }
    });

    return results;
}

export async function applyTags(file: string, tagsToAdd: string[]) {
    let content = await readFile(file);
    
    // Append to end of file with a newline
    // Check if file ends with newline
    if (!content.endsWith("\n")) content += "\n";
    
    // Add a spacing line if needed
    content += "\n";
    content += tagsToAdd.join(" ");
    
    await writeFile(file, content);
}

