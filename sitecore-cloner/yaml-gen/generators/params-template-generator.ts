/**
 * Parameters Template Generator — produces per-component rendering parameters
 * template + Standard Values. Each rendering has its own unique Parameters Template.
 */

import type { FieldManifest, YamlFile } from '../types.js';
import type { GuidRegistry } from '../guid-registry.js';
import {
  TEMPLATE_TEMPLATE,
  TEMPLATE_SECTION,
  BASE_TEMPLATE_FIELD_ID,
  STD_VALUES_POINTER_ID,
  ICON_FIELD_ID,
  RENDERING_READ_ONLY_ID,
  RENDERING_SHARED_REV_ID,
  RENDERING_PARAMS_BASE,
  PARAMS_BASE_1,
  PARAMS_BASE_2,
  PARAMS_BASE_3,
  PARAMS_FOLDER_TEMPLATE,
  TEMPLATES_BASE_PATH,
} from '../constants.js';
import { renderYamlItem, renderStandardValues, guidList, bracedGuid } from '../yaml-writer.js';

export function generateParamsTemplateYaml(
  manifest: FieldManifest,
  guids: GuidRegistry
): YamlFile[] {
  const files: YamlFile[] = [];
  const folder = manifest.templateFolder;
  const templateName = manifest.templateName;
  const componentName = manifest.componentName;
  const paramsName = `${templateName} Parameters`;

  const basePath = `${TEMPLATES_BASE_PATH}/Components/${folder}/${templateName}/Rendering Parameters`;
  const sitecorePath = `/sitecore/templates/Project/industry-verticals/Components/${folder}/${templateName}/Rendering Parameters`;

  const paramsRootId = guids.paramsRoot(componentName);
  const paramsStdValId = guids.paramsStdVal(componentName);
  const parentId = guids.templateFolder(componentName); // same container as data template

  // Parameters Template inherits from 4 base GUIDs (order from IV fork Hero Banner Parameters):
  // PARAMS_BASE_1 + PARAMS_BASE_2 + RENDERING_PARAMS_BASE + PARAMS_BASE_3
  const baseTemplates = [
    PARAMS_BASE_1,
    PARAMS_BASE_2,
    RENDERING_PARAMS_BASE,
    PARAMS_BASE_3,
  ];

  // 1. Rendering Parameters folder
  const renderingParamsFolderId = guids.get(`params-folder:${componentName}`);
  files.push({
    relativePath: `${TEMPLATES_BASE_PATH}/Components/${folder}/${templateName}/Rendering Parameters.yml`,
    content: renderYamlItem({
      id: renderingParamsFolderId,
      parent: guids.templateFolder(componentName),
      template: PARAMS_FOLDER_TEMPLATE,
      path: sitecorePath,
      sharedFields: [],
    }),
  });

  // 2. Parameters Template root (with all 5 SharedFields matching IV fork)
  const paramsRevId = guids.get(`params-rev:${componentName}`);
  files.push({
    relativePath: `${basePath}/${paramsName}.yml`,
    content: renderYamlItem({
      id: paramsRootId,
      parent: renderingParamsFolderId,
      template: TEMPLATE_TEMPLATE,
      path: `${sitecorePath}/${paramsName}`,
      sharedFields: [
        {
          id: ICON_FIELD_ID,
          hint: '__Icon',
          value: 'sxa/16x16/promo.png',
        },
        {
          id: BASE_TEMPLATE_FIELD_ID,
          hint: '__Base template',
          value: guidList(baseTemplates),
        },
        {
          id: RENDERING_READ_ONLY_ID,
          hint: '__Read Only',
          value: '0',
        },
        {
          id: RENDERING_SHARED_REV_ID,
          hint: '__Shared revision',
          value: paramsRevId,
        },
        {
          id: STD_VALUES_POINTER_ID,
          hint: '__Standard values',
          value: bracedGuid(paramsStdValId),
        },
      ],
    }),
  });

  // 3. Standard Values
  files.push({
    relativePath: `${basePath}/${paramsName}/__Standard Values.yml`,
    content: renderStandardValues({
      id: paramsStdValId,
      parentTemplateId: paramsRootId,
      path: `${sitecorePath}/${paramsName}`,
    }),
  });

  // 4. "Params" section (structural child — matches IV Hero Banner Parameters pattern)
  const paramsSectionId = guids.get(`params:${componentName}:section`);
  files.push({
    relativePath: `${basePath}/${paramsName}/Params.yml`,
    content: renderYamlItem({
      id: paramsSectionId,
      parent: paramsRootId,
      template: TEMPLATE_SECTION,
      path: `${sitecorePath}/${paramsName}/Params`,
      sharedFields: [],
    }),
  });

  return files;
}
