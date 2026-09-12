# satteri-autolink-paragraphs

[Satteri](https://satteri.bruits.org) plugin to add permalink anchors to top-level paragraphs. It is modeled on [`rehype-autolink-headings`](https://github.com/rehypejs/rehype-autolink-headings), but only targets `p` elements that are direct children of the document root.

## What's this?

This package adds stable fragment IDs and accessible permalink anchors to top-level paragraphs:

```html
<p id="paragraph-1">
  First paragraph. <a class="autolink-paragraph" aria-label="Link to this paragraph" href="#paragraph-1">¶</a>
</p>
```

Nested paragraphs in blockquotes, lists, footnotes, and other containers are left unchanged. Paragraphs can contain ordinary links: the permalink is inserted alongside their content instead of wrapping it, which avoids invalid nested anchors.

## Install

```sh
npm install satteri-autolink-paragraphs
yarn add satteri-autolink-paragraphs
pnpm add satteri-autolink-paragraphs
```

## Use

```js
import { markdownToHtml } from "satteri";
import satteriAutolinkParagraphs from "satteri-autolink-paragraphs";

const { html } = markdownToHtml("First paragraph.", {
  hastPlugins: [satteriAutolinkParagraphs()],
});

console.log(html);
```

The default behavior appends a visible `¶` link, assigns the class `autolink-paragraph` and accessible label `Link to this paragraph`, and generates IDs such as `paragraph-1`.

> [!IMPORTANT]
> When using [`satteri-figure`](../satteri-figure), put `satteriFigure()` before this plugin in `hastPlugins`. This lets image-only paragraphs become figures before paragraph links are added.

## API

The default export is `satteriAutolinkParagraphs`, a function returning a HAST plugin definition to pass to `hastPlugins`.

```ts
import satteriAutolinkParagraphs, {
  type SatteriAutolinkParagraphsOptions,
} from "satteri-autolink-paragraphs";

const options: SatteriAutolinkParagraphsOptions = {
  behavior: "prepend",
  prefix: "note-",
};

const plugin = satteriAutolinkParagraphs(options);
```

Its main TypeScript API is:

```ts
type Behavior = "prepend" | "append" | "before" | "after";

interface ParagraphLinkInfo {
  id: string;
  index: number;
}

interface SatteriAutolinkParagraphsOptions {
  behavior?: Behavior;
  prefix?: string;
  content?: HastContent | HastContent[] | BuildContent;
  properties?: HastProperties | BuildProperties;
  test?: ParagraphTest;
}
```

All options are optional:

- `behavior`: place the link inside the paragraph at the start (`prepend`) or end (`append`), or as a root-level sibling (`before` or `after`). Default: `append`.
- `prefix`: prefix for generated IDs. Default: `paragraph-`.
- `content`: static HAST link content or a builder receiving the readonly paragraph and its `{ id, index }`. Default: the text `¶`.
- `properties`: static HAST properties or a builder receiving the readonly paragraph and its `{ id, index }`. Values override the default class and accessible label; the generated `href` always wins.
- `test`: synchronous predicate evaluated against each top-level paragraph before numbering. Skipped paragraphs do not consume an index.

Non-empty authored paragraph IDs are preserved. Generated IDs are checked against every ID in the HAST; collisions gain a suffix such as `paragraph-1-2`. Duplicate authored IDs remain unchanged, but the plugin reports a warning because the fragment target is ambiguous.

There is deliberately no `wrap` behavior because paragraphs may already contain links, and wrapping them would create invalid nested anchors.

## Development

From the workspace root:

- Run `pnpm build` to compile the package to `dist/`
- Run `pnpm typecheck` to type-check the implementation and tests
- Run `pnpm test` to run the behavior tests
- Run `pnpm lint` to run package lint scripts
- Run `pnpm format` to run package formatting scripts

## License

[MIT](../../LICENSE)
