import { ExportOptions } from "../../app/state/atoms/exportAtoms";
import { createMarkdownProcessor } from "../markdown/pipeline";
import { save } from "@tauri-apps/api/dialog";
import { writeTextFile } from "@tauri-apps/api/fs";

// Helper to gather all current styles from the document
function getAllStyles(): string {
  const styleSheets = Array.from(document.styleSheets);
  let css = "";

  styleSheets.forEach((sheet) => {
    try {
      const rules = Array.from(sheet.cssRules);
      rules.forEach((rule) => {
        css += rule.cssText + "\n";
      });
    } catch (e) {
      console.warn("Could not read stylesheet rules", e);
    }
  });
  
  return css;
}

// Generate the full HTML document
async function generateHtmlDocument(content: string, options: ExportOptions): Promise<string> {
  // Convert Markdown to HTML
  // Note: If we want to support different colors, we should pass them to the processor
  // or inject them as CSS variables.
  const processor = createMarkdownProcessor({
      // We can pass basic colors here for statblocks if needed, 
      // but overriding via CSS variables is better for global theming.
      bgColor: options.theme === 'custom' ? options.customColors?.background : undefined,
      fontColor: options.theme === 'custom' ? options.customColors?.text : undefined
  });
  
  const file = await processor.process(content);
  const bodyHtml = String(file);

  const styles = getAllStyles();

  // Custom Theme Overrides
  let customStyle = "";
  if (options.theme === "print") {
      customStyle = `
        body { background-color: white !important; color: black !important; }
        .markdown-body { color: black !important; background-color: white !important; }
        a { color: black !important; text-decoration: underline; }
        /* Force statblocks to be B&W compliant if needed, or keep them as is */
        .c-statblock { background-color: #fff !important; border: 1px solid #000 !important; color: #000 !important; }
        .c-statblock__name, .c-statblock__section-header { color: #000 !important; }
      `;
  } else if (options.theme === "custom" && options.customColors) {
      const { background, text, accent } = options.customColors;
      customStyle = `
        body { background-color: ${background} !important; color: ${text} !important; }
        .markdown-body { color: ${text} !important; background-color: ${background} !important; }
        h1, h2, h3, h4, h5, h6 { color: ${accent} !important; }
        a { color: ${accent} !important; }
        .c-statblock { background-color: ${background} !important; border-color: ${accent} !important; color: ${text} !important; }
        .c-statblock__name, .c-statblock__section-header { color: ${accent} !important; }
      `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Codex Export</title>
    <style>
      ${styles}
      
      /* Print Specific Fixes */
      @media print {
          @page { margin: 2cm; }
          body { -webkit-print-color-adjust: exact; }
      }
      
      /* Export Container Overrides */
      body {
          padding: 40px;
          max-width: 100%;
          margin: 0 auto;
          overflow: visible !important;
          height: auto !important;
      }
      
      ${customStyle}
    </style>
</head>
<body class="markdown-body">
    ${bodyHtml}
</body>
</html>`;
}

export async function handleExport(content: string, options: ExportOptions) {
  const html = await generateHtmlDocument(content, options);

  if (options.format === "html") {
    // Save to file
    try {
        const filePath = await save({
            filters: [{ name: 'HTML', extensions: ['html'] }]
        });
        
        if (filePath) {
            await writeTextFile(filePath, html);
            return true; // Success
        }
    } catch (e) {
        console.error("Failed to save HTML", e);
        throw e;
    }
  } else if (options.format === "pdf") {
    // Print window strategy
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for resources to load then print
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            // Optional: printWindow.close(); // Don't auto close so user can see result if print fails
        };
        return true;
    } else {
        throw new Error("Could not open print window. Please check popup blockers.");
    }
  }
  return false;
}

