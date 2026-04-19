/**
 * Rendering Generator — produces the rendering definition YAML.
 * Each rendering has 10 always-present SharedFields + up to 4 conditional ones.
 */

import type { FieldManifest, YamlFile } from '../types.js';
import type { GuidRegistry } from '../guid-registry.js';
import {
  RENDERING_TEMPLATE,
  RENDERING_FOLDER_TEMPLATE,
  RENDERING_COMPONENT_NAME_ID,
  RENDERING_ICON_ID,
  RENDERING_DS_TEMPLATE_ID,
  RENDERING_OPEN_PROPS_ID,
  RENDERING_READ_ONLY_ID,
  RENDERING_PARAMS_TEMPLATE_ID,
  RENDERING_DS_LOCATION_ID,
  RENDERING_ADD_EDITOR_BTN_ID,
  RENDERING_SHARED_REV_ID,
  RENDERING_OTHER_PROPS_ID,
  RENDERING_COMPONENT_QUERY_ID,
  RENDERING_PAGE_EDITOR_BTN_ID,
  PAGE_EDITOR_BTN_MAIN,
  PAGE_EDITOR_BTN_ADD,
  DEFAULT_RENDERING_ICON,
  RENDERINGS_BASE_PATH,
} from '../constants.js';
import { renderYamlItem, bracedGuid, type SharedField } from '../yaml-writer.js';

export function generateRenderingYaml(
  manifest: FieldManifest,
  guids: GuidRegistry
): YamlFile[] {
  const files: YamlFile[] = [];
  const folder = manifest.templateFolder;
  const componentName = manifest.componentName;
  const templateName = manifest.templateName;

  const renderingId = guids.rendering(componentName);
  const renderingFolderId = guids.renderingFolder(folder);
  const paramsTemplateId = guids.paramsRoot(componentName);

  // Datasource template path (empty if no datasource)
  const dsTemplatePath = manifest.fields.length > 0 || manifest.hasDatasourceChildren
    ? `/sitecore/templates/Project/industry-verticals/Components/${folder}/${templateName}/${templateName}`
    : '';

  // Datasource location query
  const dsLocation = dsTemplatePath
    ? `query:$site/*[@@name='Data']/*[@@templatename='${templateName} Folder']|query:$sharedSites/*[@@name='Data']/*[@@templatename='${templateName} Folder']`
    : '';

  const sitecorePath = `/sitecore/layout/Renderings/Project/industry-verticals/${folder}/${componentName}`;

  // --- 10 ALWAYS PRESENT SharedFields ---
  const sharedFields: SharedField[] = [
    { id: RENDERING_COMPONENT_NAME_ID, hint: 'componentName', value: componentName },
    { id: RENDERING_ICON_ID, hint: '__Icon', value: DEFAULT_RENDERING_ICON },
    { id: RENDERING_DS_TEMPLATE_ID, hint: 'Datasource Template', value: dsTemplatePath },
    { id: RENDERING_OPEN_PROPS_ID, hint: 'Open Properties after Add', value: '0' },
    { id: RENDERING_READ_ONLY_ID, hint: '__Read Only', value: '' },
    { id: RENDERING_PARAMS_TEMPLATE_ID, hint: 'Parameters Template', value: bracedGuid(paramsTemplateId) },
    { id: RENDERING_DS_LOCATION_ID, hint: 'Datasource Location', value: dsLocation },
    { id: RENDERING_ADD_EDITOR_BTN_ID, hint: 'AddFieldEditorButton', value: '' },
    { id: RENDERING_SHARED_REV_ID, hint: '__Shared revision', value: guids.get(`rendering-rev:${componentName}`) },
    { id: RENDERING_OTHER_PROPS_ID, hint: 'OtherProperties', value: 'IsRenderingsWithDynamicPlaceholders=true' },
  ];

  // --- CONDITIONAL SharedFields ---

  // ComponentQuery (for datasource children with GraphQL)
  if (manifest.graphqlQuery) {
    sharedFields.push({
      id: RENDERING_COMPONENT_QUERY_ID,
      hint: 'ComponentQuery',
      value: manifest.graphqlQuery,
    });
  }

  // Page Editor Buttons (for datasource folder components)
  if (manifest.hasDatasourceChildren) {
    sharedFields.push({
      id: RENDERING_PAGE_EDITOR_BTN_ID,
      hint: 'Page Editor Buttons',
      value: `${bracedGuid(PAGE_EDITOR_BTN_MAIN)}|${bracedGuid(PAGE_EDITOR_BTN_ADD)}`,
    });
  }

  // Rendering definition
  files.push({
    relativePath: `${RENDERINGS_BASE_PATH}/${folder}/${componentName}.yml`,
    content: renderYamlItem({
      id: renderingId,
      parent: renderingFolderId,
      template: RENDERING_TEMPLATE,
      path: sitecorePath,
      sharedFields,
    }),
  });

  return files;
}

export function generateRenderingFolderYaml(
  folder: string,
  guids: GuidRegistry
): YamlFile[] {
  const renderingFolderId = guids.renderingFolder(folder);
  return [{
    relativePath: `${RENDERINGS_BASE_PATH}/${folder}.yml`,
    content: renderYamlItem({
      id: renderingFolderId,
      parent: guids.get('renderings-project-folder'),
      template: RENDERING_FOLDER_TEMPLATE,
      path: `/sitecore/layout/Renderings/Project/industry-verticals/${folder}`,
      sharedFields: [],
    }),
  }];
}
