import { defineHastPlugin } from "satteri";

// HTML inter-element whitespace.
// See <https://infra.spec.whatwg.org/#ascii-whitespace>.
const whitespaceRe = /^[ \t\n\f\r]*$/;

/**
 * @typedef {object} SatteriFigureOptions
 * @property {string | string[]} [className]
 *   Class(es) for the wrapping `figure` element. No classes are added
 *   by default.
 */

/**
 * Satteri plugin to transform an image with alt text to a figure with
 * caption.
 *
 * Port of [`@microflash/rehype-figure`](https://github.com/naiyerasif/rehype-figure)
 * to a Satteri HAST plugin.
 *
 * @param {SatteriFigureOptions} [options]
 *   Optional settings.
 * @returns
 *   HAST plugin definition; pass the result to `hastPlugins`.
 */
export default function satteriFigure(options = {}) {
	return defineHastPlugin({
		name: "satteri-figure",
		element: [
			{
				// Phase 1: unwrap the images inside an images-only paragraph,
				// wrapping each image with alt text in a figure on the way up.
				filter: ["p"],
				visit(node, ctx) {
					if (!hasOnlyImages(node)) {
						return;
					}

					const parent = ctx.parent(node);

					ctx.replaceNode(
						node,
						node.children
							.filter(
								(child) => child.type === "element" && child.tagName === "img"
							)
							.map((image) =>
								isImageWithAlt(image) &&
								!isImageWithCaption(parent) &&
								!isImageLink(parent)
									? createFigure(image, options)
									: image
							)
					);
				},
			},
			{
				// Phase 2: wrap every other image with alt text in a figure.
				filter: ["img"],
				visit(node, ctx) {
					if (!isImageWithAlt(node)) {
						return;
					}

					const parent = ctx.parent(node);

					if (
						isImageWithCaption(parent) ||
						isImageLink(parent) ||
						// Handled by the paragraph visitor above.
						(parent?.tagName === "p" && hasOnlyImages(parent))
					) {
						return;
					}

					ctx.replaceNode(node, createFigure(node, options));
				},
			},
		],
	});
}

function hasOnlyImages(node) {
	return (
		node?.type === "element" &&
		node.children.every(
			(child) =>
				(child.type === "element" && child.tagName === "img") ||
				(child.type === "text" && whitespaceRe.test(child.value))
		)
	);
}

function isImageWithAlt(node) {
	return (
		node?.type === "element" &&
		node.tagName === "img" &&
		Boolean(node.properties?.alt) &&
		Boolean(node.properties?.src)
	);
}

function isImageWithCaption(node) {
	return (
		node?.type === "element" &&
		node.tagName === "figure" &&
		node.children.some(
			(child) => child.type === "element" && child.tagName === "figcaption"
		)
	);
}

function isImageLink(node) {
	return node?.type === "element" && node.tagName === "a";
}

function createFigure(image, options) {
	const classes = toClasses(options.className);

	return {
		type: "element",
		tagName: "figure",
		properties: classes.length > 0 ? { className: classes } : {},
		children: [
			{
				type: "element",
				tagName: "img",
				properties: { ...image.properties },
				children: [],
			},
			{
				type: "element",
				tagName: "figcaption",
				properties: {},
				children: [{ type: "text", value: String(image.properties.alt) }],
			},
		],
	};
}

function toClasses(className) {
	if (!className) {
		return [];
	}

	return (Array.isArray(className) ? className : [className])
		.flatMap((value) => String(value).split(/\s+/))
		.filter(Boolean);
}
