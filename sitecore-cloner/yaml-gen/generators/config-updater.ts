/**
 * Config Updater — generates JSON config updates for the target IV repo:
 *   - common.module.json: add site include + media folder rule
 *   - xmcloud.build.json: add rendering host + SCS modules
 *   - Per-site module JSON files: {site}-content.module.json, {site}-media.module.json
 */

import type { SiteConfig, YamlFile, JsonConfigUpdate } from '../types.js';
import { SITE_MODULES_DIR, COMMON_MODULE_PATH } from '../constants.js';

/**
 * Generate the per-site SCS module JSON files (new files, not updates).
 */
export function generateSiteModuleFiles(config: SiteConfig): YamlFile[] {
  const siteName = config.siteName;
  const pascalSiteName = toPascalCase(siteName);

  // Content module
  const contentModule = {
    $schema: '../.sitecore/schemas/ModuleFile.schema.json',
    namespace: `Project.${pascalSiteName}-Content`,
    references: ['Project.IndustryVerticals'],
    items: {
      includes: [
        {
          name: 'site-home',
          path: `/sitecore/content/industry-verticals/${siteName}/home`,
          scope: 'DescendantsOnly',
          allowedPushOperations: 'CreateAndUpdate',
        },
        {
          name: 'site-media',
          path: `/sitecore/content/industry-verticals/${siteName}/Media`,
          scope: 'DescendantsOnly',
          allowedPushOperations: 'CreateAndUpdate',
        },
        {
          name: 'site-data',
          path: `/sitecore/content/industry-verticals/${siteName}/Data`,
          scope: 'DescendantsOnly',
          allowedPushOperations: 'CreateAndUpdate',
        },
        {
          name: 'site-dictionary',
          path: `/sitecore/content/industry-verticals/${siteName}/Dictionary`,
          scope: 'DescendantsOnly',
          allowedPushOperations: 'CreateAndUpdate',
        },
        {
          name: 'site-presentation',
          path: `/sitecore/content/industry-verticals/${siteName}/Presentation`,
          scope: 'DescendantsOnly',
          allowedPushOperations: 'CreateAndUpdate',
        },
      ],
    },
  };

  // Media module
  const mediaModule = {
    $schema: '../.sitecore/schemas/ModuleFile.schema.json',
    namespace: `Project.${pascalSiteName}-Media`,
    references: ['Project.IndustryVerticals'],
    items: {
      includes: [
        {
          name: `${siteName}-media-library`,
          path: `/sitecore/Media Library/Project/industry-verticals/${siteName}`,
          scope: 'ItemAndDescendants',
          allowedPushOperations: 'CreateUpdateAndDelete',
        },
      ],
    },
  };

  return [
    {
      relativePath: `${SITE_MODULES_DIR}/${siteName}/${siteName}-content.module.json`,
      content: JSON.stringify(contentModule, null, 2),
    },
    {
      relativePath: `${SITE_MODULES_DIR}/${siteName}/${siteName}-media.module.json`,
      content: JSON.stringify(mediaModule, null, 2),
    },
  ];
}

/**
 * Generate a config updater for common.module.json — adds the site's include entry
 * and a media folder rule.
 */
export function generateCommonModuleUpdater(config: SiteConfig): JsonConfigUpdate {
  const siteName = config.siteName;

  return {
    relativePath: COMMON_MODULE_PATH,
    updater: (existing) => {
      const items = existing.items as { includes: Array<Record<string, unknown>> };
      if (!items?.includes) return existing;

      // Add site include (if not already present)
      const alreadyExists = items.includes.some(
        (inc) => inc.name === `sites-${siteName}`
      );
      if (!alreadyExists) {
        items.includes.push({
          name: `sites-${siteName}`,
          path: `/sitecore/content/industry-verticals/${siteName}`,
          rules: [
            { path: '/home', scope: 'SingleItem', allowedPushOperations: 'CreateOnly' },
            { path: '/Media', scope: 'SingleItem', allowedPushOperations: 'CreateAndUpdate' },
            { path: '/Data', scope: 'SingleItem', allowedPushOperations: 'CreateOnly' },
            { path: '/Dictionary', scope: 'SingleItem', allowedPushOperations: 'CreateOnly' },
            { path: '/Presentation', scope: 'SingleItem', allowedPushOperations: 'CreateOnly' },
            { path: '/Settings/Site Grouping', scope: 'ItemAndDescendants', allowedPushOperations: 'CreateOnly' },
            { path: '/Settings', scope: 'ItemAndChildren', allowedPushOperations: 'CreateAndUpdate' },
            { path: '*', scope: 'Ignored' },
          ],
        });
      }

      // Add media folder rule to projectMediaFolders include
      const mediaFoldersInclude = items.includes.find(
        (inc) => inc.name === 'projectMediaFolders'
      );
      if (mediaFoldersInclude) {
        const rules = mediaFoldersInclude.rules as Array<Record<string, string>> | undefined;
        if (rules) {
          const alreadyHasRule = rules.some((r) => r.path === `/${siteName}`);
          if (!alreadyHasRule) {
            rules.push({
              path: `/${siteName}`,
              scope: 'SingleItem',
              allowedPushOperations: 'CreateOnly',
            });
          }
        }
      }

      return existing;
    },
  };
}

/**
 * Generate a config updater for xmcloud.build.json — adds rendering host + SCS modules.
 */
export function generateXmCloudBuildUpdater(config: SiteConfig): JsonConfigUpdate {
  const siteName = config.siteName;
  const pascalSiteName = toPascalCase(siteName);

  return {
    relativePath: 'xmcloud.build.json',
    updater: (existing) => {
      // Add rendering host
      const renderingHosts = existing.renderingHosts as Record<string, unknown> | undefined;
      if (renderingHosts && !renderingHosts[siteName]) {
        renderingHosts[siteName] = {
          path: `./industry-verticals/${siteName}`,
          nodeVersion: '22.11.0',
          jssDeploymentSecret: '110F1C44A496B45478640DD36F80C18C9',
          enabled: true,
          type: 'sxa',
          buildCommand: 'build',
          runCommand: 'next:start',
        };
      }

      // Add SCS modules to postActions — handle both structures
      const postActions = existing.postActions as Record<string, unknown> | undefined;
      if (postActions) {
        const actions = postActions.actions as Record<string, unknown> | undefined;
        const scsModulesContainer =
          (actions?.scsModules as { modules?: string[] } | undefined) ??
          (postActions.scsModules as { modules?: string[] } | undefined);

        if (scsModulesContainer?.modules) {
          const modules = scsModulesContainer.modules;
          const contentNamespace = `Project.${pascalSiteName}-Content`;

          if (!modules.includes(contentNamespace)) {
            modules.push(contentNamespace);
          }
          // Note: Media module is NOT added to postActions until media items
          // are serialized. Adding it without items causes SCS push failure:
          // "Configured source item path ... did not exist in serialized items"
        }
      }

      return existing;
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
