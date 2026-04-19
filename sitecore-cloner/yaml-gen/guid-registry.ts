/**
 * GUID Registry — pre-allocates all UUIDs upfront with deterministic keys.
 * Cross-references resolve by key lookup. Every GUID used in the generated
 * YAML comes from this registry, ensuring referential integrity.
 */

import { randomUUID } from 'node:crypto';

export class GuidRegistry {
  private guids = new Map<string, string>();

  /** Get or create a GUID for the given key. */
  get(key: string): string {
    const existing = this.guids.get(key);
    if (existing) return existing;
    const guid = randomUUID();
    this.guids.set(key, guid);
    return guid;
  }

  /** Check if a key already has a GUID. */
  has(key: string): boolean {
    return this.guids.has(key);
  }

  /** Set an externally-known GUID (e.g., read from target repo). */
  set(key: string, guid: string): void {
    this.guids.set(key, guid);
  }

  /** Return all keys and GUIDs for debugging / dry-run output. */
  entries(): [string, string][] {
    return [...this.guids.entries()];
  }

  /** Total number of allocated GUIDs. */
  get size(): number {
    return this.guids.size;
  }

  // -----------------------------------------------------------------------
  // Convenience key builders (enforce naming convention)
  // -----------------------------------------------------------------------

  // --- Data template keys ---
  templateRoot(componentName: string): string {
    return this.get(`template:${componentName}:root`);
  }
  templateStdVal(componentName: string): string {
    return this.get(`template:${componentName}:stdval`);
  }
  templateSection(componentName: string): string {
    return this.get(`template:${componentName}:section`);
  }
  templateField(componentName: string, fieldName: string): string {
    return this.get(`template:${componentName}:field:${fieldName}`);
  }
  templateFolder(componentName: string): string {
    return this.get(`template:${componentName}:folder`);
  }

  // --- Child template keys (for datasource children) ---
  childTemplateRoot(componentName: string): string {
    return this.get(`child-template:${componentName}:root`);
  }
  childTemplateStdVal(componentName: string): string {
    return this.get(`child-template:${componentName}:stdval`);
  }
  childTemplateSection(componentName: string): string {
    return this.get(`child-template:${componentName}:section`);
  }
  childTemplateField(componentName: string, fieldName: string): string {
    return this.get(`child-template:${componentName}:field:${fieldName}`);
  }

  // --- Parameters template keys ---
  paramsRoot(componentName: string): string {
    return this.get(`params:${componentName}:root`);
  }
  paramsStdVal(componentName: string): string {
    return this.get(`params:${componentName}:stdval`);
  }

  // --- Folder template keys (datasource folder) ---
  folderRoot(componentName: string): string {
    return this.get(`folder:${componentName}:root`);
  }
  folderStdVal(componentName: string): string {
    return this.get(`folder:${componentName}:stdval`);
  }

  // --- Rendering keys ---
  rendering(componentName: string): string {
    return this.get(`rendering:${componentName}`);
  }
  renderingFolder(folderName: string): string {
    return this.get(`rendering-folder:${folderName}`);
  }

  // --- Site definition keys ---
  siteRoot(): string {
    return this.get('site:root');
  }
  siteHome(): string {
    return this.get('site:home');
  }
  siteData(): string {
    return this.get('site:data');
  }
  siteMedia(): string {
    return this.get('site:media');
  }
  siteDictionary(): string {
    return this.get('site:dictionary');
  }
  sitePresentation(): string {
    return this.get('site:presentation');
  }
  siteSettings(): string {
    return this.get('site:settings');
  }
  siteSiteGrouping(): string {
    return this.get('site:site-grouping');
  }
  siteSiteGroupingItem(): string {
    return this.get('site:site-grouping-item');
  }

  // --- Content item keys ---
  contentFolder(componentName: string): string {
    return this.get(`content:${componentName}:folder`);
  }
  contentItem(componentName: string, index: number): string {
    return this.get(`content:${componentName}:${index}`);
  }
  contentChildItem(componentName: string, parentIndex: number, childIndex: number): string {
    return this.get(`content:${componentName}:${parentIndex}:child:${childIndex}`);
  }
}
