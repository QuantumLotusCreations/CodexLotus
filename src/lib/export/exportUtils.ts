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
  const rootStyles = document.documentElement.getAttribute("style") || "";
  const rootClass = document.documentElement.className || "";

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
  } else if (options.theme === "screen") {
      // Capture current computed styles to ensure they persist in print
      const computedBody = window.getComputedStyle(document.body);
      let bg = computedBody.backgroundColor;
      const color = computedBody.color;
      
      // Fallback if background is transparent
      if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") {
          const computedRoot = window.getComputedStyle(document.documentElement);
          bg = computedRoot.backgroundColor;
      }
      
      customStyle = `
        /* Force background on everything possible */
        html, body {
            background-color: ${bg} !important;
            color: ${color} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        /* Ensure markdown body also inherits */
        .markdown-body { 
            background-color: ${bg} !important; 
            color: ${color} !important; 
        }

        /* Specific fix for code blocks you mentioned were working - ensuring they don't conflict */
        pre, code, .c-statblock {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        @media print {
            html, body {
                background-color: ${bg} !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            /* Attempt to color the page canvas itself */
            @page {
                margin: 0; /* Removing margin sometimes helps cover the white */
                background-color: ${bg} !important; 
            }
        }
      `;
  }

  return `<!DOCTYPE html>
<html lang="en" class="${rootClass}" style="${rootStyles}">
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
    // Hidden Iframe Strategy (Better for Electron/Tauri)
    // Create an iframe to hold the content
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '0'; // Hide it visually but keep it in DOM
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        
        // Wait for load
        iframe.onload = () => {
            setTimeout(() => {
                if (iframe.contentWindow) {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    
                    // Remove iframe after print dialog closes (or after delay)
                    // Since we can't reliably detect print close, we leave it or remove after long delay.
                    // However, removing it too early breaks printing in some browsers.
                    // A safe bet is to remove it on next export or after a long timeout.
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                    }, 60000 * 5); // 5 minutes cleanup
                }
            }, 500);
        };
        return true;
    } else {
        throw new Error("Could not create print frame.");
    }
  }
  return false;
}

