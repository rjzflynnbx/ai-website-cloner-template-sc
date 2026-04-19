/**
 * Low-level YAML string builders.
 * Uses template strings to match SCS serialization format exactly.
 * No YAML library dependency — output must match `dotnet sitecore ser` format.
 */

export interface SharedField {
  id: string;
  hint: string;
  value: string;
}

export interface YamlItemOptions {
  id: string;
  parent: string;
  template: string;
  path: string;
  branchId?: string;
  sharedFields?: SharedField[];
  languages?: YamlLanguageBlock[];
}

export interface YamlLanguageBlock {
  language: string;
  fields?: SharedField[];
  versions?: YamlVersionBlock[];
}

export interface YamlVersionBlock {
  version: number;
  fields?: SharedField[];
}

/**
 * Render a complete SCS YAML item.
 * Matches the format: `---\nID: "..."\nParent: "..."\n...`
 */
export function renderYamlItem(opts: YamlItemOptions): string {
  const lines: string[] = ['---'];
  lines.push(`ID: "${opts.id}"`);
  lines.push(`Parent: "${opts.parent}"`);
  lines.push(`Template: "${opts.template}"`);
  lines.push(`Path: "${opts.path}"`);

  if (opts.branchId) {
    lines.push(`BranchID: "${opts.branchId}"`);
  }

  if (opts.sharedFields && opts.sharedFields.length > 0) {
    lines.push('SharedFields:');
    for (const sf of opts.sharedFields) {
      lines.push(...renderSharedField(sf));
    }
  }

  if (opts.languages && opts.languages.length > 0) {
    lines.push('Languages:');
    for (const lang of opts.languages) {
      lines.push(`- Language: ${lang.language}`);
      if (lang.fields && lang.fields.length > 0) {
        lines.push('  Fields:');
        for (const f of lang.fields) {
          lines.push(...renderSharedField(f, '  '));
        }
      }
      if (lang.versions && lang.versions.length > 0) {
        lines.push('  Versions:');
        for (const v of lang.versions) {
          lines.push(`  - Version: ${v.version}`);
          if (v.fields && v.fields.length > 0) {
            lines.push('    Fields:');
            for (const f of v.fields) {
              lines.push(...renderSharedField(f, '    '));
            }
          }
        }
      }
    }
  }

  return lines.join('\n');
}

function renderSharedField(sf: SharedField, indent = ''): string[] {
  const lines: string[] = [];
  lines.push(`${indent}- ID: "${sf.id}"`);
  lines.push(`${indent}  Hint: ${sf.hint}`);

  // Multi-line values use YAML block scalar
  if (sf.value.includes('\n')) {
    lines.push(`${indent}  Value: |`);
    for (const line of sf.value.split('\n')) {
      lines.push(`${indent}    ${line}`);
    }
  } else {
    lines.push(`${indent}  Value: "${escapeYamlString(sf.value)}"`);
  }

  return lines;
}

/** Escape special characters in YAML double-quoted strings. */
function escapeYamlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

/**
 * Format a GUID for use in SCS YAML references (with braces).
 * Converts "abc123..." → "{ABC123...}" (uppercase with braces).
 */
export function bracedGuid(guid: string): string {
  return `{${guid.toUpperCase()}}`;
}

/**
 * Format a list of GUIDs as a multi-line pipe-separated value.
 * Used for __Base template and Modules fields.
 */
export function guidList(guids: string[]): string {
  return guids.map((g) => bracedGuid(g)).join('\n');
}

/**
 * Build a YAML item for a Standard Values child.
 * Standard Values is self-referential: its Template field = the parent template ID.
 */
export function renderStandardValues(opts: {
  id: string;
  parentTemplateId: string;
  path: string;
  sharedFields?: SharedField[];
}): string {
  return renderYamlItem({
    id: opts.id,
    parent: opts.parentTemplateId,
    template: opts.parentTemplateId,
    path: `${opts.path}/__Standard Values`,
    sharedFields: opts.sharedFields,
    languages: [
      {
        language: 'en',
        versions: [
          {
            version: 1,
            fields: [],
          },
        ],
      },
    ],
  });
}
