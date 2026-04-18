import { Command } from 'commander';
import { requireVaultRoot, vaultPaths } from '../lib/config.js';
import { loadWikiPages } from '../lib/wiki.js';
import { bm25Search } from '../lib/search.js';

export const searchCommand = new Command('search')
  .description('Search wiki pages using BM25 keyword search')
  .argument('<query>', 'search query')
  .option('-n, --limit <number>', 'max results', '10')
  .action((query: string, opts: { limit: string }) => {
    const root = requireVaultRoot();
    const paths = vaultPaths(root);
    const pages = loadWikiPages(paths.wiki);

    if (pages.length === 0) {
      console.log('No wiki pages found. Use /ingest to add content.');
      return;
    }

    const limit = parseInt(opts.limit, 10);
    const results = bm25Search(pages, query, limit);

    if (results.length === 0) {
      console.log(`No results for "${query}"`);
      return;
    }

    console.log(`Results for "${query}" (${results.length} matches):\n`);
    for (const { page, score } of results) {
      console.log(`  ${page.slug}`);
      console.log(`    Title: ${page.title}`);
      if (page.description) console.log(`    ${page.description}`);
      console.log(`    Score: ${score.toFixed(3)} | Tags: ${page.tags.join(', ') || 'none'}`);
      console.log('');
    }
  });
