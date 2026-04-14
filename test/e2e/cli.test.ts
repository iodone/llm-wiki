import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createTempDir } from "../helpers/fixtures.js";
import { serializeFrontmatter } from "../../src/utils/frontmatter.js";

const CLI = join(__dirname, "../../dist/cli.js");

function run(cmd: string, cwd: string): string {
  try {
    return execSync(`node ${CLI} ${cmd}`, {
      cwd,
      encoding: "utf-8",
      timeout: 30000,
    });
  } catch (err: any) {
    return err.stdout || err.stderr || err.message;
  }
}

describe("CLI end-to-end", () => {
  it("init creates a complete project", () => {
    const dir = createTempDir();
    const output = run(
      'init --name "E2E Test" --template research --language en',
      dir
    );

    expect(output).toContain("initialized successfully");
    expect(existsSync(join(dir, "llm-wiki.toml"))).toBe(true);
    expect(existsSync(join(dir, "wiki/concepts"))).toBe(true);
    expect(existsSync(join(dir, ".agents/AGENTS.md"))).toBe(true);
    expect(existsSync(join(dir, ".agents/skills/ingest.md"))).toBe(true);
  });

  it("init rejects double initialization", () => {
    const dir = createTempDir();
    run('init --name "First" --template general --language en', dir);
    const output = run(
      'init --name "Second" --template general --language en',
      dir
    );
    expect(output).toContain("already");
  });

  it("status works on initialized project", () => {
    const dir = createTempDir();
    run('init --name "Status Test" --template general --language en', dir);

    const output = run("status", dir);
    expect(output).toContain("Status");
    expect(output).toContain("Pages:");
  });

  it("status --json returns valid JSON", () => {
    const dir = createTempDir();
    run('init --name "JSON Test" --template general --language en', dir);

    const output = run("status --json", dir);
    const parsed = JSON.parse(output);
    expect(parsed.wiki.name).toBe("JSON Test");
    expect(typeof parsed.statistics.pages).toBe("number");
  });

  it("search finds content after adding pages", () => {
    const dir = setupWikiWithPages();
    const output = run("search machine --format json", dir);
    const results = JSON.parse(output);
    expect(results.length).toBeGreaterThan(0);
  });

  it("graph builds and outputs JSON", () => {
    const dir = setupWikiWithPages();
    const output = run("graph --json", dir);
    // Output includes "Building knowledge graph..." before JSON
    const jsonStart = output.indexOf("{");
    const parsed = JSON.parse(output.slice(jsonStart));
    expect(parsed.nodes.length).toBeGreaterThan(0);
  });

  it("index lists pages as JSON", () => {
    const dir = setupWikiWithPages();
    const output = run("index --format json", dir);
    const pages = JSON.parse(output);
    expect(pages.length).toBeGreaterThan(0);
  });

  it("index filters by tag", () => {
    const dir = setupWikiWithPages();
    const output = run("index --format json --tag ml", dir);
    const pages = JSON.parse(output);
    for (const page of pages) {
      expect(page.tags).toContain("ml");
    }
  });
});

function setupWikiWithPages(): string {
  const dir = createTempDir();
  execSync(
    `node ${CLI} init --name "Test" --template general --language en`,
    { cwd: dir, encoding: "utf-8" }
  );

  // Add some wiki pages
  const wikiDir = join(dir, "wiki/concepts");
  mkdirSync(wikiDir, { recursive: true });

  writeFileSync(
    join(wikiDir, "machine-learning.md"),
    serializeFrontmatter(
      {
        title: "Machine Learning",
        description: "ML overview",
        tags: ["ai", "ml"],
        page_type: "concept",
      },
      "Machine learning is a subset of [[artificial-intelligence]]."
    ),
    "utf-8"
  );

  writeFileSync(
    join(wikiDir, "artificial-intelligence.md"),
    serializeFrontmatter(
      {
        title: "Artificial Intelligence",
        description: "AI overview",
        tags: ["ai"],
        page_type: "concept",
      },
      "AI encompasses [[machine-learning]] and more."
    ),
    "utf-8"
  );

  writeFileSync(
    join(wikiDir, "deep-learning.md"),
    serializeFrontmatter(
      {
        title: "Deep Learning",
        description: "DL overview",
        tags: ["ai", "ml"],
        page_type: "concept",
      },
      "Deep learning is a subset of [[machine-learning]]."
    ),
    "utf-8"
  );

  return dir;
}
