# **Project Summary**

You want to build an **AI-assisted TTRPG Development IDE**—essentially **Cursor, but specialized for writing, maintaining, and expanding Tabletop Roleplaying Game rulebooks**.

The core idea:
The user keeps all rulebook content as **markdown files** in a project folder. The IDE uses an **API-connected LLM (OpenAI, Gemini, etc.)** that can read the entire folder, reason about it, and help the user develop the game.

---

## **High-Level Functional Description**

### **1. Project File System**

* The IDE displays and manages a folder containing **markdown files** (the rulebook chapters, mechanics, lore, etc.).
* The AI should be able to **index, search, and reference** all files simultaneously, similar to how Cursor maintains a project context.

### **2. AI Context Integration**

* The LLM receives:
  * The **current file** being edited
  * A **selectable subset** of files
  * Or **the entire markdown project** (within token limits)
* This allows the AI to understand the full system: mechanics, lore, balance, terminology, etc.

### **3. Assistant Capabilities**

The AI should be able to:

#### **(A) Answer questions**

* “Where does the combat system contradict itself?”
* “What page defines Exhaustion?”
* “How would you simplify encumbrance rules?”

#### **(B) Suggest revisions and edits**

* Improve clarity
* Improve game balance
* Fix contradictions
* Standardize terminology
* Rewrite rules for readability or style

#### **(C) Generate new content**

* Entire new mechanics
* New subsystems (magic, crafting, vehicles)
* Fully drafted chapters
* Stat blocks, tables, example scenarios
* Worldbuilding and lore generated in the user’s preferred style

#### **(D) Maintain coherence across the whole rulebook**

* Track terminology, tags, keywords
* Avoid contradictions
* Suggest integrations with existing mechanics
* Automatically update references (e.g., “See Chapter 3”)

---

### **4. IDE Features (Cursor-Inspired)**

Your IDE should support:
* **Chat panel** with the AI
* **File-level AI editing** (e.g., “Rewrite this file”)
* **Diff/patch previews** before accepting AI changes
* **Inline suggestions** (like GitHub Copilot)
* **Quick actions** such as:
  * “Add example”
  * “Rewrite for clarity”
  * “Balance this mechanic”
* **Project-wide search** (AI and regular)
* **Version management** (Git integration available)

---

### **5. Technical Requirements**

Below is a concise technical outline you can hand directly to a developer.

#### **Backend**

* Connect to one or more LLM APIs (OpenAI, Gemini, Claude, etc.).
* Provide endpoints for:
  * Embedding the entire project
  * Retrieving context chunks
  * Providing conversation + project context to the LLM
  * Generating AI edits and diffs

#### **Frontend / IDE**

* Sidebar file explorer for markdown files
* Markdown editor with diff view
* Chat panel where AI references project content
* Ability to select which files are part of the context
* Syntax highlighting specifically for RPG mechanics (tables, stat blocks, tags)

#### **UI / UX Requirements**

* The IDE uses **Dark Mode as the default and only built-in theme**.
* The default aesthetic is:
  * **Dark green background** (deep forest / muted emerald)
  * **Warm amber accent colors** for highlights, active elements, and UI chrome
  * **Soft off-white or warm beige text**
* No Light Mode is provided, but users can fully customize:
  * Background color
  * Accent color
  * Text color
* Theme settings should persist across sessions.
* UI should be minimalist and readable, with a focus on long-form text editing.
* All AI-generated diff views, chat panels, and sidebars must respect theme colors.

#### **Context Management**

* Use embeddings or RAG for larger projects
* For smaller projects, pass files directly into system/context prompts
* Allow the AI to request additional files when needed (like Cursor’s “missing context” behavior)

#### **Plugin/Extension Interface**

* Homebrew rule calculators
* Dice probability tools
* Stat block generators
* Playtest simulation helpers

#### **AI Provider Configuration (API Keys)**

> CodexLotus uses user-provided API keys for all AI interactions. During first launch and any time the user changes models or providers, the user can enter their API keys in the **Settings** panel, which is itself opened as a tab in the main workspace. Keys are stored securely using Tauri’s encrypted storage layer and are never transmitted except to the selected LLM provider during API calls.

---

### **6. Stretch Goals**

* “Lore Map” / “Mechanic Network Graph” visualization
* Built-in playtest simulation tool (NPC vs NPC, combat rounds)
* Procedural generation tools for bestiaries or settings
* Export to PDF/HTML
* Layout tools

---

### **7. One-Sentence Pitch (if you want one)**

> **An AI-powered IDE for creating and expanding TTRPG rulebooks—like Cursor, but purpose-built for mechanics, lore, and coherent system design across markdown files.**

---

# Plugin and Stretch Goal Details
## **1. Plugin / Extension Interface**

This refers to your IDE supporting **modular add-ons**—tools that extend the core system. Think “VS Code extensions,” but for TTRPG design.

You **do not** need this for launch, but it becomes powerful once your user base grows or once you want to keep the core app lightweight.

Below are the four plugin concepts, what they do, and why you might want them.

---

### **Homebrew Rule Calculators**

#### **What it does**

Automates math-heavy design tasks such as:
* XP → level curve calculators
* Ability score cost balance
* Encounter budget formulas
* Crafting time/economy estimators
* Damage-per-round calculators

#### **Why this is valuable**

* Many designers struggle with “design math.”
* Great for systems with tight balance: OSR, 5e-style, tactical RPGs.
* Reduces errors and speeds iteration dramatically.

---

### **Dice Probability Tools**

#### **What it does**

An interactive tool where you:
* Input a dice mechanic: `2d6+3 vs target number`
* It calculates probabilities, success curves, critical ranges, etc.

#### **Why this is valuable**

* Helps authors understand the shape of their game’s RNG.
* Avoids accidental “swingy” or “flat” mechanics.

---

### **Stat Block Generators**

#### **What it does**

* Auto-generates formatted stat blocks for monsters, NPCs, hazards.
* Could use AI to fill in descriptions, traits, abilities.
* Might include templates (e.g., “OSR-style,” “5e-like,” “Your own system”).

#### **Why this is valuable**

* Saves huge amounts of time.
* Keeps formatting consistent across the bestiary.

---

### **Playtest Simulation Helpers**

#### **What it does**

* Automates simple combat/math simulations to estimate:
  * Average damage
  * Time-to-defeat
  * Ability usefulness
  * Risk profiles

#### **Why this is valuable**

* Gives quantitative feedback on balance without needing live players.
* Important for crunchy combat systems.

---

## **2. Stretch Goals**

These are more advanced features that add “wow factor” but aren’t necessary for early versions.

---

### **“Lore Map” / “Mechanic Network Graph” Visualization**

#### **What it does**

* Automatically creates a visual graph that shows how concepts relate:
  * Mechanics interact with each other
  * Lore references locations, factions, characters
  * Systems depend on one another (e.g., “combat → initiative → stats → skills”)

#### **Why this is valuable**

* Amazing for large systems with many interlinked rules.
* Helps designers spot contradictions, redundancies, or missing links.

---

### **Built-in Playtest Simulation Tool (NPC vs NPC, Combat Rounds)**

#### **What it does**

Runs full combat simulations using the rules in the markdown files:
* AI-controlled NPC behavior
* Dice rolling
* Rule interpretation

#### **Why this is valuable**

* Removes tons of manual playtesting.
* Shows you “This monster is too strong at level 3” without human testers.
* Potentially the most powerful feature long-term.

---

### **Procedural Generation Tools (Bestiaries, Settings, Items)**

#### **What it does**

Uses AI to generate:
* Monster families
* Locations and regions
* Cultures and factions
* Magic items
* Entire settings

#### **Why this is valuable**

* Dramatically expands creative output.
* Helps solo creators build full worlds quickly.

---

# **MVP vs Long-Term Roadmap Recommendation**

## **Highly Recommended for MVP**
* Dice probability tools
* Basic stat block generator
* AI content generation (core feature)
* File-aware AI editing
* Context-aware chat

## **Nice-to-Have for MVP (If resources allow)**
* Simple homebrew rule calculators
* Light procedural generation tools

## **Post-MVP / Stretch Goals**
* Plugin system
* Advanced homebrew calculators
* Advanced procedural generators

## **Late-stage / Premium Features**
* Lore & mechanic graph visualization
* Full combat simulation engine
* Ecosystem of third-party extensions

---

Absolutely — here is a clean, professional **Tech Stack Brief** summarizing every architectural decision we made.
You can copy/paste this directly into **CodexLotus_DevGuide.md**.

---

# 🌒 **CodexLotus — Tech Stack Brief**

This document summarizes the core architectural decisions for the CodexLotus IDE.
It defines the technologies, rationale, and long-term implications for the project’s frontend, backend, state model, and AI infrastructure.

---

# 🟩 **1. Application Architecture Overview**

CodexLotus is a **desktop-first, AI-assisted TTRPG rulebook IDE**, combining:

* Cursor-like AI editing
* Markdown-based rulebook management
* Document-wide coherence checking
* Diff previews
* Project-wide RAG (Retrieval-Augmented Generation)
* Multi-pane layout (editor, preview, chat)

This design requires:

* Excellent performance
* Reliable local file operations
* Mature editor ecosystem
* Future plugin support
* AI streaming
* Strong text-processing capabilities

The stack below has been selected specifically to meet these demands.

---

# 🟦 **2. Platform & Framework Choices**

## **2.1 Desktop Shell: Tauri**

Tauri provides:

* Native performance (Rust backend + WebView frontend)
* Lightweight executable compared to Electron
* Secure APIs for filesystem and backend communication
* Fast startup time
* Perfect alignment with Rust-based AI/RAG indexing

Tauri is the foundation for the CodexLotus desktop experience.

---

# 🟧 **3. Frontend Technology**

## **3.1 React (Primary Frontend Framework)**

React was chosen due to:

* Mature ecosystem for developer tools
* Best-in-class integrations with:
  * Monaco Editor
  * Monaco Diff viewer
  * Markdown processors
  * Virtualized lists
* Abundant patterns for IDE-style UIs
* Long-term stability and community support

Performance concerns are mitigated through architecture choices and signals (below).

---

## **3.2 Jotai (Primary Application State Model)**

Jotai provides:

* Atomic, fine-grained reactivity
* Perfect fit for multi-pane IDE interfaces
* Clean global state without reducers or boilerplate
* Ideal for plugin architecture (plugins own their own atoms)
* Excellent integration with async workflows and derived state

Chosen for clarity, composability, and long-term maintainability.

---

## **3.3 React Query (Async & Network State)**

React Query handles:

* LLM API calls
* RAG pipeline operations
* Streaming responses
* Background indexing jobs
* Caching and invalidation
* Mutation patterns (save file, generate diffs, etc.)

This keeps async logic out of the global state system, improving separation of concerns.

---

## **3.4 Preact Signals (Localized High-Performance Reactivity)**

Signals are used *selectively* for UI subsystems that require extremely high-frequency updates, such as:

* Chat streaming
* Live preview updates
* Scroll/cursor synchronization
* Search input filters
* UI elements updating dozens of times per second

This provides highly responsive, fine-grained UI updates while seamlessly integrating into the existing React architecture.

---

## **3.5 Context API (Static Configuration Only)**

React Context is used exclusively for:

* Theme tokens
* App configuration
* Read-only dependencies

This prevents Context from becoming a bloated global store.

---

# 🟪 **4. Backend / Core Engine**

## **4.1 Rust Backend (Tauri Commands + AI Orchestration)**

Rust is the primary backend language for:

* File system indexing
* Full RAG pipeline
* Embedding generation
* Chunking and retrieval
* LLM provider orchestration
* Streaming
* Project graph analysis (future)
* Plugin runtime hooks

Rust delivers maximum performance, reliability, and future-proofing.

---

# 🟫 **5. AI Context & RAG Layer**

## **5.1 Local Embedding Storage: SQLite + sqlite-vss**

Chosen as the optimal vector store for a desktop-first IDE.

Benefits:

* Zero configuration
* Very fast local queries
* Lightweight and embedded
* Perfect for single-user RAG
* Works directly with Rust via mature crates
* No external dependencies

This ensures a lightweight, reliable, and fully self-contained vector storage solution suited to a desktop-first application.

---

# 🟨 **6. Editor & UI Components**

CodexLotus will integrate React-friendly, battle-tested components:

* **Monaco Editor** (primary editor for all markdown and rulebook editing)
* **Monaco Diff Viewer** for AI-generated patch previews
* **Markdown rendering toolchain (remark/rehype)** with AST customization
* **Virtualized lists** for file explorer, search results, and large rule collections

Markdown rendering will use the remark/rehype toolchain, enabling custom plugins for TTRPG-specific syntax (stat blocks, tables, mechanics tags).

These components align perfectly with React’s ecosystem and support CodexLotus’s IDE-like interface requirements.

## **6.1 Unified Tabbed Workspace for Tools and Documents**

All major tools in CodexLotus open **inside the main application shell** using the *same* tab strip used for Markdown files. This includes:

* Rule Builder
* Stat Block Designer
* Dice & Probability Tools
* Procedural Generators
* Settings Panel
* Any future plugin-based tool

Rather than opening in separate windows or modal overlays, tools appear as **first-class tabs**, consistent with how documents behave. This provides a unified, IDE-like experience and reinforces CodexLotus as a professional creative environment rather than a collection of disconnected utilities.

### **Benefits of the Tabbed Workspace**

**✔ Consistent navigation**
Users access everything — markdown chapters, tools, previews, generators — from the same horizontal tab bar.

**✔ Minimizes cognitive load**
No pop-ups or window juggling. Tools feel like part of the writing-and-design workflow.

**✔ Supports advanced workflows**
Multiple tools can be opened alongside documents:
e.g., Stat Block Editor + the chapter it belongs to + a Dice Probability panel.

**✔ Familiar and industry-standard**
This matches interface patterns used by:
* Cursor
* VS Code
* IntelliJ
* Godot
* Unity
* JetBrains Rider

These tools demonstrate that a tab-centric approach increases usability and reduces friction.

**✔ Cleanly supports future extensions**
Because tools are just internal panels rendered as tabs, plugins can register new tool panels without altering the app shell’s layout or navigation model.

### **How Tools Are Implemented**

Each tool is registered as a “workspace view,” which includes:

* A React component (rendered inside the tab)
* Its own Jotai atom state scope
* Optional Tauri backend endpoints
* A unique tab label and icon
* Optional context-saving (restores last-opened tool state)

This ensures every tool behaves consistently while remaining internally modular.

---

# 🟩 **7. Theming & Design Token Integration**

The UI uses CodexLotus’s unique aesthetic, driven by a centralized token system:

* Dark-green forest backgrounds
* Warm amber accents
* Neutral off-white text
* Soft shadows and rounded panels

Implementation details:

* Global CSS variables generated from design tokens
* Token-driven style system (via Vanilla Extract)
* Theme applied consistently across:
  * Chat
  * Editors
  * Panels
  * Diff views
  * Sidebar
  * Tabs

Vanilla Extract is used as the styling framework to ensure type-safe, token-driven design across all components.

No light mode is included by default; users may customize colors.

---

# 🟫 **8. Plugin Ecosystem Considerations**

The selected tech stack enables a future plugin architecture:

* Plugins define their own state via Jotai atoms
* Communication with backend via Tauri commands
* Extensibility for:
  * Dice calculators
  * Stat block generators
  * Probability analysis tools
  * Playtest simulation engines
  * Procedural content generation

The combination of Rust backend + React/Jotai frontend is well-suited to modular extension.

---

# 🌔 **9. Summary of Final Stack**

### **Desktop Shell**

* **Tauri**

### **Frontend / UI**

* **React**
* **Jotai** (global application state)
* **React Query** (async + streaming)
* **Preact Signals (localized high-frequency UI state)**
* **React Context (static, read-only config)**

### **Editor Components**

* **Monaco Editor** (primary editor)
* **Monaco Diff viewer** for patch previews
* **Markdown toolchain (remark/rehype)** for previews and transformations

### **Backend**

* **Rust (Tauri commands)**
* **Rust for RAG pipeline, embeddings, retrieval, file ops**

### **Vector Storage**

* **SQLite + sqlite-vss**

### **Theming**

* Vanilla Extract for Token-driven theme system
* CSS variables
* Dark mode only, user-customizable

### **Plugin Architecture**

* Atom-based state isolation
* Rust backend extensible commands
* React component injection points

---

# 🌕 **This tech stack is built for:**

✔ High performance
✔ Long-term maintainability
✔ Future plugin ecosystem
✔ AI-heavy workflows
✔ Rich text editing
✔ Desktop-native speed
✔ Strong developer ergonomics
✔ Maximum extensibility

---

# 🌘 **CodexLotus — Master Token JSON**

### *(Tokens Studio Grouped Structure; Single Theme; Dark Mode)*

```json
{
  "color": {
    "core": {
      "lotusInk": { "value": "#0B1C17" },
      "lotusDeep": { "value": "#102821" },
      "lotusLeaf": { "value": "#1E4638" },
      "amber": { "value": "#D6AA3D" },
      "amberBright": { "value": "#F5C96A" },
      "neutral100": { "value": "#FFFFFF" },
      "neutral90": { "value": "#E6E6E6" },
      "neutral80": { "value": "#CCCCCC" },
      "neutral60": { "value": "#999999" },
      "neutral40": { "value": "#666666" },
      "neutral20": { "value": "#333333" },
      "neutral0": { "value": "#000000" }
    },
    "background": {
      "base": { "value": "{color.core.lotusInk}" },
      "panel": { "value": "{color.core.lotusDeep}" },
      "panelRaised": { "value": "{color.core.lotusLeaf}" },
      "toolbar": { "value": "{color.core.lotusDeep}" },
      "editor": { "value": "{color.core.lotusInk}" },
      "sidebar": { "value": "{color.core.lotusDeep}" },
      "tabActive": { "value": "{color.core.lotusLeaf}" },
      "tabInactive": { "value": "{color.core.lotusDeep}" },
      "overlay": { "value": "rgba(0,0,0,0.5)" }
    },
    "text": {
      "primary": { "value": "{color.core.neutral100}" },
      "secondary": { "value": "{color.core.neutral80}" },
      "muted": { "value": "{color.core.neutral60}" },
      "disabled": { "value": "{color.core.neutral40}" },
      "accent": { "value": "{color.core.amberBright}" },
      "inverse": { "value": "{color.core.neutral0}" }
    },
    "border": {
      "subtle": { "value": "rgba(255,255,255,0.06)" },
      "strong": { "value": "rgba(255,255,255,0.15)" },
      "accent": { "value": "{color.core.amber}" }
    },
    "accent": {
      "primary": { "value": "{color.core.amber}" },
      "primaryBright": { "value": "{color.core.amberBright}" },
      "highlight": { "value": "#F0D68A" }
    },
    "state": {
      "success": { "value": "#2F9E44" },
      "warning": { "value": "#E67700" },
      "danger": { "value": "#C92A2A" },
      "info": { "value": "#4DABF7" }
    }
  },

  "typography": {
    "fontFamily": {
      "display": { "value": "Inter, sans-serif" },
      "body": { "value": "Inter, sans-serif" },
      "mono": { "value": "JetBrains Mono, monospace" }
    },
    "fontSize": {
      "xs": { "value": "12px" },
      "sm": { "value": "14px" },
      "md": { "value": "16px" },
      "lg": { "value": "20px" },
      "xl": { "value": "24px" },
      "2xl": { "value": "32px" },
      "3xl": { "value": "40px" }
    },
    "lineHeight": {
      "tight": { "value": "1.1" },
      "snug": { "value": "1.2" },
      "normal": { "value": "1.4" },
      "relaxed": { "value": "1.6" }
    },
    "fontWeight": {
      "regular": { "value": "400" },
      "medium": { "value": "500" },
      "semibold": { "value": "600" },
      "bold": { "value": "700" }
    }
  },

  "spacing": {
    "none": { "value": "0px" },
    "2xs": { "value": "2px" },
    "xs": { "value": "4px" },
    "sm": { "value": "8px" },
    "md": { "value": "12px" },
    "lg": { "value": "16px" },
    "xl": { "value": "24px" },
    "2xl": { "value": "32px" },
    "3xl": { "value": "48px" }
  },

  "radius": {
    "none": { "value": "0px" },
    "sm": { "value": "4px" },
    "md": { "value": "8px" },
    "lg": { "value": "12px" },
    "xl": { "value": "16px" },
    "full": { "value": "999px" }
  },

  "shadow": {
    "sm": { "value": "0px 1px 2px rgba(0,0,0,0.4)" },
    "md": { "value": "0px 3px 6px rgba(0,0,0,0.45)" },
    "lg": { "value": "0px 6px 12px rgba(0,0,0,0.5)" }
  },

  "component": {
    "button": {
      "background": { "value": "{color.accent.primary}" },
      "backgroundHover": { "value": "{color.accent.primaryBright}" },
      "text": { "value": "{color.text.inverse}" },
      "radius": { "value": "{radius.md}" },
      "paddingX": { "value": "{spacing.md}" },
      "paddingY": { "value": "{spacing.sm}" }
    },
    "input": {
      "background": { "value": "{color.background.panelRaised}" },
      "border": { "value": "{color.border.subtle}" },
      "text": { "value": "{color.text.primary}" },
      "placeholder": { "value": "{color.text.muted}" },
      "radius": { "value": "{radius.sm}" },
      "paddingX": { "value": "{spacing.md}" },
      "paddingY": { "value": "{spacing.sm}" }
    },
    "panel": {
      "background": { "value": "{color.background.panel}" },
      "border": { "value": "{color.border.subtle}" },
      "radius": { "value": "{radius.lg}" }
    },
    "tab": {
      "activeBackground": { "value": "{color.background.tabActive}" },
      "inactiveBackground": { "value": "{color.background.tabInactive}" },
      "textActive": { "value": "{color.text.primary}" },
      "textInactive": { "value": "{color.text.muted}" }
    }
  }
}
```