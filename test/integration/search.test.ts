import { describe, it, expect, vi } from "vitest";
import { searchCommand } from "../../src/commands/search.js";
import {
  createTestWiki,
  STANDARD_PAGES,
  CJK_PAGES,
} from "../helpers/fixtures.js";

describe("search command integration", () => {
  it("finds relevant pages by keyword", async () => {
    const dir = createTestWiki(STANDARD_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      const results = await captureSearchJson(dir, "machine learning");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].slug).toBe("concepts/machine-learning");
    } finally {
      process.chdir(origCwd);
    }
  });

  it("returns empty for non-matching query", async () => {
    const dir = createTestWiki(STANDARD_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      const results = await captureSearchJson(dir, "xyznonexistentterm");
      expect(results.length).toBe(0);
    } finally {
      process.chdir(origCwd);
    }
  });

  it("searches CJK content", async () => {
    const dir = createTestWiki(CJK_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      const results = await captureSearchJson(dir, "机器学习");
      expect(results.length).toBeGreaterThan(0);
      // The page about 机器学习 should rank first
      expect(results[0].slug).toBe("concepts/ji-qi-xue-xi");
    } finally {
      process.chdir(origCwd);
    }
  });

  it("handles empty wiki gracefully", async () => {
    const dir = createTestWiki([]);
    const origCwd = process.cwd();
    process.chdir(dir);

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.join(" "));
    });

    try {
      await searchCommand("anything", { limit: "10", format: "text" });
      const output = logs.join("\n");
      expect(output).toContain("No wiki pages found");
    } finally {
      vi.restoreAllMocks();
      process.chdir(origCwd);
    }
  });

  it("respects --limit", async () => {
    const dir = createTestWiki(STANDARD_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      const results = await captureSearchJson(dir, "ai", "2");
      expect(results.length).toBeLessThanOrEqual(2);
    } finally {
      process.chdir(origCwd);
    }
  });
});

async function captureSearchJson(
  dir: string,
  query: string,
  limit: string = "10"
): Promise<Array<{ slug: string; score: number }>> {
  const logs: string[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.join(" "));
  });

  try {
    await searchCommand(query, { limit, format: "json" });
    const output = logs.join("\n");
    if (!output.trim() || output.includes("No")) return [];
    return JSON.parse(output);
  } finally {
    spy.mockRestore();
  }
}
