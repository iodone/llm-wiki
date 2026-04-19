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

export function installSkillsTo(targetDir: string): string[] {
  const skillsDir = getSkillsDir();
  if (!existsSync(skillsDir)) {
    throw new Error('Skills directory not found. Package may be corrupted.');
  }
  mkdirSync(targetDir, { recursive: true });
  const files = listSkills(skillsDir);
  for (const file of files) {
    copyFileSync(join(skillsDir, file), join(targetDir, file));
  }
  return files;
}
