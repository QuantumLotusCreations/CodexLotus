# CodexLotus 🌒

**An AI-powered IDE for creating and expanding TTRPG rulebooks—like Cursor, but purpose-built for mechanics, lore, and coherent system design.**

CodexLotus is a desktop-first application that helps game designers write, maintain, and expand Tabletop Roleplaying Game rulebooks. It combines a markdown-based editor with an API-connected LLM that understands your entire project context, allowing for coherent generation of mechanics, lore, and stat blocks.

---

## 🚀 Key Features

### 📝 AI-Assisted Rulebook Editor
- **Context-Aware AI**: The built-in assistant indexes your entire project (mechanics, lore, chapters) to provide accurate suggestions and answer complex questions about your game system.
- **Markdown First**: Write in standard Markdown with TTRPG-specific syntax highlighting and preview.
- **Diff Views**: Review AI-suggested changes with a clear diff/patch interface before accepting them.

### 🛠️ Integrated Design Tools
CodexLotus includes a suite of specialized tools running as tabs within the IDE:
- **Dice Probability**: Visualize success curves and probability distributions for your custom mechanics.
- **Stat Block Designer**: Create and manage consistent stat blocks for monsters and NPCs.
- **Rule Calculators**: Automate math for XP curves, encounter balancing, and economy.
- **Procedural Generation**: Generate content like bestiaries, items, and locations.
- **Lore Map**: (Experimental) Visualize relationships between game concepts and lore elements.

### 🎨 Designed for Focus
- **Immersive UI**: A "Deep Forest" dark theme with warm amber accents, designed for long writing sessions.
- **Unified Workspace**: All tools live in a tabbed interface—no window juggling required.

---

## 🏗️ Tech Stack

CodexLotus is built on a high-performance, modern stack:

- **Core**: [Tauri](https://tauri.app/) (Rust backend + Web frontend) for native performance and secure file access.
- **Frontend**:
  - **Framework**: React + TypeScript + Vite
  - **State**: Jotai (Global), React Query (Async/Network), Preact Signals (High-freq UI)
  - **Styling**: Vanilla Extract (Type-safe CSS-in-JS)
  - **Editor**: Monaco Editor (VS Code's editor engine)
- **Backend (Rust)**:
  - **AI/RAG**: Custom Rust implementation for file indexing, embeddings, and LLM orchestration.
  - **Database**: SQLite for local vector storage.
  - **LLM Providers**: Supports OpenAI, Gemini, and other API-compatible providers.

---

## ⚡ Getting Started

## 🏃‍♂️ Portable Version
A portable `CodexLotus.exe` is available in this repository for easy access. You can run this executable directly to use the application without setting up a development environment.

---

## Build it Yourself

### Prerequisites
- **Node.js** (v18+ recommended)
- **Rust** (latest stable)
- **VS Code** (recommended for development) with `rust-analyzer` and `Tauri` extensions.

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CodexLotus
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install Rust dependencies**
   (This happens automatically during the first build, but you can ensure your environment is ready)
   ```bash
   # Ensure you have the Tauri CLI installed globally or use npx
   npm install -g @tauri-apps/cli
   ```

### Running Development Server

To start the app in development mode (with hot reloading for both frontend and backend):

```bash
npm run tauri:dev
```

This command will:
1. Start the Vite dev server.
2. Compile the Rust backend.
3. Launch the CodexLotus application window.

### Building for Production

To build the optimized executable/installer for your OS:

```bash
npm run tauri:build
```

The output will be located in `src-tauri/target/release/bundle/`.

---

## 📂 Project Structure

```
CodexLotus/
├── src/                  # React Frontend
│   ├── app/              # Main UI shell and feature components
│   ├── assets/           # Static assets (icons, images)
│   ├── lib/              # Utilities (Markdown pipeline, API clients)
│   └── theme/            # Design tokens and global styles
├── src-tauri/            # Rust Backend
│   ├── src/              # Core Rust logic (AI, Commands, DB)
│   ├── build.rs          # Build scripts
│   └── tauri.conf.json   # Tauri configuration
├── docs/                 # Developer documentation
└── CodexLotus_DevGuide.md # Detailed project philosophy and guide
```

## 📖 Documentation

For a deep dive into the project's philosophy, architecture, and feature breakdown, please read the **[CodexLotus Developer Guide](./CodexLotus_DevGuide.md)**.

Additional documentation can be found in the `src/docs/` directory.

---

## 🤝 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

