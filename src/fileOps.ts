import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import ejs from 'ejs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { t } from './i18n.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_AGENTS_DIR = path.resolve(__dirname, '..', 'agents');

export interface DirectoryInfo {
  sourceAgentsDir: string;
  targetDir: string;
  targetAgentsDir: string;
  targetHarnessDir: string;
  targetSprintsDir: string;
  hasSourceAgents: boolean;
}

interface FileToCopy {
  source: string;
  target: string;
  relativePath: string;
}

function getTargetDirs() {
  const targetBaseDir = path.resolve(process.cwd(), '.opencode');
  return {
    targetBaseDir,
    targetAgentsDir: path.join(targetBaseDir, 'agents'),
    targetHarnessDir: path.join(targetBaseDir, 'harness'),
    targetSprintsDir: path.join(targetBaseDir, 'harness', 'sprints')
  };
}

export async function checkDirectories(): Promise<DirectoryInfo> {
  console.log(chalk.gray(t('info.checkingDirs')));

  const hasSourceAgents = await fs.pathExists(SOURCE_AGENTS_DIR);

  if (!hasSourceAgents) {
    throw new Error(
      `${t('errors.sourceNotFound')}\n` +
      `  - ${SOURCE_AGENTS_DIR}`
    );
  }

  const { targetBaseDir, targetAgentsDir, targetHarnessDir, targetSprintsDir } = getTargetDirs();

  await fs.ensureDir(targetBaseDir);
  console.log(chalk.gray(`  ✓ ${targetBaseDir}`));

  await fs.ensureDir(targetAgentsDir);
  console.log(chalk.gray(`  ✓ ${targetAgentsDir}`));

  await fs.ensureDir(targetHarnessDir);
  console.log(chalk.gray(`  ✓ ${targetHarnessDir}`));

  await fs.ensureDir(targetSprintsDir);
  console.log(chalk.gray(`  ✓ ${targetSprintsDir}`));

  return {
    sourceAgentsDir: SOURCE_AGENTS_DIR,
    targetDir: targetBaseDir,
    targetAgentsDir,
    targetHarnessDir,
    targetSprintsDir,
    hasSourceAgents
  };
}

export async function transactionalCopy(model: string, dirs: DirectoryInfo): Promise<void> {
  console.log(chalk.gray(`\n${t('info.transactionCheck')}`));

  const filesToCopy: FileToCopy[] = [];
  const existingFiles: string[] = [];

  const agentFiles = await glob('**/*.md', {
    cwd: dirs.sourceAgentsDir,
    absolute: true
  });

  for (const sourcePath of agentFiles) {
    const relativePath = path.relative(dirs.sourceAgentsDir, sourcePath);
    const targetPath = path.join(dirs.targetAgentsDir, relativePath);

    if (await fs.pathExists(targetPath)) {
      existingFiles.push(targetPath);
    } else {
      filesToCopy.push({
        source: sourcePath,
        target: targetPath,
        relativePath
      });
    }
  }

  // Check for existing harness directories that would conflict
  const harnessDirs = ['sprints'];
  for (const subDir of harnessDirs) {
    const targetPath = path.join(dirs.targetHarnessDir, subDir);
    if (await fs.pathExists(targetPath)) {
      const contents = await fs.readdir(targetPath);
      if (contents.length > 0) {
        existingFiles.push(targetPath);
      }
    }
  }

  if (existingFiles.length > 0) {
    console.error(chalk.red(`\n❌ ${t('transaction.failed')}`));
    for (const file of existingFiles) {
      console.error(chalk.red(`   - ${file}`));
    }
    throw new Error(t('errors.transactionFailed', { count: existingFiles.length }));
  }

  console.log(chalk.gray(`  ✓ ${t('info.noConflicts', { count: filesToCopy.length })}`));

  console.log(chalk.gray(`\n${t('info.copyingFiles')}`));

  for (const file of filesToCopy) {
    await fs.ensureDir(path.dirname(file.target));

    const content = await fs.readFile(file.source, 'utf-8');
    const processed = await processTemplate(content, { model });
    await fs.writeFile(file.target, processed);

    console.log(chalk.gray(`  ✓ ${file.relativePath}`));
  }
}

async function processTemplate(content: string, data: Record<string, string>): Promise<string> {
  try {
    const result = ejs.render(content, data, {
      async: false
    });
    return result;
  } catch {
    return content;
  }
}