/**
 * Assembly — the full orchestrator that ties all generators together.
 * Reads manifest files, allocates GUIDs, runs all generators, and
 * either writes files to the target repo or prints a dry-run summary.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

import type {
  FieldManifest,
  SiteConfig,
  YamlFile,
  JsonConfigUpdate,
  AssemblyResult,
} from './types.js';
import { GuidRegistry } from './guid-registry.js';

import { generateTemplateYaml } from './generators/template-generator.js';
import { generateParamsTemplateYaml } from './generators/params-template-generator.js';
import { generateFolderTemplateYaml } from './generators/folder-template-generator.js';
import { generateRenderingYaml, generateRenderingFolderYaml } from './generators/rendering-generator.js';
import { generateSiteDefinitionYaml } from './generators/site-definition-generator.js';
import { generateRenderingsXml } from './generators/renderings-xml-generator.js';
import { generateContentItemYaml } from './generators/content-item-generator.js';
import {
  generateSiteModuleFiles,
  generateCommonModuleUpdater,
  generateXmCloudBuildUpdater,
} from './generators/config-updater.js';
import { RENDERINGS_FIELD_ID, RENDERINGS_BASE_PATH } from './constants.js';

export function runAssembly(config: SiteConfig): AssemblyResult {
  const result: AssemblyResult = {
    yamlFiles: [],
    configUpdates: [],
    scaffoldingFiles: [],
    errors: [],
    warnings: [],
  };

  // -----------------------------------------------------------------------
  // 1. Read manifests
  // -----------------------------------------------------------------------
  const manifests = readManifests(config.manifestDir);
  if (manifests.length === 0) {
    result.errors.push(`No .manifest.json files found in ${config.manifestDir}`);
    return result;
  }

  console.log(`Found ${manifests.length} manifest(s):`);
  for (const m of manifests) {
    console.log(`  - ${m.componentName} (${m.templateName}) → ${m.placeholder}`);
  }

  // -----------------------------------------------------------------------
  // 2. Initialize GUID registry + pre-allocate shared keys
  // -----------------------------------------------------------------------
  const guids = new GuidRegistry();

  // Read existing parent GUIDs from target IV repo
  const ivSitesParentId = readIvSitesParentId(config.targetDir) ?? guids.get('iv-sites-parent');

  const renderingsProjectFolderId = readRenderingsProjectFolder(config.targetDir);
  if (renderingsProjectFolderId) {
    guids.set('renderings-project-folder', renderingsProjectFolderId);
    console.log(`Using existing renderings folder GUID: ${renderingsProjectFolderId}`);
  } else {
    guids.get('renderings-project-folder');
    result.warnings.push('Could not read renderings project folder GUID from target — using generated GUID');
  }

  // Pre-allocate template folder GUIDs (one per unique templateFolder)
  const folders = new Set(manifests.map((m) => m.templateFolder));
  for (const f of folders) {
    guids.get(`template-folder:${f}`);
  }

  // -----------------------------------------------------------------------
  // 3. Generate per-component YAML
  // -----------------------------------------------------------------------

  // Generate rendering folders once per unique templateFolder (deduplicated)
  for (const folder of folders) {
    result.yamlFiles.push(...generateRenderingFolderYaml(folder, guids));
  }

  for (const manifest of manifests) {
    result.yamlFiles.push(...generateTemplateYaml(manifest, guids));
    result.yamlFiles.push(...generateParamsTemplateYaml(manifest, guids));
    result.yamlFiles.push(...generateFolderTemplateYaml(manifest, guids));
    result.yamlFiles.push(...generateRenderingYaml(manifest, guids));
    result.yamlFiles.push(...generateContentItemYaml(manifest, config, guids));
  }

  // -----------------------------------------------------------------------
  // 4. Generate per-site YAML (including Home with __Renderings)
  // -----------------------------------------------------------------------
  const renderingsXml = generateRenderingsXml(manifests, guids);
  result.yamlFiles.push(
    ...generateSiteDefinitionYaml(config, guids, ivSitesParentId, renderingsXml, RENDERINGS_FIELD_ID)
  );

  // -----------------------------------------------------------------------
  // 5. Generate config files and updaters
  // -----------------------------------------------------------------------
  result.yamlFiles.push(...generateSiteModuleFiles(config));
  result.configUpdates.push(generateCommonModuleUpdater(config));
  result.configUpdates.push(generateXmCloudBuildUpdater(config));

  // -----------------------------------------------------------------------
  // 6. Copy scaffolding
  // -----------------------------------------------------------------------
  const scaffoldingDir = resolve(
    dirname(new URL(import.meta.url).pathname),
    '../scaffolding'
  );
  const siteTargetDir = join(config.targetDir, 'industry-verticals', config.siteName);

  if (existsSync(scaffoldingDir)) {
    result.scaffoldingFiles.push(`${siteTargetDir}/ (from scaffolding template)`);
  } else {
    result.warnings.push(`Scaffolding directory not found: ${scaffoldingDir}`);
  }

  // -----------------------------------------------------------------------
  // 7. Write or dry-run
  // -----------------------------------------------------------------------
  if (config.dryRun) {
    printDryRun(result, guids);
  } else {
    writeResults(result, config, scaffoldingDir, siteTargetDir);
  }

  // -----------------------------------------------------------------------
  // 8. Summary
  // -----------------------------------------------------------------------
  console.log(`\n--- Assembly Summary ---`);
  console.log(`YAML files: ${result.yamlFiles.length}`);
  console.log(`Config updates: ${result.configUpdates.length}`);
  console.log(`Scaffolding: ${result.scaffoldingFiles.length > 0 ? 'yes' : 'no'}`);
  console.log(`GUIDs allocated: ${guids.size}`);
  if (result.warnings.length > 0) {
    console.log(`Warnings: ${result.warnings.length}`);
    for (const w of result.warnings) console.log(`  ! ${w}`);
  }
  if (result.errors.length > 0) {
    console.log(`Errors: ${result.errors.length}`);
    for (const e of result.errors) console.log(`  x ${e}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readManifests(manifestDir: string): FieldManifest[] {
  const absDir = resolve(manifestDir);
  if (!existsSync(absDir)) return [];

  const files = findFiles(absDir, '.manifest.json');
  const manifests: FieldManifest[] = [];

  for (const file of files) {
    try {
      const raw = readFileSync(file, 'utf-8');
      const parsed = JSON.parse(raw) as FieldManifest;
      if (parsed.$schema === 'field-manifest-v1') {
        manifests.push(parsed);
      }
    } catch (err) {
      console.warn(`Skipping invalid manifest: ${file}`, err);
    }
  }

  return manifests;
}

function findFiles(dir: string, suffix: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, suffix));
    } else if (entry.name.endsWith(suffix)) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Read the IV sites parent GUID from an existing site YAML in the target repo.
 * Looks at authoring/items/industry-verticals/common/items/sites-{name}/ directories.
 */
function readIvSitesParentId(targetDir: string): string | null {
  const commonItems = join(targetDir, 'authoring/items/industry-verticals/common/items');
  if (!existsSync(commonItems)) return null;

  try {
    const entries = readdirSync(commonItems, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith('sites-')) continue;
      const siteName = entry.name.replace('sites-', '');
      const siteYaml = join(commonItems, entry.name, `${siteName}.yml`);
      if (existsSync(siteYaml)) {
        const content = readFileSync(siteYaml, 'utf-8');
        const parentMatch = content.match(/^Parent:\s*"([^"]+)"/m);
        if (parentMatch) {
          console.log(`Found IV parent GUID from existing site '${siteName}': ${parentMatch[1]}`);
          return parentMatch[1];
        }
      }
    }
  } catch {
    // Fall through — generate a new GUID
  }

  return null;
}

/**
 * Read the renderings project folder GUID from the target repo.
 * The industry-verticals.yml file sits alongside the industry-verticals/ directory.
 */
function readRenderingsProjectFolder(targetDir: string): string | null {
  // The .yml file is at the same level as the directory, just with .yml extension
  const yamlPath = join(targetDir, RENDERINGS_BASE_PATH + '.yml');
  if (!existsSync(yamlPath)) return null;

  try {
    const content = readFileSync(yamlPath, 'utf-8');
    const idMatch = content.match(/^ID:\s*"([^"]+)"/m);
    if (idMatch) return idMatch[1];
  } catch {
    // Fall through
  }

  return null;
}

function printDryRun(result: AssemblyResult, guids: GuidRegistry): void {
  console.log('\n=== DRY RUN — No files will be written ===\n');

  console.log('YAML files to generate:');
  for (const f of result.yamlFiles) {
    const lines = f.content.split('\n').length;
    console.log(`  ${f.relativePath} (${lines} lines)`);
  }

  console.log('\nConfig files to update:');
  for (const c of result.configUpdates) {
    console.log(`  ${c.relativePath}`);
  }

  console.log('\nScaffolding:');
  for (const s of result.scaffoldingFiles) {
    console.log(`  ${s}`);
  }

  console.log(`\nGUID Registry (${guids.size} entries):`);
  for (const [key, guid] of guids.entries()) {
    console.log(`  ${key} -> ${guid}`);
  }
}

function writeResults(
  result: AssemblyResult,
  config: SiteConfig,
  scaffoldingDir: string,
  siteTargetDir: string
): void {
  const targetDir = config.targetDir;

  // Write YAML files
  for (const f of result.yamlFiles) {
    const fullPath = join(targetDir, f.relativePath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, f.content, 'utf-8');
  }

  // Apply config updates
  for (const update of result.configUpdates) {
    const fullPath = join(targetDir, update.relativePath);
    if (existsSync(fullPath)) {
      const raw = readFileSync(fullPath, 'utf-8');
      const parsed = JSON.parse(raw);
      const updated = update.updater(parsed);
      writeFileSync(fullPath, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
    } else {
      console.warn(`Config file not found, skipping: ${fullPath}`);
    }
  }

  // Copy scaffolding (with template substitution for package.json)
  if (existsSync(scaffoldingDir)) {
    cpSync(scaffoldingDir, siteTargetDir, { recursive: true });

    // Template substitution in package.json
    const pkgPath = join(siteTargetDir, 'package.json');
    if (existsSync(pkgPath)) {
      let pkgContent = readFileSync(pkgPath, 'utf-8');
      pkgContent = pkgContent
        .replace(/\{\{SITE_NAME\}\}/g, config.siteName)
        .replace(/\{\{SITE_DISPLAY_NAME\}\}/g, config.siteDisplayName);
      writeFileSync(pkgPath, pkgContent, 'utf-8');
    }
  }

  console.log(`\nFiles written to: ${targetDir}`);
}
