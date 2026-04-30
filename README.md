# LLM Wiki

Agent-native persistent knowledge management — compile knowledge once, query forever.

Based on [Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

---

## What is this?

LLM Wiki is a **CLI tool + AI Agent skill system** that maintains an evolving, interconnected Markdown knowledge base. Instead of traditional RAG (re-deriving answers from raw documents each time), LLM Wiki **compiles** knowledge into structured wiki pages that AI agents maintain and grow over time.

**Key principle:** The tool itself doesn't call LLMs. It provides skill files that let any AI agent (Claude Code, Alma/Codex, etc.) operate the wiki. Obsidian is the human interface — no self-built GUI.

---

## Installation

### Install from Source (Recommended)

Package name: `@iodone/llm-wiki`

```bash
git clone https://github.com/iodone/llm-wiki.git
cd llm-wiki
npm install
npm run build
npm pack
npm uninstall -g @iodone/llm-wiki
npm install -g ./iodone-llm-wiki-*.tgz

llm-wiki --version          # Verify installation
```

**To uninstall:** `npm uninstall -g @iodone/llm-wiki`

### Development Install (Symlink)

If you're actively developing and want changes to take effect immediately:

```bash
cd llm-wiki
npm install
npm run build
npm link                    # Creates global symlink

llm-wiki --version          # Verify installation
```

**Note:** `npm link` creates a symlink back to the source directory. This works for development but may cause issues in sandboxed environments. For production use, prefer the tarball install above.

**To uninstall:** `npm unlink`

---

## Quick Start

### 1. Initialize a wiki vault

```bash
mkdir my-wiki && cd my-wiki
llm-wiki init
```

This creates:

```
my-wiki/
├── wiki/                    # Self-contained wiki vault
│   ├── pages/               # Wiki pages (Obsidian-compatible)
│   ├── wiki-agent.md        # Agent behavior rules (single source of truth)
│   ├── wiki-purpose.md      # Purpose and scope (user-defined)
│   ├── wiki-schema.md       # Naming conventions (sensible defaults)
│   └── wiki-log.md          # Append-only change log
├── sources/                 # Raw input documents (immutable)
└── .llm-wiki/
    └── config.toml          # Vault configuration
```

**Key points:**
- `llm-wiki init` does NOT generate `AGENTS.md` or `CLAUDE.md` — those are project-level files
- `wiki/wiki-agent.md` is the **single source of truth** for agent behavior (no CLAUDE.md/AGENTS.md fallback)
- `wiki/wiki-schema.md` ships with sensible defaults based on Karpathy's LLM Wiki pattern (page types, frontmatter, wikilinks, tags) — customize it for your domain
- `wiki/wiki-purpose.md` must be user-defined (only you know what your wiki is about)

### 2. Install the skill for your AI agent

```bash
llm-wiki skill install              # Install to both .claude/ and .agents/
llm-wiki skill install --claude     # Claude Code only
llm-wiki skill install --codex      # Alma/Codex only
```

This installs the llm-wiki skill to `.agents/skills/llm-wiki/SKILL.md` (or `.claude/skills/llm-wiki/SKILL.md`).

The skill file contains the complete playbook for `/ingest`, `/query`, `/lint`, `/research` operations.

### 3. Use your AI agent

```bash
/ingest sources/some-article.md     # Compile raw docs into wiki pages
/query "What do we know about X?"   # Search and synthesize knowledge
/lint                               # Health check: broken links, orphans, contradictions
/research "deep dive on Y"          # Internet research → save to sources/ → ingest
```

---

## Vault Structure

```
my-wiki/
├── wiki/                          # Self-contained wiki vault
│   ├── pages/                     # Wiki pages (Crystal layer, LLM-maintained)
│   ├── wiki-agent.md              # Agent behavior (identity, ingest criteria, rules)
│   ├── wiki-purpose.md            # Wiki scope and audience (user-defined)
│   ├── wiki-schema.md             # Page conventions (sensible defaults, customizable)
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

1. **Self-contained wiki vault**: All wiki metadata files live inside `wiki/`. The vault can be opened directly in Obsidian.

2. **`wiki-agent.md` is the single source of truth**: No separate `CLAUDE.md` or `AGENTS.md`. The skill reads `wiki-agent.md` for agent identity, ingest criteria (MUST/MAY/NEVER), and operating rules.

3. **`wiki-schema.md` ships with defaults**: Page types (Concept/Entity/Synthesis/Source), frontmatter spec, wikilink rules, tag taxonomy — all based on Karpathy's LLM Wiki pattern. Customize for your domain.

4. **Skill directory structure**: Skills installed to `<name>/SKILL.md` (e.g., `.agents/skills/llm-wiki/SKILL.md`). This aligns with Alma's standard skill structure.

5. **Configurable paths**: Use `.llm-wiki/config.toml` to customize:
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

The default input directory is `sources/`. To customize:

```toml
# .llm-wiki/config.toml
[vault]
name = "My Wiki"
language = "zh"
source_dir = "sources"     # Default, change if needed
wiki_dir = "wiki"
pages_subdir = "pages"
```

### Customize Wiki Agent Behavior

Edit `wiki/wiki-agent.md` to override default behavior:
- Agent identity (e.g., "I am Alma for Meta42" instead of generic wiki agent)
- Auto-ingest criteria (MUST capture, MAY capture, NEVER capture)
- Security gates (e.g., Owner-only write permission)

### Customize Wiki Schema

Edit `wiki/wiki-schema.md` to define your domain-specific conventions:
- Page types and their frontmatter requirements
- Naming conventions (kebab-case, subdirectories)
- Tag taxonomy

---

## Operations

### `/ingest <path>`

Compile raw source documents into structured wiki pages. The agent reads `wiki-agent.md` for ingest criteria, creates/updates wiki pages with `[[wikilinks]]`, and logs the operation.

**Phase-based workflow:** Pre-check → Analyze & Plan → Execute → Finalize

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

Health check: broken wikilinks, orphaned pages, contradictions, stale content. Auto-fixes safe issues, reports others for human decision.

### `/research <topic>`

Deep-dive investigation: web search → save to `sources/` → ingest → synthesize a research report.

**Example:**
```bash
/research "Apache Doris query optimizer internals"
```

---

## CLI Commands

| Command | Description |
|:---|:---|
| `llm-wiki init [dir]` | Initialize a new wiki vault |
| `llm-wiki status` | Vault statistics and health summary |
| `llm-wiki search <query>` | BM25 (+ vector if DB9 configured) keyword search |
| `llm-wiki graph` | Wiki topology analysis (communities, hubs, orphans, wanted pages) |
| `llm-wiki sync` | Update search index and metadata (auto-called after operations) |
| `llm-wiki skill install` | Install/upgrade skill files to AI agent workspace |
| `llm-wiki skill list` | List available skills |
| `llm-wiki skill show <name>` | Print skill content to stdout |

---

## Integration with Projects

### Example: system-weaver

The `system-weaver` project uses llm-wiki with this structure:

```
system-weaver/
├── wiki/                          # Wiki vault (self-contained)
│   ├── pages/                     # Crystal layer (structured knowledge)
│   ├── wiki-agent.md              # Agent behavior (single source of truth)
│   ├── wiki-purpose.md
│   ├── wiki-schema.md
│   └── wiki-log.md
├── sources/                       # Input layer (immutable)
│   ├── log/                       # Trace layer (raw conversations)
│   ├── clippings/                 # External materials
│   └── research/                  # Unit layer (deep analysis)
├── projects/                      # External project symlinks
│   └── llm-wiki -> ...            # Symlink to llm-wiki project
├── .llm-wiki/
│   └── config.toml
└── .agents/
    └── skills/
        └── llm-wiki/
            └── SKILL.md
```

**Three-layer memory model:**
- **Trace** (`sources/log/`) — Raw conversations, preserve all facts
- **Unit** (`sources/research/`) — Deep analysis, reusable insights
- **Crystal** (`wiki/pages/`) — Structured knowledge graph, LLM-maintained

---

## Philosophy

### Structure Before Implementation

LLM Wiki follows the principle: **structure first, content later**.

1. **Map Relations**: Before writing anything, understand the existing topology.
2. **Entropy Check**: Will this new content reduce contradictions and increase cross-validation?
3. **Execute & Index**: Write the content AND update the index atomically.
4. **Verify & Feedback**: Run `/lint` to ensure the structure is still sound.

### Tool Generates, Protocols Reference

- **llm-wiki** generates the wiki vault structure (`wiki/`, `sources/`, `.llm-wiki/`).
- **Projects** define their own `wiki-agent.md` (identity, criteria, rules).
- **Skills** are installed separately via `llm-wiki skill install`, not bundled with `init`.

### Low-Entropy Design

- Wiki vault is **self-contained** in `wiki/` (can be opened in Obsidian directly).
- Source documents are **immutable** (append-only, never edited).
- All edits happen in `wiki/pages/`, tracked in `wiki-log.md`.
- `wiki-agent.md` is the **single source of truth** for agent behavior (no external fallback).

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

Edit `wiki/wiki-schema.md` to define your frontmatter conventions. The defaults:

```yaml
---
title: Page Title
description: One-line summary
tags: [concept, architecture]
sources: [sources/research/2024-12-01-design-doc.md]
created: 2024-12-01
updated: 2024-12-05
---
```

### Subdirectories in wiki/pages/

Organize wiki pages in subdirectories when the wiki grows:

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

---

## Troubleshooting

### `llm-wiki: command not found`

```bash
npm config get prefix
export PATH="$(npm config get prefix)/bin:$PATH"
```

Or reinstall globally:
```bash
npm uninstall -g @iodone/llm-wiki
cd /path/to/llm-wiki && npm pack && npm install -g ./iodone-llm-wiki-*.tgz
```

### Skill file not loading

```bash
ls .agents/skills/llm-wiki/SKILL.md
llm-wiki skill install    # Reinstall if missing
```

### Sync state issues

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
- [Alma](https://github.com/soul-codes/alma) — AI agent framework
- [Claude Code](https://www.anthropic.com/) — AI agent by Anthropic
