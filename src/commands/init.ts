import { Command } from 'commander';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { findVaultRoot, vaultPaths, WikiConfig } from '../lib/config.js';

const PURPOSE_TEMPLATE = `---
title: Wiki Purpose
---

# Purpose

Describe what this wiki is about, its scope, and intended audience.

Example: "This wiki captures knowledge about [project/domain/team]."
`;

const SCHEMA_TEMPLATE = `---
title: Wiki Schema
---

# Schema

Define your wiki's structure and naming conventions.

## Page Structure

\`\`\`yaml
---
title: Page Title
description: One-line summary
tags: []
sources: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
\`\`\`

## Tags

Define your tag taxonomy here as the wiki grows.
`;

const CONFIG_TEMPLATE = `[vault]
name = "My Wiki"
language = "en"
# source_dir = "sources"  # Optional: customize input directory (default: "sources")
# wiki_dir = "wiki"       # Optional: customize wiki root directory (default: "wiki")
# pages_subdir = "pages"  # Optional: store wiki pages in wiki/pages/ (default: "pages")

# [db9]
# url = "your-db9-connection-string"
`;

const LOG_TEMPLATE = `# Wiki Change Log

Format: \`YYYY-MM-DD HH:MM | operation | details\`

`;

function agentTemplate() {
  return `# LLM Wiki

This vault uses **llm-wiki** for knowledge management.

## Your Role

You are the wiki agent. When you receive information:
1. Evaluate if it is wiki-worthy (see criteria below)
2. If wiki-worthy: update or create wiki pages using workflows below
3. If not wiki-worthy: ignore silently

### Default Behavior

- You maintain this wiki by ingesting information from sources you receive
- When you receive new information, evaluate whether it is wiki-worthy
- If wiki-worthy: update or create wiki pages using the /ingest workflow
- If not wiki-worthy: ignore silently
- You do not need explicit \`/ingest\` commands to act — any information input
  that matches your ingest criteria should be processed automatically

### Auto-Ingest Criteria

**MUST capture:**
- Decisions (who decided what, when, why)
- Technical architecture and design discussions with conclusions
- Task/issue status changes
- Bug reports and their resolutions
- New concepts, systems, or processes introduced

**MAY capture (use judgment):**
- Ideas and proposals not yet confirmed
- Tool and workflow discussions

**NEVER capture:**
- Casual chat, greetings, emoji-only messages
- Credentials, tokens, personal information
- Duplicate information already in the wiki

## Layout

- \`wiki/pages/\` — AI-maintained wiki pages (Obsidian-compatible)
- \`wiki/wiki-agent.md\` — This file (agent behavioral rules)
- \`wiki/wiki-purpose.md\` — Vault purpose and scope
- \`wiki/wiki-schema.md\` — Page naming conventions
- \`wiki/wiki-log.md\` — Append-only operation log
- \`sources/\` — Raw source documents, date-partitioned (immutable)
- \`.llm-wiki/\` — Config and sync state

## CLI

- \`llm-wiki search <query>\` — BM25 (+ vector, if DB9 configured) keyword search
- \`llm-wiki graph\` — communities, hubs, orphans, wanted pages
- \`llm-wiki status\` — stats + health summary
- \`llm-wiki sync\` — track mtime/SHA256, push embeddings to DB9 if configured

## Rules

1. Always read \`wiki-purpose.md\` and \`wiki-schema.md\` before any operation
2. Never modify files in \`sources/\` — they are immutable raw inputs
3. Use \`[[wikilinks]]\` for cross-references between wiki pages
4. After every operation, append an entry to \`wiki-log.md\` **and** run \`llm-wiki sync\`
5. When you receive information, apply your auto-ingest criteria — do not wait for explicit commands
`;
}

const CLAUDE_MD_TEMPLATE = `# llm-wiki Agent Bootstrap (Claude Code)

This vault uses **llm-wiki** for knowledge management.

## Your Role

You are the wiki agent. When you receive information:
1. Evaluate if it is wiki-worthy (see wiki-agent.md)
2. If yes: use the \`/ingest\` workflow to update the wiki
3. If no: ignore silently

## Key Files

- \`wiki/pages/\` — AI-maintained wiki pages (Obsidian-compatible)
- \`wiki/wiki-purpose.md\` — Purpose and scope
- \`wiki/wiki-schema.md\` — Page conventions
- \`wiki/wiki-agent.md\` — Agent behavioral rules (optional, vault-specific)
- \`wiki/wiki-log.md\` — Append-only operation log
- \`sources/\` — Raw source documents, date-partitioned (immutable)
- \`.llm-wiki/\` — Config and sync state

## Skills

Use the \`llm-wiki\` skill (in \`.claude/skills/llm-wiki.md\`) for wiki operations:

- \`/ingest <source>\` — ingest content into the wiki
- \`/query <question>\` — search the wiki
- \`/lint\` — check for broken links and orphans
- \`/research <topic>\` — deep-dive research mode

## CLI

- \`llm-wiki search <query>\` — BM25 (+ vector, if DB9 configured) keyword search
- \`llm-wiki graph\` — communities, hubs, orphans, wanted pages
- \`llm-wiki status\` — stats + health summary
- \`llm-wiki sync\` — track mtime/SHA256, push embeddings to DB9 if configured

## Rules

1. Always read \`wiki/wiki-purpose.md\` and \`wiki/wiki-schema.md\` before any operation
2. Never modify files in \`sources/\` — they are immutable raw inputs
3. Use \`[[wikilinks]]\` for cross-references between wiki pages
4. After every operation, append an entry to \`wiki/wiki-log.md\` **and** run \`llm-wiki sync\`
5. When you receive information, apply your auto-ingest criteria — do not wait for explicit commands
`;

const AGENTS_MD_TEMPLATE = `# llm-wiki Agent Bootstrap (Codex / Alma)

This vault uses **llm-wiki** for knowledge management.

## Your Role

You are the wiki agent. When you receive information:
1. Evaluate if it is wiki-worthy (see wiki/wiki-agent.md)
2. If yes: use the \`/ingest\` workflow to update the wiki
3. If no: ignore silently

### Default Behavior (when wiki-agent.md is absent)

- You maintain this wiki by ingesting information from sources you receive
- When you receive new information, evaluate whether it is wiki-worthy
- If wiki-worthy: update or create wiki pages using the /ingest workflow
- If not wiki-worthy: ignore silently
- You do not need explicit \`/ingest\` commands to act — any information input
  that matches your ingest criteria should be processed automatically

### Auto-Ingest Criteria (defaults, override in wiki-agent.md)

**MUST capture:**
- Decisions (who decided what, when, why)
- Technical architecture and design discussions with conclusions
- Task/issue status changes
- Bug reports and their resolutions
- New concepts, systems, or processes introduced

**MAY capture (use judgment):**
- Ideas and proposals not yet confirmed
- Tool and workflow discussions

**NEVER capture:**
- Casual chat, greetings, emoji-only messages
- Credentials, tokens, personal information
- Duplicate information already in the wiki

## Layout

- \`wiki/pages/\` — Wiki pages (Obsidian-compatible)
- \`wiki/wiki-purpose.md\` — Purpose and scope
- \`wiki/wiki-schema.md\` — Page conventions
- \`wiki/wiki-agent.md\` — Agent behavioral rules (optional, vault-specific)
- \`wiki/wiki-log.md\` — Append-only operation log
- \`sources/\` — Raw source documents, date-partitioned (immutable)
- \`.llm-wiki/\` — Config and sync state

## CLI

- \`llm-wiki search <query>\` — BM25 (+ vector, if DB9 configured) keyword search
- \`llm-wiki graph\` — communities, hubs, orphans, wanted pages
- \`llm-wiki status\` — stats + health summary
- \`llm-wiki sync\` — track mtime/SHA256, push embeddings to DB9 if configured

## Rules

1. Always read \`wiki/wiki-purpose.md\` and \`wiki/wiki-schema.md\` before any operation
2. Never modify files in \`sources/\` — they are immutable raw inputs
3. Use \`[[wikilinks]]\` for cross-references between wiki pages
4. After every operation, append an entry to \`wiki/wiki-log.md\` **and** run \`llm-wiki sync\`
5. When you receive information, apply your auto-ingest criteria — do not wait for explicit commands
`;

export const initCommand = new Command('init')
  .description('Initialize a new llm-wiki vault')
  .argument('[directory]', 'directory to initialize', '.')
  .action((directory: string) => {
    const targetDir = join(process.cwd(), directory);

    // Check if already initialized
    if (findVaultRoot(targetDir)) {
      console.error('Error: This directory is already inside an llm-wiki vault.');
      process.exit(1);
    }

    // Load default config for path calculation
    const defaultConfig: WikiConfig = {
      vault: {
        name: 'My Wiki',
        language: 'en',
        wiki_dir: 'wiki',
        pages_subdir: 'pages',
      },
    };
    const paths = vaultPaths(targetDir, defaultConfig);

    // Create directories
    mkdirSync(paths.wiki, { recursive: true });        // wiki/pages/
    mkdirSync(paths.wikiRoot, { recursive: true });    // wiki/
    mkdirSync(paths.sources, { recursive: true });
    mkdirSync(paths.llmWikiDir, { recursive: true });

    // Create files (only if they don't exist)
    const filesToCreate: [string, string][] = [
      [paths.purpose, PURPOSE_TEMPLATE],
      [paths.schema, SCHEMA_TEMPLATE],
      [paths.agent, agentTemplate()],
      [paths.config, CONFIG_TEMPLATE],
      [paths.log, LOG_TEMPLATE],
    ];

    for (const [path, content] of filesToCreate) {
      if (!existsSync(path)) {
        writeFileSync(path, content);
      }
    }

    console.log(`Initialized llm-wiki vault in ${targetDir}`);
    console.log('');
    console.log('Created:');
    console.log('  wiki/pages/        — Wiki pages (Crystal layer)');
    console.log('  wiki/');
    console.log('    wiki-purpose.md  — Purpose and scope');
    console.log('    wiki-schema.md   — Naming conventions');
    console.log('    wiki-agent.md    — Agent behavior rules');
    console.log('    wiki-log.md      — Change log');
    console.log('  sources/           — Raw input documents (immutable)');
    console.log('  .llm-wiki/         — Config and state');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Edit wiki/wiki-purpose.md to define scope');
    console.log('  2. Edit wiki/wiki-schema.md for naming conventions');
    console.log('  3. (Optional) Customize source_dir via .llm-wiki/config.toml');
    console.log('  4. Use /ingest to build the wiki');
    console.log('');
    console.log('To install the llm-wiki skill for your AI agent:');
    console.log('  See https://github.com/iodone/llm-wiki#installation');
  });
