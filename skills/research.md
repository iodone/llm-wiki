# Research — Deep-Dive Investigation

You are an AI agent performing deep research on a topic for an LLM Wiki. Unlike Query (which answers from existing Wiki content), Research goes beyond the Wiki — searching the web, reading external sources, and ingesting new knowledge into the Wiki.

## Context

The LLM Wiki follows a three-layer architecture:
- **sources/** — Raw, immutable source documents
- **wiki/** — AI-maintained Markdown pages with cross-references
- **schema.md** — Defines the Wiki's domain, page types, and naming conventions
- **purpose.md** — Describes the Wiki's purpose and scope

## Input

You will be given a research topic or question. This is typically triggered when:
- A Query reveals knowledge gaps the Wiki can't answer
- The user explicitly asks for deep research on a topic
- A Lint report identifies areas that need enrichment

## Procedure

### Step 1: Scope the Research

1. Read `purpose.md` — confirm the topic is within the Wiki's domain
2. Read `schema.md` — understand what page types and structures to target
3. Run a **Query** first — understand what the Wiki already knows about this topic
4. Identify **knowledge gaps** — what's missing, outdated, or insufficient

Define a clear research question and scope. Avoid scope creep.

### Step 2: Gather External Sources

Search for high-quality sources. Prioritize:
- Primary sources (official docs, papers, original announcements)
- Authoritative secondary sources (well-known publications, expert blogs)
- Recency — prefer recent sources for fast-moving topics

For each source found:
1. Save it to `sources/` with a descriptive filename
2. Add frontmatter:
   ```yaml
   ---
   title: Source Title
   url: https://original-url (if from web)
   author: Author Name
   date: YYYY-MM-DD (publication date)
   retrieved: YYYY-MM-DD (date you accessed it)
   type: article | paper | documentation | blog | video-transcript
   ---
   ```
3. Save the content as Markdown below the frontmatter

### Step 3: Ingest Sources

For each new source, run the **Ingest** procedure:
- Extract key entities and claims
- Create or update Wiki pages
- Add cross-references
- Mark source as ingested

### Step 4: Synthesize Research Report

After all sources are ingested, write a research summary:

```markdown
## Research Report: [Topic]

### Question
[The original research question]

### Findings
[Synthesized answer based on all sources gathered and ingested]

### Sources Added
- sources/source-1.md — [what it contributed]
- sources/source-2.md — [what it contributed]

### Wiki Pages Created/Updated
- [[page-1]] — [what was added]
- [[page-2]] — [what was added]

### Remaining Gaps
- [What still couldn't be answered]
- [Suggested follow-up research]
```

### Step 5: Knowledge Compounding

If the research produced a novel synthesis (connecting information across multiple new sources), create a synthesis page in the Wiki following the **Query** skill's compounding rules.

## Quality Standards

- **Source diversity** — Don't rely on a single source. Cross-reference claims across 2+ sources.
- **Recency** — Note the publication date. Flag information older than 2 years for fast-moving fields.
- **Attribution** — Every claim in a Wiki page must be traceable to a source via the `sources` frontmatter field.
- **Scope discipline** — Stay within the research question. If you discover interesting tangents, note them as "suggested follow-up" but don't pursue them in this session.

## Research Templates

### Template: General Research
```
Topic: [topic]
Scope: [what to cover]
Depth: [overview | detailed | exhaustive]
```

### Template: Competitive Analysis
```
Topic: [product/technology]
Compare: [list of alternatives]
Dimensions: [features, performance, cost, community, ...]
```
