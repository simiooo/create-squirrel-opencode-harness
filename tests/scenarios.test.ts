import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { run } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to create a temp test directory with unique name
async function createTempDir(): Promise<string> {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const tempDir = path.join(__dirname, '..', '.test-temp', uniqueId);
  await fs.ensureDir(tempDir);
  return tempDir;
}

// Helper to cleanup temp directory
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
    it('should create .opencode directory with all subdirectories and files', async () => {
      // Verify no .opencode exists initially
      const opencodePath = path.join(tempDir, '.opencode');
      expect(await fs.pathExists(opencodePath)).toBe(false);

      // Run the CLI
      await run({
        positionalModel: 'test-model',
        lang: 'en'
      });

      // Verify .opencode was created
      expect(await fs.pathExists(opencodePath)).toBe(true);

      // Verify subdirectories were created
      expect(await fs.pathExists(path.join(opencodePath, 'agents'))).toBe(true);
      expect(await fs.pathExists(path.join(opencodePath, 'harness'))).toBe(true);
      expect(await fs.pathExists(path.join(opencodePath, 'harness', 'templates'))).toBe(true);

      // Verify agent files were created with correct model
      const evaluatorContent = await fs.readFile(
        path.join(opencodePath, 'agents', 'evaluator.md'),
        'utf-8'
      );
      expect(evaluatorContent).toContain('model: test-model');

      // Verify harness template files were copied
      expect(await fs.pathExists(
        path.join(opencodePath, 'harness', 'templates', 'contract-template.md')
      )).toBe(true);
      expect(await fs.pathExists(
        path.join(opencodePath, 'harness', 'templates', 'spec-template.md')
      )).toBe(true);
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
      // Create empty .opencode
      await fs.ensureDir(path.join(tempDir, '.opencode'));

      await run({
        positionalModel: 'test-model',
        lang: 'en'
      });

      // Verify subdirectories were created
      expect(await fs.pathExists(path.join(tempDir, '.opencode', 'agents'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.opencode', 'harness', 'templates'))).toBe(true);

      // Verify files were copied
      expect(await fs.pathExists(
        path.join(tempDir, '.opencode', 'agents', 'evaluator.md')
      )).toBe(true);
    });

    it('should handle partial subdirectory structure', async () => {
      // Create .opencode with only harness (no agents)
      await fs.ensureDir(path.join(tempDir, '.opencode', 'harness'));

      await run({
        positionalModel: 'test-model',
        lang: 'en'
      });

      // Verify agents directory was created
      expect(await fs.pathExists(path.join(tempDir, '.opencode', 'agents'))).toBe(true);

      // Verify harness templates were added
      expect(await fs.pathExists(
        path.join(tempDir, '.opencode', 'harness', 'templates', 'contract-template.md')
      )).toBe(true);
    });
  });

  describe('Scenario 3: Has .opencode with subdirectories but no files', () => {
    it('should copy all files when directories exist but are empty', async () => {
      // Create directory structure but no files
      await fs.ensureDir(path.join(tempDir, '.opencode', 'agents'));
      await fs.ensureDir(path.join(tempDir, '.opencode', 'harness', 'templates'));

      await run({
        positionalModel: 'test-model',
        lang: 'en'
      });

      // Verify all files were created
      const agentsDir = path.join(tempDir, '.opencode', 'agents');
      const harnessDir = path.join(tempDir, '.opencode', 'harness', 'templates');

      expect(await fs.pathExists(path.join(agentsDir, 'evaluator.md'))).toBe(true);
      expect(await fs.pathExists(path.join(agentsDir, 'generator.md'))).toBe(true);
      expect(await fs.pathExists(path.join(agentsDir, 'harness.md'))).toBe(true);
      expect(await fs.pathExists(path.join(agentsDir, 'planner.md'))).toBe(true);

      expect(await fs.pathExists(path.join(harnessDir, 'contract-template.md'))).toBe(true);
      expect(await fs.pathExists(path.join(harnessDir, 'spec-template.md'))).toBe(true);
    });

    it('should handle partial files (some files exist, some do not)', async () => {
      // Create directory structure with some existing files
      await fs.ensureDir(path.join(tempDir, '.opencode', 'agents'));
      await fs.ensureDir(path.join(tempDir, '.opencode', 'harness', 'templates'));

      // Create one existing agent file
      await fs.writeFile(
        path.join(tempDir, '.opencode', 'agents', 'existing-file.md'),
        'existing content'
      );

      // All files should be copied since they're different files
      await run({
        positionalModel: 'test-model',
        lang: 'en'
      });

      // Verify new files were added
      expect(await fs.pathExists(
        path.join(tempDir, '.opencode', 'agents', 'evaluator.md')
      )).toBe(true);

      // Verify existing file still exists
      const existingContent = await fs.readFile(
        path.join(tempDir, '.opencode', 'agents', 'existing-file.md'),
        'utf-8'
      );
      expect(existingContent).toBe('existing content');
    });
  });

  describe('Transaction Protection', () => {
    it('should abort if any target file already exists (agents)', async () => {
      // Create directory with an existing file that would conflict
      await fs.ensureDir(path.join(tempDir, '.opencode', 'agents'));
      await fs.writeFile(
        path.join(tempDir, '.opencode', 'agents', 'evaluator.md'),
        'existing evaluator'
      );

      // Should throw error due to existing file
      await expect(run({
        positionalModel: 'test-model',
        lang: 'en'
      })).rejects.toThrow('Transaction aborted');

      // Verify existing file was not overwritten
      const content = await fs.readFile(
        path.join(tempDir, '.opencode', 'agents', 'evaluator.md'),
        'utf-8'
      );
      expect(content).toBe('existing evaluator');
    });

    it('should abort if any target file already exists (harness templates)', async () => {
      // Create directory with an existing template file
      await fs.ensureDir(path.join(tempDir, '.opencode', 'harness', 'templates'));
      await fs.writeFile(
        path.join(tempDir, '.opencode', 'harness', 'templates', 'contract-template.md'),
        'existing contract'
      );

      // Should throw error
      await expect(run({
        positionalModel: 'test-model',
        lang: 'en'
      })).rejects.toThrow('Transaction aborted');
    });

    it('should show all conflicting files in error message', async () => {
      // Create multiple existing files
      await fs.ensureDir(path.join(tempDir, '.opencode', 'agents'));
      await fs.ensureDir(path.join(tempDir, '.opencode', 'harness', 'templates'));

      await fs.writeFile(
        path.join(tempDir, '.opencode', 'agents', 'evaluator.md'),
        'existing'
      );
      await fs.writeFile(
        path.join(tempDir, '.opencode', 'harness', 'templates', 'contract-template.md'),
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
      // Error message should mention the number of conflicting files
      expect(error!.message).toMatch(/\d+ file\(s\) already exist/);
    });
  });
});
