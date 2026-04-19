#!/usr/bin/env npx tsx
/**
 * CLI entry point for the SCS YAML generator.
 *
 * Usage:
 *   npx tsx sitecore-cloner/yaml-gen/index.ts \
 *     --site-name acme-corp \
 *     --site-display-name "Acme Corp" \
 *     --target ~/path/to/IV-repo \
 *     --manifest-dir src/components/ \
 *     [--dry-run]
 */

import { resolve } from 'node:path';
import { runAssembly } from './assembly.js';
import type { SiteConfig } from './types.js';

function parseArgs(args: string[]): SiteConfig {
  let siteName = '';
  let siteDisplayName = '';
  let targetDir = '';
  let manifestDir = '';
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--site-name':
        siteName = args[++i] ?? '';
        break;
      case '--site-display-name':
        siteDisplayName = args[++i] ?? '';
        break;
      case '--target':
        targetDir = args[++i] ?? '';
        break;
      case '--manifest-dir':
        manifestDir = args[++i] ?? '';
        break;
      case '--dry-run':
        dryRun = true;
        break;
      default:
        if (args[i].startsWith('--')) {
          console.error(`Unknown option: ${args[i]}`);
          process.exit(1);
        }
    }
  }

  if (!siteName) {
    console.error('Missing required option: --site-name');
    printUsage();
    process.exit(1);
  }
  if (!targetDir) {
    console.error('Missing required option: --target');
    printUsage();
    process.exit(1);
  }
  if (!manifestDir) {
    console.error('Missing required option: --manifest-dir');
    printUsage();
    process.exit(1);
  }

  if (!siteDisplayName) {
    // Default: convert kebab-case to Title Case
    siteDisplayName = siteName
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return {
    siteName,
    siteDisplayName,
    targetDir: resolve(targetDir),
    manifestDir: resolve(manifestDir),
    dryRun,
  };
}

function printUsage(): void {
  console.log(`
Usage:
  npx tsx sitecore-cloner/yaml-gen/index.ts \\
    --site-name <kebab-case-name> \\
    --site-display-name "Display Name" \\
    --target <path-to-iv-repo> \\
    --manifest-dir <path-to-manifests> \\
    [--dry-run]

Options:
  --site-name          Required. Kebab-case site name (e.g., "acme-corp")
  --site-display-name  Optional. Human-readable name (default: derived from site-name)
  --target             Required. Absolute path to the Industry Verticals repo
  --manifest-dir       Required. Directory containing .manifest.json files
  --dry-run            Optional. Preview only, don't write files
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const config = parseArgs(process.argv.slice(2));

console.log('=== SCS YAML Generator ===');
console.log(`Site: ${config.siteName} (${config.siteDisplayName})`);
console.log(`Target: ${config.targetDir}`);
console.log(`Manifests: ${config.manifestDir}`);
console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'WRITE'}`);
console.log('');

const result = runAssembly(config);

if (result.errors.length > 0) {
  process.exit(1);
}
