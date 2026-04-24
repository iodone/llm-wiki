# LLM Wiki

Agent-native persistent knowledge management — compile knowledge once, query forever.

Based on [Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

---

## What is this?

LLM Wiki is a **CLI tool + AI Agent skill system** that maintains an evolving, interconnected Markdown knowledge base. Instead of traditional RAG (re-deriving answers from raw documents each time), LLM Wiki **compiles** knowledge into structured wiki pages that AI agents maintain and grow over time.

**Key principle:** The tool itself doesn't call LLMs. It provides skill files that let any AI agent (Claude Code, Alma/Codex, etc.) operate the wiki. Obsidian is the human interface — no self-built GUI.

---

## Installation

### Option 1: npm (Global Install)

```bash
npm install -g @jackwener/llm-wiki
```

After installation, `llm-wiki` will be available in your PATH.

### Option 2: Direct Execution (No Install)

Clone the repo and build:

```bash
git clone https://github.com/iodone/llm-wiki.git
cd llm-wiki
npm install
npm run build
```

Then run directly:

```bash
./dist/cli.js init my-wiki
./dist/cli.js status
```

Or symlink to your PATH:

```bash
ln -s $(pwd)/dist/cli.js /usr/local/bin/llm-wiki
```

---

## Quick Start

### 1. Initialize a wiki vault

```bash
mkdir my-wiki && cd my-wiki
llm-wiki init
```

This creates:
- `wiki/` directory with metadata files (wiki-purpose.md, wiki-schema.md, wiki-agent.md, wiki-log.md)
- `wiki/pages/` for wiki content (Crystal layer)
- `sources/` for raw input documents (immutable)
- `.llm-wiki/config.toml` for configuration

**Note:** `llm-wiki init` does NOT generate `AGENTS.md` or `CLAUDE.md` — those are project-level files, not wiki-level. The wiki vault is self-contained in `wiki/`.

### 2. Install the skill for your AI agent

```bash
# For Alma/Codex (default)
llm-wiki skill install

# For Claude Code only
llm-wiki skill install --claude

# For both
llm-wiki skill install --claude --codex
```

This installs the llm-wiki skill to:
- `.agents/skills/llm-wiki/SKILL.md` (Alma/Codex)
- `.claude/skills/llm-wiki/SKILL.md` (Claude Code)

### 3. Use your AI agent

Now use your AI agent (Alma, Claude Code, etc.) with the wiki:

```bash
/ingest sources/some-article.md   # Compile raw docs into wiki pages
/query "What do we know about X?" # Search and synthesize knowledge
/lint                             # Health check: broken links, orphans, contradictions
/research "deep dive on Y"        # Internet research → save to sources/ → ingest
```

The skill file (`.agents/skills/llm-wiki/SKILL.md`) contains the full playbook for these operations.

---

## Vault Structure

```
my-wiki/
├── wiki/                          # Wiki vault (self-contained)
│   ├── pages/                     # Wiki pages (Crystal layer, LLM-maintained)
│   ├── wiki-purpose.md            # Wiki scope and audience
│   ├── wiki-schema.md             # Page naming conventions, frontmatter rules
│   ├── wiki-agent.md              # Agent behavioral rules (customizable)
│   └── wiki-log.md                # Append-only operation log
├── sources/                       # Raw, immutable source documents
│   └── YYYY-MM-DD/                # Date-based storage (optional)
├── .llm-wiki/
│   ├── config.toml                # Vault configuration
│   └── sync-state.json            # Incremental sync tracking (auto-generated)
├── .agents/
│   └── skills/
│       └── llm-wiki/
│           └── SKILL.md           # Skill file for Alma/Codex
└── .claude/
    └── skills/
        └── llm-wiki/
            └── SKILL.md           # Skill file for Claude Code
```

### Key Design Decisions

1. **Self-contained wiki vault**: All wiki metadata files (`wiki-*.md`) live inside `wiki/`, not at the project root. This keeps the vault modular and portable.

2. **No project-level files generated**: `llm-wiki init` does NOT create `AGENTS.md` or `CLAUDE.md`. Those are project protocol files, managed by the project, not the wiki tool.

3. **Skill directory structure**: Skills are installed to `<name>/SKILL.md` (e.g., `.agents/skills/llm-wiki/SKILL.md`), not flat files like `llm-wiki.md`. This aligns with Alma's standard skill structure.

4. **Configurable paths**: Use `.llm-wiki/config.toml` to customize:
   ```toml
   [vault]
   name = "My Wiki"
   language = "en"
   source_dir = "sources"    # Optional: customize input directory
   wiki_dir = "wiki"          # Optional: customize wiki root
   pages_subdir = "pages"     # Optional: wiki pages in wiki/pages/
   ```

---

## Configuration

### Customize Source Directory

If your project uses `raw/` instead of `sources/`:

```toml
# .llm-wiki/config.toml
[vault]
name = "My Wiki"
language = "zh"
source_dir = "raw"         # Use raw/ instead of sources/
wiki_dir = "wiki"
pages_subdir = "pages"
```

### Customize Wiki Agent Behavior

Edit `wiki/wiki-agent.md` to override default behavior:
- Auto-ingest criteria (MUST capture, MAY capture, NEVER capture)
- Agent identity (e.g., "I am Alma for Meta42" instead of generic wiki agent)
- Security gates (e.g., Owner-only write permission)

See `wiki/wiki-agent.md` template after running `llm-wiki init`.

---

## Operations

### `/ingest <path>`

Compile raw source documents into structured wiki pages.

**Four-stage loop:**
1. **Map Relations**: Check `sources/` and `wiki/` for existing related content
2. **Entropy Check**: Is this content worth capturing? Does it reduce contradictions?
3. **Execute & Index**: Create/update wiki pages, update `wiki-log.md`, run `llm-wiki sync`
4. **Verify & Feedback**: Run `/lint` to check for broken links, orphans, contradictions

**Example:**
```bash
/ingest sources/2024-12-01/architecture-discussion.md
```

### `/query <question>`

Semantic search across the wiki + synthesize an answer. If the query reveals new insights, write them back to the wiki (knowledge compounding).

**Example:**
```bash
/query "What are the key differences between Snowflake and Databricks?"
```

### `/lint`

Health check:
- Broken wikilinks
- Orphaned pages (no incoming links)
- Contradicting information
- Outdated content

Auto-fixes safe issues, reports others for human decision.

### `/research <topic>`

Agent conducts internet research, saves findings to `sources/`, then runs `/ingest`.

**Example:**
```bash
/research "Apache Doris query optimizer internals"
```

---

## CLI Commands

### `llm-wiki init [directory]`

Initialize a new wiki vault.

```bash
llm-wiki init                # Initialize in current directory
llm-wiki init my-wiki        # Initialize in my-wiki/
```

### `llm-wiki status`

Show vault statistics:
- Number of wiki pages
- Number of source documents
- Number of wikilinks
- Last sync time
- Health status

### `llm-wiki search <query>`

BM25 keyword search (+ vector search if DB9 configured).

```bash
llm-wiki search "distributed consensus"
```

### `llm-wiki graph`

Analyze wiki topology:
- Communities (clusters of related pages)
- Hubs (highly connected pages)
- Orphans (pages with no incoming links)
- Wanted pages (linked but not yet created)

### `llm-wiki sync`

Update search index and metadata.

**Automatically called after every `/ingest`, `/query`, `/lint` operation.** You rarely need to run this manually.

```bash
llm-wiki sync              # Incremental sync (fast)
llm-wiki sync --full       # Full rebuild (slow, for troubleshooting)
```

### `llm-wiki skill install`

Install/upgrade skill files to AI agent workspace.

```bash
llm-wiki skill install              # Install to both .claude/ and .agents/
llm-wiki skill install --claude     # Install to .claude/skills/ only
llm-wiki skill install --codex      # Install to .agents/skills/ only
llm-wiki skill install --dir ~/work/my-project  # Custom workspace directory
```

### `llm-wiki skill list`

List all available skills bundled with llm-wiki.

### `llm-wiki skill show <name>`

Print skill content to stdout.

```bash
llm-wiki skill show llm-wiki
```

---

## Integration with Projects

### Example: system-weaver

The `system-weaver` project uses llm-wiki with this structure:

```
system-weaver/
├── AGENTS.md                      # Project protocol (references wiki/wiki-agent.md)
├── wiki/                          # Wiki vault
│   ├── pages/                     # Crystal layer (structured knowledge)
│   ├── wiki-agent.md              # Wiki-specific behavior (Identity: Alma for Meta42)
│   ├── wiki-purpose.md
│   ├── wiki-schema.md
│   └── wiki-log.md
├── raw/                           # Input layer
│   ├── log/                       # Trace layer (raw conversations)
│   ├── clippings/                 # External materials
│   └── research/                  # Unit layer (deep analysis)
├── .llm-wiki/
│   └── config.toml                # source_dir = "raw", wiki_dir = "wiki"
└── .agents/
    └── skills/
        └── llm-wiki/
            └── SKILL.md
```

**Three-layer memory model:**
- **Trace** (`raw/log/`) — Raw conversations, preserve all facts
- **Unit** (`raw/research/`) — Deep analysis, reusable insights
- **Crystal** (`wiki/pages/`) — Structured knowledge graph, LLM-maintained

**Four-stage reasoning loop:**
1. Map Relations → 2. Entropy Check → 3. Execute & Index → 4. Verify & Feedback

See `system-weaver/AGENTS.md` for the full workflow.

---

## Philosophy

### Structure Before Implementation

LLM Wiki follows the principle: **structure first, content later**.

1. **Map Relations**: Before writing anything, understand the existing topology (what pages exist, how they're linked).
2. **Entropy Check**: Will this new content reduce contradictions and increase cross-validation?
3. **Execute & Index**: Write the content AND update the index (wiki-log.md, wiki/index.md) atomically.
4. **Verify & Feedback**: Run `/lint` to ensure the structure is still sound.

### Tool Generates, Protocols Reference

- **llm-wiki** generates the wiki vault structure (wiki/, sources/, .llm-wiki/).
- **Projects** (like system-weaver) reference the wiki via `AGENTS.md → wiki/wiki-agent.md`.
- **Skills** are installed separately via `llm-wiki skill install`, not bundled with `init`.

### Low-Entropy Design

- Wiki vault is **self-contained** in `wiki/` (can be opened in Obsidian directly).
- Source documents are **immutable** (append-only, never edited).
- All edits happen in `wiki/pages/`, tracked in `wiki-log.md`.
- Real-time topology consistency via index files (`wiki/index.md`, `raw/*/index.md`).

---

## Advanced

### Vector Search (Optional)

Configure DB9 connection in `.llm-wiki/config.toml`:

```toml
[db9]
url = "your-db9-connection-string"
```

Then `llm-wiki sync` will push embeddings to DB9 for semantic search.

### Custom Frontmatter

Edit `wiki/wiki-schema.md` to define your frontmatter conventions:

```yaml
---
title: Page Title
description: One-line summary
tags: [concept, architecture]
sources: [raw/research/2024-12-01-design-doc.md]
created: 2024-12-01
updated: 2024-12-05
---
```

### Subdirectories in wiki/

You can organize wiki pages in subdirectories:

```
wiki/pages/
├── concepts/
│   ├── distributed-consensus.md
│   └── raft-algorithm.md
├── systems/
│   ├── kafka.md
│   └── flink.md
└── index.md
```

Update `wiki/wiki-schema.md` to document your taxonomy.

---

## Troubleshooting

### `llm-wiki: command not found`

If installed via npm globally but not in PATH:

```bash
# Find where npm installs global packages
npm config get prefix

# Add to PATH (e.g., in ~/.zshrc or ~/.bashrc)
export PATH="$(npm config get prefix)/bin:$PATH"
```

If using direct execution:

```bash
ln -s /path/to/llm-wiki/dist/cli.js /usr/local/bin/llm-wiki
```

### Skill file not loading

Make sure the skill file exists:

```bash
ls .agents/skills/llm-wiki/SKILL.md
```

If missing, reinstall:

```bash
llm-wiki skill install
```

### Sync state issues

If `llm-wiki sync` behaves strangely:

```bash
rm .llm-wiki/sync-state.json
llm-wiki sync --full
```

---

## Contributing

PRs welcome! This project follows:
- **Structure before implementation** — design the API and data model first
- **Low-entropy code** — clean, functional, minimal side effects
- **Tool responsibility** — llm-wiki generates wiki vaults, doesn't manage project files

---

## License

MIT

---

## Credits

- Inspired by [Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- Built for [Alma](https://github.com/soul-codes/alma) and Claude Code workflows
- Maintained by [@iodone](https://github.com/iodone)

---

## Related Projects

- [Obsidian](https://obsidian.md/) — Human interface for wiki vaults
- [Alma](https://github.com/soul-codes/alma) — AI agent framework (Codex)
- [Claude Code](https://www.anthropic.com/) — AI agent by Anthropic
