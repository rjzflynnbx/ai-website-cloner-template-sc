# Sitecore AI CMS Website Cloner

> **Start here.** This folder contains everything needed to convert a cloned website into a deployable Sitecore AI CMS project.

## Quick Context

This repo is a fork of [ai-website-cloner-template](https://github.com/anthropics/ai-website-cloner-template). The upstream template reverse-engineers websites into plain Next.js. This fork adds Sitecore AI CMS output: Content SDK components, SCS YAML serialization, and automated assembly into a Sitecore Industry Verticals project.

**North Star:** SE runs one command → gets a fully deployable Sitecore site of the prospect's website → demos with real inline editing and CMS capabilities.

## What's Here

```
sitecore-cloner/
├── README.md                          ← YOU ARE HERE (start point)
├── BRIEF.md                           ← Full project brief (architecture, progress, all GUIDs)
├── FIELD_TYPE_RULES.md                ← HTML → Sitecore field type mapping (9 rules)
├── BUILDER_PROMPT_TEMPLATE.md         ← Phase 4 builder prompt + manifest schema
├── NEW_SITE_CHECKLIST.md              ← 50-item checklist for adding a site to IV
├── scaffolding/                       ← Site template files (copy of starter, components stripped)
│   ├── package.json                   ← Templated: {{SITE_NAME}}, {{SITE_DISPLAY_NAME}}
│   ├── src/components/content-sdk/    ← 3 required utility components
│   ├── src/pages/                     ← Catch-all route + API routes
│   └── ...                            ← ~50 infrastructure files (verbatim from IV starter)
├── yaml-gen/                          ← SCS YAML generator (12 TS modules)
│   ├── index.ts                       ← CLI entry point
│   ├── assembly.ts                    ← Orchestrator (reads manifests → writes everything)
│   ├── types.ts                       ← FieldManifest, SiteConfig interfaces
│   ├── constants.ts                   ← All SCS GUIDs (40+ platform constants)
│   ├── guid-registry.ts              ← UUID allocation with deterministic cross-refs
│   ├── yaml-writer.ts                ← Template-string YAML builders
│   └── generators/                    ← 8 generators (one per output type)
└── archive/                           ← Completed plans and research notes
```

## How It Works

### Pipeline (5 phases)

| Phase | What | Where | Status |
|-------|------|-------|--------|
| 1. Recon | Screenshots, design tokens, interaction sweeps | This repo (`docs/`) | Unchanged from upstream |
| 2. Foundation | Fonts, colors, CSS tokens, SVG extraction | This repo (`src/`) | Unchanged from upstream |
| 3. Specs | One detailed spec per component | This repo (`docs/research/components/`) | Unchanged from upstream |
| 4. Build | Parallel builders → Content SDK components + manifests | This repo (worktrees → `src/`) | **Modified** (Sitecore mode) |
| 5. Assembly | Scaffolding + YAML + config → target IV repo | SE's IV repo | **NEW** |

### Phase 5 Assembly (the new part)

```bash
# Generate everything:
npx tsx sitecore-cloner/yaml-gen/index.ts \
  --site-name acme-corp \
  --site-display-name "Acme Corp" \
  --target ~/path/to/IV-repo \
  --manifest-dir src/components/

# Preview without writing:
npx tsx sitecore-cloner/yaml-gen/index.ts \
  --site-name acme-corp \
  --target ~/path/to/IV-repo \
  --manifest-dir src/components/ \
  --dry-run
```

Assembly does:
1. Reads `.manifest.json` files from builders
2. Generates SCS YAML (templates, renderings, site definition, content items)
3. Copies scaffolding to target IV repo
4. Updates `common.module.json` + `xmcloud.build.json`
5. Creates per-site module configs

### Per-component output (~8 YAML files)
- Data template hierarchy (root + StdVal + section + field items)
- Parameters template + StdVal
- Folder template + StdVal (if datasource children)
- Rendering definition (10+ SharedFields)
- Content items with sample data

## Current Status

- **Phase 1 (Exploration):** DONE — IV repo analyzed, Content SDK patterns confirmed
- **Phase 2 (Design):** DONE — field rules, builder prompt, YAML patterns, all GUIDs catalogued
- **Phase 3 (Implementation):** Scaffolding + YAML generator DONE, dry-run verified
- **Next:** MVP test — create manual components, run Assembly against IV fork, verify build + deploy

## Key Technical Decisions

- **Content SDK v1.2.1** (NOT legacy JSS) — `@sitecore-content-sdk/nextjs`
- **SCS YAML for everything** — no CLI tools, no MCP for v1
- **Starter site as scaffolding base** — identical infrastructure to all 7 IV sites
- **Single `/clone-website` skill with `--target` flag** — Sitecore mode is opt-in
- **Build here, deliver there** — builders work in this repo, Assembly copies once to target

## Reading Order for New Context

1. **This README** — overview + status
2. **BRIEF.md** — full context (architecture, GUIDs, progress, blind spots)
3. **FIELD_TYPE_RULES.md** — if working on builder prompt or manifest validation
4. **BUILDER_PROMPT_TEMPLATE.md** — if working on Phase 4 builders
5. **yaml-gen/types.ts** — if working on YAML generator
6. **NEW_SITE_CHECKLIST.md** — reference for what Assembly must produce
