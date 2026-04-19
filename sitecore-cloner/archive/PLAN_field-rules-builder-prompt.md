# Plan: Create FIELD_TYPE_RULES.md + BUILDER_PROMPT_TEMPLATE.md

> **To implement this plan:** Read this file, then execute the steps below. All research is done — this is implementation-ready.

## Context

We're progressing Phase 2 of the Sitecore AI CMS website cloner. The upstream cloning pipeline (Phases 1-3) produces framework-agnostic component specs. Phase 4 builders currently output plain React components. We need two design documents that define how builders produce **Content SDK components + field manifests** instead, so Phase 5 (Assembly) can generate valid SCS YAML.

These are the two most critical design artifacts blocking the MVP test. Without them, we can't test whether our generated SCS YAML is accepted by Sitecore.

**Evidence base:** Patterns validated against the reference IV repo (305 field definitions across 7 sites, 30+ components, rendering YAML, Standard Values, template inheritance), official Sitecore docs, and the existing clone-website skill.

---

## Blind Spot Review (verified against reference code)

These findings from the deep-dive must be incorporated:

### 1. Standard Values are boilerplate
Standard Values items are mostly system metadata (`__Created`, `__Updated`, `__Revision`). Only rare templates have field defaults (e.g., `$name` token). **Implication:** Assembly generates them mechanically — no data needed from the manifest.

### 2. Data template inheritance is consistent (hardcodable)
ALL data templates inherit from: `{1930BBEB-7805-471A-A3BE-4858AC7CF696}` (Content Base) + `{44A022DB-56D3-419A-B43B-E27E4D8E9C41}` (Rendering Params Base). **Implication:** Hardcode in Assembly.

### 3. Parameters Template inheritance VARIES
Most use 3 GUIDs (`{4247AAD4...}` + `{44A022DB...}` + `{3DB3EB10...}`), some use 4. **Implication:** Assembly reads base templates from an existing Parameters Template in the target IV repo rather than hardcoding. The manifest doesn't need to capture this.

### 4. Folder templates have NO base template inheritance
They're plain templates. **Implication:** Don't add `__Base template` for folder templates in Assembly.

### 5. "Shared" field flag pattern
- Image fields → Shared: 1
- Treelist/list fields → Shared: 1
- Rich Text → Shared: 1
- General Link → Shared: 1
- Number → Shared: 1
- Single-Line Text → NOT shared
- Multi-Line Text → NOT shared
**Implication:** Add `shared` boolean to field manifest + default rules in FIELD_TYPE_RULES.md.

### 6. Rendering YAML has 10 ALWAYS-present SharedFields
Not just 5-6. The full set: `componentName`, `__Icon`, `Datasource Template` (empty if none), `Open Properties after Add` (0), `__Read Only` (0), `Parameters Template` (GUID), `Datasource Location` (empty if none), `AddFieldEditorButton` (empty), `__Shared revision`, `OtherProperties` (`IsRenderingsWithDynamicPlaceholders=true`).

Plus conditionally: `Placeholders` (GUIDs), `ComponentQuery` (GraphQL), `Page Editor Buttons` (for multi-item folder components: `{31A3A929...}` + `{587F8FBD...}`).

### 7. `__Renderings` XML ordering
Uses `p:before="*"` for first rendering, `p:after="r[@uid='...']"` for subsequent ones. `s:par` contains serialized GridParameters/Styles/DynamicPlaceholderId.

### 8. IGQLTextField type needed in scaffolding
Builder prompt references `IGQLTextField` from `@/types/igql.ts`. This file must be in site scaffolding (identical across all IV sites):
```ts
import { TextField } from '@sitecore-content-sdk/nextjs';
export interface IGQLTextField { jsonValue: TextField; }
export interface IGQLField<T> { jsonValue: T; }
```

---

## Deliverable 1: `sitecore-cloner/FIELD_TYPE_RULES.md`

Opinionated, first-match rules for mapping HTML content → Sitecore field types. Consumed by builder agents (condensed in their prompt) and by Assembly (for validation).

### Structure

1. **Quick Reference Table** — HTML pattern → Sitecore type → TS type → render component → Shared flag (one-line per rule)
2. **Detailed Rules (9 rules, ordered by specificity — apply first match)**
   - Rule 1: Headings (`<h1>`-`<h6>`) → Single-Line Text, `Field<string>`, `<Text tag="h1">`, not shared
   - Rule 2: Short plain text (< ~100 chars, no HTML) → Single-Line Text, `Field<string>`, `<Text>`, not shared
   - Rule 3: Long plain text (no inline HTML) → Multi-Line Text, `Field<string>`, `<Text>`, not shared
   - Rule 4: Text with inline HTML (`<em>`, `<strong>`, `<a>`, `<br>`) → Rich Text, `Field<string>`, `<RichText>`, shared, source: `query:$xaRichTextProfile`
   - Rule 5: All images → Image, `ImageField`, `<NextImage>`, shared, source: `query:$siteMedia`
   - Rule 6: All links/buttons/CTAs → General Link, `LinkField`, `<Link>`, shared, source: `query:$linkableHomes`
   - Rule 7: Videos → `ImageField` for poster and video source (matches IV HeroBanner convention), shared
   - Rule 8: 3+ repeating items → datasource children (GraphQL `children.results` pattern)
   - Rule 9: Numbers → Number, `Field<number>`, `<Text>`, shared (rare, only genuinely numeric)
3. **Shared Flag Rules** — explicit table mapping field type to shared default
4. **Field Source Rules** — which sources go with which field types
5. **Edge Cases** — decorative SVGs (not a field), CSS backgrounds, link+text combos (one LinkField, not separate text+link), navigation (special — uses site tree, not custom fields), footer (special — placeholder-based), checkboxes (rendering params only, not content)
6. **Field Naming Conventions** — PascalCase for direct fields, camelCase prefix for children (`featureTitle`), sort order: 100, 200, 300..., descriptive names (not HTML element names)
7. **v2 Field Types** — Treelist, Droplink, Multilist (skip for v1, noted for future)

### Key Design Decisions
- **Rich Text vs Multi-Line Text boundary**: presence of ANY inline HTML tags flips to Rich Text
- **Video handling**: `ImageField` type (matches IV's HeroBanner convention, NOT File field)
- **Datasource threshold**: 3+ repeating items = always datasource children
- **Navigation/Footer**: explicitly called out as special cases
- **Link text**: comes from the LinkField value itself, NOT a separate text field

---

## Deliverable 2: `sitecore-cloner/BUILDER_PROMPT_TEMPLATE.md`

The prompt template that `/clone-website` skill (Phase 4) uses when dispatching builder agents in Sitecore mode (`--target`).

### Structure

1. **Template Header** — builder produces TWO files: `.tsx` + `.manifest.json`
2. **Placeholders** — `{{TARGET_FILE_PATH}}`, `{{MANIFEST_PATH}}`, `{{COMPONENT_SPEC_CONTENTS}}`, `{{SCREENSHOT_PATH}}`, `{{SHARED_IMPORTS_SECTION}}`, `{{ComponentName}}`, `{{DISPLAY_NAME}}`
3. **Content SDK Component Pattern** — exact skeleton:
   ```tsx
   import React from 'react';
   import { Text, RichText, NextImage, Image, Link, Field, ImageField, LinkField,
            useSitecore, Placeholder } from '@sitecore-content-sdk/nextjs';
   import { ComponentProps } from '@/lib/component-props';

   interface Fields { ... }
   interface XxxProps extends ComponentProps { fields: Fields; }

   export const Default = ({ params, fields }: XxxProps): React.ReactElement => {
     const { RenderingIdentifier: id, styles } = params;
     if (!fields) return (<div className={`component xxx ${styles}`} id={id}>
       <span className="is-empty-hint">[COMPONENT NAME]</span></div>);
     return (
       <div className={`component xxx ${styles}`} id={id}>
         <div className="component-content">...</div>
       </div>
     );
   };
   ```
4. **Datasource Children Pattern** — uses `IGQLTextField` from `@/types/igql`, `ComponentRendering & { params: ComponentParams }` props type, `data.datasource.children.results` field structure
5. **Field Type Quick Rules** — condensed from FIELD_TYPE_RULES.md (embedded in prompt so builders don't need external docs)
6. **CRITICAL Rules**:
   - Wrapper div MUST have `component` CSS class
   - Use `id={params.RenderingIdentifier}` on wrapper
   - Named exports = variants, `Default` required
   - Field rendering: Text for text, RichText for rich, NextImage for images, Link for links
   - Empty state with `is-empty-hint`
   - Use `useSitecore()` + `page.mode.isEditing` for edit mode awareness
   - Use Tailwind CSS v4 utility classes
   - Use `@/` path alias, clsx available
7. **What NOT to do**: no `useState`/`useEffect` unless needed, no `'use client'` unless needed, no numbered fields for repeating items, no `withDatasourceCheck` HOC, no direct `next/image` import, no fields for decorative elements

### Field Manifest JSON Schema

```json
{
  "$schema": "field-manifest-v1",
  "componentName": "HeroBanner",
  "templateName": "Hero Banner",
  "templateFolder": "Page Content",
  "variants": ["Default"],
  "hasDatasourceChildren": false,
  "fields": [
    {
      "name": "Title",
      "sitecoreType": "Single-Line Text",
      "tsType": "Field<string>",
      "renderComponent": "Text",
      "renderTag": "h1",
      "sortOrder": 100,
      "shared": false,
      "sampleValue": "Welcome to Our Website"
    },
    {
      "name": "BackgroundImage",
      "sitecoreType": "Image",
      "tsType": "ImageField",
      "renderComponent": "NextImage",
      "sortOrder": 200,
      "source": "query:$siteMedia",
      "shared": true,
      "sampleValue": { "src": "/images/hero-bg.webp", "alt": "Hero background", "width": 1920, "height": 1080 }
    },
    {
      "name": "CtaLink",
      "sitecoreType": "General Link",
      "tsType": "LinkField",
      "renderComponent": "Link",
      "sortOrder": 300,
      "source": "query:$linkableHomes",
      "shared": true,
      "sampleValue": { "href": "/products", "text": "Shop Now", "linktype": "internal" }
    }
  ],
  "childTemplate": null,
  "parentFields": null,
  "graphqlQuery": null,
  "placeholder": "headless-main",
  "renderingParams": []
}
```

For datasource children components, the schema adds:
```json
{
  "hasDatasourceChildren": true,
  "fields": [],
  "childTemplate": {
    "name": "Feature",
    "fields": [...],
    "sampleChildren": [{ "itemName": "Feature 1", "values": {...} }, ...]
  },
  "parentFields": [{ "name": "Title", ... }],
  "graphqlQuery": "query FeaturesQuery($datasource: String!, $language: String!) { ... }"
}
```

### Manifest → Assembly Mapping

| Manifest Field | Generates | Checklist |
|---|---|---|
| `fields[]` (name, sitecoreType, sortOrder, source, shared) | Data Template YAML (root + section + N fields + Standard Values) | D1 |
| (hardcoded base, read from target) | Parameters Template YAML (+ Standard Values) | D2 |
| `hasDatasourceChildren` + `templateName` | Folder Template YAML (no base + Standard Values) | D3 |
| `componentName` + 10 required SharedFields + conditional fields | Rendering Definition YAML | D4 |
| `graphqlQuery` | ComponentQuery field on rendering | D4 |
| `hasDatasourceChildren` | Page Editor Buttons on rendering | D4 |
| `sampleValue` / `sampleChildren` | Datasource Content Items + Data Folder Items | E1, E2 |
| `placeholder` + GUIDs | Home page `__Renderings` XML (with ordering) | C |

### New GUIDs to add to BRIEF.md

```
# Rendering YAML additional SharedField IDs
COMPONENT_QUERY_ID   = "17bb046a-a32a-41b3-8315-81217947611b"   # ComponentQuery
ICON_FIELD_ID        = "06d5295c-ed2f-4a54-9bf2-26228d113318"   # __Icon
OPEN_PROPS_ID        = "7d8ae35f-9ed1-43b5-96a2-0a5f040d4e4e"   # Open Properties after Add
READ_ONLY_ID         = "9c6106ea-7a5a-48e2-8cad-f0f693b1e2d4"   # __Read Only
ADD_EDITOR_BTN_ID    = "c39a90ce-0035-41bb-90f6-3c8a6ea87797"   # AddFieldEditorButton
PAGE_EDITOR_BTN_MAIN = "31A3A929-C599-4DD3-91A6-F4A9487CC8B7"   # Page Editor Button
PAGE_EDITOR_BTN_ADD  = "587F8FBD-E38F-4E2B-8DE4-1F474D9DDD00"   # Page Editor Button (folder)
PAGE_EDITOR_BTN_ID   = "a2f5d9df-8cba-4a1d-99eb-51acb94cb057"   # Page Editor Buttons field

# Parameters Template base GUIDs (most common pattern)
PARAMS_BASE_1        = "4247AAD4-EBDE-4994-998F-E067A51B1FE4"
PARAMS_BASE_3        = "3DB3EB10-F8D0-4CC9-BE26-18CE7B139EC8"
```

---

## Implementation Steps

### Step 1: Create `sitecore-cloner/FIELD_TYPE_RULES.md`
Full field type rules document with all sections described above.

### Step 2: Create `sitecore-cloner/BUILDER_PROMPT_TEMPLATE.md`
Full builder prompt template with Content SDK pattern, manifest schema, examples, and rules.

### Step 3: Update `sitecore-cloner/BRIEF.md`
- Add all new GUIDs to "Key SCS GUIDs" section
- Add complete rendering YAML SharedField inventory (10 always + 4 conditional)
- Update Parameters Template section (base varies, read from target)
- Note Standard Values are boilerplate
- Update Phase 2 progress (items 1-2 completed)
- Cross-reference new documents

### Step 4: Update memory (`MEMORY.md`)
Reflect completed items and next steps.

---

## Verification

1. **Manifest → Checklist**: Walk through NEW_SITE_CHECKLIST.md sections D+E; confirm manifest provides data for every item
2. **Pattern match**: Component skeleton matches 4 IV reference components
3. **Field type coverage**: All 9 IV field types covered
4. **Shared flag**: Defaults match IV pattern
5. **Rendering YAML**: 10+4 fields documented
6. **GraphQL**: Datasource pattern matches Features ComponentQuery
7. **Internal consistency**: All 3 documents don't contradict each other
8. **Golden state**: These documents enable MVP test → manually write 2-3 components → generate YAML → push to IV fork → verify Sitecore accepts

## Reference Files for Implementation

- `sitecore-cloner/BRIEF.md` — SCS YAML patterns, all GUIDs, architecture
- `sitecore-cloner/NEW_SITE_CHECKLIST.md` — validates manifest covers everything
- `.claude/skills/clone-website/SKILL.md` — upstream skill for dispatch pattern
- `reference/industry-verticals/industry-verticals/retail/src/components/` — IV component patterns
- `reference/industry-verticals/industry-verticals/retail/src/types/igql.ts` — IGQLTextField type
- `reference/industry-verticals/authoring/items/.../projectRenderings/` — rendering YAML patterns
- `reference/industry-verticals/authoring/items/.../templatesProject/` — template YAML patterns
