# Post-Review Fixes Plan (2026-04-17)

## Context
After implementing the 11-fix plan from the comprehensive review, a second thorough review was conducted. All fixes were verified correct EXCEPT for 7 remaining issues (2 critical, 3 high, 2 medium). This plan documents those issues and the fixes needed.

## Ground Truth Source
User's actual IV fork: `~/Documents/js-workspace/Sitecore.Demo.SitecoreAI.IndustryVerticals.SiteTemplates-1/`

---

## CRITICAL — Must fix before MVP

### Issue #1: TEMPLATES_BASE_PATH missing `/industry-verticals` segment

**File:** `sitecore-cloner/yaml-gen/constants.ts` line 176

**Current (WRONG):**
```typescript
export const TEMPLATES_BASE_PATH =
  'authoring/items/industry-verticals/common/items/templatesProject';
```

**Correct:**
```typescript
export const TEMPLATES_BASE_PATH =
  'authoring/items/industry-verticals/common/items/templatesProject/industry-verticals';
```

**Evidence:** `ls` of the actual IV fork `templatesProject/` shows hash-based directories plus an `industry-verticals/` subdirectory. ALL human-readable template files are at `templatesProject/industry-verticals/Components/...`. The renderings path already correctly includes this segment: `projectRenderings/industry-verticals`.

**Impact:** ALL template files (template root, StdVal, section, fields, folder template, params template) written to wrong directory. Files would technically work (SCS reads by Path: field), but would be inconsistent with IV structure and confusing.

**Files affected by this fix:** Only constants.ts — all generators already use `${TEMPLATES_BASE_PATH}/Components/${folder}/...` so appending `/industry-verticals` to the constant automatically fixes all generated paths.

---

### Issue #2: Content module include names mismatch items directory

**File:** `sitecore-cloner/yaml-gen/generators/config-updater.ts` lines 26-54

**Current (WRONG) — include names are site-prefixed:**
```typescript
{ name: `${siteName}-home`, path: `/sitecore/content/industry-verticals/${siteName}/home`, ... },
{ name: `${siteName}-data`, path: `/sitecore/content/industry-verticals/${siteName}/Data`, ... },
// etc.
```

**Actual IV convention (verified from retail-content.module.json):**
```typescript
{ name: 'site-home', path: `/sitecore/content/industry-verticals/${siteName}/home`, ... },
{ name: 'site-data', path: `/sitecore/content/industry-verticals/${siteName}/Data`, ... },
{ name: 'site-media', path: `/sitecore/content/industry-verticals/${siteName}/Media`, ... },
{ name: 'site-dictionary', path: `/sitecore/content/industry-verticals/${siteName}/Dictionary`, ... },
{ name: 'site-presentation', path: `/sitecore/content/industry-verticals/${siteName}/Presentation`, ... },
```

**Why this is critical:** SCS maps include name → `items/{include-name}/` filesystem directory. Our content-item-generator.ts writes files to `items/site-data/` but the module include expects `items/{siteName}-data/`. **SCS push won't find the content items.**

**Fix:** Change include names in `generateSiteModuleFiles()` to use generic `site-*` names matching IV convention.

---

## HIGH — Should fix before MVP

### Issue #3: Rendering Parameters folder uses wrong template GUID

**File:** `sitecore-cloner/yaml-gen/generators/params-template-generator.ts` line 52

**Current (WRONG):**
```typescript
template: 'a87a00b1-e6db-45ab-8b54-636fec3b5523', // Template Folder
```

**Correct (verified: all 38 instances in IV fork use this):**
```typescript
template: '0437fee2-44c9-46a6-abe9-28858d9fee8c', // Rendering Parameters Folder
```

**Fix:** Add new constant `PARAMS_FOLDER_TEMPLATE = '0437fee2-44c9-46a6-abe9-28858d9fee8c'` to constants.ts, import and use in params-template-generator.ts.

---

### Issue #4: Params template root missing SharedFields

**File:** `sitecore-cloner/yaml-gen/generators/params-template-generator.ts` lines 66-73

**Current:** Only has `__Base template` SharedField.

**Actual IV (from Hero Banner Parameters.yml in hash dir 99578416609F21EA):**
```yaml
SharedFields:
- ID: "06d5295c-ed2f-4a54-9bf2-26228d113318"    # __Icon
  Hint: __Icon
  Value: sxa/16x16/promo.png
- ID: "12c33f3f-86c5-43a5-aeb4-5598cec45116"    # __Base template
  Hint: __Base template
  Value: |
    {4247AAD4-EBDE-4994-998F-E067A51B1FE4}
    {5C74E985-E055-43FF-B28C-DB6C6A6450A2}
    {44A022DB-56D3-419A-B43B-E27E4D8E9C41}
    {3DB3EB10-F8D0-4CC9-BE26-18CE7B139EC8}
- ID: "9c6106ea-7a5a-48e2-8cad-f0f693b1e2d4"    # __Read Only
  Hint: __Read Only
  Value: 0
- ID: "dbbbeca1-21c7-4906-9dd2-493c1efa59a2"    # __Shared revision
  Hint: __Shared revision
  Value: "<guid>"
- ID: "f7d48a55-2158-4f02-9356-756654404f73"    # __Standard values
  Hint: __Standard values
  Value: "{<stdval-guid>}"
```

**Fix:** Add these additional SharedFields to params template root:
- `__Icon`: use `sxa/16x16/promo.png` (matches IV) or `DEFAULT_RENDERING_ICON`
- `__Standard values`: `bracedGuid(paramsStdValId)`
- `__Read Only`: `'0'`
- `__Shared revision`: `guids.get('params-rev:{componentName}')`

---

### Issue #5: Params template missing "Params" section

**Actual IV:** Hero Banner Parameters has a child section "Params" (Template: TEMPLATE_SECTION). This is where custom parameter fields would live.

**Our generator:** Creates no section under the params template.

**Fix:** Add a "Params" section item to params-template-generator.ts (same pattern as "Data" section in template-generator.ts). Even with no custom fields, the section should exist for structural correctness.

---

## MEDIUM — Nice to fix

### Issue #6: OtherProperties value over-specified

**File:** `sitecore-cloner/yaml-gen/generators/rendering-generator.ts` line 66

**Current:** `'IsRenderingsWithDynamicPlaceholders=true&UsePlaceholderDatasourceContext=true'`
**Most IV renderings (35/38):** `'IsRenderingsWithDynamicPlaceholders=true'`
**Only 3 IV renderings have the extra property:** ThemeSwitcher, ThemeEditor, Doctors Listing

**Fix:** Remove `&UsePlaceholderDatasourceContext=true` to match majority pattern.

### Issue #7: Module file naming convention

**Our generator:** `{siteName}-content.module.json`
**IV fork:** Uses themed names (retail-content, energy-content, etc.)

**Not blocking:** For a new site, using the site name is fine. This is just a convention difference.

---

## Confirmed NOT Issues (False Positives)

These were flagged by review agents but verified as NOT issues:

1. **`__Read Only` value `""` vs `"0"`** — Both exist in IV fork. Hero Banner, Deals, Selected Destinations, Product Details all use empty. GridDemand, Footer use `0`. Either is valid.

2. **XML escaping double-escape in renderings-xml-generator.ts** — The `&amp;` in `join('&amp;')` goes through YAML block scalar `|` which preserves content literally. No double escaping. Confirmed by reading actual Home.yml which shows `&amp;` in block scalar content.

3. **Params template folder structure** — Our nested structure (Rendering Parameters.yml folder → {ParamsName}.yml inside) IS correct. Verified: actual Hero Banner Parameters.yml has `Parent: "678c0346..."` pointing to the Rendering Parameters folder item.

4. **Params base inheritance order** — `[PARAMS_BASE_1, PARAMS_BASE_2, RENDERING_PARAMS_BASE, PARAMS_BASE_3]` confirmed correct from actual Hero Banner Parameters.yml lines 12-16.

---

## Execution Order

1. **constants.ts** — Fix TEMPLATES_BASE_PATH (add `/industry-verticals`), add PARAMS_FOLDER_TEMPLATE constant
2. **params-template-generator.ts** — Fix folder template GUID, add missing SharedFields to params root, add Params section
3. **config-updater.ts** — Fix include names to generic `site-*` convention
4. **rendering-generator.ts** — Remove `UsePlaceholderDatasourceContext=true` from OtherProperties

## Verification

After fixes, re-run dry-run and verify:
```bash
npx tsx sitecore-cloner/yaml-gen/index.ts \
  --site-name test-site \
  --site-display-name "Test Site" \
  --target ~/Documents/js-workspace/Sitecore.Demo.SitecoreAI.IndustryVerticals.SiteTemplates-1 \
  --manifest-dir src/components/test-manifests/ \
  --dry-run
```

Check:
- Template paths now include `templatesProject/industry-verticals/Components/...`
- Content module includes use `site-data`, `site-home`, etc.
- Params template folder uses `0437fee2-...` template
- Params template root has all 5 SharedFields
- OtherProperties just has `IsRenderingsWithDynamicPlaceholders=true`
