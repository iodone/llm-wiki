import { Command } from 'commander';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { findVaultRoot, vaultPaths } from '../lib/config.js';

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
- Use subdirectories for categories if needed (e.g., \`wiki/papers/raft.md\`)

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

# [db9]
# url = "your-db9-connection-string"
`;

const LOG_TEMPLATE = `# Change Log

Append-only record of wiki operations. Format: \`[date] verb | subject\`
`;

function generateAgentsMd(): string {
  return `# AGENTS.md

This wiki is managed by AI agents using llm-wiki skills.

## Available Skills

| Skill | Purpose | Usage |
|-------|---------|-------|
| ingest | Process source material into wiki pages | \`/ingest <path-or-url>\` |
| query | Search wiki and synthesize answers | \`/query <question>\` |
| lint | Health-check the wiki | \`/lint\` |
| research | Deep-dive investigation with external sources | \`/research <topic>\` |

## How to Install Skills

Run \`llm-wiki skill\` to get the skills directory path, then copy the skill files to your workspace:

- Claude Code: \`<workspace>/.claude/skills/\`
- Codex: \`<workspace>/.agents/skills/\`

## Key Files

- \`purpose.md\` — Wiki scope and audience
- \`schema.md\` — Page types, naming conventions, frontmatter rules
- \`log.md\` — Change log (append-only)
- \`wiki/\` — AI-maintained wiki pages
- \`sources/\` — Raw source documents (immutable)

## Rules

1. Always read \`purpose.md\` and \`schema.md\` before any operation
2. Never modify files in \`sources/\` — they are immutable raw inputs
3. Use \`[[wikilinks]]\` for cross-references between wiki pages
4. Append every operation to \`log.md\`
5. Run \`llm-wiki sync\` after making changes
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

    const paths = vaultPaths(targetDir);

    // Create directories
    mkdirSync(paths.wiki, { recursive: true });
    mkdirSync(paths.sources, { recursive: true });
    mkdirSync(paths.llmWikiDir, { recursive: true });

    // Create files (only if they don't exist)
    const filesToCreate: [string, string][] = [
      [paths.purpose, PURPOSE_TEMPLATE],
      [paths.schema, SCHEMA_TEMPLATE],
      [paths.config, CONFIG_TEMPLATE],
      [paths.log, LOG_TEMPLATE],
      [paths.agentsMd, generateAgentsMd()],
    ];

    for (const [path, content] of filesToCreate) {
      if (!existsSync(path)) {
        writeFileSync(path, content);
      }
    }

    console.log(`Initialized llm-wiki vault in ${targetDir}`);
    console.log('');
    console.log('Created:');
    console.log('  wiki/           — AI-maintained wiki pages');
    console.log('  sources/        — Raw source documents');
    console.log('  purpose.md      — Wiki purpose and scope');
    console.log('  schema.md       — Page conventions and structure');
    console.log('  log.md          — Change log');
    console.log('  AGENTS.md       — Agent routing file');
    console.log('  .llm-wiki/      — Config and state');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Edit purpose.md to define your wiki\'s scope');
    console.log('  2. Edit schema.md to set naming conventions');
    console.log('  3. Add source documents to sources/');
    console.log('  4. Use your AI agent with /ingest to start building the wiki');
  });
