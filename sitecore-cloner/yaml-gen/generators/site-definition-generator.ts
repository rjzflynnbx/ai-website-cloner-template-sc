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
const SITE_GROUPING_TEMPLATE = '8357f958-9aaa-46db-8898-36448a96356f'; // Site Grouping folder
const SITE_GROUPING_ITEM_TEMPLATE = 'e46f3af2-39fa-4866-a157-7017c4b2a40c'; // Site Grouping item

// Site Grouping item SharedField IDs (from forma-lux reference)
const SGI_START_ITEM = '1ee576af-ba8e-4312-9fbd-2ccf8395baa1';
const SGI_OTHER_PROPS = '301e719a-6f65-4874-b565-a953a7b5ac83';
const SGI_VIRTUAL_FOLDER = '475031d8-724d-463c-80b2-90839dd1ad98';
const SGI_LANGUAGE_EMBEDDING = '4e9e2ae5-36db-4955-9af1-5a1934a27c7d';
const SGI_THUMBNAILS_ROOT = '6dd8a774-2ce5-4c9e-be7f-1eaf65789956';
const SGI_FIELD_LANG_FALLBACK = '6e6da5b0-8d01-4514-b7dd-1940aff3e8cd';
const SGI_ITEM_LANG_FALLBACK = '8c436235-b85d-4097-89cf-d5a4fa70cc0a';
const SGI_HOSTNAME = '8e0dd914-9afb-4d45-bf8b-7ff5d6e5337e';
const SGI_POS = '9eaf6dc9-b811-4cda-9edd-9697faba628a';
const SGI_SCHEME = 'b59e43ab-84da-49f3-87a1-d2fcf648365b';
const SGI_SITE_NAME = 'cb4e9e2e-2b66-43dc-ad3f-9caf363d28d3';
const SGI_ENVIRONMENT = 'da06d09e-02b6-464a-80fc-9d8d7fc875e3';
const SGI_TARGET_HOSTNAME = 'e5b5ccb5-17a1-429d-bd3e-6122b3216e52';
const SGI_LANGUAGE = 'f19277fe-1b85-4b0a-8c26-5e74d766b3a3';
const SGI_RENDERING_HOST = 'f57099a3-526a-49f2-aebd-635453e48875';

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
      branchId: SETTINGS_BRANCH_ID,
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
      branchId: SETTINGS_BRANCH_ID,
      sharedFields: [
        { id: SGI_START_ITEM, hint: 'StartItem', value: bracedGuid(guids.siteHome()) },
        { id: SGI_OTHER_PROPS, hint: 'OtherProperties', value: 'isSiteThumbnailSource=true' },
        { id: SGI_VIRTUAL_FOLDER, hint: 'VirtualFolder', value: '' },
        { id: SGI_LANGUAGE_EMBEDDING, hint: 'Language Embedding', value: '1' },
        { id: SGI_THUMBNAILS_ROOT, hint: 'ThumbnailsRootPath', value: bracedGuid(guids.siteMedia()) },
        { id: SGI_FIELD_LANG_FALLBACK, hint: 'FieldLanguageFallback', value: '1' },
        { id: SITE_NAME_FIELD_ID, hint: 'Name', value: displayName },
        { id: SGI_ITEM_LANG_FALLBACK, hint: 'ItemLanguageFallback', value: '1' },
        { id: SGI_HOSTNAME, hint: 'HostName', value: '*' },
        { id: SGI_POS, hint: 'POS', value: `en=${siteName}` },
        { id: SGI_SCHEME, hint: 'Scheme', value: '' },
        { id: SGI_SITE_NAME, hint: 'SiteName', value: siteName },
        { id: SGI_ENVIRONMENT, hint: 'Environment', value: '*' },
        { id: RENDERING_SHARED_REV_ID, hint: '__Shared revision', value: guids.get('site-grouping-rev') },
        { id: SGI_TARGET_HOSTNAME, hint: 'TargetHostName', value: '' },
        { id: SGI_LANGUAGE, hint: 'Language', value: 'en' },
        { id: SGI_RENDERING_HOST, hint: 'RenderingHost', value: 'Default' },
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

  return files;
}
