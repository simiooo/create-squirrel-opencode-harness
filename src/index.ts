import chalk from 'chalk';
import { resolveInput } from './input.js';
import { checkDirectories, transactionalCopy, type DirectoryInfo } from './fileOps.js';
import { initI18n, t } from './i18n.js';

export interface RunOptions {
  positionalModel?: string;
  model?: string;
  interactive?: boolean;
  stdin?: boolean;
  lang?: string;
}

export async function run(options: RunOptions = {}, lang: string = 'en'): Promise<void> {
  // Ensure i18n is initialized
  await initI18n(lang);

  console.log(chalk.blue(`🐿️  ${t('title')}\n`));

  // Step 1: Resolve model input (from CLI args, stdin, or interactive)
  const model = await resolveInput(options);

  if (!model) {
    throw new Error(t('errors.modelRequired'));
  }

  console.log(chalk.gray(t('info.usingModel', { model }) + '\n'));

  // Step 2: Check and create directories
  const dirs: DirectoryInfo = await checkDirectories();

  // Step 3: Transactional copy with template processing
  await transactionalCopy(model, dirs);

  console.log(chalk.green(`\n✅ ${t('info.success')}`));
  console.log(chalk.gray(`   ${t('info.location', { path: dirs.targetDir })}`));
}
