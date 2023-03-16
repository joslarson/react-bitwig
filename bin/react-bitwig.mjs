#!/usr/bin/env node
import { program } from 'commander';
import { v4 as uuid } from 'uuid';
import colors from 'colors/safe.js';

import init from './tasks/init.mjs';

// init command
program
  .command('init [dirname]')
  .description(
    'Initialize a new project with dirname (defaults to current directory).'
  )
  .option('-t, --typescript', 'setup project to use TypeScript')
  .action((dirname, options) => init(dirname, options.typescript));

// uuid generator
program
  .command('uuid')
  .description('Generate a UUID')
  .action(() => console.log(colors.green(uuid())));

// parse args and run commands
program.parse(process.argv);

// no command? print help
if (!process.argv.slice(2).length) program.outputHelp();
