import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serializeFrontmatter, type Frontmatter } from "../../src/utils/frontmatter.js";
import { generateToml, type WikiConfig } from "../../src/config.js";

export interface TestPage {
  slug: string;
  frontmatter: Partial<Frontmatter>;
  content: string;
}

export const DEFAULT_CONFIG: WikiConfig = {
  wiki: { name: "Test Wiki", language: "en", template: "general" },
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

/**
 * Create a temporary directory for test isolation.
 */
export function createTempDir(prefix: string = "llm-wiki-test-"): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/**
 * Create a test wiki page file.
 */
export function createTestPage(
  wikiDir: string,
  slug: string,
  frontmatter: Partial<Frontmatter>,
  content: string
): string {
  const fm: Frontmatter = {
    title: frontmatter.title || slug,
    description: frontmatter.description ?? "Test description",
    tags: frontmatter.tags ?? ["test"],
    ...frontmatter,
  };

  const filePath = join(wikiDir, `${slug}.md`);
  const dir = join(wikiDir, ...slug.split("/").slice(0, -1));
  mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, serializeFrontmatter(fm, content), "utf-8");
  return filePath;
}

/**
 * Set up a complete test wiki environment in a temp directory.
 * Returns the project root directory.
 */
export function createTestWiki(
  pages: TestPage[],
  config?: Partial<WikiConfig>
): string {
  const projectDir = createTempDir();
  const wikiDir = join(projectDir, "wiki");
  const sourcesDir = join(projectDir, "sources");
  const llmWikiDir = join(projectDir, ".llm-wiki");

  mkdirSync(wikiDir, { recursive: true });
  mkdirSync(sourcesDir, { recursive: true });
  mkdirSync(llmWikiDir, { recursive: true });

  // Write config
  const finalConfig: WikiConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  writeFileSync(
    join(projectDir, "llm-wiki.toml"),
    generateToml(finalConfig),
    "utf-8"
  );

  // Write pages
  for (const page of pages) {
    createTestPage(wikiDir, page.slug, page.frontmatter, page.content);
  }

  return projectDir;
}

/**
 * Add a source file to a test wiki.
 */
export function addTestSource(
  projectDir: string,
  relativePath: string,
  content: string
): string {
  const filePath = join(projectDir, "sources", relativePath);
  const dir = join(projectDir, "sources", ...relativePath.split("/").slice(0, -1));
  mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

// ─── Standard Fixtures ────────────────────────────────────────────

export const STANDARD_PAGES: TestPage[] = [
  {
    slug: "concepts/machine-learning",
    frontmatter: {
      title: "Machine Learning",
      description: "An overview of machine learning",
      tags: ["ai", "ml"],
      page_type: "concept",
      sources: ["papers/ml-survey.pdf"],
    },
    content:
      "Machine learning is a subset of [[concepts/artificial-intelligence]]. Related to [[concepts/deep-learning]] and [[entities/geoffrey-hinton]].",
  },
  {
    slug: "concepts/deep-learning",
    frontmatter: {
      title: "Deep Learning",
      description: "Neural network-based learning",
      tags: ["ai", "ml", "neural-networks"],
      page_type: "concept",
      sources: ["papers/ml-survey.pdf"],
    },
    content:
      "Deep learning uses [[concepts/neural-networks]]. See also [[concepts/machine-learning]].",
  },
  {
    slug: "concepts/artificial-intelligence",
    frontmatter: {
      title: "Artificial Intelligence",
      description: "The field of AI",
      tags: ["ai"],
      page_type: "concept",
    },
    content:
      "AI encompasses [[concepts/machine-learning]], [[topics/nlp]], and more.",
  },
  {
    slug: "concepts/neural-networks",
    frontmatter: {
      title: "Neural Networks",
      description: "Computational models inspired by biological neural networks",
      tags: ["ai", "ml", "neural-networks"],
      page_type: "concept",
    },
    content:
      "Neural networks are the foundation of [[concepts/deep-learning]].",
  },
  {
    slug: "entities/geoffrey-hinton",
    frontmatter: {
      title: "Geoffrey Hinton",
      description: "Pioneer of deep learning",
      tags: ["person", "ai"],
      page_type: "entity",
    },
    content:
      'Geoffrey Hinton is known for his work on [[concepts/deep-learning]] and [[concepts/neural-networks]].',
  },
  {
    slug: "topics/nlp",
    frontmatter: {
      title: "Natural Language Processing",
      description: "Processing and understanding human language",
      tags: ["ai", "nlp"],
      page_type: "topic",
    },
    content:
      "NLP uses [[concepts/machine-learning]] and [[concepts/deep-learning]] for text understanding.",
  },
  {
    slug: "topics/computer-vision",
    frontmatter: {
      title: "Computer Vision",
      description: "Visual understanding by machines",
      tags: ["ai", "cv"],
      page_type: "topic",
    },
    content:
      "Computer vision relies on [[concepts/deep-learning]] and [[concepts/neural-networks]].",
  },
  {
    slug: "insights/ai-convergence",
    frontmatter: {
      title: "AI Field Convergence",
      description: "NLP and CV are converging through transformer architectures",
      tags: ["ai", "insight"],
      page_type: "insight",
    },
    content:
      "[[topics/nlp]] and [[topics/computer-vision]] are converging through shared architectures like transformers.",
  },
];

export const CJK_PAGES: TestPage[] = [
  {
    slug: "concepts/ji-qi-xue-xi",
    frontmatter: {
      title: "机器学习",
      description: "机器学习是人工智能的一个分支",
      tags: ["人工智能", "机器学习"],
      page_type: "concept",
    },
    content:
      "机器学习是[[concepts/ren-gong-zhi-neng]]的核心技术。深度学习是机器学习的子领域。",
  },
  {
    slug: "concepts/ren-gong-zhi-neng",
    frontmatter: {
      title: "人工智能",
      description: "人工智能概述",
      tags: ["人工智能"],
      page_type: "concept",
    },
    content:
      "人工智能包括[[concepts/ji-qi-xue-xi]]、自然语言处理等方向。",
  },
];
