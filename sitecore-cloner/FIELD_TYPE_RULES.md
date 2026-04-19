# Field Type Rules — HTML Content → Sitecore Field Types

> Opinionated, first-match rules for mapping extracted HTML content to Sitecore field types. Consumed by Phase 4 builder agents (condensed in their prompt) and by Phase 5 Assembly (for validation).

## Quick Reference Table

Apply **first match** — rules are ordered by specificity.

| # | HTML Pattern | Sitecore Type | TS Type | Render Component | Shared | Source |
|---|-------------|---------------|---------|-----------------|--------|--------|
| 1 | `<h1>`–`<h6>` headings | Single-Line Text | `Field<string>` | `<Text tag="h1">` | No | — |
| 2 | Short plain text (< ~100 chars, no HTML) | Single-Line Text | `Field<string>` | `<Text>` | No | — |
| 3 | Long plain text (no inline HTML) | Multi-Line Text | `Field<string>` | `<Text>` | No | — |
| 4 | Text with inline HTML (`<em>`, `<strong>`, `<a>`, `<br>`, lists) | Rich Text | `Field<string>` | `<RichText>` | Yes | `query:$xaRichTextProfile` |
| 5 | All images (`<img>`, background images used as content) | Image | `ImageField` | `<NextImage>` | Yes | `query:$siteMedia` |
| 6 | Links / buttons / CTAs | General Link | `LinkField` | `<Link>` | Yes | `query:$linkableHomes` |
| 7 | Videos (`<video>`, poster + source) | Image | `ImageField` | custom | Yes | `query:$siteMedia` |
| 8 | 3+ repeating items (cards, features, testimonials) | — | — | datasource children | — | — |
| 9 | Genuinely numeric values (stats, counts, prices) | Number | `Field<number>` | `<Text>` | Yes | — |

---

## Detailed Rules

### Rule 1: Headings → Single-Line Text

**Matches:** `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>` elements.

- **Sitecore Type:** Single-Line Text
- **TS Type:** `Field<string>`
- **Render:** `<Text tag="h1" field={fields.Title} />` (use matching tag)
- **Shared:** No
- **Source:** —

Headings are always single-line, even if long. The `tag` prop on `<Text>` controls the HTML element.

### Rule 2: Short Plain Text → Single-Line Text

**Matches:** Text content under ~100 characters with no inline HTML markup.

- **Sitecore Type:** Single-Line Text
- **TS Type:** `Field<string>`
- **Render:** `<Text field={fields.Subtitle} />` or `<Text tag="p" field={fields.Caption} />`
- **Shared:** No
- **Source:** —

Examples: subtitles, labels, captions, taglines, button text (when separate from a link).

### Rule 3: Long Plain Text → Multi-Line Text

**Matches:** Text content over ~100 characters with no inline HTML markup.

- **Sitecore Type:** Multi-Line Text
- **TS Type:** `Field<string>`
- **Render:** `<Text field={fields.Description} />`
- **Shared:** No
- **Source:** —

Examples: descriptions, body paragraphs (plain text only), long captions.

### Rule 4: Text with Inline HTML → Rich Text

**Matches:** Any text content containing inline HTML elements: `<em>`, `<strong>`, `<a>`, `<br>`, `<ul>`, `<ol>`, `<li>`, `<span>` with styling, `<sup>`, `<sub>`.

- **Sitecore Type:** Rich Text
- **TS Type:** `Field<string>`
- **Render:** `<RichText field={fields.Body} />`
- **Shared:** Yes
- **Source:** `query:$xaRichTextProfile`

**Key boundary:** The presence of ANY inline HTML tag flips from Multi-Line Text to Rich Text. When in doubt, use Rich Text — it's more flexible and editors can always simplify.

### Rule 5: Images → Image

**Matches:** All `<img>` elements, CSS background images used as meaningful content (not decorative).

- **Sitecore Type:** Image
- **TS Type:** `ImageField`
- **Render:** `<NextImage field={fields.BackgroundImage} />`
- **Shared:** Yes
- **Source:** `query:$siteMedia`

Use `NextImage` (from Content SDK, wraps `next/image`) for all images. Never import `next/image` directly.

### Rule 6: Links / Buttons / CTAs → General Link

**Matches:** `<a>` elements, `<button>` elements that navigate, CTA blocks.

- **Sitecore Type:** General Link
- **TS Type:** `LinkField`
- **Render:** `<Link field={fields.CtaLink} />`
- **Shared:** Yes
- **Source:** `query:$linkableHomes`

**Important:** The link text comes from the LinkField value itself (`text` property). Do NOT create a separate text field for link labels. One LinkField = href + text + target + class.

### Rule 7: Videos → ImageField

**Matches:** `<video>` elements with poster and source.

- **Sitecore Type:** Image (for both poster and video source)
- **TS Type:** `ImageField`
- **Render:** Custom rendering (conditional video/image based on field presence)
- **Shared:** Yes
- **Source:** `query:$siteMedia`

This follows the IV HeroBanner convention where video uses `ImageField` type. Typically two fields: `Image` (poster/fallback) and `Video` (video source), both `ImageField`.

### Rule 8: Repeating Items → Datasource Children

**Matches:** 3 or more visually repeating items with the same structure (cards, features, testimonials, team members, pricing tiers, gallery items).

- **Pattern:** GraphQL query with `datasource.children.results`
- **TS Type:** Custom interface per child, wrapped in `IGQLTextField` / `IGQLField<T>`
- **Render:** `.map()` over results array

This is NOT a field type — it's a structural pattern. The parent component has a GraphQL ComponentQuery that fetches child items. Each child item has its own template with fields (apply rules 1-7 to each child field).

**Threshold:** 3+ items = always datasource children. 2 items = use direct fields (e.g., `LeftTitle`, `RightTitle`). 1 item = direct fields.

### Rule 9: Numbers → Number

**Matches:** Genuinely numeric values: statistics, counts, prices, percentages, ratings.

- **Sitecore Type:** Number
- **TS Type:** `Field<number>`
- **Render:** `<Text field={fields.Rating} />`
- **Shared:** Yes
- **Source:** —

**Rare.** Only use for values that are inherently numeric. Text that happens to contain digits (e.g., "24/7 support", "100% satisfaction") should be Single-Line Text, not Number.

---

## Shared Flag Rules

The "Shared" flag on a template field determines whether the value is shared across all language versions. Default by type:

| Sitecore Type | Shared | Rationale |
|--------------|--------|-----------|
| Single-Line Text | No | Text is typically translated |
| Multi-Line Text | No | Text is typically translated |
| Rich Text | Yes | Matches IV pattern (shared rich content) |
| Image | Yes | Images are language-independent |
| General Link | Yes | Links are language-independent |
| Number | Yes | Numbers are language-independent |

> **Note:** IV consistently uses Shared=Yes for Rich Text. This means rich text content is NOT per-language in v1. If a prospect site is multilingual, this may need revisiting in v2.

---

## Field Source Rules

The `Source` field on a template field definition provides context to the Sitecore editor UI.

| Sitecore Type | Source Value | Purpose |
|--------------|-------------|---------|
| Single-Line Text | *(empty)* | No source needed |
| Multi-Line Text | *(empty)* | No source needed |
| Rich Text | `query:$xaRichTextProfile` | Rich text editor profile |
| Image | `query:$siteMedia` | Restricts image picker to site media library |
| General Link | `query:$linkableHomes` | Restricts link picker to linkable pages |
| Number | *(empty)* | No source needed |

---

## Edge Cases

### Decorative SVGs
SVG icons, dividers, background patterns — these are NOT content fields. They stay as React components or Tailwind utilities. Only create a field if the image is meaningful content that an editor should be able to change.

### CSS Background Images
If a CSS `background-image` is the primary visual content (hero backgrounds, banner images), treat as Image field (Rule 5). If it's purely decorative (subtle patterns, gradients), leave as CSS.

### Link + Text Combos
A link with visible text = ONE `LinkField`. The `text` property of the General Link field type holds the label. Do NOT create `CtaText: Field<string>` + `CtaLink: LinkField` — just `CtaLink: LinkField`.

Exception: If the link wraps a complex child (image + text + icon), the link itself is a `LinkField` and the children are separate fields.

### Navigation
Navigation components are special — they typically use the Sitecore site tree for structure, not custom fields. For v1, navigation is hardcoded from the extracted content. The cloner creates a standard navigation component with direct fields rather than tree-driven navigation.

### Footer
Similar to navigation — footers often have a mix of links, text, and logos. Treat each distinct content area as its own field using the standard rules above.

### Form Inputs / Checkboxes
These are rendering parameters (editor configuration), not content fields. Use `renderingParams` in the manifest for things like "show newsletter signup" toggles.

### Repeated Content with < 3 Items
Two side-by-side cards, a before/after pair — use direct fields with prefixes: `LeftTitle`, `LeftDescription`, `RightTitle`, `RightDescription`. Only switch to datasource children at 3+ items.

---

## Field Naming Conventions

### Names
- **PascalCase** for all field names: `Title`, `BackgroundImage`, `CtaLink`
- **Descriptive** — use content semantics, not HTML element names: `Title` not `H1`, `Description` not `Paragraph`
- **Prefix for paired fields** — when a component has multiple similar areas: `LeftTitle`, `RightImage`
- **camelCase prefix for child item fields** — datasource children fields: `featureTitle`, `featureImage`, `featureLink`

### Sort Order
- Fields are ordered by `__Sortorder`: 100, 200, 300, ...
- Order should match visual hierarchy: title first, then description, then image, then CTA
- Leave gaps (100 increments) for future field additions

### Template Names
- **Data template:** matches the component's content purpose: `Hero Banner`, `Feature Card`, `Content Block`
- **Parameters template:** `{TemplateName} Parameters` (e.g., `Hero Banner Parameters`)
- **Folder template:** `{TemplateName} Folder` (e.g., `Feature Card Folder`)
- **Template folder:** group by page area: `Page Content`, `Navigation`, `Footer`

---

## v2 Field Types (Future)

These field types exist in Sitecore but are skipped for v1 (they require existing content items to reference):

| Sitecore Type | Use Case | Why v2 |
|--------------|----------|--------|
| Treelist | Multi-select from a tree (e.g., categories, tags) | Requires pre-existing taxonomy items |
| Droplink | Single-select from a list (e.g., category picker) | Requires pre-existing items |
| Multilist | Multi-select from a flat list | Requires pre-existing items |
| Droptree | Single-select from a tree | Requires pre-existing items |
| File | File downloads (PDF, etc.) | Requires Media Library upload (Marketer MCP v2) |

For v1, content that would use these types should be simplified to the closest basic type (usually Single-Line Text or Rich Text) or handled as datasource children.
