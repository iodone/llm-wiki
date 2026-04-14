import { describe, it, expect, vi } from "vitest";
import { indexCommand } from "../../src/commands/index.js";
import {
  createTestWiki,
  STANDARD_PAGES,
} from "../helpers/fixtures.js";

describe("index command integration", () => {
  it("lists all pages as JSON", async () => {
    const dir = createTestWiki(STANDARD_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      const result = await captureIndexJson(dir);
      expect(result.length).toBe(8);
      const slugs = result.map((p: any) => p.slug);
      expect(slugs).toContain("concepts/machine-learning");
      expect(slugs).toContain("entities/geoffrey-hinton");
    } finally {
      process.chdir(origCwd);
    }
  });

  it("filters by tag", async () => {
    const dir = createTestWiki(STANDARD_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      const result = await captureIndexJson(dir, { tag: "nlp" });
      expect(result.length).toBe(1);
      expect(result[0].slug).toBe("topics/nlp");
    } finally {
      process.chdir(origCwd);
    }
  });

  it("filters by type", async () => {
    const dir = createTestWiki(STANDARD_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      const result = await captureIndexJson(dir, { type: "entity" });
      expect(result.length).toBe(1);
      expect(result[0].slug).toBe("entities/geoffrey-hinton");
    } finally {
      process.chdir(origCwd);
    }
  });

  it("handles empty wiki", async () => {
    const dir = createTestWiki([]);
    const origCwd = process.cwd();
    process.chdir(dir);

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.join(" "));
    });

    try {
      await indexCommand({ format: "text" });
      const output = logs.join("\n");
      expect(output).toContain("No wiki pages found");
    } finally {
      vi.restoreAllMocks();
      process.chdir(origCwd);
    }
  });

  it("pretty prints grouped by type", async () => {
    const dir = createTestWiki(STANDARD_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.join(" "));
    });

    try {
      await indexCommand({ format: "text" });
      const output = logs.join("\n");
      expect(output).toContain("concept");
      expect(output).toContain("entity");
      expect(output).toContain("topic");
    } finally {
      vi.restoreAllMocks();
      process.chdir(origCwd);
    }
  });
});

async function captureIndexJson(
  dir: string,
  options?: { tag?: string; type?: string }
): Promise<Array<Record<string, any>>> {
  const logs: string[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.join(" "));
  });

  try {
    await indexCommand({ format: "json", ...options });
    const output = logs.join("\n");
    return JSON.parse(output);
  } finally {
    spy.mockRestore();
  }
}
