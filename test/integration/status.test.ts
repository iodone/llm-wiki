import { describe, it, expect, vi } from "vitest";
import { statusCommand } from "../../src/commands/status.js";
import {
  createTestWiki,
  STANDARD_PAGES,
  type TestPage,
} from "../helpers/fixtures.js";

describe("status command integration", () => {
  it("reports statistics correctly", async () => {
    const dir = createTestWiki(STANDARD_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.join(" "));
    });

    try {
      await statusCommand({});

      const output = logs.join("\n");
      expect(output).toContain("Pages:");
      expect(output).toContain("8"); // 8 standard pages
    } finally {
      vi.restoreAllMocks();
      process.chdir(origCwd);
    }
  });

  it("detects broken links", async () => {
    const pages: TestPage[] = [
      {
        slug: "a",
        frontmatter: { title: "A" },
        content: "Link to [[nonexistent]].",
      },
    ];
    const dir = createTestWiki(pages);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      const result = await captureStatusJson(dir);
      expect(result.issues.brokenLinks.length).toBe(1);
      expect(result.issues.brokenLinks[0].link).toBe("nonexistent");
    } finally {
      process.chdir(origCwd);
    }
  });

  it("detects orphan pages", async () => {
    const pages: TestPage[] = [
      {
        slug: "linked",
        frontmatter: { title: "Linked" },
        content: "Link to [[other]].",
      },
      {
        slug: "other",
        frontmatter: { title: "Other" },
        content: "",
      },
      {
        slug: "orphan",
        frontmatter: { title: "Orphan" },
        content: "Nobody links here.",
      },
    ];
    const dir = createTestWiki(pages);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      const result = await captureStatusJson(dir);
      expect(result.issues.orphanPages).toContain("linked");
      expect(result.issues.orphanPages).toContain("orphan");
      expect(result.issues.orphanPages).not.toContain("other");
    } finally {
      process.chdir(origCwd);
    }
  });

  it("handles empty wiki without crashing", async () => {
    const dir = createTestWiki([]);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      // Should not throw
      await statusCommand({});
    } finally {
      process.chdir(origCwd);
    }
  });

  it("outputs valid JSON with --json", async () => {
    const dir = createTestWiki(STANDARD_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      const result = await captureStatusJson(dir);
      expect(result.wiki.name).toBe("Test Wiki");
      expect(result.statistics.pages).toBe(8);
      expect(typeof result.health.totalIssues).toBe("number");
    } finally {
      process.chdir(origCwd);
    }
  });
});

async function captureStatusJson(dir: string): Promise<Record<string, any>> {
  const logs: string[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.join(" "));
  });

  try {
    await statusCommand({ json: true });
    const output = logs.join("\n");
    return JSON.parse(output);
  } finally {
    spy.mockRestore();
  }
}
