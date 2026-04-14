import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  loadSyncState,
  saveSyncState,
  getSyncStatePath,
  type SyncState,
} from "../src/lib/sync-state.js";
import { createTempDir } from "./helpers/fixtures.js";

describe("getSyncStatePath", () => {
  it("returns correct path", () => {
    const path = getSyncStatePath("/foo/bar");
    expect(path).toBe("/foo/bar/.llm-wiki/sync-state.json");
  });
});

describe("loadSyncState", () => {
  it("returns empty state when no file exists", () => {
    const dir = createTempDir();
    const state = loadSyncState(dir);
    expect(state.lastSyncAt).toBeNull();
    expect(state.wikiFiles).toEqual({});
    expect(state.sourceFiles).toEqual({});
  });

  it("returns empty state for corrupted JSON", () => {
    const dir = createTempDir();
    const { mkdirSync, writeFileSync } = require("node:fs");
    mkdirSync(join(dir, ".llm-wiki"), { recursive: true });
    writeFileSync(getSyncStatePath(dir), "not valid json{{{", "utf-8");

    const state = loadSyncState(dir);
    expect(state.lastSyncAt).toBeNull();
    expect(state.wikiFiles).toEqual({});
  });
});

describe("saveSyncState", () => {
  it("creates directory and saves state", () => {
    const dir = createTempDir();
    const state: SyncState = {
      lastSyncAt: "2024-01-01T00:00:00.000Z",
      wikiFiles: {
        "concepts/ml.md": { hash: "abc123", mtime: 1000 },
      },
      sourceFiles: {
        "papers/test.pdf": { mtime: 2000 },
      },
    };

    saveSyncState(dir, state);

    expect(existsSync(getSyncStatePath(dir))).toBe(true);

    const loaded = loadSyncState(dir);
    expect(loaded.lastSyncAt).toBe("2024-01-01T00:00:00.000Z");
    expect(loaded.wikiFiles["concepts/ml.md"].hash).toBe("abc123");
    expect(loaded.sourceFiles["papers/test.pdf"].mtime).toBe(2000);
  });

  it("overwrites existing state", () => {
    const dir = createTempDir();

    saveSyncState(dir, {
      lastSyncAt: "old",
      wikiFiles: { "a.md": { hash: "old", mtime: 1 } },
      sourceFiles: {},
    });

    saveSyncState(dir, {
      lastSyncAt: "new",
      wikiFiles: { "b.md": { hash: "new", mtime: 2 } },
      sourceFiles: {},
    });

    const loaded = loadSyncState(dir);
    expect(loaded.lastSyncAt).toBe("new");
    expect(loaded.wikiFiles["a.md"]).toBeUndefined();
    expect(loaded.wikiFiles["b.md"].hash).toBe("new");
  });
});
