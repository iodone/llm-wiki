import { Command } from 'commander';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function getSkillsDir(): string {
  // Skills are in the package's skills/ directory (sibling to dist/)
  const currentFile = fileURLToPath(import.meta.url);
  const packageRoot = dirname(dirname(currentFile));
  return join(packageRoot, 'skills');
}

export const skillCommand = new Command('skill')
  .description('Show skill files for AI agent installation')
  .argument('[name]', 'skill name (ingest, query, lint, research). Omit to list all.')
  .action((name?: string) => {
    const skillsDir = getSkillsDir();

    if (!existsSync(skillsDir)) {
      console.error('Error: Skills directory not found. Package may be corrupted.');
      process.exit(1);
    }

    if (!name) {
      // List available skills
      const files = readdirSync(skillsDir).filter(f => f.endsWith('.md'));
      console.log(`Skills directory: ${skillsDir}\n`);
      console.log('Available skills:');
      for (const file of files) {
        const skillName = file.replace(/\.md$/, '');
        console.log(`  ${skillName}`);
      }
      console.log('');
      console.log('Usage:');
      console.log('  llm-wiki skill <name>    — Print skill content');
      console.log('  llm-wiki skill           — List all skills and show directory path');
      console.log('');
      console.log('To install skills for your AI agent, copy them to:');
      console.log('  Claude Code: <workspace>/.claude/skills/');
      console.log('  Codex:       <workspace>/.agents/skills/');
      return;
    }

    const skillPath = join(skillsDir, `${name}.md`);
    if (!existsSync(skillPath)) {
      console.error(`Error: Skill "${name}" not found.`);
      console.error(`Available: ${readdirSync(skillsDir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')).join(', ')}`);
      process.exit(1);
    }

    // Output skill content (agent can capture and save)
    console.log(readFileSync(skillPath, 'utf-8'));
  });
