import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { searchCommand } from './commands/search.js';
import { graphCommand } from './commands/graph.js';
import { statusCommand } from './commands/status.js';
import { syncCommand } from './commands/sync.js';
import { skillCommand } from './commands/skill.js';

const program = new Command();

program
  .name('llm-wiki')
  .description('Agent-native LLM Wiki — AI-maintained knowledge base')
  .version('0.2.0');

program.addCommand(initCommand);
program.addCommand(searchCommand);
program.addCommand(graphCommand);
program.addCommand(statusCommand);
program.addCommand(syncCommand);
program.addCommand(skillCommand);

program.parse();
