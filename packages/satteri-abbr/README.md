# satteri-abbr

[Satteri](https://satteri.bruits.org) plugin to wrap abbreviations in [`abbr`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr) elements with their definitions, built on Satteri's [HAST plugin API](https://satteri.bruits.org/docs/plugin-api/).

## What's this?

This package is a [Satteri](https://satteri.bruits.org) plugin that takes a set of abbreviations and their definitions, and wraps every occurrence of those abbreviations in Markdown text with an `abbr` element carrying the definition as its `title` attribute.

```html
<abbr title="HyperText Markup Language">HTML</abbr>
```

## Install

```sh
npm install satteri-abbr
yarn add satteri-abbr
pnpm add satteri-abbr
```

## Use

Say we have the following module `example.js`:

```js
import { markdownToHtml } from "satteri";
import satteriAbbr from "satteri-abbr";

const { html } = markdownToHtml("HTML is the backbone of the web.", {
  hastPlugins: [
    satteriAbbr({
      abbreviations: {
        HTML: "HyperText Markup Language",
        CSS: { definition: "Cascading Style Sheets", aliases: ["css"] },
      },
    }),
  ],
});

console.log(html);
```

Running that with `node example.js` yields:

```html
<p><abbr title="HyperText Markup Language">HTML</abbr> is the backbone of the web.</p>
```

## API

The default export is `satteriAbbr`, a function returning a HAST plugin definition to pass to `hastPlugins`.

```ts
import satteriAbbr, { type SatteriAbbrOptions } from "satteri-abbr";

const options: SatteriAbbrOptions = {
  abbreviations: {
    HTML: "HyperText Markup Language",
    CSS: { definition: "Cascading Style Sheets", aliases: ["css"] },
  },
  firstOnly: false,
  ignore: ["a", "abbr", "code", "pre"],
};

const plugin = satteriAbbr(options);
```

Its TypeScript API is:

```ts
import type { HastPluginDefinition } from "satteri";

export interface Abbreviation {
  definition: string;
  aliases?: string[];
}

export interface SatteriAbbrOptions {
  abbreviations: Record<string, string | Abbreviation>;
  firstOnly?: boolean;
  ignore?: HtmlTagName[];
}

export default function satteriAbbr(
  options: SatteriAbbrOptions,
): HastPluginDefinition;
```

The following options are available:

- `abbreviations` (required): the terms to expand. Each key is the canonical written form; the value is either the definition itself or an object with a `definition` and `aliases` (additional written forms, e.g. lowercase variants). Matching is case-sensitive, so variants should be listed as aliases.
- `firstOnly`: wrap only the first occurrence of each abbreviation per document. Default: `false`.
- `ignore`: ancestor tags whose text content is never matched. Default: `["a", "abbr", "code", "pre"]`.

## Notes

- Longer forms win: if both `HTTP` and `HTTPS` are registered, `HTTPS` matches first.
- Matching respects word boundaries: `HTML` does not match inside `HTMLified`.
- Inline markup splits text nodes, so `H**T**ML` will not match `HTML`.
- Raw HTML in Markdown is kept as opaque chunks by default, so ancestor checks cannot see it. Enable [`features: { rawHtml: true }`](https://satteri.bruits.org/docs/entry-points/#reparsing-raw-html-rawhtml) to have raw markup (such as an existing `<abbr>`) parsed into real elements the plugin can skip. Without it, an existing raw `<abbr>` may end up double-wrapped — the plugin prints a console warning when it spots raw `<abbr>` markup.

## Development

From the workspace root:

- Run `pnpm build` to compile the package to `dist/`
- Run `pnpm typecheck` to type-check the implementation, tests, and fixtures
- Run `pnpm test` to run the behavior tests
- Run `pnpm lint` to run package lint scripts
- Run `pnpm format` to run package formatting scripts

## License

[MIT](../../LICENSE)
