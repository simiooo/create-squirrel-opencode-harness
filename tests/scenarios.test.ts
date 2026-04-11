import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { run } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createTempDir(): Promise<string> {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const tempDir = path.join(__dirname, '..', '.test-temp', uniqueId);
  await fs.ensureDir(tempDir);
  return tempDir;
}

async function cleanupTempDir(tempDir: string): Promise<void> {
  await fs.remove(tempDir);
}

describe('CLI Scenarios', () => {
  let originalCwd: string;
  let tempDir: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = await createTempDir();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await cleanupTempDir(tempDir);
  });

  describe('Scenario 1: No .opencode directory exists', () => {
    it('should create .opencode directory with all subdirectories and agent files', async () => {
      const opencodePath = path.join(tempDir, '.opencode');
      expect(await fs.pathExists(opencodePath)).toBe(false);

      await run({
        positionalModel: 'test-model',
        lang: 'en'
      });

      expect(await fs.pathExists(opencodePath)).toBe(true);

      expect(await fs.pathExists(path.join(opencodePath, 'agents'))).toBe(true);
      expect(await fs.pathExists(path.join(opencodePath, 'harness'))).toBe(true);
      expect(await fs.pathExists(path.join(opencodePath, 'harness', 'sprints'))).toBe(true);

      const evaluatorContent = await fs.readFile(
        path.join(opencodePath, 'agents', 'evaluator.md'),
        'utf-8'
      );
      expect(evaluatorContent).toContain('model: test-model');
    });

    it('should handle all 4 agent files with model replacement', async () => {
      await run({
        positionalModel: 'my-custom-model',
        lang: 'en'
      });

      const agentsDir = path.join(tempDir, '.opencode', 'agents');
      const agents = ['evaluator.md', 'generator.md', 'harness.md', 'planner.md'];

      for (const agent of agents) {
        const content = await fs.readFile(path.join(agentsDir, agent), 'utf-8');
        expect(content).toContain('model: my-custom-model');
      }
    });
  });

  describe('Scenario 2: Has .opencode but no subdirectories', () => {
    it('should create missing subdirectories and copy all files', async () => {
      await fs.ensureDir(path.join(tempDir, '.opencode'));

      await run({
        positionalModel: 'test-model',
        lang: 'en'
      });

      expect(await fs.pathExists(path.join(tempDir, '.opencode', 'agents'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.opencode', 'harness', 'sprints'))).toBe(true);

      expect(await fs.pathExists(
        path.join(tempDir, '.opencode', 'agents', 'evaluator.md')
      )).toBe(true);
    });

    it('should handle partial subdirectory structure', async () => {
      await fs.ensureDir(path.join(tempDir, '.opencode', 'harness'));

      await run({
        positionalModel: 'test-model',
        lang: 'en'
      });

      expect(await fs.pathExists(path.join(tempDir, '.opencode', 'agents'))).toBe(true);

      expect(await fs.pathExists(
        path.join(tempDir, '.opencode', 'harness', 'sprints')
      )).toBe(true);
    });
  });

  describe('Scenario 3: Has .opencode with subdirectories but no files', () => {
    it('should copy all files when directories exist but are empty', async () => {
      await fs.ensureDir(path.join(tempDir, '.opencode', 'agents'));
      await fs.ensureDir(path.join(tempDir, '.opencode', 'harness', 'sprints'));

      await run({
        positionalModel: 'test-model',
        lang: 'en'
      });

      const agentsDir = path.join(tempDir, '.opencode', 'agents');

      expect(await fs.pathExists(path.join(agentsDir, 'evaluator.md'))).toBe(true);
      expect(await fs.pathExists(path.join(agentsDir, 'generator.md'))).toBe(true);
      expect(await fs.pathExists(path.join(agentsDir, 'harness.md'))).toBe(true);
      expect(await fs.pathExists(path.join(agentsDir, 'planner.md'))).toBe(true);
    });

    it('should handle partial files (some files exist, some do not)', async () => {
      await fs.ensureDir(path.join(tempDir, '.opencode', 'agents'));
      await fs.ensureDir(path.join(tempDir, '.opencode', 'harness', 'sprints'));

      await fs.writeFile(
        path.join(tempDir, '.opencode', 'agents', 'existing-file.md'),
        'existing content'
      );

      await run({
        positionalModel: 'test-model',
        lang: 'en'
      });

      expect(await fs.pathExists(
        path.join(tempDir, '.opencode', 'agents', 'evaluator.md')
      )).toBe(true);

      const existingContent = await fs.readFile(
        path.join(tempDir, '.opencode', 'agents', 'existing-file.md'),
        'utf-8'
      );
      expect(existingContent).toBe('existing content');
    });
  });

  describe('Transaction Protection', () => {
    it('should abort if any target file already exists (agents)', async () => {
      await fs.ensureDir(path.join(tempDir, '.opencode', 'agents'));
      await fs.writeFile(
        path.join(tempDir, '.opencode', 'agents', 'evaluator.md'),
        'existing evaluator'
      );

      await expect(run({
        positionalModel: 'test-model',
        lang: 'en'
      })).rejects.toThrow('Transaction aborted');

      const content = await fs.readFile(
        path.join(tempDir, '.opencode', 'agents', 'evaluator.md'),
        'utf-8'
      );
      expect(content).toBe('existing evaluator');
    });

    it('should show conflicting files in error message', async () => {
      await fs.ensureDir(path.join(tempDir, '.opencode', 'agents'));

      await fs.writeFile(
        path.join(tempDir, '.opencode', 'agents', 'evaluator.md'),
        'existing'
      );

      let error: Error | undefined;
      try {
        await run({
          positionalModel: 'test-model',
          lang: 'en'
        });
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeDefined();
      expect(error!.message).toMatch(/\d+ file\(s\) already exist/);
    });
  });
});