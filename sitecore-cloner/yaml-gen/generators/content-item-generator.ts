/**
 * Content Item Generator — creates datasource content items from manifest sampleValues.
 * For each component with a datasource, creates:
 *   - A datasource folder item (under site Data/)
 *   - One content item per component instance (with field values from sampleValue)
 *   - For datasource children: child items under the parent content item
 */

import type { FieldManifest, ManifestField, SiteConfig, YamlFile, ImageSampleValue, LinkSampleValue } from '../types.js';
import type { GuidRegistry } from '../guid-registry.js';
import { SITE_CONTENT_BASE_PATH } from '../constants.js';
import { renderYamlItem, type SharedField } from '../yaml-writer.js';

export function generateContentItemYaml(
  manifest: FieldManifest,
  config: SiteConfig,
  guids: GuidRegistry
): YamlFile[] {
  const hasDatasource = manifest.fields.length > 0 || manifest.hasDatasourceChildren;
  if (!hasDatasource) return [];

  const files: YamlFile[] = [];
  const siteName = config.siteName;
  const templateName = manifest.templateName;
  const componentName = manifest.componentName;
  const folderTemplateName = `${templateName} Folder`;

  const dataFolderPath = `${SITE_CONTENT_BASE_PATH}/${siteName}/items/site-data/Data`;
  const sitecoreDataPath = `/sitecore/content/industry-verticals/${siteName}/Data`;

  // 1. Datasource folder item
  const contentFolderId = guids.contentFolder(componentName);
  files.push({
    relativePath: `${dataFolderPath}/${folderTemplateName}.yml`,
    content: renderYamlItem({
      id: contentFolderId,
      parent: guids.siteData(),
      template: guids.folderRoot(componentName),
      path: `${sitecoreDataPath}/${folderTemplateName}`,
      sharedFields: [],
    }),
  });

  if (manifest.hasDatasourceChildren && manifest.childTemplate) {
    // Datasource children pattern: one parent item with child items
    const parentItemId = guids.contentItem(componentName, 0);
    const parentFields = manifest.parentFields ?? [];

    // Parent content item (with parentFields values)
    const parentFieldValues = buildFieldValues(parentFields, guids, componentName, 'template');

    files.push({
      relativePath: `${dataFolderPath}/${folderTemplateName}/${templateName}.yml`,
      content: renderYamlItem({
        id: parentItemId,
        parent: contentFolderId,
        template: guids.templateRoot(componentName),
        path: `${sitecoreDataPath}/${folderTemplateName}/${templateName}`,
        languages: parentFieldValues.length > 0
          ? [{
              language: 'en',
              versions: [{ version: 1, fields: parentFieldValues }],
            }]
          : undefined,
      }),
    });

    // Child items
    for (let i = 0; i < manifest.childTemplate.sampleChildren.length; i++) {
      const child = manifest.childTemplate.sampleChildren[i];
      const childId = guids.contentChildItem(componentName, 0, i);
      const childFields: SharedField[] = [];

      for (const field of manifest.childTemplate.fields) {
        const value = child.values[field.name];
        if (value !== undefined) {
          // Use real child template field GUID from registry
          const fieldGuid = guids.childTemplateField(componentName, field.name);
          childFields.push(buildSingleFieldValue(fieldGuid, field, value));
        }
      }

      const safeName = child.itemName.replace(/[/\\:?<>|"*]/g, '-');
      files.push({
        relativePath: `${dataFolderPath}/${folderTemplateName}/${templateName}/${safeName}.yml`,
        content: renderYamlItem({
          id: childId,
          parent: parentItemId,
          template: guids.childTemplateRoot(componentName),
          path: `${sitecoreDataPath}/${folderTemplateName}/${templateName}/${safeName}`,
          languages: childFields.length > 0
            ? [{
                language: 'en',
                versions: [{ version: 1, fields: childFields }],
              }]
            : undefined,
        }),
      });
    }
  } else {
    // Standard component: one content item with direct field values
    const itemId = guids.contentItem(componentName, 0);
    const fieldValues = buildFieldValues(manifest.fields, guids, componentName, 'template');

    files.push({
      relativePath: `${dataFolderPath}/${folderTemplateName}/${templateName}.yml`,
      content: renderYamlItem({
        id: itemId,
        parent: contentFolderId,
        template: guids.templateRoot(componentName),
        path: `${sitecoreDataPath}/${folderTemplateName}/${templateName}`,
        languages: fieldValues.length > 0
          ? [{
              language: 'en',
              versions: [{ version: 1, fields: fieldValues }],
            }]
          : undefined,
      }),
    });
  }

  return files;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildFieldValues(
  fields: ManifestField[],
  guids: GuidRegistry,
  componentName: string,
  keyPrefix: 'template' | 'child-template'
): SharedField[] {
  const result: SharedField[] = [];
  for (const field of fields) {
    if (field.sampleValue !== undefined && field.sampleValue !== '') {
      const fieldGuid = keyPrefix === 'child-template'
        ? guids.childTemplateField(componentName, field.name)
        : guids.templateField(componentName, field.name);
      result.push(buildSingleFieldValue(fieldGuid, field, field.sampleValue));
    }
  }
  return result;
}

function buildSingleFieldValue(
  fieldGuid: string,
  field: ManifestField,
  value: string | number | ImageSampleValue | LinkSampleValue
): SharedField {
  let stringValue: string;

  if (typeof value === 'string') {
    stringValue = value;
  } else if (typeof value === 'number') {
    stringValue = String(value);
  } else if (isImageValue(value)) {
    stringValue = `<image mediaid="" alt="${escapeXml(value.alt ?? '')}" />`;
  } else if (isLinkValue(value)) {
    stringValue = `<link text="${escapeXml(value.text ?? '')}" linktype="${escapeXml(value.linktype ?? 'internal')}" url="${escapeXml(value.href ?? '')}" anchor="" target="" />`;
  } else {
    stringValue = String(value);
  }

  return { id: fieldGuid, hint: field.name, value: stringValue };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isImageValue(value: unknown): value is ImageSampleValue {
  return typeof value === 'object' && value !== null && 'src' in value && 'alt' in value;
}

function isLinkValue(value: unknown): value is LinkSampleValue {
  return typeof value === 'object' && value !== null && 'href' in value && 'text' in value;
}
