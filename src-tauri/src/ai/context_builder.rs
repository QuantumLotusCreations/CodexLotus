use crate::db::embeddings::ScoredChunk;

pub struct ContextBuilder {
    context_chunks: Vec<ScoredChunk>,
    templates: Vec<String>,
}

impl ContextBuilder {
  pub fn new() -> Self {
    Self {
        context_chunks: Vec::new(),
        templates: Vec::new(),
    }
  }

  pub fn with_context(mut self, chunks: Vec<ScoredChunk>) -> Self {
    self.context_chunks = chunks;
    self
  }

  pub fn with_templates(mut self, templates: Vec<String>) -> Self {
    self.templates = templates;
    self
  }

  /// Build system context string (templates + file contents) for multi-turn conversations
  pub fn build_system_context(&self) -> String {
    let mut context_str = String::new();
    
    // File editing instructions
    context_str.push_str(r#"You are an AI assistant for CodexLotus, a TTRPG rulebook editor.

## File Editing Capability
When the user asks you to edit, update, modify, or change a file, you MUST output the complete updated file content using this exact format:

<file_edit path="FILENAME.md">
... complete updated file content here ...
</file_edit>

IMPORTANT RULES FOR FILE EDITS:
- The path should be the relative path shown in the context (e.g., "chapter-3.md", "rules/combat.md")
- Include the COMPLETE file content, not just the changed parts
- Do NOT wrap the content in markdown code fences inside the file_edit tags
- After the file_edit block, briefly explain what you changed

Example:
User: "Add a section about flanking to combat.md"
Assistant: <file_edit path="combat.md">
# Combat Rules

## Basic Combat
[existing content...]

## Flanking
When two allies are on opposite sides of an enemy, they gain +2 to attack rolls against that enemy.
</file_edit>

I've added a new "Flanking" section that grants +2 to attack rolls when allies are positioned on opposite sides of an enemy.

---

"#);
    
    if !self.templates.is_empty() {
        context_str.push_str("Available Table Templates (Schemas):\n");
        for tmpl in &self.templates {
             context_str.push_str(tmpl);
             context_str.push_str("\n\n");
        }
        context_str.push_str("If the user asks to generate an item/statblock using a specific template, output valid YAML inside a ```codex block that adheres to the schema. Set the 'template' field to the template ID.\n\n");
    }

    if !self.context_chunks.is_empty() {
        context_str.push_str("Project files for reference:\n\n");
        for chunk in &self.context_chunks {
            context_str.push_str(&format!("--- BEGIN FILE: {} ---\n", chunk.relative_path));
            context_str.push_str(&chunk.content);
            context_str.push_str(&format!("\n--- END FILE: {} ---\n\n", chunk.relative_path));
        }
    }

    context_str
  }

  pub fn build_prompt(&self, user_prompt: &str) -> String {
    let mut context_str = String::new();
    
    if !self.templates.is_empty() {
        context_str.push_str("Available Table Templates (Schemas):\n");
        for tmpl in &self.templates {
             context_str.push_str(tmpl);
             context_str.push_str("\n\n");
        }
        context_str.push_str("If the user asks to generate an item/statblock using a specific template, output valid YAML inside a ```codex block that adheres to the schema. Set the 'template' field to the template ID.\n\n");
    }

    if !self.context_chunks.is_empty() {
        context_str.push_str("Use the following project context to answer the user's question. References to 'file' or 'chapter' usually refer to these snippets:\n\n");
        for chunk in &self.context_chunks {
            context_str.push_str(&format!("--- BEGIN FILE: {} ---\n", chunk.relative_path));
            context_str.push_str(&chunk.content);
            context_str.push_str(&format!("\n--- END FILE: {} ---\n\n", chunk.relative_path));
        }
        context_str.push_str("---\n\n");
    }

    format!("{}{}", context_str, user_prompt)
  }
}
