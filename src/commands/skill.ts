import { Command } from 'commander';
import { existsSync, readFileSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function getSkillsDir(): string {
  // Skills are in the package's skills/ directory (sibling to dist/)
  const currentFile = fileURLToPath(import.meta.url);
  const packageRoot = dirname(dirname(currentFile));
  return join(packageRoot, 'skills');
}

function listSkills(skillsDir: string): string[] {
  return readdirSync(skillsDir).filter(f => f.endsWith('.md'));
}

export const skillCommand = new Command('skill')
  .description('Manage AI agent skills');

function detectAgent(workspace: string): 'claude' | 'codex' {
  if (existsSync(join(workspace, '.agents'))) return 'codex';
  return 'claude'; // default
}

skillCommand
  .command('install')
  .description('Install all skills to your AI agent workspace (one command)')
  .option('--claude', 'force install to .claude/skills/')
  .option('--codex', 'force install to .agents/skills/')
  .option('--dir <path>', 'workspace directory (default: cwd)')
  .action((opts: { claude?: boolean; codex?: boolean; dir?: string }) => {
    const skillsDir = getSkillsDir();
    if (!existsSync(skillsDir)) {
      console.error('Error: Skills directory not found. Package may be corrupted.');
      process.exit(1);
    }

    const workspace = opts.dir || process.cwd();
    const agent = opts.codex ? 'codex' : opts.claude ? 'claude' : detectAgent(workspace);
    const targetDir = agent === 'codex'
      ? join(workspace, '.agents', 'skills')
      : join(workspace, '.claude', 'skills');

    mkdirSync(targetDir, { recursive: true });

    const files = listSkills(skillsDir);
    for (const file of files) {
      copyFileSync(join(skillsDir, file), join(targetDir, file));
    }

    console.log(`Installed ${files.length} skills to ${targetDir}/`);
    for (const file of files) {
      console.log(`  ${file.replace('.md', '')}`);
    }
  });

skillCommand
  .command('show')
  .description('Print skill content to stdout')
  .argument('<name>', 'skill name (ingest, query, lint, research)')
  .action((name: string) => {
    const skillsDir = getSkillsDir();
    if (!existsSync(skillsDir)) {
      console.error('Error: Skills directory not found. Package may be corrupted.');
      process.exit(1);
    }

    const skillPath = join(skillsDir, `${name}.md`);
    if (!existsSync(skillPath)) {
      console.error(`Error: Skill "${name}" not found.`);
      console.error(`Available: ${listSkills(skillsDir).map(f => f.replace('.md', '')).join(', ')}`);
      process.exit(1);
    }

    console.log(readFileSync(skillPath, 'utf-8'));
  });

skillCommand
  .command('list')
  .description('List all available skills')
  .action(() => {
    const skillsDir = getSkillsDir();
    if (!existsSync(skillsDir)) {
      console.error('Error: Skills directory not found. Package may be corrupted.');
      process.exit(1);
    }

    const files = listSkills(skillsDir);
    console.log('Available skills:');
    for (const file of files) {
      console.log(`  ${file.replace(/\.md$/, '')}`);
    }
    console.log('');
    console.log('Install all:  llm-wiki skill install');
    console.log('Show one:     llm-wiki skill show <name>');
  });

// Default action when no subcommand — behave like list
skillCommand.action(() => {
  skillCommand.commands.find(c => c.name() === 'list')!.parse([], { from: 'user' });
});
