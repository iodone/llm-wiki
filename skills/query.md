# Query — Search Wiki and Synthesize Answers

You are an AI agent performing knowledge queries against an LLM Wiki. Your job is to search the Wiki, synthesize an answer, and optionally write valuable answers back as new Wiki pages (knowledge compounding).

## Context

The LLM Wiki follows a three-layer architecture:
- **sources/** — Raw, immutable source documents
- **wiki/** — AI-maintained Markdown pages with cross-references
- **schema.md** — Defines the Wiki's domain, page types, and naming conventions
- **purpose.md** — Describes the Wiki's purpose and scope

## Input

You will be given a natural language question or topic to investigate.

## Procedure

### Step 1: Understand the Query

Parse the user's question. Identify:
- **Key terms** — entities, concepts, or topics to search for
- **Query type** — factual lookup, comparison, synthesis, exploration
- **Scope** — is this within the Wiki's domain? (check `purpose.md` if unclear)

### Step 2: Search the Wiki

Search strategy (apply in order, stop when you have enough context):

1. **Direct match** — Look for Wiki pages whose titles match key terms: `wiki/<term>.md`
2. **Wikilink search** — Find pages that contain `[[term]]` wikilinks
3. **Full-text search** — Search page content for key terms
4. **Graph walk** — Follow `[[wikilinks]]` and `## Related` sections from matched pages to discover connected knowledge

Read all relevant pages. Pay attention to:
- `sources` in frontmatter — trace back to original sources if needed
- `## Related` sections — follow links to build a complete picture
- Contradictions between pages — note them in your answer

### Step 3: Synthesize Answer

Compose an answer that:
- Directly addresses the user's question
- Cites Wiki pages as sources: "According to [[page-name]], ..."
- Notes any contradictions or knowledge gaps found
- Distinguishes between well-sourced claims and inferences

If the Wiki doesn't contain enough information to answer:
- Say so clearly
- Suggest what sources could be ingested to fill the gap
- If the user provides additional context, consider triggering an ingest

### Step 4: Knowledge Compounding (Optional)

If your synthesized answer produces **new insight** — a comparison, connection, or summary that doesn't exist in any single Wiki page — write it back to the Wiki:

1. Create a new page or update an existing one following `schema.md` conventions
2. Add proper frontmatter with `sources` listing the Wiki pages that contributed
3. Add `[[wikilinks]]` connecting to source pages
4. Mark the source as `query-synthesis` in the frontmatter:
   ```yaml
   ---
   title: Comparison of X and Y
   tags: [synthesis]
   sources: [wiki/x.md, wiki/y.md]
   source_type: query-synthesis
   created: YYYY-MM-DD
   updated: YYYY-MM-DD
   ---
   ```

**When to compound**:
- The answer connects 3+ Wiki pages in a way not previously documented
- The answer resolves a contradiction
- The answer fills a knowledge gap with high-confidence synthesis
- The user explicitly asks to save the answer

**When NOT to compound**:
- The answer is a simple lookup (just returning what's already on one page)
- The answer relies heavily on information outside the Wiki
- The synthesis is speculative or low-confidence

## Output Format

```
## Answer

[Your synthesized answer here, with [[wikilinks]] to cited pages]

## Sources Consulted

- [[page-1]] — what was relevant
- [[page-2]] — what was relevant

## Knowledge Gaps

- [Any questions that couldn't be fully answered]
- [Suggested sources to ingest]

## Compounded (if applicable)

- Created/updated: [[new-page]] — what was added
```
