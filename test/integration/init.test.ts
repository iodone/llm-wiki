import { describe, it, expect, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { initCommand } from "../../src/commands/init.js";
import { createTempDir } from "../helpers/fixtures.js";

describe("init command integration", () => {
  it("creates complete directory structure", async () => {
    const dir = createTempDir();
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      await initCommand({
        name: "Test Wiki",
        template: "research",
        language: "en",
      });

      // Verify config
      expect(existsSync(join(dir, "llm-wiki.toml"))).toBe(true);
      const toml = readFileSync(join(dir, "llm-wiki.toml"), "utf-8");
      expect(toml).toContain('name = "Test Wiki"');
      expect(toml).toContain('template = "research"');

      // Verify directories
      expect(existsSync(join(dir, "wiki/concepts"))).toBe(true);
      expect(existsSync(join(dir, "wiki/entities"))).toBe(true);
      expect(existsSync(join(dir, "wiki/topics"))).toBe(true);
      expect(existsSync(join(dir, "wiki/insights"))).toBe(true);
      expect(existsSync(join(dir, "sources"))).toBe(true);
      expect(existsSync(join(dir, ".agents/skills"))).toBe(true);

      // Verify content files
      expect(existsSync(join(dir, "purpose.md"))).toBe(true);
      expect(existsSync(join(dir, "schema.md"))).toBe(true);
      expect(existsSync(join(dir, "index.md"))).toBe(true);
      expect(existsSync(join(dir, "log.md"))).toBe(true);

      // Verify AGENTS.md and skills
      expect(existsSync(join(dir, ".agents/AGENTS.md"))).toBe(true);
      expect(existsSync(join(dir, ".agents/skills/ingest.md"))).toBe(true);
      expect(existsSync(join(dir, ".agents/skills/query.md"))).toBe(true);
      expect(existsSync(join(dir, ".agents/skills/lint.md"))).toBe(true);
      expect(existsSync(join(dir, ".agents/skills/deep-research.md"))).toBe(true);

      // Verify .gitignore
      expect(existsSync(join(dir, ".gitignore"))).toBe(true);
      const gitignore = readFileSync(join(dir, ".gitignore"), "utf-8");
      expect(gitignore).toContain(".llm-wiki/");

      // Verify index.md content
      const index = readFileSync(join(dir, "index.md"), "utf-8");
      expect(index).toContain("Test Wiki");

      // Verify log.md has timestamp
      const log = readFileSync(join(dir, "log.md"), "utf-8");
      expect(log).toContain("Wiki initialized");
    } finally {
      process.chdir(origCwd);
    }
  });

  it("rejects double initialization", async () => {
    const dir = createTempDir();
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      await initCommand({
        name: "First",
        template: "general",
        language: "en",
      });

      // Second init should fail
      const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
        throw new Error("process.exit called");
      }) as never);

      await expect(
        initCommand({
          name: "Second",
          template: "general",
          language: "en",
        })
      ).rejects.toThrow("process.exit called");

      mockExit.mockRestore();
    } finally {
      process.chdir(origCwd);
    }
  });

  it("works with all templates", async () => {
    for (const template of ["research", "reading", "business", "general"]) {
      const dir = createTempDir();
      const origCwd = process.cwd();
      process.chdir(dir);

      try {
        await initCommand({
          name: `${template} Wiki`,
          template,
          language: "zh",
        });

        expect(existsSync(join(dir, "purpose.md"))).toBe(true);
        expect(existsSync(join(dir, "schema.md"))).toBe(true);

        const toml = readFileSync(join(dir, "llm-wiki.toml"), "utf-8");
        expect(toml).toContain(`template = "${template}"`);
        expect(toml).toContain('language = "zh"');
      } finally {
        process.chdir(origCwd);
      }
    }
  });
});
