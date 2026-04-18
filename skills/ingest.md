# Ingest — Source Document to Wiki Pages

You are an AI agent performing knowledge ingestion for an LLM Wiki. Your job is to read a source document, extract knowledge, and create or update interconnected Wiki pages.

## Context

The LLM Wiki follows a three-layer architecture:
- **sources/** — Raw, immutable source documents (articles, papers, notes, web clips)
- **wiki/** — AI-maintained Markdown pages with cross-references and summaries
- **schema.md** — Defines the Wiki's domain, page types, and naming conventions
- **purpose.md** — Describes the Wiki's purpose and scope

## Input

You will be given a source document to ingest. Before starting, read:
1. `purpose.md` — to understand what this Wiki is about
2. `schema.md` — to understand page types, naming conventions, and structure rules
3. The source document itself

## Procedure

### Step 1: Analyze the Source

Read the source document carefully. Identify:
- **Key entities** — people, projects, concepts, technologies, organizations
- **Key claims** — facts, relationships, opinions, data points
- **Relevance** — how this document relates to the Wiki's purpose (from `purpose.md`)

If the source is not relevant to the Wiki's purpose, stop and report: "Source is outside the Wiki's scope."

### Step 2: Plan Wiki Updates

Determine which Wiki pages need to be created or updated. For each page:
- Check if `wiki/<page-name>.md` already exists
- If it exists, read it to understand current content
- Decide: **create new** or **merge into existing**

Follow `schema.md` for:
- Page naming conventions (e.g., kebab-case, entity-type prefix)
- Required frontmatter fields
- Page structure templates

### Step 3: Write/Update Wiki Pages

For each page, apply these rules:

**Frontmatter** (YAML):
```yaml
---
title: Page Title
aliases: [alternate names]
tags: [domain-specific tags from schema.md]
sources: [relative paths to source documents that contributed]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

**Content rules**:
- Write in clear, concise prose. Summarize, don't copy.
- Use `[[wikilinks]]` to cross-reference other Wiki pages. Link generously — every entity mention that has (or should have) its own page gets a link.
- When updating an existing page, **merge** new information. Do not overwrite existing content unless it's contradicted by a more authoritative or more recent source. If contradicted, note the conflict with both sources cited.
- Add the source document to the `sources` list in frontmatter.
- Keep pages focused. If a section grows too large, split it into its own page and link back.

**Cross-referencing**:
- After writing all pages, review them for missing cross-references.
- If you reference an entity that doesn't have a Wiki page yet, still use `[[wikilink]]` — it creates a discoverable "wanted page."
- Add a `## Related` section at the bottom listing related pages: `- [[page-name]] — one-line description of relationship`

### Step 4: Update Source Index

Add a YAML frontmatter block to the source document (if not already present):
```yaml
---
ingested: YYYY-MM-DD
wiki_pages: [list of wiki pages created/updated from this source]
---
```

If the source already has frontmatter, add or update the `ingested` and `wiki_pages` fields.

## Output Checklist

After ingestion, verify:
- [ ] All key entities from the source have Wiki pages (new or updated)
- [ ] All pages follow `schema.md` conventions
- [ ] Cross-references (`[[wikilinks]]`) connect related pages
- [ ] Source document has `ingested` and `wiki_pages` metadata
- [ ] No content was lost from existing Wiki pages during merge
- [ ] `sources` frontmatter in each updated Wiki page includes the new source

## Example

Given a source `sources/karpathy-llm-os-2024.md` about Karpathy's "LLM OS" talk:

1. Read purpose.md → Wiki is about AI/ML research
2. Read schema.md → entity pages use `kebab-case`, concept pages get `concept-` prefix
3. Analyze source → entities: Andrej Karpathy, LLM OS; concepts: tool use, System 2 thinking
4. Create/update:
   - `wiki/andrej-karpathy.md` — add LLM OS talk reference
   - `wiki/concept-llm-os.md` — new page summarizing the concept
   - `wiki/concept-tool-use.md` — update with Karpathy's framing
   - `wiki/concept-system-2-thinking.md` — update with LLM OS context
5. Add cross-references between all pages
6. Mark source as ingested
