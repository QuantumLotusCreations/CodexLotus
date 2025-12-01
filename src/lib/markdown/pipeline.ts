import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive"; // Import directives support
import { ttrpgExtensions } from "./ttrpgExtensions";
import { layoutExtensions } from "./layoutExtensions"; // Import our new handler

import { TtrpgOptions } from "./ttrpgExtensions";

export function createMarkdownProcessor(options: TtrpgOptions = {}) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective) // Enable ::: syntax
    .use(layoutExtensions) // Handle the directives
    .use(ttrpgExtensions, options)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify);
}
