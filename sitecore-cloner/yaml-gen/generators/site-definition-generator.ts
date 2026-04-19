/**
 * Site Definition Generator — creates the site root item, Home page,
 * standard folders (Data, Media, Dictionary, Presentation, Settings),
 * and Site Grouping items.
 */

import type { SiteConfig, YamlFile } from '../types.js';
import type { GuidRegistry } from '../guid-registry.js';
import {
  HEADLESS_SITE_TEMPLATE,
  SITE_MODULES_FIELD_ID,
  SITE_MODULES,
  SITE_DEFS_BASE_PATH,
  SITE_NAME_FIELD_ID,
  SITE_MEDIA_LIBRARY_FIELD_ID,
  TITLE_FIELD_ID,
  SETTINGS_TEMPLATE,
  SETTINGS_BRANCH_ID,
  SETTINGS_NAME_ID,
  SETTINGS_FILESYSTEM_PATH_ID,
  SETTINGS_APP_TEMPLATE_ID,
  SETTINGS_SSR_ENGINE_ID,
  SETTINGS_DATASOURCES_PATH_ID,
  RENDERING_SHARED_REV_ID,
} from '../constants.js';
import { renderYamlItem, bracedGuid, guidList } from '../yaml-writer.js';

/** Well-known template GUIDs for site structure items */
const FOLDER_TEMPLATE = 'a87a00b1-e6db-45ab-8b54-636fec3b5523';
const PAGE_TEMPLATE = '76036f5e-cbce-46d1-af0a-4143f9b557aa'; // Standard page template
const SITE_GROUPING_TEMPLATE = 'e9e7d50b-4e46-438a-a236-f53b7bc70de4';
const SITE_GROUPING_ITEM_TEMPLATE = '3f8a2510-d3e8-4e41-8809-aa4bbf68d2b6';

/**
 * @param renderingsXml — optional __Renderings XML to embed in the Home item
 * @param renderingsFieldId — the __Renderings field GUID
 */
export function generateSiteDefinitionYaml(
  config: SiteConfig,
  guids: GuidRegistry,
  ivSitesParentId: string,
  renderingsXml?: string,
  renderingsFieldId?: string
): YamlFile[] {
  const files: YamlFile[] = [];
  const siteName = config.siteName;
  const displayName = config.siteDisplayName;
  const basePath = `${SITE_DEFS_BASE_PATH}/sites-${siteName}/${siteName}`;
  const sitecoreBase = `/sitecore/content/industry-verticals/${siteName}`;

  const siteRootId = guids.siteRoot();

  // 1. Site root
  files.push({
    relativePath: `${SITE_DEFS_BASE_PATH}/sites-${siteName}/${siteName}.yml`,
    content: renderYamlItem({
      id: siteRootId,
      parent: ivSitesParentId,
      template: HEADLESS_SITE_TEMPLATE,
      path: sitecoreBase,
      sharedFields: [
        {
          id: SITE_MODULES_FIELD_ID,
          hint: 'Modules',
          value: guidList(SITE_MODULES),
        },
        {
          id: SITE_NAME_FIELD_ID,
          hint: 'Name',
          value: displayName,
        },
        {
          id: SITE_MEDIA_LIBRARY_FIELD_ID,
          hint: 'SiteMediaLibrary',
          value: bracedGuid(guids.siteMedia()),
        },
      ],
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
    }),
  });

  // 2. Home page (with __Renderings XML as SharedField)
  const homeSharedFields = [];

  if (renderingsXml && renderingsFieldId) {
    homeSharedFields.push({
      id: renderingsFieldId,
      hint: '__Renderings',
      value: renderingsXml, // yaml-writer handles multi-line as block scalar (|)
    });
  }

  files.push({
    relativePath: `${basePath}/Home.yml`,
    content: renderYamlItem({
      id: guids.siteHome(),
      parent: siteRootId,
      template: PAGE_TEMPLATE,
      path: `${sitecoreBase}/home`,
      sharedFields: homeSharedFields.length > 0 ? homeSharedFields : undefined,
      languages: [
        {
          language: 'en',
          versions: [
            {
              version: 1,
              fields: [
                { id: TITLE_FIELD_ID, hint: 'Title', value: displayName },
              ],
            },
          ],
        },
      ],
    }),
  });

  // 3. Standard folders: Data, Media, Dictionary, Presentation
  const standardFolders: Array<{ name: string; guidFn: () => string }> = [
    { name: 'Data', guidFn: () => guids.siteData() },
    { name: 'Media', guidFn: () => guids.siteMedia() },
    { name: 'Dictionary', guidFn: () => guids.siteDictionary() },
    { name: 'Presentation', guidFn: () => guids.sitePresentation() },
  ];

  for (const folder of standardFolders) {
    files.push({
      relativePath: `${basePath}/${folder.name}.yml`,
      content: renderYamlItem({
        id: folder.guidFn(),
        parent: siteRootId,
        template: FOLDER_TEMPLATE,
        path: `${sitecoreBase}/${folder.name}`,
        sharedFields: [],
      }),
    });
  }

  // 4. Settings item (uses Settings template + branch, not generic folder)
  const settingsId = guids.siteSettings();
  files.push({
    relativePath: `${basePath}/Settings.yml`,
    content: renderYamlItem({
      id: settingsId,
      parent: siteRootId,
      template: SETTINGS_TEMPLATE,
      path: `${sitecoreBase}/Settings`,
      branchId: SETTINGS_BRANCH_ID,
      sharedFields: [
        { id: SETTINGS_NAME_ID, hint: 'Name', value: siteName },
        { id: SETTINGS_FILESYSTEM_PATH_ID, hint: 'FilesystemPath', value: `/dist/${siteName}` },
        { id: SETTINGS_APP_TEMPLATE_ID, hint: 'AppTemplate', value: bracedGuid(HEADLESS_SITE_TEMPLATE) },
        { id: SETTINGS_SSR_ENGINE_ID, hint: 'ServerSideRenderingEngine', value: 'http' },
        { id: SETTINGS_DATASOURCES_PATH_ID, hint: 'AppDatasourcesPath', value: bracedGuid(guids.siteData()) },
        { id: RENDERING_SHARED_REV_ID, hint: '__Shared revision', value: guids.get('settings-rev') },
      ],
    }),
  });

  // 5. Site Grouping folder + item
  const siteGroupingId = guids.siteSiteGrouping();
  files.push({
    relativePath: `${basePath}/Settings/Site Grouping.yml`,
    content: renderYamlItem({
      id: siteGroupingId,
      parent: settingsId,
      template: SITE_GROUPING_TEMPLATE,
      path: `${sitecoreBase}/Settings/Site Grouping`,
      sharedFields: [],
    }),
  });

  files.push({
    relativePath: `${basePath}/Settings/Site Grouping/${siteName}.yml`,
    content: renderYamlItem({
      id: guids.siteSiteGroupingItem(),
      parent: siteGroupingId,
      template: SITE_GROUPING_ITEM_TEMPLATE,
      path: `${sitecoreBase}/Settings/Site Grouping/${siteName}`,
      sharedFields: [],
      languages: [
        {
          language: 'en',
          versions: [
            {
              version: 1,
              fields: [
                { id: TITLE_FIELD_ID, hint: 'Title', value: displayName },
              ],
            },
          ],
        },
      ],
    }),
  });

  return files;
}
