import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import ejs from 'ejs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { t } from './i18n.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source directories (where templates are stored) - relative to src/ directory
const SOURCE_AGENTS_DIR = path.resolve(__dirname, '..', 'agents');
const SOURCE_HARNESS_DIR = path.resolve(__dirname, '..', 'harness');

export interface DirectoryInfo {
  sourceAgentsDir: string;
  sourceHarnessDir: string;
  targetDir: string;
  targetAgentsDir: string;
  targetHarnessDir: string;
  hasSourceAgents: boolean;
  hasSourceHarness: boolean;
}

interface FileToCopy {
  source: string;
  target: string;
  isAgent: boolean;
  relativePath: string;
}

// Target directories (computed at runtime to support test isolation)
function getTargetDirs() {
  const targetBaseDir = path.resolve(process.cwd(), '.opencode');
  return {
    targetBaseDir,
    targetAgentsDir: path.join(targetBaseDir, 'agents'),
    targetHarnessDir: path.join(targetBaseDir, 'harness')
  };
}

export async function checkDirectories(): Promise<DirectoryInfo> {
  console.log(chalk.gray(t('info.checkingDirs')));

  // Check if source directories exist
  const hasSourceAgents = await fs.pathExists(SOURCE_AGENTS_DIR);
  const hasSourceHarness = await fs.pathExists(SOURCE_HARNESS_DIR);

  if (!hasSourceAgents && !hasSourceHarness) {
    throw new Error(
      `${t('errors.sourceNotFound')}\n` +
      `  - ${SOURCE_AGENTS_DIR}\n` +
      `  - ${SOURCE_HARNESS_DIR}`
    );
  }

  // Get target directories (computed at runtime)
  const { targetBaseDir, targetAgentsDir, targetHarnessDir } = getTargetDirs();

  // Create target directories if they don't exist
  await fs.ensureDir(targetBaseDir);
  console.log(chalk.gray(`  ✓ ${targetBaseDir}`));

  await fs.ensureDir(targetAgentsDir);
  console.log(chalk.gray(`  ✓ ${targetAgentsDir}`));

  await fs.ensureDir(targetHarnessDir);
  console.log(chalk.gray(`  ✓ ${targetHarnessDir}`));

  return {
    sourceAgentsDir: SOURCE_AGENTS_DIR,
    sourceHarnessDir: SOURCE_HARNESS_DIR,
    targetDir: targetBaseDir,
    targetAgentsDir,
    targetHarnessDir,
    hasSourceAgents,
    hasSourceHarness
  };
}

export async function transactionalCopy(model: string, dirs: DirectoryInfo): Promise<void> {
  console.log(chalk.gray(`\n${t('info.transactionCheck')}`));

  // Collect all files that need to be copied
  const filesToCopy: FileToCopy[] = [];
  const existingFiles: string[] = [];

  // Process agents directory
  if (dirs.hasSourceAgents) {
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
          isAgent: true,
          relativePath
        });
      }
    }
  }

  // Process harness directory
  if (dirs.hasSourceHarness) {
    const harnessFiles = await glob('**/*', {
      cwd: dirs.sourceHarnessDir,
      absolute: true,
      nodir: true
    });

    for (const sourcePath of harnessFiles) {
      const relativePath = path.relative(dirs.sourceHarnessDir, sourcePath);
      const targetPath = path.join(dirs.targetHarnessDir, relativePath);

      if (await fs.pathExists(targetPath)) {
        existingFiles.push(targetPath);
      } else {
        filesToCopy.push({
          source: sourcePath,
          target: targetPath,
          isAgent: false,
          relativePath
        });
      }
    }
  }

  // Transaction check: if any file exists, abort
  if (existingFiles.length > 0) {
    console.error(chalk.red(`\n❌ ${t('transaction.failed')}`));
    for (const file of existingFiles) {
      console.error(chalk.red(`   - ${file}`));
    }
    throw new Error(t('errors.transactionFailed', { count: existingFiles.length }));
  }

  console.log(chalk.gray(`  ✓ ${t('info.noConflicts', { count: filesToCopy.length })}`));

  // All checks passed, now perform the copy
  console.log(chalk.gray(`\n${t('info.copyingFiles')}`));

  for (const file of filesToCopy) {
    await fs.ensureDir(path.dirname(file.target));

    if (file.isAgent && file.relativePath.endsWith('.md')) {
      // Process template for agent markdown files
      const content = await fs.readFile(file.source, 'utf-8');
      const processed = await processTemplate(content, { model });
      await fs.writeFile(file.target, processed);
    } else {
      // Copy as-is for non-agent files
      await fs.copy(file.source, file.target);
    }

    console.log(chalk.gray(`  ✓ ${file.relativePath}`));
  }
}

async function processTemplate(content: string, data: Record<string, string>): Promise<string> {
  // Use EJS to render the template
  // The model variable will be replaced in the template
  try {
    const result = ejs.render(content, data, {
      async: false
    });
    return result;
  } catch (error) {
    // If EJS parsing fails, return original content
    // This handles files that may not be valid EJS templates
    return content;
  }
}
