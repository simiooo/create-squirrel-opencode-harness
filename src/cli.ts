import { Command } from 'commander';
import chalk from 'chalk';
import { run } from './index.js';
import { initI18n, t } from './i18n.js';

interface CliOptions {
  model?: string;
  interactive?: boolean;
  stdin?: boolean;
  lang?: string;
}

const program = new Command();

program
  .name('create-squirrel-opencode-harness')
  .description('Scaffold squirrel opencode harness into .opencode directory')
  .version('1.0.0')
  .option('-m, --model <model>', 'Model identifier for agents (e.g., fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo)')
  .option('-i, --interactive', 'Use interactive mode to input model')
  .option('--stdin', 'Read model from stdin')
  .option('-l, --lang <lang>', 'Language (en/zh)', 'en')
  .argument('[model]', 'Model identifier (positional argument)')
  .action(async (positionalModel: string | undefined, options: CliOptions) => {
    try {
      // Initialize i18n with selected language
      const lang = options.lang === 'zh' ? 'zh' : 'en';
      await initI18n(lang);

      // Update program description based on language
      program.description(t('cli.description'));

      await run({
        positionalModel,
        ...options
      }, lang);
    } catch (error: unknown) {
      // Ensure i18n is initialized even for early errors
      if (error instanceof Error) {
        console.error(chalk.red('Error:'), error.message);
      } else {
        console.error(chalk.red('Error:'), String(error));
      }
      process.exit(1);
    }
  });

program.parse();
