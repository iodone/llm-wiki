import { Command } from 'commander';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { findVaultRoot, vaultPaths, WikiConfig } from '../lib/config.js';

const PURPOSE_TEMPLATE = `---
title: Wiki Purpose
---

# Purpose

Describe what this wiki is about, its scope, and intended audience.

Example: "This wiki tracks my research on distributed systems, covering papers, concepts, and open questions."
`;

const SCHEMA_TEMPLATE = `---
title: Wiki Schema
---

# Schema

## Page Types

Define the types of pages in this wiki and their conventions.

## Naming Convention

- Use kebab-case for page filenames (e.g., \`distributed-consensus.md\`)
- Use subdirectories for categories if needed (e.g., \`wiki/pages/papers/raft.md\`)

## Required Frontmatter

Every wiki page must include:

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

const LOG_TEMPLATE = `# Change Log

Format: \`YYYY-MM-DD HH:MM | operation | details\`

`;

function agentTemplate(): string {
  return `---
title: Wiki Agent
---

# Wiki Agent

This page defines the agent's role, behavior, and operating rules for this wiki vault.
The AI agent reads this file (via the llm-wiki skill) on every wiki operation.

## Identity

Describe the agent's role here. Example:

> I am the knowledge maintainer for [project name]. I observe discussions,
> extract valuable information, and organize it into structured wiki pages.

## Responsibilities

- Continuously ingest wiki-worthy information from received inputs
- Maintain accuracy and freshness of existing wiki pages
- Cross-reference related topics with [[wikilinks]]
- Never participate in discussions — observe and record only

## Ingest Rules

### MUST capture
- Decisions and their rationale
- Architecture and design conclusions
- Task/issue lifecycle events (created, assigned, completed)
- Bug reports and resolutions
- New systems, concepts, or processes

### MAY capture
- Unconfirmed proposals and ideas
- Tool and workflow discussions
- Performance observations

### NEVER capture
- Casual conversation and greetings
- Credentials, tokens, personal data
- Information already recorded in the wiki
- Emoji-only or single-word reactions

## Output Standards

- Write in the language specified in \`.llm-wiki/config.toml\`
- Each wiki page focuses on one topic
- Always include source attribution
- Use [[wikilinks]] for every entity that has or should have a page
- Append every action to wiki-log.md
- After every operation, run \`llm-wiki sync\`

## Layout

- \`wiki/pages/\` — AI-maintained wiki pages (Obsidian-compatible)
- \`wiki/wiki-agent.md\` — This file (agent behavioral rules)
- \`wiki/wiki-purpose.md\` — Purpose and scope
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

1. Always read \`wiki/wiki-purpose.md\` and \`wiki/wiki-schema.md\` before any operation
2. Never modify files in \`sources/\` — they are immutable raw inputs
3. Use \`[[wikilinks]]\` for cross-references between wiki pages
4. After every operation, append an entry to \`wiki/wiki-log.md\` **and** run \`llm-wiki sync\`
5. When you receive information, apply your auto-ingest criteria — do not wait for explicit commands
`;
}

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
    console.log('  wiki/pages/        — Wiki pages (Obsidian-compatible)');
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
    console.log('  3. (Optional) Customize wiki-agent.md for project-specific behavior');
    console.log('  4. (Optional) Customize source_dir via .llm-wiki/config.toml');
    console.log('  5. Use /ingest to build the wiki');
    console.log('');
    console.log('To install the llm-wiki skill for your AI agent:');
    console.log('  See https://github.com/iodone/llm-wiki#installation');
  });
