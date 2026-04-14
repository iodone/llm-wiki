import { describe, it, expect } from "vitest";
import {
  createDb9Client,
  initDb9Schema,
  upsertWikiPage,
  vectorSearch,
  deleteWikiPage,
  updatePageSources,
  type Db9Client,
} from "../../src/db.js";
import { createTestWiki, STANDARD_PAGES } from "../helpers/fixtures.js";

const DB9_AVAILABLE = !!process.env.RUN_DB9_TESTS;

describe.skipIf(!DB9_AVAILABLE)("DB9 integration", () => {
  let client: Db9Client;
  let projectDir: string;

  it("creates client and initializes schema", async () => {
    projectDir = createTestWiki(STANDARD_PAGES, {
      db9: { enabled: true, database: `llm-wiki-test-${Date.now()}` },
    });

    client = (await createDb9Client(projectDir))!;
    expect(client).not.toBeNull();

    await initDb9Schema(client);
    // Schema should be idempotent
    await initDb9Schema(client);
  });

  it("upserts wiki pages", async () => {
    await upsertWikiPage(
      client,
      "test/ml",
      "Machine Learning",
      "ML overview",
      "concept",
      "abc123",
      ["ai", "ml"],
      1,
      "Machine learning is a field of AI."
    );

    await upsertWikiPage(
      client,
      "test/dl",
      "Deep Learning",
      "DL overview",
      "concept",
      "def456",
      ["ai", "dl"],
      0,
      "Deep learning uses neural networks."
    );

    // Verify by querying
    const result = await client.sql(
      "SELECT slug, title FROM wiki_index WHERE slug LIKE 'test/%' ORDER BY slug;"
    );
    expect(result.rows.length).toBe(2);
  });

  it("performs vector search", async () => {
    const scores = await vectorSearch(client, "machine learning AI", 5);
    expect(scores.size).toBeGreaterThan(0);
    expect(scores.get("test/ml")).toBeGreaterThan(0);
  });

  it("updates page sources", async () => {
    await updatePageSources(client, "test/ml", [
      "papers/ml-survey.pdf",
      "papers/ai-intro.pdf",
    ]);

    const result = await client.sql(
      "SELECT source_path FROM wiki_page_sources WHERE page_slug = 'test/ml' ORDER BY source_path;"
    );
    expect(result.rows.length).toBe(2);
  });

  it("deletes wiki page (cascades sources)", async () => {
    await deleteWikiPage(client, "test/ml");

    const result = await client.sql(
      "SELECT slug FROM wiki_index WHERE slug = 'test/ml';"
    );
    expect(result.rows.length).toBe(0);

    // Sources should be cascade-deleted
    const sources = await client.sql(
      "SELECT source_path FROM wiki_page_sources WHERE page_slug = 'test/ml';"
    );
    expect(sources.rows.length).toBe(0);
  });

  it("handles upsert (update existing)", async () => {
    await upsertWikiPage(
      client,
      "test/dl",
      "Deep Learning (Updated)",
      "Updated DL overview",
      "concept",
      "updated-hash",
      ["ai", "dl", "neural"],
      2,
      "Deep learning uses neural networks for complex tasks."
    );

    const result = await client.sql(
      "SELECT title FROM wiki_index WHERE slug = 'test/dl';"
    );
    expect(result.rows[0][0]).toBe("Deep Learning (Updated)");
  });

  it("cleans up test data", async () => {
    await deleteWikiPage(client, "test/dl");
    await client.close();
  });
});
