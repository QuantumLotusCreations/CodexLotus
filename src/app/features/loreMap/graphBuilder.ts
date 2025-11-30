import { listMarkdownFiles, readFile, FileEntry } from "../../../lib/api/files";

export interface GraphNode {
  id: string;
  name: string;
  group: string; // e.g. folder name
  val: number; // size based on connections
}

export interface GraphLink {
  source: string;
  target: string;
  type?: "explicit" | "tag"; // Distinguish between direct links and tag matches
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

function extractLinks(content: string): string[] {
  const links: string[] = [];
  
  // 1. Wiki links [[Target]] or [[Target|Label]]
  const wikiLinkRegex = /\[\[(.*?)(?:\|.*?)?\]\]/g;
  let match;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    links.push(match[1].trim());
  }

  // 2. Standard Markdown links [Label](Target.md)
  // We care about the target path/filename
  const mdLinkRegex = /\[.*?\]\((.*?)\)/g;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    const link = match[1];
    // Ignore external links
    if (!link.startsWith("http")) {
        // Clean up extension and path
        const cleanLink = link.replace(/(\.md)?$/, "").split("/").pop(); 
        if (cleanLink) links.push(cleanLink);
    }
  }

  return links;
}

function extractTags(content: string): string[] {
    const tags = new Set<string>();
    // Match #tag but ensure it's not in a URL or middle of word
    // Simple regex: look for # followed by letters/numbers/dashes
    // We avoid capturing hex codes (usually 3 or 6 chars, often in code blocks or css)
    // This is heuristic and might need tuning.
    const tagRegex = /(?<=^|\s)(#[a-zA-Z][\w-]*)/g;
    
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
        tags.add(match[1].toLowerCase());
    }
    
    return Array.from(tags);
}

function getGroupName(path: string): string {
    // Use top-level folder as group
    const parts = path.replace(/\\/g, "/").split("/");
    // If path is "mechanics/combat/Initiative.md", group is "mechanics"
    // If path is just "Intro.md", group is "root"
    if (parts.length > 1) return parts[0];
    return "root";
}

function getNodeName(path: string): string {
    const parts = path.replace(/\\/g, "/").split("/");
    const filename = parts[parts.length - 1];
    return filename.replace(/\.md$/i, "");
}

export async function buildLoreGraph(projectRoot: string): Promise<GraphData> {
  const files = await listMarkdownFiles(projectRoot);
  
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeMap = new Map<string, string>(); // Name -> ID (path) mapping for easier lookup
  
  // Map to store which files have which tags
  // Tag -> [FilePath1, FilePath2, ...]
  const tagMap = new Map<string, string[]>();

  // 1. Create Nodes
  files.forEach((file) => {
    // file.path is relative to project root (based on typical listMarkdownFiles behavior)
    const name = getNodeName(file.path);
    const group = getGroupName(file.path);
    
    nodes.push({
      id: file.path,
      name: name,
      group: group,
      val: 1 
    });

    // Store mapping from "Name" to "Path" to resolve links
    nodeMap.set(name.toLowerCase(), file.path);
  });

  // 2. Process Files for Links and Tags
  const fileContents = await Promise.all(
    files.map(async (f) => ({
        path: f.path,
        content: await readFile(f.path).catch(() => "") // Handle read errors gracefully
    }))
  );

  fileContents.forEach(({ path, content }) => {
    // A. Explicit Links
    const foundLinks = extractLinks(content);
    foundLinks.forEach((linkName) => {
        const targetPath = nodeMap.get(linkName.toLowerCase());
        if (targetPath && targetPath !== path) {
            links.push({
                source: path,
                target: targetPath,
                type: "explicit"
            });
        }
    });

    // B. Tags
    const foundTags = extractTags(content);
    foundTags.forEach(tag => {
        if (!tagMap.has(tag)) {
            tagMap.set(tag, []);
        }
        tagMap.get(tag)?.push(path);
    });
  });

  // 3. Generate Links from Tags
  // If File A and File B both have #magic, link them.
  // Warning: This creates a clique (fully connected subgraph) for each tag.
  // To avoid explosion, we only link if the group is small, or we create a "hub" node?
  // For now, let's do direct links but maybe limit them if there are too many.
  tagMap.forEach((filesWithTag, tag) => {
      // If 50 files have #dnd, we don't want 1225 links.
      // Maybe we treat the Tag itself as a node if > 5 files?
      // For this iteration, let's do direct links but be careful.
      
      // Let's link everything to everything for small groups (< 10).
      // For large groups, we won't link them to avoid visual noise, or maybe we link them sequentially?
      // Better approach for "Concept Map": Create a "Virtual Node" for the tag if it connects > 2 things.
      
      if (filesWithTag.length > 1) {
          // Create a virtual node for the tag
          const tagNodeId = `tag:${tag}`;
          nodes.push({
              id: tagNodeId,
              name: tag,
              group: "_tags", // Special group for styling
              val: 1 + Math.log(filesWithTag.length) // Size based on usage
          });
          
          // Link all files to this tag node
          filesWithTag.forEach(filePath => {
              links.push({
                  source: filePath,
                  target: tagNodeId,
                  type: "tag"
              });
          });
      }
  });

  // 4. Update node sizes based on connections
  const connectionCount = new Map<string, number>();
  links.forEach(l => {
      connectionCount.set(l.source, (connectionCount.get(l.source) || 0) + 1);
      connectionCount.set(l.target, (connectionCount.get(l.target) || 0) + 1);
  });

  nodes.forEach(n => {
      // Base size 1, plus connections. Log scale to prevent huge nodes.
      const count = connectionCount.get(n.id) || 0;
      n.val = 1 + Math.log(count + 1) * 2; 
  });

  return { nodes, links };
}
