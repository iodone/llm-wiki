import { Command } from 'commander';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { requireVaultRoot, vaultPaths } from '../lib/config.js';
import { computeSync, loadSyncState, saveSyncState, updateSyncState } from '../lib/sync.js';

export const syncCommand = new Command('sync')
  .description('Track changes and update sync state (mtime + content hash)')
  .option('--dry-run', 'show changes without updating state')
  .action((opts: { dryRun?: boolean }) => {
    const root = requireVaultRoot();
    const paths = vaultPaths(root);

    // Ensure .llm-wiki directory exists
    mkdirSync(dirname(paths.syncState), { recursive: true });

    const state = loadSyncState(paths.syncState);
    const result = computeSync([paths.wiki, paths.sources], root, state);

    const totalChanges = result.added.length + result.modified.length + result.deleted.length;

    if (totalChanges === 0) {
      console.log('Everything up to date.');
      return;
    }

    if (result.added.length > 0) {
      console.log(`Added (${result.added.length}):`);
      for (const f of result.added) console.log(`  + ${f}`);
    }
    if (result.modified.length > 0) {
      console.log(`Modified (${result.modified.length}):`);
      for (const f of result.modified) console.log(`  ~ ${f}`);
    }
    if (result.deleted.length > 0) {
      console.log(`Deleted (${result.deleted.length}):`);
      for (const f of result.deleted) console.log(`  - ${f}`);
    }

    console.log(`\nTotal: ${totalChanges} changes, ${result.unchanged.length} unchanged`);

    if (opts.dryRun) {
      console.log('\n(dry run — state not updated)');
      return;
    }

    const newState = updateSyncState([paths.wiki, paths.sources], root, state);
    saveSyncState(paths.syncState, newState);
    console.log(`\nSync state updated (${newState.lastSync})`);
  });
