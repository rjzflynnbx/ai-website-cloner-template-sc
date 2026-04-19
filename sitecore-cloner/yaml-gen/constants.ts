/**
 * SCS YAML constants — all hardcoded GUIDs from the Sitecore platform.
 * These are "vocabulary" GUIDs that never change; new items get fresh UUIDs.
 * Source: BRIEF.md "Key SCS GUIDs" section + IV fork ground-truth analysis.
 */

// ---------------------------------------------------------------------------
// Item template types (the Template field on each YAML item)
// ---------------------------------------------------------------------------

/** Template whose items ARE data templates */
export const TEMPLATE_TEMPLATE = 'ab86861a-6030-46c5-b394-e8f99e8b87db';
/** Template section (groups fields within a template) */
export const TEMPLATE_SECTION = 'e269fbb5-3750-427a-9149-7aa950b49301';
/** Template field (individual field definition) */
export const TEMPLATE_FIELD = '455a3e98-a627-4b40-8035-e683a0331ac7';
/** Rendering definition template */
export const RENDERING_TEMPLATE = '04646a89-996f-4ee7-878a-ffdbf1f0ef0d';
/** Generic template folder */
export const TEMPLATE_FOLDER = 'a87a00b1-e6db-45ab-8b54-636fec3b5523';
/** Rendering Parameters folder template (NOT generic Template Folder — verified: all 38 instances in IV fork) */
export const PARAMS_FOLDER_TEMPLATE = '0437fee2-44c9-46a6-abe9-28858d9fee8c';
/** Rendering folder template (for rendering tree folders) */
export const RENDERING_FOLDER_TEMPLATE = '840d4a46-5503-49ec-bf9d-bd090946c63d';
/** Headless site template */
export const HEADLESS_SITE_TEMPLATE = 'e5b045ab-fadd-4e52-8168-4b4e5c489e36';

// ---------------------------------------------------------------------------
// Field definition SharedField IDs (on template field items)
// ---------------------------------------------------------------------------

/** Field "Type" (e.g., "Single-Line Text") */
export const FIELD_TYPE_ID = 'ab162cc0-dc80-4abf-8871-998ee5d7ba32';
/** Field "Source" (e.g., "query:$siteMedia") */
export const FIELD_SOURCE_ID = '1eb8ae32-e190-44a6-968d-ed904c794ebf';
/** Field "__Sortorder" */
export const FIELD_SORTORDER_ID = 'ba3f86a2-4a1c-4d78-b63d-91c2779c1b5e';
/** Field "Shared" (value "1" = shared across languages) */
export const FIELD_SHARED_ID = 'be351a73-fcb0-4213-93fa-c302d8ab4f51';

// ---------------------------------------------------------------------------
// Rendering SharedField IDs — 10 ALWAYS PRESENT
// ---------------------------------------------------------------------------

export const RENDERING_COMPONENT_NAME_ID = '037fe404-dd19-4bf7-8e30-4dadf68b27b0';
export const RENDERING_ICON_ID = '06d5295c-ed2f-4a54-9bf2-26228d113318';
export const RENDERING_DS_TEMPLATE_ID = '1a7c85e5-dc0b-490d-9187-bb1dbcb4c72f';
export const RENDERING_OPEN_PROPS_ID = '7d8ae35f-9ed1-43b5-96a2-0a5f040d4e4e';
export const RENDERING_READ_ONLY_ID = '9c6106ea-7a5a-48e2-8cad-f0f693b1e2d4';
export const RENDERING_PARAMS_TEMPLATE_ID = 'a77e8568-1ab3-44f1-a664-b7c37ec7810d';
export const RENDERING_DS_LOCATION_ID = 'b5b27af1-25ef-405c-87ce-369b3a004016';
export const RENDERING_ADD_EDITOR_BTN_ID = 'c39a90ce-0035-41bb-90f6-3c8a6ea87797';
export const RENDERING_SHARED_REV_ID = 'dbbbeca1-21c7-4906-9dd2-493c1efa59a2';
export const RENDERING_OTHER_PROPS_ID = 'e829c217-5e94-4306-9c48-2634b094fdc2';

// ---------------------------------------------------------------------------
// Rendering SharedField IDs — CONDITIONAL
// ---------------------------------------------------------------------------

/** Placeholders (GUID list, if component has child placeholders) */
export const RENDERING_PLACEHOLDERS_ID = '069a8361-b1cd-437c-8c32-a3be78941446';
/** ComponentQuery (GraphQL, for datasource children) */
export const RENDERING_COMPONENT_QUERY_ID = '17bb046a-a32a-41b3-8315-81217947611b';
/** Page Editor Buttons (for folder components) */
export const RENDERING_PAGE_EDITOR_BTN_ID = 'a2f5d9df-8cba-4a1d-99eb-51acb94cb057';

// ---------------------------------------------------------------------------
// Page Editor Button GUIDs
// ---------------------------------------------------------------------------

export const PAGE_EDITOR_BTN_MAIN = '31A3A929-C599-4DD3-91A6-F4A9487CC8B7';
export const PAGE_EDITOR_BTN_ADD = '587F8FBD-E38F-4E2B-8DE4-1F474D9DDD00';

// ---------------------------------------------------------------------------
// Base template GUIDs (for __Base template inheritance)
// ---------------------------------------------------------------------------

/** Standard content base template (data templates) */
export const CONTENT_BASE = '1930BBEB-7805-471A-A3BE-4858AC7CF696';
/** Rendering parameters base template */
export const RENDERING_PARAMS_BASE = '44A022DB-56D3-419A-B43B-E27E4D8E9C41';

// ---------------------------------------------------------------------------
// Standard SharedField IDs used on template items
// ---------------------------------------------------------------------------

/** __Base template field */
export const BASE_TEMPLATE_FIELD_ID = '12c33f3f-86c5-43a5-aeb4-5598cec45116';
/** __Standard values pointer on template root */
export const STD_VALUES_POINTER_ID = 'f7d48a55-2158-4f02-9356-756654404f73';
/** __Enable item fallback */
export const ENABLE_ITEM_FALLBACK_ID = 'fd4e2050-186c-4375-8b99-e8a85dd7436e';
/** __Icon field */
export const ICON_FIELD_ID = '06d5295c-ed2f-4a54-9bf2-26228d113318';

// ---------------------------------------------------------------------------
// Standard SharedField IDs used on Standard Values
// ---------------------------------------------------------------------------

/** __Workflow (empty for cloned sites) */
export const WORKFLOW_FIELD_ID = 'a4f985d9-98b3-4b52-aaaf-4344f6e747c6';

// ---------------------------------------------------------------------------
// Site definition field IDs
// ---------------------------------------------------------------------------

/** Modules field on headless site definition */
export const SITE_MODULES_FIELD_ID = '1230d2cb-4948-4d43-8a3b-b39978f6f1b3';
/** Site Name field */
export const SITE_NAME_FIELD_ID = '85a7501a-86d9-4243-9075-0b727c3a6db4';
/** SiteMediaLibrary field */
export const SITE_MEDIA_LIBRARY_FIELD_ID = '33d9005e-1f71-415f-b107-53b965c3b037';
/** Title field (used on Home + Site Grouping items) */
export const TITLE_FIELD_ID = '335B4D59-3966-4C7A-A86C-E1B4B25A867F';
/** __Renderings field (SharedField on page items) */
export const RENDERINGS_FIELD_ID = 'f1a1fe9e-a60c-4ddb-a3a0-bb5b29fe732e';

// ---------------------------------------------------------------------------
// Settings item constants
// ---------------------------------------------------------------------------

/** Settings template GUID */
export const SETTINGS_TEMPLATE = '4628b2c8-d026-4251-b85e-5987e09d56ef';
/** Settings BranchID */
export const SETTINGS_BRANCH_ID = '45cf9f42-b3ac-4412-aab9-f8441c7e448e';

/** Settings SharedField IDs */
export const SETTINGS_NAME_ID = '3e4f559f-8e59-4405-b50d-619811371f6c';
export const SETTINGS_FILESYSTEM_PATH_ID = '72e83c8d-3578-4e50-b4c0-93a78a1729f2';
export const SETTINGS_APP_TEMPLATE_ID = '32ce6bbe-4217-46e5-9335-42793884cbe3';
export const SETTINGS_SSR_ENGINE_ID = '9016141c-ff51-40f2-9135-40f5161b9784';
export const SETTINGS_RENDERINGS_PATH_ID = 'f29428d5-1285-48b8-a884-44057965829a';
export const SETTINGS_TEMPLATES_ID = 'e8881464-38af-4655-be4a-ee10586578a2';
export const SETTINGS_PLACEHOLDERS_PATH_ID = '5ca117eb-8782-4a4f-9f2f-30de31fc2e34';
export const SETTINGS_DATASOURCES_PATH_ID = '5764d2d4-724d-4313-a81b-9246c911faff';

// ---------------------------------------------------------------------------
// Default rendering icon
// ---------------------------------------------------------------------------

export const DEFAULT_RENDERING_ICON = 'Office/32x32/window_dialog.png';

// ---------------------------------------------------------------------------
// Layout device ID (always the same for web)
// ---------------------------------------------------------------------------

export const DEFAULT_DEVICE_ID = 'FE5D7FDF-89C0-4D99-9AA3-B5FBD009C9F3';

// ---------------------------------------------------------------------------
// 15 module GUIDs for every site's Modules field
// ---------------------------------------------------------------------------

export const SITE_MODULES = [
  '5A2F6A6F-3028-4210-AAD3-82C1365C4802',
  '9F10010E-49E2-4DCD-A5A1-4DA752ADED2A',
  '4342A029-0186-4B0D-8959-FFEF4FD998C2',
  'AE5D1384-BB75-4C6B-A8B5-4B008C2AC5DA',
  'C4658673-5D70-44ED-9004-D66EAC1DC718',
  'CA502DCF-20D2-4618-A735-E4FCB6D5E114',
  'E2AF1A41-799E-481B-8FDC-B2D33FB729A1',
  '66B9C663-2602-42B1-A5A2-3D04DB6C506A',
  '1FD78E81-59A6-4513-90F1-165A95D4B16B',
  'BEBF4026-24A3-4EA6-986A-518B76DBD71A',
  '385F31BE-FF0C-4D84-A627-9ECD21295AFD',
  'F0EA389E-F78D-440B-9429-F04FE735344A',
  'AC1A27CA-6BF3-4D23-915E-668326D52CF1',
  'D7EEAF4D-2B58-4029-B141-844221565EF0',
  '1F35559F-2140-4774-8BC1-525BB722BAA2',
];

// ---------------------------------------------------------------------------
// SCS YAML paths (relative to IV repo root)
// Verified against: ~/Documents/js-workspace/Sitecore.Demo.SitecoreAI.IndustryVerticals.SiteTemplates-1/
// ---------------------------------------------------------------------------

/** Templates → common module's templatesProject include */
export const TEMPLATES_BASE_PATH =
  'authoring/items/industry-verticals/common/items/templatesProject/industry-verticals';

/** Renderings → common module's projectRenderings include (inside the industry-verticals subfolder) */
export const RENDERINGS_BASE_PATH =
  'authoring/items/industry-verticals/common/items/projectRenderings/industry-verticals';

/** Site definitions → common module items dir (each site under sites-{name}/) */
export const SITE_DEFS_BASE_PATH =
  'authoring/items/industry-verticals/common/items';

/** Per-site content items → per-site content module items dir */
export const SITE_CONTENT_BASE_PATH =
  'authoring/items/industry-verticals/sites';

/** Path to common.module.json */
export const COMMON_MODULE_PATH =
  'authoring/items/industry-verticals/common/common.module.json';

/** Directory for per-site module JSON files */
export const SITE_MODULES_DIR =
  'authoring/items/industry-verticals/sites';

// ---------------------------------------------------------------------------
// Rendering parameters template base GUIDs
// Order matters — must match IV fork pattern exactly.
// ---------------------------------------------------------------------------

export const PARAMS_BASE_1 = '4247AAD4-EBDE-4994-998F-E067A51B1FE4';
export const PARAMS_BASE_2 = '5C74E985-E055-43FF-B28C-DB6C6A6450A2';
export const PARAMS_BASE_3 = '3DB3EB10-F8D0-4CC9-BE26-18CE7B139EC8';
