import { existsSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function getSkillsDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const packageRoot = dirname(dirname(currentFile));
  return join(packageRoot, 'skills');
}

export function listSkills(skillsDir: string): string[] {
  return readdirSync(skillsDir).filter(f => f.endsWith('.md'));
}

export interface InstallResult {
  installed: string[];
  skipped: string[];
}

export function installSkillsTo(targetDir: string, overwrite = true): InstallResult {
  const skillsDir = getSkillsDir();
  if (!existsSync(skillsDir)) {
    throw new Error('Skills directory not found. Package may be corrupted.');
  }
  mkdirSync(targetDir, { recursive: true });
  const files = listSkills(skillsDir);
  const installed: string[] = [];
  const skipped: string[] = [];
  for (const file of files) {
    // Extract skill name (e.g., "llm-wiki.md" -> "llm-wiki")
    const skillName = file.replace(/\.md$/, '');
    
    // Create skill directory: .agents/skills/llm-wiki/
    const skillDir = join(targetDir, skillName);
    mkdirSync(skillDir, { recursive: true });
    
    // Destination: .agents/skills/llm-wiki/SKILL.md
    const dest = join(skillDir, 'SKILL.md');
    
    if (!overwrite && existsSync(dest)) {
      skipped.push(skillName);
      continue;
    }
    copyFileSync(join(skillsDir, file), dest);
    installed.push(skillName);
  }
  return { installed, skipped };
}
