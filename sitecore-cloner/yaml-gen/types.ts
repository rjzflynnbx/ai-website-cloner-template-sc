/**
 * Types for the SCS YAML generator.
 * Mirrors the field-manifest-v1 schema from BUILDER_PROMPT_TEMPLATE.md
 * plus internal types for assembly.
 */

// ---------------------------------------------------------------------------
// Field Manifest (produced by Phase 4 builders, consumed by Assembly)
// ---------------------------------------------------------------------------

export interface ManifestField {
  name: string;
  sitecoreType: SitecoreFieldType;
  tsType: string;
  renderComponent: string;
  renderTag?: string;
  sortOrder: number;
  shared: boolean;
  source: string;
  sampleValue: string | number | ImageSampleValue | LinkSampleValue;
}

export interface ImageSampleValue {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface LinkSampleValue {
  href: string;
  text: string;
  linktype?: string;
}

export interface SampleChild {
  itemName: string;
  values: Record<string, string | number | ImageSampleValue | LinkSampleValue>;
}

export interface ChildTemplate {
  name: string;
  fields: ManifestField[];
  sampleChildren: SampleChild[];
}

export interface FieldManifest {
  $schema: 'field-manifest-v1';
  componentName: string;
  templateName: string;
  templateFolder: string;
  variants: string[];
  hasDatasourceChildren: boolean;
  fields: ManifestField[];
  childTemplate: ChildTemplate | null;
  parentFields: ManifestField[] | null;
  graphqlQuery: string | null;
  placeholder: 'headless-header' | 'headless-main' | 'headless-footer';
  renderingParams: string[];
}

// ---------------------------------------------------------------------------
// Sitecore field types (v1 subset)
// ---------------------------------------------------------------------------

export type SitecoreFieldType =
  | 'Single-Line Text'
  | 'Multi-Line Text'
  | 'Rich Text'
  | 'Image'
  | 'General Link'
  | 'Number';

// ---------------------------------------------------------------------------
// YAML output file descriptor
// ---------------------------------------------------------------------------

export interface YamlFile {
  /** Relative path within the target IV repo (e.g., "authoring/items/.../Template.yml") */
  relativePath: string;
  /** YAML string content */
  content: string;
}

// ---------------------------------------------------------------------------
// JSON config update descriptor
// ---------------------------------------------------------------------------

export interface JsonConfigUpdate {
  /** Relative path within the target IV repo */
  relativePath: string;
  /** Function that takes the parsed JSON and returns the updated JSON */
  updater: (existing: Record<string, unknown>) => Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Site configuration (CLI input)
// ---------------------------------------------------------------------------

export interface SiteConfig {
  /** kebab-case site name, e.g. "acme-corp" */
  siteName: string;
  /** Human-readable display name, e.g. "Acme Corp" */
  siteDisplayName: string;
  /** Absolute path to the target IV repo root */
  targetDir: string;
  /** Directory containing .manifest.json files */
  manifestDir: string;
  /** Dry run — preview only, don't write files */
  dryRun: boolean;
}

// ---------------------------------------------------------------------------
// Assembly result
// ---------------------------------------------------------------------------

export interface AssemblyResult {
  yamlFiles: YamlFile[];
  configUpdates: JsonConfigUpdate[];
  scaffoldingFiles: string[];
  errors: string[];
  warnings: string[];
}
