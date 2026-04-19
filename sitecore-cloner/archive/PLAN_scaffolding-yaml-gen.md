# Plan: Site Scaffolding + SCS YAML Generation (Phase 5 Assembly)

## Context

Phase 4 builders produce Content SDK React components + `.manifest.json` files. Phase 5 Assembly takes those manifests and produces a deployable Sitecore site in the SE's Industry Verticals repo. This plan covers the two prerequisites for MVP testing: (1) scaffolding template files, (2) YAML generation logic.

## Part 1: Site Scaffolding (`sitecore-cloner/scaffolding/`)

**What:** A committed copy of the starter site infrastructure from `reference/industry-verticals/industry-verticals/starter/`, stripped of its 12 default components.

**Key finding:** Infrastructure is 95%+ identical across all 7 IV sites. Only `package.json` name field needs templating.

### Files to include (~65 files):

| Category | Files | Notes |
|----------|-------|-------|
| Root configs | `tsconfig.json`, `next.config.js`, `postcss.config.mjs`, `sitecore.config.ts`, `sitecore.cli.config.ts`, `vitest.config.ts`, `next-env.d.ts`, `components.json` | Verbatim |
| `package.json` | 1 file | Template `{{SITE_NAME}}` in `name` and `config.appName` |
| `src/pages/` | 12 files | Verbatim (catch-all route, _app, 404, 500, API routes) |
| `src/lib/` | 2 files | `sitecore-client.ts`, `component-props/index.ts` |
| `src/types/` | 3 files | `common.ts`, `igql.ts`, `locale.ts` |
| `src/components/content-sdk/` | 3 files | CdpPageView, FEAASScripts, SitecoreStyles |
| `src/assets/base/` | 6 CSS files | Verbatim base CSS |
| `src/assets/components/index.css` | 1 file | Empty (cloned CSS goes here) |
| `src/assets/main.css` | 1 file | Simplified (no starter component imports) |
| `src/helpers/` | 3 files | Verbatim |
| `src/hooks/` | 3 files | Verbatim |
| `src/byoc/` | 3 files | Verbatim |
| `src/shadcn/lib/utils.ts` | 1 file | Verbatim |
| `src/constants/` | 1 file | Verbatim |
| `src/Layout.tsx` etc. | 5 files | Layout, Bootstrap, Scripts, NotFound, DesignLibraryLayout |
| `.sitecore/import-map.ts` | 1 file | Verbatim (component-map.ts is auto-generated) |
| `public/favicon.ico` | 1 file | Placeholder |

**Excluded:** 12 starter components, `.storybook/`, `src/stories/`, `node_modules/`, `.next/`, `package-lock.json`

### Implementation:
1. `cp -r` starter to `sitecore-cloner/scaffolding/`
2. Delete excluded dirs/files
3. Template `package.json` with `{{SITE_NAME}}`
4. Simplify `src/assets/main.css` and `src/assets/components/index.css`

---

## Part 2: SCS YAML Generator (`sitecore-cloner/yaml-gen/`)

**What:** TypeScript module (runs via `npx tsx`) that reads `.manifest.json` files → generates all SCS YAML + config updates.

**Dependencies:** Zero new npm deps. Uses `crypto.randomUUID()` + template string YAML output.

### Module Structure

```
sitecore-cloner/yaml-gen/
  index.ts                              # CLI entry point
  types.ts                              # FieldManifest, SiteConfig, YamlFile interfaces
  constants.ts                          # All hardcoded SCS GUIDs (from BRIEF.md)
  guid-registry.ts                      # GUID allocation + cross-reference tracking
  yaml-writer.ts                        # Low-level YAML string builders
  generators/
    template-generator.ts               # Data template + section + fields + StdVal
    params-template-generator.ts        # Parameters template + StdVal
    folder-template-generator.ts        # Folder template + StdVal (if datasource)
    rendering-generator.ts              # Rendering definition (10+4 SharedFields)
    site-definition-generator.ts        # Site root + Home + folders + Settings
    content-item-generator.ts           # Datasource content items
    renderings-xml-generator.ts         # Home page __Renderings XML
    config-updater.ts                   # common.module.json + xmcloud.build.json + per-site modules
  assembly.ts                           # Full orchestrator
```

### Per-Component Output (~8 YAML files each):

1. **Container folder** — `Components/{Folder}/{TemplateName}.yml`
2. **Data template root** — `.../{TemplateName}/{TemplateName}.yml` (with `__Base template` = 2 hardcoded GUIDs)
3. **Standard Values** — `.../{TemplateName}/__Standard Values.yml` (self-referential: Template = Parent)
4. **Data section** — `.../{TemplateName}/Data.yml`
5. **Field items** — `.../{TemplateName}/Data/{FieldName}.yml` (one per field)
6. **Params template root** — `.../{TemplateName}/Rendering Parameters/{Name} Parameters.yml` (4 base GUIDs)
7. **Params StdVal** — `.../__Standard Values.yml`
8. **Folder template** — `.../{TemplateName} Folder.yml` (if datasource) + StdVal
9. **Rendering definition** — `Renderings/{Folder}/{ComponentName}.yml`

### Per-Site Output (once):

- Site definition YAML (with 15 module GUIDs)
- Home.yml with `__Renderings` XML
- Data/Media/Dictionary/Presentation folder items
- Settings + Site Grouping items
- Datasource content items (from manifest `sampleValue`/`sampleChildren`)
- `{site}-content.module.json` + `{site}-media.module.json`
- Updates to `common.module.json` + `xmcloud.build.json`

### GUID Strategy

**`GuidRegistry`** class allocates all UUIDs upfront with deterministic keys:
- `template:{Component}:root`, `:stdval`, `:section`, `:field:{Name}`
- `params:{Component}:root`, `:stdval`, `:folder`
- `folder:{Component}:root`, `:stdval`
- `rendering:{Component}`
- `site:root`, `site:home`, `site:data`, etc.
- `content:{Component}:folder`, `content:{Component}:{index}`

Cross-references resolve by key lookup. Parent GUIDs from existing target repo read at startup.

### Home Page `__Renderings` XML

Compose from all manifests, ordered by placeholder (`headless-header` → `headless-main` → `headless-footer`), with `p:before="*"` / `p:after` ordering, `s:ds` pointing to content item GUIDs, `s:id` to rendering GUIDs.

### Config Updates

- **common.module.json**: add site include to `items.includes`
- **xmcloud.build.json**: add rendering host + modules to `postActions.actions.scsModules.modules`
- Both use JSON read → modify → write with validation

---

## Implementation Sequence

| Step | Task | Depends On |
|------|------|------------|
| 1 | Copy scaffolding from starter, strip components, template package.json | — |
| 2 | `types.ts` + `constants.ts` | — |
| 3 | `guid-registry.ts` + `yaml-writer.ts` | Step 2 |
| 4 | `template-generator.ts` (most complex: ~6 files per component) | Step 3 |
| 5 | `params-template-generator.ts` + `folder-template-generator.ts` | Step 3 |
| 6 | `rendering-generator.ts` | Step 3 |
| 7 | `renderings-xml-generator.ts` + `site-definition-generator.ts` | Step 3 |
| 8 | `content-item-generator.ts` | Steps 4-6 (needs GUID keys) |
| 9 | `config-updater.ts` | Step 2 |
| 10 | `assembly.ts` + `index.ts` (orchestrator + CLI) | All above |

Steps 1-2 parallel. Steps 4-6 parallel. Steps 7-9 parallel.

---

## CLI Usage

```bash
# Full assembly (MVP test):
npx tsx sitecore-cloner/yaml-gen/index.ts \
  --site-name acme-corp \
  --site-display-name "Acme Corp" \
  --target ~/path/to/IV-repo \
  --manifest-dir src/components/

# Dry run (preview only):
npx tsx sitecore-cloner/yaml-gen/index.ts \
  --site-name acme-corp \
  --site-display-name "Acme Corp" \
  --target ~/path/to/IV-repo \
  --manifest-dir src/components/ \
  --dry-run
```

---

## Verification

### In this repo:
- `--dry-run` mode prints file list + YAML preview
- GUID integrity check: every parent reference resolves
- Compare generated YAML structure against reference files

### MVP test in target IV repo:
1. Create 2-3 manual `.manifest.json` files (HeroBanner, Features with children, Footer)
2. Run generator against user's IV fork
3. `cd target/industry-verticals/test-site && npm install && npm run build`
4. Push → deploy → verify site appears in Sitecore with templates, renderings, inline editing

### Key reference files for validation:
- `reference/.../Components/Page Content/Hero Banner/` — template YAML pattern
- `reference/.../projectRenderings/.../Hero Banner.yml` — rendering YAML pattern
- `reference/.../sites/forma-lux/.../Home.yml` — `__Renderings` XML pattern
