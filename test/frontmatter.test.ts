import { describe, it, expect } from "vitest";
import { parseFrontmatter, serializeFrontmatter } from "../src/utils/frontmatter.js";

describe("parseFrontmatter — edge cases", () => {
  it("handles CJK titles", () => {
    const raw = `---
title: 机器学习概述
description: 这是一个关于机器学习的文档
tags: [人工智能, 深度学习]
---
内容在这里。`;
    const parsed = parseFrontmatter(raw);
    expect(parsed.frontmatter.title).toBe("机器学习概述");
    expect(parsed.frontmatter.description).toBe("这是一个关于机器学习的文档");
    expect(parsed.frontmatter.tags).toEqual(["人工智能", "深度学习"]);
    expect(parsed.content).toBe("内容在这里。");
  });

  it("handles special characters in values", () => {
    const raw = `---
title: "O'Reilly: A Book Review"
description: "Backslash and colon: here"
tags: [c++, c#]
---
Content.`;
    const parsed = parseFrontmatter(raw);
    expect(parsed.frontmatter.title).toBe("O'Reilly: A Book Review");
    expect(parsed.frontmatter.tags).toContain("c++");
    expect(parsed.content).toBe("Content.");
  });

  it("handles damaged/invalid YAML gracefully", () => {
    const raw = `---
title: [invalid yaml
  this is broken: {{
---
Content after broken yaml.`;
    const parsed = parseFrontmatter(raw);
    // Should fall back to empty frontmatter
    expect(parsed.frontmatter.title).toBe("");
    expect(parsed.content).toBe("Content after broken yaml.");
  });

  it("handles frontmatter with extra unknown fields", () => {
    const raw = `---
title: Extended
description: Has extra fields
tags: [test]
custom_field: some value
another: 42
---
Body.`;
    const parsed = parseFrontmatter(raw);
    expect(parsed.frontmatter.title).toBe("Extended");
    expect(parsed.frontmatter.custom_field).toBe("some value");
    expect(parsed.frontmatter.another).toBe(42);
  });

  it("handles multiline description", () => {
    const raw = `---
title: Multiline
description: >
  This is a long description
  that spans multiple lines
tags: []
---
Content.`;
    const parsed = parseFrontmatter(raw);
    expect(parsed.frontmatter.description).toContain("This is a long description");
  });

  it("handles content with --- inside body", () => {
    const raw = `---
title: Test
---
Some content.

---

A horizontal rule above.`;
    const parsed = parseFrontmatter(raw);
    expect(parsed.frontmatter.title).toBe("Test");
    expect(parsed.content).toContain("A horizontal rule above.");
  });

  it("handles Windows line endings (CRLF)", () => {
    const raw = "---\r\ntitle: Windows\r\ntags: [test]\r\n---\r\nContent here.";
    const parsed = parseFrontmatter(raw);
    expect(parsed.frontmatter.title).toBe("Windows");
    expect(parsed.content).toBe("Content here.");
  });
});

describe("serializeFrontmatter — edge cases", () => {
  it("round-trips CJK content", () => {
    const fm = { title: "机器学习", description: "概述", tags: ["AI", "ML"] };
    const content = "中文内容。";
    const serialized = serializeFrontmatter(fm, content);
    const parsed = parseFrontmatter(serialized);
    expect(parsed.frontmatter.title).toBe("机器学习");
    expect(parsed.content).toBe("中文内容。");
  });

  it("round-trips special characters", () => {
    const fm = { title: "O'Reilly", description: 'Quote "test"', tags: [] };
    const content = "Body.";
    const serialized = serializeFrontmatter(fm, content);
    const parsed = parseFrontmatter(serialized);
    expect(parsed.frontmatter.title).toBe("O'Reilly");
  });

  it("handles empty content", () => {
    const fm = { title: "Empty", description: "", tags: [] };
    const serialized = serializeFrontmatter(fm, "");
    const parsed = parseFrontmatter(serialized);
    expect(parsed.frontmatter.title).toBe("Empty");
    expect(parsed.content).toBe("");
  });
});
