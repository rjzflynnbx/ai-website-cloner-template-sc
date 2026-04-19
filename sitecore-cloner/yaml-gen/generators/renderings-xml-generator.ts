/**
 * Renderings XML Generator — produces the __Renderings XML value for the Home page.
 * This XML is stored in a language/version field on the Home item and tells Sitecore
 * which rendering components to place in which placeholders.
 */

import type { FieldManifest } from '../types.js';
import type { GuidRegistry } from '../guid-registry.js';
import { DEFAULT_DEVICE_ID } from '../constants.js';
import { bracedGuid } from '../yaml-writer.js';

/**
 * Build the __Renderings XML value for all manifests.
 * Components are ordered by placeholder (header → main → footer),
 * then by manifest order within each placeholder.
 */
export function generateRenderingsXml(
  manifests: FieldManifest[],
  guids: GuidRegistry
): string {
  const placeholderOrder = ['headless-header', 'headless-main', 'headless-footer'] as const;

  // Group manifests by placeholder
  const grouped = new Map<string, FieldManifest[]>();
  for (const ph of placeholderOrder) {
    grouped.set(ph, []);
  }
  for (const m of manifests) {
    const list = grouped.get(m.placeholder);
    if (list) {
      list.push(m);
    }
  }

  // Build <r> elements
  const renderingElements: string[] = [];

  for (const ph of placeholderOrder) {
    const items = grouped.get(ph) ?? [];
    for (let i = 0; i < items.length; i++) {
      const m = items[i];
      const renderingGuid = bracedGuid(guids.rendering(m.componentName));
      const uid = bracedGuid(guids.get(`rendering-uid:${m.componentName}`));

      // Datasource reference (if component has a datasource)
      const hasDatasource = m.fields.length > 0 || m.hasDatasourceChildren;
      const dsGuid = hasDatasource
        ? bracedGuid(guids.contentItem(m.componentName, 0))
        : '';

      const ordering = i === 0 ? 'p:before="*"' : `p:after="${bracedGuid(guids.get(`rendering-uid:${items[i - 1].componentName}`))}"`;

      // Build parameters string
      const params = [
        'GridParameters=%7B31229421-7F42-4E7D-8B6A-D92FD80B83F7%7D',
        'FieldNames=%7B34DC4F0D-B498-4547-ACCC-A9E1AB92B8E2%7D',
        'Styles=%7B00000000-0000-0000-0000-000000000000%7D',
        'RenderingIdentifier',
        'CSSStyles',
        'DynamicPlaceholderId=1',
      ].join('&amp;');

      const dsAttr = dsGuid ? `\n       s:ds="${dsGuid}"` : '';

      renderingElements.push(
        `    <r uid="${uid}" ${ordering}${dsAttr}\n       s:id="${renderingGuid}"\n       s:par="${params}"\n       s:ph="${ph}" />`
      );
    }
  }

  return [
    '<r xmlns:p="p" xmlns:s="s" p:p="1">',
    `  <d id="${bracedGuid(DEFAULT_DEVICE_ID)}">`,
    ...renderingElements,
    '  </d>',
    '</r>',
  ].join('\n');
}
