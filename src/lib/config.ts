import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import TOML from 'toml';

export interface WikiConfig {
  vault: {
    name: string;
    language: string;
    source_dir?: string;     // Optional: defaults to 'sources', can be customized (e.g., 'raw')
    wiki_dir?: string;       // Optional: defaults to 'wiki', can be customized if vault is nested
    pages_subdir?: string;   // Optional: defaults to '' (flat), can be 'pages' for wiki/pages/ structure
  };
  db9?: {
    url: string;
  };
}

const DEFAULT_CONFIG: WikiConfig = {
  vault: {
    name: 'My Wiki',
    language: 'en',
  },
};

const CONFIG_PATH = '.llm-wiki/config.toml';

export function findVaultRoot(from: string = process.cwd()): string | null {
  let dir = resolve(from);
  while (true) {
    if (existsSync(join(dir, CONFIG_PATH))) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) return null;
    dir = parent;
  }
}

export function requireVaultRoot(from?: string): string {
  const root = findVaultRoot(from);
  if (!root) {
    console.error('Error: Not inside an llm-wiki vault. Run `llm-wiki init` first.');
    process.exit(1);
  }
  return root;
}

export function loadConfig(vaultRoot: string): WikiConfig {
  const configPath = join(vaultRoot, CONFIG_PATH);
  if (!existsSync(configPath)) return DEFAULT_CONFIG;
  const raw = readFileSync(configPath, 'utf-8');
  return { ...DEFAULT_CONFIG, ...TOML.parse(raw) } as WikiConfig;
}

export function vaultPaths(root: string, config?: WikiConfig) {
  const sourceDir = config?.vault?.source_dir || 'sources';
  const wikiDir = config?.vault?.wiki_dir || 'wiki';
  const pagesSubdir = config?.vault?.pages_subdir || 'pages';
  
  const wikiRoot = join(root, wikiDir);
  const wikiPages = pagesSubdir ? join(wikiRoot, pagesSubdir) : wikiRoot;
  
  return {
    wiki: wikiPages,                            // wiki/pages/ (or wiki/ if pages_subdir is empty)
    wikiRoot: wikiRoot,                         // wiki/
    sources: join(root, sourceDir),
    purpose: join(wikiRoot, 'wiki-purpose.md'), // wiki/wiki-purpose.md
    schema: join(wikiRoot, 'wiki-schema.md'),   // wiki/wiki-schema.md
    agent: join(wikiRoot, 'wiki-agent.md'),     // wiki/wiki-agent.md
    log: join(wikiRoot, 'wiki-log.md'),         // wiki/wiki-log.md
    claudeMd: join(root, 'CLAUDE.md'),
    agentsMd: join(root, 'AGENTS.md'),
    claudeSkillsDir: join(root, '.claude', 'skills'),
    agentsSkillsDir: join(root, '.agents', 'skills'),
    config: join(root, CONFIG_PATH),
    syncState: join(root, '.llm-wiki/sync-state.json'),
    lintResult: join(root, '.llm-wiki/lint-result.yaml'),
    llmWikiDir: join(root, '.llm-wiki'),
  };
}
