# satteri-figure

[Satteri](https://satteri.bruits.org) plugin to transform an image with alt text to a figure with caption. A port of [`@microflash/rehype-figure`](https://github.com/naiyerasif/rehype-figure) to Satteri's [HAST plugin API](https://satteri.bruits.org/docs/plugin-api/).

> [!IMPORTANT]
> Converting an image with alt text to a figure with caption is an [escape hatch](https://en.wiktionary.org/wiki/escape_hatch). Alt text, title, and captions have [different intended purposes](https://www.stylemanual.gov.au/content-types/images/alt-text-captions-and-titles-images), and you should eventually enhance your content to adopt them.

## What's this?

This package is a [Satteri](https://satteri.bruits.org) plugin that takes an image node with alt text (e.g., `![Alt text](path-to-image.jpg)`) and converts it to a [figure](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure) element with caption.

```html
<figure>
  <img src="path-to-image.jpg" alt="Alt text" />
  <figcaption>Alt text</figcaption>
</figure>
```

## Install

```sh
npm install satteri-figure
yarn add satteri-figure
pnpm add satteri-figure
```

## Use

Say we have the following module `example.js`:

```js
import { markdownToHtml } from "satteri";
import satteriFigure from "satteri-figure";

const { html } = markdownToHtml("![Alt text](path-to-image.jpg)", {
  hastPlugins: [satteriFigure()],
});

console.log(html);
```

Running that with `node example.js` yields:

```html
<figure><img src="path-to-image.jpg" alt="Alt text"><figcaption>Alt text</figcaption></figure>
```

## API

The default export is `satteriFigure`, a function returning a HAST plugin definition to pass to `hastPlugins`.

The following options are available. All of them are optional.

- `className`: class (or list of classes) for the wrapped `figure` element

By default, no classes are added to the `figure` element.

## Development

- Run `pnpm test` to run tests

## License

[MIT](../../LICENSE)
