import { describe, it, expect } from "vitest";
import {
  tokenize,
  buildBM25Index,
  searchBM25,
  reciprocalRankFusion,
  graphExpand,
  hybridSearch,
} from "../src/lib/search.js";
import { buildGraph } from "../src/lib/graph.js";
import { extractWikilinks, type WikiPage } from "../src/lib/wiki.js";
import { contentHash } from "../src/utils/hash.js";
import type { WikiConfig } from "../src/config.js";

const defaultConfig: WikiConfig = {
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

describe("tokenize", () => {
  it("tokenizes Latin text", () => {
    const tokens = tokenize("Hello World 123");
    expect(tokens).toContain("hello");
    expect(tokens).toContain("world");
    expect(tokens).toContain("123");
  });

  it("tokenizes CJK text with bigrams", () => {
    const tokens = tokenize("机器学习");
    // Should contain individual characters and bigrams
    expect(tokens).toContain("机器");
    expect(tokens).toContain("器学");
    expect(tokens).toContain("学习");
  });

  it("handles mixed text", () => {
    const tokens = tokenize("AI 机器学习 deep");
    expect(tokens).toContain("ai");
    expect(tokens).toContain("deep");
    expect(tokens).toContain("机器");
  });
});

describe("BM25", () => {
  const pages: WikiPage[] = [
    makePage("ml", "Machine Learning", "Machine learning is a field of AI."),
    makePage("dl", "Deep Learning", "Deep learning uses neural networks."),
    makePage("nlp", "NLP", "Natural language processing uses transformers."),
  ];

  it("builds index and searches", () => {
    const index = buildBM25Index(pages);
    const results = searchBM25("machine learning AI", index);

    expect(results.get("ml")).toBeGreaterThan(0);
    // "machine" and "learning" appear in the ML page
    expect(results.get("ml")!).toBeGreaterThan(results.get("nlp") || 0);
  });

  it("returns empty for no matches", () => {
    const index = buildBM25Index(pages);
    const results = searchBM25("xyznonexistent", index);
    expect(results.size).toBe(0);
  });
});

describe("reciprocalRankFusion", () => {
  it("fuses multiple ranked lists", () => {
    const list1 = new Map([
      ["a", 10],
      ["b", 5],
      ["c", 1],
    ]);
    const list2 = new Map([
      ["b", 10],
      ["c", 5],
      ["a", 1],
    ]);

    const fused = reciprocalRankFusion([
      { scores: list1, weight: 1 },
      { scores: list2, weight: 1 },
    ]);

    // 'b' should rank high (top in one, second in another)
    expect(fused.get("b")!).toBeGreaterThan(0);
    expect(fused.get("a")!).toBeGreaterThan(0);
  });
});

describe("graphExpand", () => {
  it("expands from hit nodes", () => {
    const pages: WikiPage[] = [
      makePage("a", "A", "Link to [[b]]."),
      makePage("b", "B", "Link to [[c]]."),
      makePage("c", "C", ""),
    ];
    const graph = buildGraph(pages, defaultConfig);

    const expanded = graphExpand(new Set(["a"]), graph, 1);
    expect(expanded.has("b")).toBe(true);
  });
});

describe("hybridSearch", () => {
  it("returns sorted results", () => {
    const pages: WikiPage[] = [
      makePage("ml", "Machine Learning", "Machine learning is a field."),
      makePage("dl", "Deep Learning", "Deep learning uses neural nets."),
      makePage("nlp", "NLP", "Natural language processing."),
    ];
    const index = buildBM25Index(pages);
    const graph = buildGraph(pages, defaultConfig);

    const results = hybridSearch(
      "machine learning",
      pages,
      index,
      graph,
      defaultConfig
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe("ml");
  });
});

describe("CJK search accuracy", () => {
  const pages: WikiPage[] = [
    makePage("ml-zh", "机器学习", "机器学习是人工智能的核心技术，包括监督学习和无监督学习。"),
    makePage("dl-zh", "深度学习", "深度学习使用神经网络进行特征提取和模式识别。"),
    makePage("nlp-zh", "自然语言处理", "自然语言处理利用机器学习理解人类语言。"),
  ];

  it("finds Chinese pages by Chinese query", () => {
    const index = buildBM25Index(pages);
    const results = searchBM25("机器学习", index);
    expect(results.get("ml-zh")).toBeGreaterThan(0);
    expect(results.get("ml-zh")!).toBeGreaterThan(results.get("dl-zh") || 0);
  });

  it("finds pages with partial CJK match", () => {
    const index = buildBM25Index(pages);
    const results = searchBM25("神经网络", index);
    expect(results.get("dl-zh")).toBeGreaterThan(0);
  });

  it("hybrid search works with CJK", () => {
    const index = buildBM25Index(pages);
    const graph = buildGraph(pages, defaultConfig);
    const results = hybridSearch("机器学习", pages, index, graph, defaultConfig);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe("ml-zh");
  });
});

describe("search edge cases", () => {
  it("handles empty query", () => {
    const pages: WikiPage[] = [makePage("a", "A", "Content.")];
    const index = buildBM25Index(pages);
    const results = searchBM25("", index);
    expect(results.size).toBe(0);
  });

  it("handles single page wiki", () => {
    const pages: WikiPage[] = [makePage("only", "Only Page", "The only page.")];
    const index = buildBM25Index(pages);
    const graph = buildGraph(pages, defaultConfig);
    const results = hybridSearch("only page", pages, index, graph, defaultConfig);
    expect(results.length).toBe(1);
    expect(results[0].slug).toBe("only");
  });

  it("handles empty wiki", () => {
    const pages: WikiPage[] = [];
    const index = buildBM25Index(pages);
    const results = searchBM25("anything", index);
    expect(results.size).toBe(0);
  });
});

function makePage(
  slug: string,
  title: string,
  content: string = ""
): WikiPage {
  return {
    slug,
    path: `wiki/${slug}.md`,
    relativePath: `${slug}.md`,
    frontmatter: {
      title,
      description: "Test",
      tags: ["test"],
    },
    content,
    raw: "",
    hash: contentHash(content),
    wikilinks: extractWikilinks(content),
    mtime: Date.now(),
  };
}
