/**
 * Data Template Generator — produces the template hierarchy YAML:
 *   Container folder → Template root → Standard Values → Section → Field items
 *
 * For datasource children components, also generates the child template.
 */

import type { FieldManifest, ManifestField, YamlFile } from '../types.js';
import type { GuidRegistry } from '../guid-registry.js';
import {
  TEMPLATE_TEMPLATE,
  TEMPLATE_SECTION,
  TEMPLATE_FIELD,
  TEMPLATE_FOLDER,
  BASE_TEMPLATE_FIELD_ID,
  FIELD_TYPE_ID,
  FIELD_SOURCE_ID,
  FIELD_SORTORDER_ID,
  FIELD_SHARED_ID,
  CONTENT_BASE,
  RENDERING_PARAMS_BASE,
  STD_VALUES_POINTER_ID,
  ENABLE_ITEM_FALLBACK_ID,
  ICON_FIELD_ID,
  DEFAULT_RENDERING_ICON,
  TEMPLATES_BASE_PATH,
} from '../constants.js';
import {
  renderYamlItem,
  renderStandardValues,
  guidList,
  bracedGuid,
  type SharedField,
} from '../yaml-writer.js';

export function generateTemplateYaml(
  manifest: FieldManifest,
  guids: GuidRegistry
): YamlFile[] {
  const files: YamlFile[] = [];
  const folder = manifest.templateFolder; // e.g., "Page Content"
  const templateName = manifest.templateName; // e.g., "Hero Banner"
  const componentName = manifest.componentName;

  // Base path: .../Components/{Folder}
  const folderPath = `${TEMPLATES_BASE_PATH}/Components/${folder}`;
  const templateBasePath = `${folderPath}/${templateName}`;

  // Ensure the containing folder exists
  const containerId = guids.templateFolder(componentName);
  files.push({
    relativePath: `${folderPath}/${templateName}.yml`,
    content: renderYamlItem({
      id: containerId,
      parent: guids.get(`template-folder:${folder}`),
      template: TEMPLATE_FOLDER,
      path: `/sitecore/templates/Project/industry-verticals/Components/${folder}/${templateName}`,
      sharedFields: [],
    }),
  });

  // Determine the fields for this template
  // For datasource children: parentFields go on the main template, child fields on child template
  // For standard components: fields go directly on the main template
  const mainFields = manifest.hasDatasourceChildren
    ? manifest.parentFields ?? []
    : manifest.fields;

  // --- Main data template ---
  files.push(
    ...generateSingleTemplate({
      templateId: guids.templateRoot(componentName),
      stdValId: guids.templateStdVal(componentName),
      sectionId: guids.templateSection(componentName),
      parentId: containerId,
      templateName,
      basePath: templateBasePath,
      sitecorePath: `/sitecore/templates/Project/industry-verticals/Components/${folder}/${templateName}`,
      fields: mainFields,
      guids,
      componentName,
      fieldKeyPrefix: 'template',
    })
  );

  // --- Child template (datasource children) ---
  if (manifest.hasDatasourceChildren && manifest.childTemplate) {
    const childName = manifest.childTemplate.name;
    const childBasePath = `${templateBasePath}/${childName}`;
    const childSitecorePath = `/sitecore/templates/Project/industry-verticals/Components/${folder}/${templateName}/${childName}`;

    // Child template container folder
    files.push({
      relativePath: `${childBasePath}.yml`,
      content: renderYamlItem({
        id: guids.get(`child-template-container:${componentName}`),
        parent: containerId,
        template: TEMPLATE_FOLDER,
        path: childSitecorePath,
        sharedFields: [],
      }),
    });

    files.push(
      ...generateSingleTemplate({
        templateId: guids.childTemplateRoot(componentName),
        stdValId: guids.childTemplateStdVal(componentName),
        sectionId: guids.childTemplateSection(componentName),
        parentId: guids.get(`child-template-container:${componentName}`),
        templateName: childName,
        basePath: `${childBasePath}/${childName}`,
        sitecorePath: `${childSitecorePath}/${childName}`,
        fields: manifest.childTemplate.fields,
        guids,
        componentName,
        fieldKeyPrefix: 'child-template',
      })
    );
  }

  return files;
}

// ---------------------------------------------------------------------------
// Internal: generates template root + StdVal + section + fields for one template
// ---------------------------------------------------------------------------

interface SingleTemplateOpts {
  templateId: string;
  stdValId: string;
  sectionId: string;
  parentId: string;
  templateName: string;
  basePath: string;
  sitecorePath: string;
  fields: ManifestField[];
  guids: GuidRegistry;
  componentName: string;
  fieldKeyPrefix: string;
}

function generateSingleTemplate(opts: SingleTemplateOpts): YamlFile[] {
  const files: YamlFile[] = [];

  // 1. Template root
  files.push({
    relativePath: `${opts.basePath}/${opts.templateName}.yml`,
    content: renderYamlItem({
      id: opts.templateId,
      parent: opts.parentId,
      template: TEMPLATE_TEMPLATE,
      path: `${opts.sitecorePath}/${opts.templateName}`,
      sharedFields: [
        {
          id: BASE_TEMPLATE_FIELD_ID,
          hint: '__Base template',
          value: guidList([CONTENT_BASE, RENDERING_PARAMS_BASE]),
        },
        { id: ICON_FIELD_ID, hint: '__Icon', value: DEFAULT_RENDERING_ICON },
        { id: STD_VALUES_POINTER_ID, hint: '__Standard values', value: bracedGuid(opts.stdValId) },
        { id: ENABLE_ITEM_FALLBACK_ID, hint: '__Enable item fallback', value: '1' },
      ],
    }),
  });

  // 2. Standard Values
  files.push({
    relativePath: `${opts.basePath}/${opts.templateName}/__Standard Values.yml`,
    content: renderStandardValues({
      id: opts.stdValId,
      parentTemplateId: opts.templateId,
      path: `${opts.sitecorePath}/${opts.templateName}`,
      sharedFields: [
        { id: ENABLE_ITEM_FALLBACK_ID, hint: '__Enable item fallback', value: '1' },
      ],
    }),
  });

  // 3. Template section ("Data")
  files.push({
    relativePath: `${opts.basePath}/${opts.templateName}/Data.yml`,
    content: renderYamlItem({
      id: opts.sectionId,
      parent: opts.templateId,
      template: TEMPLATE_SECTION,
      path: `${opts.sitecorePath}/${opts.templateName}/Data`,
      sharedFields: [],
    }),
  });

  // 4. Field items
  for (const field of opts.fields) {
    const fieldId =
      opts.fieldKeyPrefix === 'child-template'
        ? opts.guids.childTemplateField(opts.componentName, field.name)
        : opts.guids.templateField(opts.componentName, field.name);

    const sharedFields: SharedField[] = [
      { id: FIELD_TYPE_ID, hint: 'Type', value: field.sitecoreType },
      {
        id: FIELD_SORTORDER_ID,
        hint: '__Sortorder',
        value: String(field.sortOrder),
      },
    ];

    if (field.source) {
      sharedFields.push({
        id: FIELD_SOURCE_ID,
        hint: 'Source',
        value: field.source,
      });
    }

    if (field.shared) {
      sharedFields.push({
        id: FIELD_SHARED_ID,
        hint: 'Shared',
        value: '1',
      });
    }

    files.push({
      relativePath: `${opts.basePath}/${opts.templateName}/Data/${field.name}.yml`,
      content: renderYamlItem({
        id: fieldId,
        parent: opts.sectionId,
        template: TEMPLATE_FIELD,
        path: `${opts.sitecorePath}/${opts.templateName}/Data/${field.name}`,
        sharedFields,
      }),
    });
  }

  return files;
}
