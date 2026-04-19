# Builder Prompt Template — Sitecore Mode

> This is the prompt template used by the `/clone-website` skill (Phase 4) when dispatching builder agents in Sitecore mode (`--target`). Each builder receives this prompt with placeholders filled in, plus the component spec and screenshots.

## How This Template Is Used

The skill dispatches one builder agent per component in an isolated worktree. Each builder produces **two files**:

1. **`{{TARGET_FILE_PATH}}`** — Content SDK React component (`.tsx`)
2. **`{{MANIFEST_PATH}}`** — Field manifest (`.manifest.json`)

The manifest is consumed by Phase 5 (Assembly) to generate SCS YAML items.

---

## Builder Prompt

```
You are building a Sitecore Content SDK component for {{DISPLAY_NAME}}.

## Output Files

You MUST produce exactly two files:

1. `{{TARGET_FILE_PATH}}` — the React component
2. `{{MANIFEST_PATH}}` — the field manifest JSON

## Component Spec

{{COMPONENT_SPEC_CONTENTS}}

## Screenshot Reference

See: {{SCREENSHOT_PATH}}

---

## Content SDK Component Pattern

{{SHARED_IMPORTS_SECTION}}

Write a Content SDK component following this exact pattern:

### Standard Component (field-based)

```tsx
import React from 'react';
import {
  Text,
  RichText,
  NextImage,
  Link,
  Field,
  ImageField,
  LinkField,
  useSitecore,
} from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from '@/lib/component-props';

interface Fields {
  Title: Field<string>;
  Description: Field<string>;
  BackgroundImage: ImageField;
  CtaLink: LinkField;
}

interface {{ComponentName}}Props extends ComponentProps {
  fields: Fields;
}

export const Default = ({ params, fields }: {{ComponentName}}Props): React.ReactElement => {
  const { RenderingIdentifier: id, styles } = params;

  if (!fields) {
    return (
      <div className={`component {{componentCssClass}} ${styles ?? ''}`} id={id}>
        <span className="is-empty-hint">{{DISPLAY_NAME}}</span>
      </div>
    );
  }

  return (
    <div className={`component {{componentCssClass}} ${styles ?? ''}`} id={id}>
      <div className="component-content">
        <Text tag="h1" field={fields.Title} />
        <Text field={fields.Description} />
        <NextImage field={fields.BackgroundImage} />
        <Link field={fields.CtaLink} />
      </div>
    </div>
  );
};
```

### Datasource Children Component (GraphQL-driven)

For components with 3+ repeating items (cards, features, testimonials), use this pattern:

```tsx
import React from 'react';
import {
  Text,
  RichText,
  NextImage,
  Link,
  Field,
  ImageField,
  LinkField,
  useSitecore,
  ComponentRendering,
  ComponentParams,
} from '@sitecore-content-sdk/nextjs';
import { IGQLTextField, IGQLField } from '@/types/igql';

interface FeatureItem {
  featureTitle: IGQLTextField;
  featureDescription: IGQLTextField;
  featureImage: IGQLField<ImageField>;
  featureLink: IGQLField<LinkField>;
}

interface Fields {
  data: {
    datasource: {
      children: {
        results: FeatureItem[];
      };
      title: IGQLTextField;
    };
  };
}

type {{ComponentName}}Props = {
  rendering: ComponentRendering;
  params: ComponentParams;
  fields: Fields;
};

export const Default = (props: {{ComponentName}}Props): React.ReactElement => {
  const id = props.params.RenderingIdentifier;
  const styles = props.params.styles ?? '';
  const datasource = props.fields?.data?.datasource;

  if (!datasource) {
    return (
      <div className={`component {{componentCssClass}} ${styles}`} id={id}>
        <span className="is-empty-hint">{{DISPLAY_NAME}}</span>
      </div>
    );
  }

  const results = datasource.children.results;

  return (
    <div className={`component {{componentCssClass}} ${styles}`} id={id}>
      <div className="component-content">
        {datasource.title?.jsonValue && (
          <Text tag="h2" field={datasource.title.jsonValue} />
        )}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {results.map((item, index) => (
            <div key={index} className="...">
              <NextImage field={item.featureImage.jsonValue} />
              <Text tag="h3" field={item.featureTitle.jsonValue} />
              <Text field={item.featureDescription.jsonValue} />
              <Link field={item.featureLink.jsonValue} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## Field Type Quick Rules

Apply **first match**:

| HTML Pattern | Sitecore Type | TS Type | Render | Shared |
|-------------|---------------|---------|--------|--------|
| `<h1>`–`<h6>` | Single-Line Text | `Field<string>` | `<Text tag="hN">` | No |
| Short plain text (< ~100 chars) | Single-Line Text | `Field<string>` | `<Text>` | No |
| Long plain text | Multi-Line Text | `Field<string>` | `<Text>` | No |
| Text with `<em>`, `<strong>`, `<a>`, `<br>`, lists | Rich Text | `Field<string>` | `<RichText>` | Yes |
| Images | Image | `ImageField` | `<NextImage>` | Yes |
| Links / buttons / CTAs | General Link | `LinkField` | `<Link>` | Yes |
| Videos | Image | `ImageField` | custom | Yes |
| 3+ repeating items | — | — | datasource children | — |
| Genuinely numeric values | Number | `Field<number>` | `<Text>` | Yes |

**Key rules:**
- ANY inline HTML in text → Rich Text (not Multi-Line)
- Link text comes from LinkField value — do NOT make a separate text field
- Decorative SVGs/icons are NOT fields — keep as React components
- 3+ repeating items → ALWAYS datasource children with GraphQL query

---

## CRITICAL Rules

### Component Wrapper
- Wrapper div MUST have the `component` CSS class — required for Page Builder
- Use `id={params.RenderingIdentifier}` on the wrapper div
- Apply `params.styles` for SXA editor styles: `className={`component {{name}} ${styles ?? ''}`}`

### Exports & Variants
- Use **named exports** for variants: `export const Default`, `export const TopContent`
- `Default` variant is REQUIRED — every component must have one
- Variant names must be PascalCase and match what will be registered in Sitecore

### Empty State
- ALWAYS check `if (!fields)` and render an empty hint
- Use `<span className="is-empty-hint">{{DISPLAY_NAME}}</span>`
- This enables Page Builder to show a placeholder when no datasource is assigned

### Edit Mode Awareness
- Use `const { page } = useSitecore()` and `page.mode.isEditing` when needed
- In edit mode, always render fields even if empty (so editors can click to edit)
- In normal mode, conditionally hide empty sections

### Styling
- Use **Tailwind CSS v4** utility classes for all styling
- Use `@/` path alias for imports (e.g., `@/lib/component-props`)
- `clsx` is available for conditional classes
- Match the target site's visual design pixel-perfectly

### Field Rendering
- `<Text>` for Single-Line Text and Multi-Line Text (use `tag` prop for semantic HTML)
- `<RichText>` for Rich Text
- `<NextImage>` for Image fields (from Content SDK, NOT `next/image`)
- `<Link>` for General Link fields

### Field Naming
- PascalCase: `Title`, `BackgroundImage`, `CtaLink`
- Descriptive content names, not HTML element names: `Title` not `H1`
- camelCase prefix for datasource child fields: `featureTitle`, `featureImage`

---

## What NOT To Do

- **No `useState` / `useEffect`** unless the component genuinely needs client-side state (rare)
- **No `'use client'`** directive unless the component uses hooks or browser APIs
- **No numbered fields** for repeating items — use datasource children: NOT `Feature1Title`, `Feature2Title`, `Feature3Title`
- **No `withDatasourceCheck` HOC** — use the `if (!fields)` empty state pattern instead
- **No direct `next/image` import** — always use `NextImage` from Content SDK
- **No fields for decorative elements** — icons, dividers, background patterns stay as code
- **No separate text field for link labels** — LinkField includes text
- **No hardcoded content** — every piece of visible text/image that an editor should control must be a field

---

## Field Manifest JSON Schema

The `.manifest.json` file provides structured metadata for Phase 5 Assembly to generate SCS YAML.

### Standard Component Manifest

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
      "source": "",
      "sampleValue": "Welcome to Our Website"
    },
    {
      "name": "Description",
      "sitecoreType": "Rich Text",
      "tsType": "Field<string>",
      "renderComponent": "RichText",
      "sortOrder": 200,
      "shared": true,
      "source": "query:$xaRichTextProfile",
      "sampleValue": "<p>Discover our <strong>premium</strong> collection of products.</p>"
    },
    {
      "name": "BackgroundImage",
      "sitecoreType": "Image",
      "tsType": "ImageField",
      "renderComponent": "NextImage",
      "sortOrder": 300,
      "shared": true,
      "source": "query:$siteMedia",
      "sampleValue": {
        "src": "/images/hero-bg.webp",
        "alt": "Hero background",
        "width": 1920,
        "height": 1080
      }
    },
    {
      "name": "CtaLink",
      "sitecoreType": "General Link",
      "tsType": "LinkField",
      "renderComponent": "Link",
      "sortOrder": 400,
      "shared": true,
      "source": "query:$linkableHomes",
      "sampleValue": {
        "href": "/products",
        "text": "Shop Now",
        "linktype": "internal"
      }
    }
  ],
  "childTemplate": null,
  "parentFields": null,
  "graphqlQuery": null,
  "placeholder": "headless-main",
  "renderingParams": []
}
```

### Datasource Children Manifest

```json
{
  "$schema": "field-manifest-v1",
  "componentName": "Features",
  "templateName": "Feature",
  "templateFolder": "Page Content",
  "variants": ["Default"],
  "hasDatasourceChildren": true,
  "fields": [],
  "childTemplate": {
    "name": "Feature",
    "fields": [
      {
        "name": "featureTitle",
        "sitecoreType": "Single-Line Text",
        "tsType": "Field<string>",
        "renderComponent": "Text",
        "renderTag": "h3",
        "sortOrder": 100,
        "shared": false,
        "source": "",
        "sampleValue": "Fast Delivery"
      },
      {
        "name": "featureDescription",
        "sitecoreType": "Multi-Line Text",
        "tsType": "Field<string>",
        "renderComponent": "Text",
        "sortOrder": 200,
        "shared": false,
        "source": "",
        "sampleValue": "Get your order delivered within 24 hours."
      },
      {
        "name": "featureImage",
        "sitecoreType": "Image",
        "tsType": "ImageField",
        "renderComponent": "NextImage",
        "sortOrder": 300,
        "shared": true,
        "source": "query:$siteMedia",
        "sampleValue": {
          "src": "/images/feature-delivery.webp",
          "alt": "Fast delivery icon",
          "width": 400,
          "height": 300
        }
      },
      {
        "name": "featureLink",
        "sitecoreType": "General Link",
        "tsType": "LinkField",
        "renderComponent": "Link",
        "sortOrder": 400,
        "shared": true,
        "source": "query:$linkableHomes",
        "sampleValue": {
          "href": "/delivery",
          "text": "Learn More",
          "linktype": "internal"
        }
      }
    ],
    "sampleChildren": [
      {
        "itemName": "Fast Delivery",
        "values": {
          "featureTitle": "Fast Delivery",
          "featureDescription": "Get your order delivered within 24 hours.",
          "featureImage": { "src": "/images/feature-delivery.webp", "alt": "Fast delivery" },
          "featureLink": { "href": "/delivery", "text": "Learn More" }
        }
      },
      {
        "itemName": "Quality Guarantee",
        "values": {
          "featureTitle": "Quality Guarantee",
          "featureDescription": "Every product meets our rigorous quality standards.",
          "featureImage": { "src": "/images/feature-quality.webp", "alt": "Quality guarantee" },
          "featureLink": { "href": "/quality", "text": "Learn More" }
        }
      },
      {
        "itemName": "24/7 Support",
        "values": {
          "featureTitle": "24/7 Support",
          "featureDescription": "Our team is always here to help you.",
          "featureImage": { "src": "/images/feature-support.webp", "alt": "Customer support" },
          "featureLink": { "href": "/support", "text": "Learn More" }
        }
      }
    ]
  },
  "parentFields": [
    {
      "name": "Title",
      "sitecoreType": "Single-Line Text",
      "tsType": "Field<string>",
      "renderComponent": "Text",
      "renderTag": "h2",
      "sortOrder": 100,
      "shared": false,
      "source": "",
      "sampleValue": "Why Choose Us"
    }
  ],
  "graphqlQuery": "query {{ComponentName}}Query($datasource: String!, $language: String!) {\n  datasource: item(path: $datasource, language: $language) {\n    ... on {{TemplateName}} {\n      title: field(name: \"Title\") {\n        jsonValue\n      }\n    }\n    children(hasLayout: false, first: 50) {\n      results {\n        ... on {{ChildTemplateName}} {\n          featureTitle: field(name: \"featureTitle\") {\n            jsonValue\n          }\n          featureDescription: field(name: \"featureDescription\") {\n            jsonValue\n          }\n          featureImage: field(name: \"featureImage\") {\n            jsonValue\n          }\n          featureLink: field(name: \"featureLink\") {\n            jsonValue\n          }\n        }\n      }\n    }\n  }\n}",
  "placeholder": "headless-main",
  "renderingParams": []
}
```

---

## Manifest Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | Yes | Always `"field-manifest-v1"` |
| `componentName` | string | Yes | PascalCase React component name (e.g., `HeroBanner`) |
| `templateName` | string | Yes | Sitecore template display name (e.g., `Hero Banner`) |
| `templateFolder` | string | Yes | Folder under Components (e.g., `Page Content`, `Navigation`, `Footer`) |
| `variants` | string[] | Yes | Named export variants (must include `"Default"`) |
| `hasDatasourceChildren` | boolean | Yes | `true` if component uses GraphQL children pattern |
| `fields` | Field[] | Yes | Direct fields on the data template (empty array if datasource children only) |
| `childTemplate` | object\|null | Yes | Child template definition (null if no children) |
| `childTemplate.name` | string | — | Child template name (e.g., `Feature`) |
| `childTemplate.fields` | Field[] | — | Fields on each child item |
| `childTemplate.sampleChildren` | object[] | — | Sample data for pre-creating child items |
| `parentFields` | Field[]\|null | Yes | Fields on the parent datasource item (title above cards, etc.) |
| `graphqlQuery` | string\|null | Yes | Full GraphQL ComponentQuery string (null if no children) |
| `placeholder` | string | Yes | Target placeholder: `headless-header`, `headless-main`, or `headless-footer` |
| `renderingParams` | string[] | Yes | Custom rendering parameters beyond defaults (usually empty) |

### Field Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | PascalCase field name (e.g., `Title`, `BackgroundImage`) |
| `sitecoreType` | string | Yes | Sitecore field type: `Single-Line Text`, `Multi-Line Text`, `Rich Text`, `Image`, `General Link`, `Number` |
| `tsType` | string | Yes | TypeScript type: `Field<string>`, `Field<number>`, `ImageField`, `LinkField` |
| `renderComponent` | string | Yes | Content SDK component: `Text`, `RichText`, `NextImage`, `Link` |
| `renderTag` | string | No | HTML tag for `<Text>`: `h1`, `h2`, `p`, `span`, etc. |
| `sortOrder` | number | Yes | Sort order in template: 100, 200, 300, ... |
| `shared` | boolean | Yes | Whether the field is shared across languages |
| `source` | string | Yes | Field source value (empty string if none) |
| `sampleValue` | any | Yes | Sample content extracted from target site |

---

## Manifest → Assembly Mapping

How Assembly (Phase 5) uses each manifest field to generate SCS YAML:

| Manifest Field | Generates | Checklist Ref |
|---|---|---|
| `fields[]` (name, sitecoreType, sortOrder, source, shared) | Data Template YAML: template root + Data section + N field items + `__Standard Values` | D1 |
| *(hardcoded base, read from target)* | Parameters Template YAML + `__Standard Values` | D2 |
| `hasDatasourceChildren` + `templateName` | Folder Template YAML + `__Standard Values` (only if `hasDatasourceChildren`) | D3 |
| `componentName` + 10 required SharedFields + conditional fields | Rendering Definition YAML | D4 |
| `graphqlQuery` | ComponentQuery field on rendering definition | D4 |
| `hasDatasourceChildren` | Page Editor Buttons on rendering (add buttons for folder components) | D4 |
| `sampleValue` / `sampleChildren` | Datasource content items + data folder items | E1, E2 |
| `placeholder` + rendering GUIDs | Home page `__Renderings` XML (with `p:before`/`p:after` ordering) | C |
| `templateFolder` | YAML path structure under `templatesProject/` and `projectRenderings/` | D1, D4 |
| `variants` | Named exports in component file (Assembly doesn't generate YAML for these — they're code-only) | — |
```

---

## Template Placeholders

These placeholders are filled by the skill before dispatching to builders:

| Placeholder | Source | Example |
|---|---|---|
| `{{TARGET_FILE_PATH}}` | Skill generates from component name | `src/components/HeroBanner.tsx` |
| `{{MANIFEST_PATH}}` | Skill generates from component name | `src/components/HeroBanner.manifest.json` |
| `{{COMPONENT_SPEC_CONTENTS}}` | Full contents of the component spec file from Phase 3 | *(markdown)* |
| `{{SCREENSHOT_PATH}}` | Path to component screenshot from Phase 1 | `docs/design-references/hero-desktop.png` |
| `{{SHARED_IMPORTS_SECTION}}` | Common imports and utilities shared across all builders | *(code block)* |
| `{{ComponentName}}` | PascalCase component name | `HeroBanner` |
| `{{componentCssClass}}` | kebab-case CSS class | `hero-banner` |
| `{{DISPLAY_NAME}}` | Human-readable display name | `Hero Banner` |
| `{{TemplateName}}` | Sitecore template name (for GraphQL) | `HeroBanner` |
| `{{ChildTemplateName}}` | Child template name (for GraphQL, if applicable) | `Feature` |
