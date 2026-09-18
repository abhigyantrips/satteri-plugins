# satteri-abbr

## 0.1.0

### Minor Changes

- 7b6773f: Add `satteri-abbr`, a plugin that wraps abbreviations in `<abbr>` elements with their definitions. Supports per-term aliases, a `firstOnly` mode, and a configurable `ignore` list of ancestor tags (default: `a`, `abbr`, `code`, `pre`).

### Patch Changes

- 9cacb0d: Warns when raw `<abbr>` markup is found without `features.rawHtml` enabled, since its content may be double-wrapped.
