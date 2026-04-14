import { describe, it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfig, generateToml, type WikiConfig } from "../src/config.js";
import { createTempDir } from "./helpers/fixtures.js";

describe("loadConfig", () => {
  it("returns defaults when no config file exists", () => {
    const dir = createTempDir();
    const config = loadConfig(dir);

    expect(config.wiki.name).toBe("My Wiki");
    expect(config.wiki.language).toBe("en");
    expect(config.wiki.template).toBe("general");
    expect(config.db9.enabled).toBe(false);
    expect(config.search.bm25_weight).toBe(1.0);
    expect(config.graph.direct_link_weight).toBe(3.0);
  });

  it("parses a valid TOML config", () => {
    const dir = createTempDir();
    writeFileSync(
      join(dir, "llm-wiki.toml"),
      `[wiki]
name = "Test Wiki"
language = "zh"
template = "research"

[db9]
enabled = true

[search]
bm25_weight = 2.0
vector_weight = 1.5
graph_weight = 0.8

[graph]
direct_link_weight = 5.0
source_overlap_weight = 4.0
adamic_adar_weight = 1.5
type_affinity_weight = 1.0
community_cohesion_threshold = 0.2
`,
      "utf-8"
    );

    const config = loadConfig(dir);
    expect(config.wiki.name).toBe("Test Wiki");
    expect(config.wiki.language).toBe("zh");
    expect(config.wiki.template).toBe("research");
    expect(config.db9.enabled).toBe(true);
    expect(config.search.bm25_weight).toBe(2.0);
    expect(config.graph.direct_link_weight).toBe(5.0);
    expect(config.graph.community_cohesion_threshold).toBe(0.2);
  });

  it("merges partial config with defaults", () => {
    const dir = createTempDir();
    writeFileSync(
      join(dir, "llm-wiki.toml"),
      `[wiki]
name = "Partial"
`,
      "utf-8"
    );

    const config = loadConfig(dir);
    expect(config.wiki.name).toBe("Partial");
    // Defaults should fill in the rest
    expect(config.wiki.language).toBe("en");
    expect(config.wiki.template).toBe("general");
    expect(config.db9.enabled).toBe(false);
    expect(config.search.bm25_weight).toBe(1.0);
  });
});

describe("generateToml", () => {
  it("generates valid TOML that round-trips", () => {
    const config: WikiConfig = {
      wiki: { name: "Round Trip", language: "ja", template: "reading" },
      db9: { enabled: true, database: "test-db" },
      search: { bm25_weight: 1.5, vector_weight: 2.0, graph_weight: 0.3 },
      graph: {
        direct_link_weight: 3.0,
        source_overlap_weight: 4.0,
        adamic_adar_weight: 1.5,
        type_affinity_weight: 1.0,
        community_cohesion_threshold: 0.15,
      },
    };

    const dir = createTempDir();
    const toml = generateToml(config);
    writeFileSync(join(dir, "llm-wiki.toml"), toml, "utf-8");

    const loaded = loadConfig(dir);
    expect(loaded.wiki.name).toBe("Round Trip");
    expect(loaded.wiki.language).toBe("ja");
    expect(loaded.db9.enabled).toBe(true);
    expect(loaded.db9.database).toBe("test-db");
    expect(loaded.search.bm25_weight).toBe(1.5);
  });

  it("omits optional db9 fields when not set", () => {
    const config: WikiConfig = {
      wiki: { name: "Test", language: "en", template: "general" },
      db9: { enabled: false },
      search: { bm25_weight: 1.0, vector_weight: 1.0, graph_weight: 0.5 },
      graph: {
        direct_link_weight: 3.0,
        source_overlap_weight: 4.0,
        adamic_adar_weight: 1.5,
        type_affinity_weight: 1.0,
        community_cohesion_threshold: 0.15,
      },
    };

    const toml = generateToml(config);
    expect(toml).not.toContain("host");
    expect(toml).not.toContain("database");
  });
});
