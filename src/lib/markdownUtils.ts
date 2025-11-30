export interface MarkdownHeader {
  text: string;
  level: number;
  line: number;
}

export function parseMarkdownHeaders(content: string): MarkdownHeader[] {
  const lines = content.split(/\r?\n/);
  const headers: MarkdownHeader[] = [];
  // Regex for headers: # Text
  // We want to capture the level and the text
  const regex = /^(#{1,6})\s+(.+)$/;
  
  lines.forEach((line, index) => {
    const match = line.match(regex);
    if (match) {
      headers.push({
        level: match[1].length,
        text: match[2].trim(),
        line: index
      });
    }
  });
  
  return headers;
}

/**
 * Extracts the content of a specific section defined by a header text.
 * @deprecated Use extractSectionByLine for more robust handling of duplicates.
 */
export function extractSection(content: string, headerText: string): string {
  const lines = content.split(/\r?\n/);
  const regex = /^(#{1,6})\s+(.+)$/;
  
  let startLine = -1;
  let endLine = -1;
  let targetLevel = -1;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(regex);
    if (match) {
        const currentLevel = match[1].length;
        const currentText = match[2].trim();
        
        if (startLine === -1) {
            if (currentText === headerText) {
                startLine = i;
                targetLevel = currentLevel;
            }
        } else {
            if (currentLevel <= targetLevel) {
                endLine = i;
                break;
            }
        }
    }
  }
  
  if (startLine === -1) return "";
  if (endLine === -1) endLine = lines.length;
  
  return lines.slice(startLine, endLine).join("\n");
}

/**
 * Extracts the content of a specific section starting at a known line number.
 * More robust than searching by text, especially for duplicate headers.
 */
export function extractSectionByLine(content: string, startLineIndex: number): string {
  const lines = content.split(/\r?\n/);
  
  if (startLineIndex < 0 || startLineIndex >= lines.length) return "";

  // 1. Determine the level of the target header
  const regex = /^(#{1,6})\s+(.+)$/;
  const startMatch = lines[startLineIndex].match(regex);
  
  if (!startMatch) {
      // Fallback: If the start line isn't a header, maybe return empty or just the rest?
      // Strictly speaking, this function expects to start at a header.
      return ""; 
  }

  const targetLevel = startMatch[1].length;
  let endLine = -1;

  // 2. Find the end (next header of <= level)
  for (let i = startLineIndex + 1; i < lines.length; i++) {
      const match = lines[i].match(regex);
      if (match) {
          const currentLevel = match[1].length;
          if (currentLevel <= targetLevel) {
              endLine = i;
              break;
          }
      }
  }

  if (endLine === -1) endLine = lines.length;

  return lines.slice(startLineIndex, endLine).join("\n");
}
