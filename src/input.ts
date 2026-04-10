import inquirer from 'inquirer';
import { t } from './i18n.js';

export interface InputOptions {
  positionalModel?: string;
  model?: string;
  interactive?: boolean;
  stdin?: boolean;
}

export async function resolveInput(options: InputOptions): Promise<string | null> {
  // Priority 1: CLI argument (positional)
  if (options.positionalModel) {
    return options.positionalModel;
  }

  // Priority 2: CLI option --model
  if (options.model) {
    return options.model;
  }

  // Priority 3: Stdin
  if (options.stdin) {
    return readStdin();
  }

  // Priority 4: Interactive mode (if requested or as fallback)
  if (options.interactive || !hasModelInput(options)) {
    return promptInteractive();
  }

  return null;
}

function hasModelInput(options: InputOptions): boolean {
  return !!(options.positionalModel || options.model || options.stdin);
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (chunk: string) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      const trimmed = data.trim();
      if (!trimmed) {
        reject(new Error(t('errors.stdinNoData')));
      } else {
        resolve(trimmed);
      }
    });

    process.stdin.on('error', (err: Error) => {
      reject(new Error(t('errors.stdinReadError', { message: err.message })));
    });

    // If stdin is a TTY (not piped), we need to handle it differently
    if (process.stdin.isTTY) {
      reject(new Error(t('errors.stdinNotAvailable')));
    }
  });
}

async function promptInteractive(): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'model',
      message: t('prompts.enterModel'),
      validate: (input: string) => {
        if (!input || input.trim() === '') {
          return t('prompts.modelRequired');
        }
        return true;
      }
    }
  ]);

  return (answers.model as string).trim();
}
