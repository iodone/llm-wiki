# Lint — Wiki Health Check

You are an AI agent performing a health check on an LLM Wiki. Your job is to identify quality issues — contradictions, orphan pages, stale content, missing cross-references — and fix them.

## Context

The LLM Wiki follows a three-layer architecture:
- **sources/** — Raw, immutable source documents
- **wiki/** — AI-maintained Markdown pages with cross-references
- **schema.md** — Defines the Wiki's domain, page types, and naming conventions
- **purpose.md** — Describes the Wiki's purpose and scope

## Input

You may be given:
- A specific page or set of pages to lint
- A category/tag to lint
- No input (lint the entire Wiki)

## Procedure

### Step 1: Scan

Read `schema.md` to understand the expected structure. Then scan the Wiki:

1. **List all pages** in `wiki/`
2. **List all sources** in `sources/`
3. **Build a link graph** — for each page, extract all `[[wikilinks]]`

### Step 2: Check for Issues

Run these checks in order:

#### 2a. Structural Issues
- **Orphan pages** — Wiki pages with no incoming `[[wikilinks]]` from other pages
- **Broken links** — `[[wikilinks]]` that point to non-existent pages (wanted pages)
- **Missing frontmatter** — Pages without required YAML fields per `schema.md`
- **Naming violations** — Page names that don't follow `schema.md` conventions
- **Duplicate topics** — Multiple pages covering the same entity/concept (check `aliases`)

#### 2b. Content Issues
- **Contradictions** — Pages that make conflicting claims about the same topic. Compare claims across pages that share `[[wikilinks]]` or tags.
- **Stale content** — Pages whose `updated` date is significantly older than their sources' modification dates (source was updated but Wiki page wasn't)
- **Unsourced claims** — Pages with empty or missing `sources` in frontmatter
- **Shallow pages** — Pages with very little content (< 3 sentences excluding frontmatter) that should either be expanded or merged

#### 2c. Source Issues
- **Uningested sources** — Files in `sources/` without an `ingested` date in their frontmatter
- **Source drift** — Sources whose content has changed since their `ingested` date (file modification date > ingested date)

### Step 3: Report

Generate a structured report:

```markdown
## Lint Report — YYYY-MM-DD

### Summary
- Total pages: N
- Total sources: N
- Issues found: N (critical: X, warning: Y, info: Z)

### Critical Issues
[Issues that cause broken functionality or data loss]

- **Broken link**: [[page-a]] links to [[nonexistent-page]]
- **Contradiction**: [[page-b]] says X, but [[page-c]] says Y (re: topic Z)

### Warnings
[Issues that degrade Wiki quality]

- **Orphan page**: [[page-d]] has no incoming links
- **Stale content**: [[page-e]] not updated since YYYY-MM-DD, but source was modified on YYYY-MM-DD
- **Unsourced**: [[page-f]] has no sources listed

### Info
[Suggestions for improvement]

- **Shallow page**: [[page-g]] has only 2 sentences — consider expanding or merging
- **Wanted page**: [[mentioned-but-unwritten]] is linked from 3 pages but doesn't exist
- **Uningested source**: sources/new-article.md has not been ingested
```

### Step 4: Auto-Fix (if requested)

If asked to fix issues (not just report), apply these fixes:

| Issue | Auto-Fix |
|-------|----------|
| Broken link | Remove the link or create a stub page |
| Missing frontmatter | Add required fields with sensible defaults |
| Orphan page | Add links from related pages (find by tag/topic match) |
| Stale content | Re-read source and update the page (mini-ingest) |
| Duplicate topics | Merge into one page, redirect the other via alias |
| Shallow page | Expand from sources, or merge into a related page |

**Never auto-fix contradictions** — report them for human review. Contradictions require judgment about which source is more authoritative.

## Running Modes

- `lint` — Full scan, report only
- `lint --fix` — Full scan, auto-fix what's safe, report the rest
- `lint <page>` — Lint a specific page and its immediate neighbors
- `lint --sources` — Only check source ingestion status
