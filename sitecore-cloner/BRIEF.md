# Sitecore AI CMS Website Cloner — Project Brief

> **This repo is a fork of [ai-website-cloner-template](https://github.com/anthropics/ai-website-cloner-template).** The upstream template reverse-engineers any website into a plain Next.js codebase. This fork adds Sitecore AI CMS output capability — the cloning pipeline (recon, foundation, component specs) stays unchanged; we modify what Phase 4 builders produce (Content SDK components instead of plain React) and add a new Phase 5 (assembly & delivery to the SE's Industry Verticals repo).

> To restore context in a new Claude Code session: "Read sitecore-cloner/README.md first, then BRIEF.md for full context."

## North Star / Golden Outcome

A Sitecore Sales Engineer runs **one command** against a prospect's website and gets a **fully deployable Sitecore AI CMS project** — the prospect's own site, running in Sitecore, with real inline editing, personalization, and full CMS capabilities. Ready to demo to the prospect.

Everything below serves this outcome.

## Target Users

Sitecore Sales Engineers — all have access to Sitecore AI CMS instances, can deploy applications, and have full platform access.

## What This Repo Is

`ai-website-cloner-template-sc` is a fork of the upstream website cloning template. The `/clone-website` skill (defined in `.claude/skills/clone-website/SKILL.md`) runs a 5-phase pipeline:

1. **Reconnaissance** — screenshots, design token extraction, interaction sweeps (scroll, click, hover, responsive) via browser MCP
2. **Foundation Build** (sequential) — fonts, colors, globals.css tokens, TypeScript types, SVG icon extraction, asset downloads
3. **Component Specs** — one detailed spec file per atomic component in `docs/research/components/`, with exact `getComputedStyle()` values, all states, responsive breakpoints, interaction models
4. **Parallel Build** — dispatches one builder agent per component in isolated git worktrees; each builder gets the full spec + screenshots inline
5. **Assembly & QA** — merges worktrees, wires up page routing, visual diff against original

**What we change:** Phases 1-3 are identical to upstream. Phase 4 builders output Content SDK components + field manifests (instead of plain React). Phase 5 becomes Assembly & Delivery — copies to the SE's Industry Verticals repo, generates SCS YAML, and verifies the build.

The skill uses a `--target` flag for Sitecore mode: `/clone-website <url> --target ~/path/to/Industry-Verticals/`. Without `--target`, it behaves identically to the upstream template.

## Repo Structure

```
ai-website-cloner-template-sc/
├── .claude/skills/clone-website/   ← the cloning skill (shared with upstream)
├── AGENTS.md                       ← upstream cloner instructions (unchanged)
├── CLAUDE.md                       ← references both AGENTS.md and sitecore-cloner/BRIEF.md
├── docs/                           ← cloner research output (filled during cloning)
│   ├── research/                   ← inspection output, component specs
│   └── design-references/          ← screenshots
├── sitecore-cloner/                ← OUR ADDITIONS (Sitecore-specific docs & templates)
│   ├── BRIEF.md                    ← this file
│   ├── NEW_SITE_CHECKLIST.md       ← every file/change to add a site to IV
│   ├── FIELD_TYPE_RULES.md         ← HTML content → Sitecore field type mapping
│   ├── BUILDER_PROMPT_TEMPLATE.md  ← Phase 4 builder prompt + field manifest schema
│   └── PLAN_field-rules-builder-prompt.md ← research notes (implementation-ready plan)
├── reference/industry-verticals/   ← git submodule (official Sitecore upstream, v4.1.1)
├── src/                            ← staging area (filled during cloning, copied to target in Phase 5)
└── public/                         ← static assets
```

## Architecture: Approach B — "Build Here, Deliver There"

This repo is the **tool** (skill + research workspace), not the product. Output goes into the SE's existing Industry Verticals repo.

```
THIS REPO (the brain)                    SE's INDUSTRY VERTICALS (the canvas)
├── .claude/skills/         ← skill logic
├── docs/research/          ← screenshots, specs   ──writes to──►  industry-verticals/cloned-site/
├── sitecore-cloner/        ← Sitecore docs/templates               authoring/items/.../cloned-site/
├── reference/industry-verticals/  ← pattern ref                    xmcloud.build.json (updated)
└── src/ (staging area)
```

```
Phases 1-3: Recon, Foundation, Specs    → in THIS repo (unchanged)
Phase 4:    Parallel Build              → worktrees in THIS repo, builders write to src/
Phase 5:    Assembly & Delivery         → surgical copy to target IV repo, verify build there
```

- `src/` is the staging area — builders write Content SDK components here in isolated worktrees, merge back.
- Assembly phase copies finished components + generates SCS items into the target IV repo.
- Build verification (`npm run build`) runs in the target repo where all dependencies exist.
- The SE's repo is only touched once, at the end, after everything is built and merged.

### Reference: Industry Verticals
Pattern reference. Shows exactly how a production Sitecore project is structured.

- Reference copy: `reference/industry-verticals/` (git submodule, official Sitecore upstream, v4.1.1)
- User's fork on disk: `/Users/rif/Documents/js-workspace/Sitecore.Demo.SitecoreAI.IndustryVerticals.SiteTemplates-1/`

## Progress

### Phase 1: Exploration — COMPLETED (2026-04-13)
1. **Sitecore documentation MCP** — confirmed working (Kapa.ai-style docs MCP)
2. **Industry Verticals repo explored** — findings:
   - **Content SDK v1.2.1** (`@sitecore-content-sdk/nextjs`) — NOT JSS
   - **SCS with YAML** serialization, `*.module.json` configs
   - **7 sites** defined in `xmcloud.build.json` (retail, luxury-retail, healthcare, travel, energy, starter, essential-living)
   - **~50 components** registered, auto-generated component-map via `sitecore-tools`
   - **Named exports** for variants (`export const Default`, `export const TopContent`)
   - **Next.js 15.3.8** + React 19 + Tailwind CSS v4 + Radix UI + Lucide icons
   - Each site has its own Next.js app under `industry-verticals/{site}/`
   - Content serialization modules split per site: `{site}-content.module.json` + `{site}-media.module.json`
3. **Cross-referenced with Sitecore docs** — patterns confirmed against official documentation

### Phase 2: Design & Feasibility — COMPLETED (2026-04-17)

4. **SCS YAML patterns studied** — complete template/rendering/site-definition YAML examined (see SCS YAML Patterns section below)
5. **New-site checklist formalized** — see `sitecore-cloner/NEW_SITE_CHECKLIST.md`
6. **Skill approach decided** — single skill with `--target` flag (no separate `/clone-website-sitecore`)
7. **Field type rules designed** — see `sitecore-cloner/FIELD_TYPE_RULES.md`
8. **Builder prompt template designed** — see `sitecore-cloner/BUILDER_PROMPT_TEMPLATE.md`

### Phase 3: Implementation — COMPLETED (2026-04-17)

9. **Site scaffolding created** — `sitecore-cloner/scaffolding/` (~50 files from starter, 12 components stripped, `package.json` templated)
10. **SCS YAML generator implemented** — `sitecore-cloner/yaml-gen/` (12 TS modules, zero deps, runs via `npx tsx`)
11. **Code review + bug fixes** — 5 critical/high issues found and fixed (content item field GUIDs, __Renderings injection, __Read Only value, XML escaping, IV parent ID detection)
12. **Dry-run verified** — generates 24-26 YAML files per component, cross-references intact

### Phase 4: MVP Test — NEXT

13. Create 2-3 manual Content SDK components + `.manifest.json` files
14. Run Assembly against user's IV fork
15. Verify: `npm install && npm run build` passes in target repo
16. Push → deploy → verify site appears in Sitecore with templates, renderings, inline editing

### Phase 5: Skill Integration — FUTURE

17. Modify `/clone-website` skill to add `--target` Sitecore mode + Pre-Flight
18. End-to-end test — clone a real website into Sitecore

## Key Technical Context (Confirmed)

### SDK: Content SDK v1.2.1
Industry Verticals uses `@sitecore-content-sdk/nextjs` v1.2.1 (the modern SDK, NOT legacy JSS).

### Sitecore Component Pattern (Content SDK — confirmed from Industry Verticals)
```tsx
import React from 'react';
import { Text, RichText, Field, ImageField, LinkField } from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from 'lib/component-props';

type HeroBannerProps = ComponentProps & {
  fields: {
    Title: Field<string>;
    Subtitle: Field<string>;
    BackgroundImage: ImageField;
    CTALink: LinkField;
  };
};

// Named export = variant name. 'Default' is required.
export const Default = ({ params, fields }: HeroBannerProps): React.ReactElement => {
  const styles = `${params.GridParameters ?? ''} ${params.styles ?? ''}`.trimEnd();
  return (
    <div className={`component hero-banner ${styles}`}>
      <div className="component-content">
        <Text tag="h1" field={fields.Title} />
        <RichText field={fields.Subtitle} />
      </div>
    </div>
  );
};
```

Key patterns:
- `component` CSS class on wrapper is REQUIRED for Page Builder
- `props.params.styles` for SXA style support
- `props.params.GridParameters` for grid layout
- Named exports = variant names (must match Content Editor variant definitions)
- Component map is auto-generated by `sitecore-tools project component generate-map`

### Content Modeling
- **Templates** = field schemas (like TypeScript interfaces for content)
- **Items** = instances of templates (the actual content)
- **Renderings** = mapping from Sitecore rendering name → React component
- **Placeholders** = named slots where editors drop renderings
- **Component Factory/Map** = registry that resolves rendering names to React components

### Data Flow
```
Content author publishes → Experience Edge (CDN) →
Next.js fetches via client.getPage(path, locale) → Layout + component data →
[[...path]].tsx catch-all → SitecoreProvider(componentMap) → Placeholder components →
Component Map resolves rendering → Component receives props.fields → Renders
```

### Key Structural Differences from Plain Next.js
| What | Plain Next.js | Sitecore Next.js |
|------|--------------|-----------------|
| Routing | File-based `page.tsx` | Catch-all `[[...path]].tsx` resolving via Layout Service |
| Content | Hardcoded JSX | `props.fields` from Layout Service via Experience Edge |
| Components | Regular React | Content SDK field helpers (`<Text>`, `<Image>`, etc.) for inline editing |
| Page composition | Single component tree | Placeholder-based (editors can rearrange) |
| Content model | None | Templates + Items in Sitecore |
| Middleware | None | Redirects, multisite, personalization plugins |
| Preview/editing | `npm run dev` | Pages editor with editing host |

## SCS YAML Patterns (investigated 2026-04-15)

Concrete YAML structures from the reference submodule. These are the patterns we generate programmatically.

### Template Hierarchy: Template → Section → Field

Each Sitecore data template is 3 levels of YAML items:

**Template root** — defines the schema, inherits from base templates:
```yaml
ID: "ac18eef2-f134-4985-8b74-6ad16cca6577"
Parent: "<parent-folder-guid>"
Template: "ab86861a-6030-46c5-b394-e8f99e8b87db"  # Template template
SharedFields:
- ID: "12c33f3f-86c5-43a5-aeb4-5598cec45116"
  Hint: __Base template
  Value: |
    {1930BBEB-7805-471A-A3BE-4858AC7CF696}
    {44A022DB-56D3-419A-B43B-E27E4D8E9C41}
```

**Template section** ("Data") — groups fields:
```yaml
Template: "e269fbb5-3750-427a-9149-7aa950b49301"  # Template section template
```

**Template field** — each field with its type:
```yaml
Template: "455a3e98-a627-4b40-8035-e683a0331ac7"  # Template field template
SharedFields:
- ID: "ab162cc0-dc80-4abf-8871-998ee5d7ba32"
  Hint: Type
  Value: "Single-Line Text"  # or "Rich Text", "Image", "General Link"
- ID: "ba3f86a2-4a1c-4d78-b63d-91c2779c1b5e"
  Hint: __Sortorder
  Value: 100
- ID: "1eb8ae32-e190-44a6-968d-ed904c794ebf"
  Hint: Source
  Value: "query:$siteMedia"  # optional, field-type-dependent
```

### Key SCS GUIDs (constants)

```
# Item template types
TEMPLATE_TEMPLATE    = "ab86861a-6030-46c5-b394-e8f99e8b87db"
TEMPLATE_SECTION     = "e269fbb5-3750-427a-9149-7aa950b49301"
TEMPLATE_FIELD       = "455a3e98-a627-4b40-8035-e683a0331ac7"
RENDERING_TEMPLATE   = "04646a89-996f-4ee7-878a-ffdbf1f0ef0d"

# Field definition shared field IDs (the ID of the field ON the template field item)
FIELD_TYPE_ID        = "ab162cc0-dc80-4abf-8871-998ee5d7ba32"   # "Type" hint
FIELD_SOURCE_ID      = "1eb8ae32-e190-44a6-968d-ed904c794ebf"   # "Source" hint
FIELD_SORTORDER_ID   = "ba3f86a2-4a1c-4d78-b63d-91c2779c1b5e"  # "__Sortorder"
FIELD_SHARED_ID      = "be351a73-fcb0-4213-93fa-c302d8ab4f51"   # "Shared" (1 = shared)
FIELD_SHARED_REV_ID  = "dbbbeca1-21c7-4906-9dd2-493c1efa59a2"  # "__Shared revision"

# Rendering shared field IDs (10 ALWAYS-present + 4 conditional)
# Always present:
COMPONENT_NAME_ID    = "037fe404-dd19-4bf7-8e30-4dadf68b27b0"   # "componentName"
ICON_FIELD_ID        = "06d5295c-ed2f-4a54-9bf2-26228d113318"   # "__Icon"
DS_TEMPLATE_ID       = "1a7c85e5-dc0b-490d-9187-bb1dbcb4c72f"   # "Datasource Template" (empty if none)
OPEN_PROPS_ID        = "7d8ae35f-9ed1-43b5-96a2-0a5f040d4e4e"   # "Open Properties after Add" (value: 0)
READ_ONLY_ID         = "9c6106ea-7a5a-48e2-8cad-f0f693b1e2d4"   # "__Read Only" (value: 0)
PARAMS_TEMPLATE_ID   = "a77e8568-1ab3-44f1-a664-b7c37ec7810d"   # "Parameters Template" (GUID)
DS_LOCATION_ID       = "b5b27af1-25ef-405c-87ce-369b3a004016"   # "Datasource Location" (empty if none)
ADD_EDITOR_BTN_ID    = "c39a90ce-0035-41bb-90f6-3c8a6ea87797"   # "AddFieldEditorButton" (empty)
FIELD_SHARED_REV_ID  = "dbbbeca1-21c7-4906-9dd2-493c1efa59a2"   # "__Shared revision"
OTHER_PROPS_ID       = "e829c217-5e94-4306-9c48-2634b094fdc2"   # "OtherProperties" (IsRenderingsWithDynamicPlaceholders=true)
# Conditional:
PLACEHOLDERS_ID      = "069a8361-b1cd-437c-8c32-a3be78941446"   # "Placeholders" (GUID list, if component has child placeholders)
COMPONENT_QUERY_ID   = "17bb046a-a32a-41b3-8315-81217947611b"   # "ComponentQuery" (GraphQL, for datasource children)
PAGE_EDITOR_BTN_ID   = "a2f5d9df-8cba-4a1d-99eb-51acb94cb057"   # "Page Editor Buttons" (for folder components)
# Page Editor Button GUIDs (used in PAGE_EDITOR_BTN_ID value):
PAGE_EDITOR_BTN_MAIN = "31A3A929-C599-4DD3-91A6-F4A9487CC8B7"   # Edit button
PAGE_EDITOR_BTN_ADD  = "587F8FBD-E38F-4E2B-8DE4-1F474D9DDD00"   # Add child button

# Parameters Template base GUIDs (inheritance varies — read from target repo)
PARAMS_BASE_1        = "4247AAD4-EBDE-4994-998F-E067A51B1FE4"   # Most common base
PARAMS_BASE_3        = "3DB3EB10-F8D0-4CC9-BE26-18CE7B139EC8"   # Third base (varies)

# Base template GUIDs (for __Base template field)
CONTENT_BASE         = "1930BBEB-7805-471A-A3BE-4858AC7CF696"
RENDERING_PARAMS_BASE = "44A022DB-56D3-419A-B43B-E27E4D8E9C41"

# Site definition
HEADLESS_SITE_TEMPLATE = "e5b045ab-fadd-4e52-8168-4b4e5c489e36"
MODULES_FIELD_ID     = "1230d2cb-4948-4d43-8a3b-b39978f6f1b3"

# These 15 module GUIDs go in every site's Modules field (copy from existing site)
SITE_MODULES = """
{5A2F6A6F-3028-4210-AAD3-82C1365C4802}
{9F10010E-49E2-4DCD-A5A1-4DA752ADED2A}
{4342A029-0186-4B0D-8959-FFEF4FD998C2}
{AE5D1384-BB75-4C6B-A8B5-4B008C2AC5DA}
{C4658673-5D70-44ED-9004-D66EAC1DC718}
{CA502DCF-20D2-4618-A735-E4FCB6D5E114}
{E2AF1A41-799E-481B-8FDC-B2D33FB729A1}
{66B9C663-2602-42B1-A5A2-3D04DB6C506A}
{1FD78E81-59A6-4513-90F1-165A95D4B16B}
{BEBF4026-24A3-4EA6-986A-518B76DBD71A}
{385F31BE-FF0C-4D84-A627-9ECD21295AFD}
{F0EA389E-F78D-440B-9429-F04FE735344A}
{AC1A27CA-6BF3-4D23-915E-668326D52CF1}
{D7EEAF4D-2B58-4029-B141-844221565EF0}
{1F35559F-2140-4774-8BC1-525BB722BAA2}
"""
```

### Rendering Item Pattern (Full SharedField Inventory)

Every rendering definition has **10 always-present** SharedFields + up to **4 conditional** ones:

```yaml
ID: "<generated-guid>"
Parent: "<renderings-folder-guid>"
Template: "04646a89-996f-4ee7-878a-ffdbf1f0ef0d"
Path: "/sitecore/layout/Renderings/Project/industry-verticals/<folder>/<ComponentName>"
SharedFields:
# --- 10 ALWAYS PRESENT ---
- ID: "037fe404-dd19-4bf7-8e30-4dadf68b27b0"
  Hint: componentName
  Value: ComponentName
- ID: "06d5295c-ed2f-4a54-9bf2-26228d113318"
  Hint: __Icon
  Value: "Office/32x32/window_dialog.png"
- ID: "1a7c85e5-dc0b-490d-9187-bb1dbcb4c72f"
  Hint: Datasource Template
  Value: "/sitecore/templates/Project/industry-verticals/Components/<folder>/<TemplateName>/<TemplateName>"
- ID: "7d8ae35f-9ed1-43b5-96a2-0a5f040d4e4e"
  Hint: Open Properties after Add
  Value: "0"
- ID: "9c6106ea-7a5a-48e2-8cad-f0f693b1e2d4"
  Hint: __Read Only
  Value: "0"
- ID: "a77e8568-1ab3-44f1-a664-b7c37ec7810d"
  Hint: Parameters Template
  Value: "{<params-template-guid>}"
- ID: "b5b27af1-25ef-405c-87ce-369b3a004016"
  Hint: Datasource Location
  Value: "query:$site/*[@@name='Data']/*[@@templatename='<TemplateName> Folder']|query:$sharedSites/*[@@name='Data']/*[@@templatename='<TemplateName> Folder']"
- ID: "c39a90ce-0035-41bb-90f6-3c8a6ea87797"
  Hint: AddFieldEditorButton
  Value: ""
- ID: "dbbbeca1-21c7-4906-9dd2-493c1efa59a2"
  Hint: __Shared revision
  Value: "<generated-guid>"
- ID: "e829c217-5e94-4306-9c48-2634b094fdc2"
  Hint: OtherProperties
  Value: IsRenderingsWithDynamicPlaceholders=true
# --- CONDITIONAL (add when applicable) ---
# Placeholders — when component has child placeholders:
# - ID: "069a8361-b1cd-437c-8c32-a3be78941446"
#   Hint: Placeholders
#   Value: "{<placeholder-guid>}"
# ComponentQuery — when component uses GraphQL for datasource children:
# - ID: "17bb046a-a32a-41b3-8315-81217947611b"
#   Hint: ComponentQuery
#   Value: "<full-graphql-query>"
# Page Editor Buttons — for datasource folder components:
# - ID: "a2f5d9df-8cba-4a1d-99eb-51acb94cb057"
#   Hint: Page Editor Buttons
#   Value: "{31A3A929-C599-4DD3-91A6-F4A9487CC8B7}|{587F8FBD-E38F-4E2B-8DE4-1F474D9DDD00}"
```

**Notes:**
- Datasource Template and Datasource Location can be empty if the component doesn't use a datasource
- Parameters Template base inheritance VARIES (3 or 4 GUIDs) — Assembly reads from an existing params template in the target IV repo, does NOT hardcode
- Standard Values on ALL templates are mostly boilerplate (system metadata: `__Created`, `__Updated`, `__Revision`) — Assembly generates them mechanically

### Placeholder Strategy

IV Layout.tsx uses 3 placeholders: `headless-header`, `headless-main`, `headless-footer`. The cloner already extracts header/body/footer separately → maps naturally:

```
Cloner extracts:           Sitecore Layout.tsx placeholders:
  Navigation component  →   headless-header
  Body sections         →   headless-main (each section = a rendering)
  Footer component      →   headless-footer
```

### Home Page __Renderings XML

```xml
<r xmlns:p="p" xmlns:s="s" p:p="1">
  <d id="{FE5D7FDF-89C0-4D99-9AA3-B5FBD009C9F3}">
    <r uid="{<unique-guid>}" p:before="*"
       s:ds="<datasource-item-guid>"
       s:id="{<rendering-definition-guid>}"
       s:par="GridParameters=...&FieldNames=...&Styles=...&RenderingIdentifier&CSSStyles&DynamicPlaceholderId=1"
       s:ph="headless-main" />
  </d>
</r>
```

### Module Configuration

**common.module.json** — per-site include pattern:
```json
{
  "name": "sites-{site-name}",
  "path": "/sitecore/content/industry-verticals/{site-name}",
  "rules": [
    { "path": "/home", "scope": "SingleItem", "allowedPushOperations": "CreateOnly" },
    { "path": "/Media", "scope": "SingleItem", "allowedPushOperations": "CreateAndUpdate" },
    { "path": "/Data", "scope": "SingleItem", "allowedPushOperations": "CreateOnly" },
    { "path": "/Dictionary", "scope": "SingleItem", "allowedPushOperations": "CreateOnly" },
    { "path": "/Presentation", "scope": "SingleItem", "allowedPushOperations": "CreateOnly" },
    { "path": "/Settings/Site Grouping", "scope": "ItemAndDescendants", "allowedPushOperations": "CreateOnly" },
    { "path": "/Settings", "scope": "ItemAndChildren", "allowedPushOperations": "CreateAndUpdate" },
    { "path": "*", "scope": "Ignored" }
  ]
}
```

**Per-site content module** (`{site}-content.module.json`):
```json
{
  "namespace": "Project.{SiteName}-Content",
  "references": ["Project.IndustryVerticals"],
  "items": {
    "includes": [
      { "name": "{site}-home", "path": "/sitecore/content/industry-verticals/{site}/home", "scope": "DescendantsOnly", "allowedPushOperations": "CreateAndUpdate" },
      { "name": "{site}-media", "path": "/sitecore/content/industry-verticals/{site}/Media", "scope": "DescendantsOnly", "allowedPushOperations": "CreateAndUpdate" },
      { "name": "{site}-data", "path": "/sitecore/content/industry-verticals/{site}/Data", "scope": "DescendantsOnly", "allowedPushOperations": "CreateAndUpdate" },
      { "name": "{site}-dictionary", "path": "/sitecore/content/industry-verticals/{site}/Dictionary", "scope": "DescendantsOnly", "allowedPushOperations": "CreateAndUpdate" },
      { "name": "{site}-presentation", "path": "/sitecore/content/industry-verticals/{site}/Presentation", "scope": "DescendantsOnly", "allowedPushOperations": "CreateAndUpdate" }
    ]
  }
}
```

## Resolved Blind Spots

### Marketer MCP — v2 Enhancement Only
The Marketer MCP is a marketer tool, not a developer tool. It can populate content and compose pages, but cannot create templates, renderings, or site definitions. **SCS serialization handles everything for v1.** Marketer MCP becomes a v2 enhancement for post-deploy refinement (upload images to Media Library, add personalization, fine-tune content).

### Parallel Build Strategy
Builders write Content SDK components to `src/` in isolated worktrees, same parallel pattern as the upstream cloner. Assembly phase copies finished components to the target IV repo. The SE's repo is only touched once, at the end.

### Staging Area Dependencies (investigated 2026-04-15)
This repo doesn't have `@sitecore-content-sdk/nextjs` installed (it's a plain Next.js 16 template). Builders in worktrees write Content SDK components with imports like `import { Text } from '@sitecore-content-sdk/nextjs'` — `npx tsc --noEmit` would fail.

**Solution:** The skill's Pre-Flight step (in Sitecore mode) installs Content SDK + creates `lib/component-props` stubs in this repo as dev dependencies. This is temporary setup for the build session, keeps the worktree strategy intact, and allows type-checking. The components don't run here — they just need to type-check.

### Parameters Template — Per Component (investigated 2026-04-15)
Each rendering has its own unique Parameters Template (NOT a shared template). For each cloned component, we generate:
1. Data template + Standard Values + section + field items
2. Parameters template + Standard Values
3. Folder template + Standard Values (for datasource-driven components)
4. Rendering definition

That's **6-8+ YAML items per component**, not 3 as originally estimated. See `NEW_SITE_CHECKLIST.md` section D for details.

### Standard Values — Required (investigated 2026-04-15)
Every template MUST have a `__Standard Values` child item. It's a self-referential item (Template field = parent template GUID). Can have empty fields but the item itself must exist, or SCS push may fail.

### Content SDK Utility Components — Required (investigated 2026-04-15)
IV sites require 3 utility components in `src/components/content-sdk/`:
- `CdpPageView.tsx` — CDP page view event tracking
- `FEAASScripts.tsx` — Front-End-as-a-Service integrations
- `SitecoreStyles.tsx` — Page Editor styles
These are identical across all IV sites and must be included in site scaffolding.

### Existing Cloner Compatibility
- Phases 1-3 (recon, foundation, specs): unchanged from upstream
- Phase 4 (builders): prompt template must output Content SDK components + field manifests
- Phase 5 (assembly): NEW — copy to target, generate SCS YAML, create scaffolding, verify build

## Known Risks

1. **Content model decisions** — AI must choose field types. Mitigated by opinionated defaults in `FIELD_TYPE_RULES.md`.
2. **SCS ordering** — templates must be pushed before content items. Module `references` field handles this (per-site modules reference `Project.IndustryVerticals`).
3. **xmcloud.build.json edits** — surgical additions only, back up first, validate JSON after.
4. **Prospect images** — v1: static assets in `public/`. v2: Marketer MCP upload to Media Library.
5. **Version drift** — reference is v4.1.1; SE's fork may differ. Validate at skill start.
6. **Module GUIDs in site definition** — read from existing site in target repo, don't hardcode.
7. **Datasource Folder templates** — each datasource-driven component needs a companion Folder template for the Datasource Location query to work. Pre-created datasource items work without it (referenced by GUID in `__Renderings`), but editors can't create new ones without it.

## Important Notes
- `CLAUDE.md` references both `AGENTS.md` (upstream cloner) and `sitecore-cloner/BRIEF.md` (this file)
- `AGENTS.md` is untouched — it still describes the original cloner template
- `reference/industry-verticals/` is a git submodule (official Sitecore upstream, v4.1.1). Use `git submodule update --init` after cloning.
- The Sitecore rebrand: XM Cloud → Sitecore AI CMS (November 2025). Always use the latest terminology.
- Content SDK drops Experience Editor support — all visual editing through Pages (Page Builder)
- Experience Edge + GraphQL is the canonical data flow for Sitecore AI CMS
- Default rendering strategy: SSG + ISR
