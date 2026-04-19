/**
 * Folder Template Generator — for datasource-driven components.
 * Creates the "{TemplateName} Folder" template that enables editors
 * to create new datasource items in the Datasource Location.
 *
 * Folder templates have NO base template inheritance (no fields of their own).
 */

import type { FieldManifest, YamlFile } from '../types.js';
import type { GuidRegistry } from '../guid-registry.js';
import {
  TEMPLATE_TEMPLATE,
  TEMPLATES_BASE_PATH,
} from '../constants.js';
import { renderYamlItem, renderStandardValues } from '../yaml-writer.js';

export function generateFolderTemplateYaml(
  manifest: FieldManifest,
  guids: GuidRegistry
): YamlFile[] {
  // Generate for any component that has a datasource (fields or children)
  if (manifest.fields.length === 0 && !manifest.hasDatasourceChildren) {
    return [];
  }

  const files: YamlFile[] = [];
  const folder = manifest.templateFolder;
  const templateName = manifest.templateName;
  const componentName = manifest.componentName;
  const folderTemplateName = `${templateName} Folder`;

  const basePath = `${TEMPLATES_BASE_PATH}/Components/${folder}/${templateName}`;
  const sitecorePath = `/sitecore/templates/Project/industry-verticals/Components/${folder}/${templateName}`;

  const folderRootId = guids.folderRoot(componentName);
  const folderStdValId = guids.folderStdVal(componentName);
  const parentId = guids.templateFolder(componentName);

  // 1. Folder Template root (no base template — folder templates are plain containers)
  files.push({
    relativePath: `${basePath}/${folderTemplateName}.yml`,
    content: renderYamlItem({
      id: folderRootId,
      parent: parentId,
      template: TEMPLATE_TEMPLATE,
      path: `${sitecorePath}/${folderTemplateName}`,
      sharedFields: [],
    }),
  });

  // 2. Standard Values
  files.push({
    relativePath: `${basePath}/${folderTemplateName}/__Standard Values.yml`,
    content: renderStandardValues({
      id: folderStdValId,
      parentTemplateId: folderRootId,
      path: `${sitecorePath}/${folderTemplateName}`,
    }),
  });

  return files;
}
