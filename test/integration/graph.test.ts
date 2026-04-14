import { describe, it, expect, vi } from "vitest";
import { graphCommand } from "../../src/commands/graph.js";
import {
  createTestWiki,
  STANDARD_PAGES,
} from "../helpers/fixtures.js";

describe("graph command integration", () => {
  it("builds graph and outputs JSON", async () => {
    const dir = createTestWiki(STANDARD_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      const result = await captureGraphJson(dir, { json: true });
      expect(result.nodes.length).toBe(8);
      expect(result.edges.length).toBeGreaterThan(0);
      expect(result.communities.length).toBeGreaterThan(0);
      expect(typeof result.modularity).toBe("number");
    } finally {
      process.chdir(origCwd);
    }
  });

  it("generates insights when requested", async () => {
    const dir = createTestWiki(STANDARD_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    try {
      const result = await captureGraphJson(dir, { json: true, insights: true });
      expect(Array.isArray(result.insights)).toBe(true);
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
      await graphCommand({});
      const output = logs.join("\n");
      expect(output).toContain("No wiki pages found");
    } finally {
      vi.restoreAllMocks();
      process.chdir(origCwd);
    }
  });

  it("pretty prints without errors", async () => {
    const dir = createTestWiki(STANDARD_PAGES);
    const origCwd = process.cwd();
    process.chdir(dir);

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.join(" "));
    });

    try {
      await graphCommand({ insights: true });
      const output = logs.join("\n");
      expect(output).toContain("Knowledge Graph");
      expect(output).toContain("Nodes:");
      expect(output).toContain("Communities");
    } finally {
      vi.restoreAllMocks();
      process.chdir(origCwd);
    }
  });
});

async function captureGraphJson(
  dir: string,
  options: { json?: boolean; insights?: boolean }
): Promise<Record<string, any>> {
  const logs: string[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.join(" "));
  });

  try {
    await graphCommand(options);
    const output = logs.join("\n");
    // Find the JSON part (skip the "Building knowledge graph..." line)
    const jsonStart = output.indexOf("{");
    return JSON.parse(output.slice(jsonStart));
  } finally {
    spy.mockRestore();
  }
}
