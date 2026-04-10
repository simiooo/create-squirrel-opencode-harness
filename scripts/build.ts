#!/usr/bin/env node
/**
 * Build script using esbuild
 * Reads configuration from tsconfig.json for consistency with tsc and tsx
 * Run: pnpm exec tsx scripts/build.ts
 */

import { build } from 'esbuild';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const tsconfigPath = path.join(rootDir, 'tsconfig.json');

async function main() {
  console.log('🚀 Building with esbuild...');
  console.log(`   Using tsconfig: ${tsconfigPath}\n`);

  // Verify tsconfig exists
  if (!await fs.pathExists(tsconfigPath)) {
    console.error('❌ tsconfig.json not found');
    process.exit(1);
  }

  // Read tsconfig for consistency
  const tsconfig = await fs.readJson(tsconfigPath);
  const compilerOptions = tsconfig.compilerOptions || {};

  // Clean dist directory
  await fs.remove(distDir);
  await fs.ensureDir(distDir);

  // Common esbuild options aligned with tsconfig
  const commonOptions = {
    platform: 'node' as const,
    target: compilerOptions.target?.toLowerCase() || 'es2022',
    format: 'esm' as const,
    sourcemap: compilerOptions.sourceMap !== false,
    tsconfigRaw: {
      compilerOptions: {
        // Ensure strict settings match tsconfig
        strict: compilerOptions.strict ?? true,
        esModuleInterop: compilerOptions.esModuleInterop ?? true,
        skipLibCheck: compilerOptions.skipLibCheck ?? true,
        allowSyntheticDefaultImports: compilerOptions.allowSyntheticDefaultImports ?? true,
        isolatedModules: compilerOptions.isolatedModules ?? true,
      }
    }
  };

  // Build CLI entry point (bundled for distribution)
  console.log('📦 Building CLI bundle...');
  await build({
    ...commonOptions,
    entryPoints: [path.join(rootDir, 'src', 'cli.ts')],
    bundle: true,
    outfile: path.join(distDir, 'cli.js'),
    external: [
      // Dependencies that should not be bundled
      'commander',
      'chalk',
      'inquirer',
      'fs-extra',
      'glob',
      'ejs',
      'i18next',
      'i18next-fs-backend',
    ],
    minify: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  });

  // Make cli.js executable
  await fs.chmod(path.join(distDir, 'cli.js'), 0o755);

  // Build other modules (for programmatic API access, unbundled)
  console.log('📦 Building module files...');
  const modules = ['index', 'fileOps', 'input', 'i18n'];
  for (const mod of modules) {
    await build({
      ...commonOptions,
      entryPoints: [path.join(rootDir, 'src', `${mod}.ts`)],
      bundle: false,
      outdir: distDir,
    });
  }

  // Copy locales directory to dist (for runtime i18n)
  console.log('📦 Copying locales...');
  await fs.copy(
    path.join(rootDir, 'locales'),
    path.join(distDir, 'locales')
  );

  console.log('\n✅ Build completed successfully!');
  console.log(`   Output: ${distDir}`);
  console.log('\n📋 Configuration:');
  console.log(`   Target: ${commonOptions.target}`);
  console.log(`   Format: ESM`);
  console.log(`   Sourcemap: ${commonOptions.sourcemap ? 'enabled' : 'disabled'}`);
  console.log(`   Strict: ${commonOptions.tsconfigRaw?.compilerOptions?.strict ? 'enabled' : 'disabled'}`);
}

main().catch((err) => {
  console.error('\n❌ Build failed:', err);
  process.exit(1);
});
