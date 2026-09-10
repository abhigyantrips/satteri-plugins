import {
	defineHastPlugin,
	type HastNode,
	type HastPluginDefinition,
} from "satteri";

type HastElement = Extract<HastNode, { type: "element" }>;
type HastImage = HastElement & { tagName: "img" };

// HTML inter-element whitespace.
// See <https://infra.spec.whatwg.org/#ascii-whitespace>.
const whitespaceRe = /^[ \t\n\f\r]*$/;

export interface SatteriFigureOptions {
	/** Class(es) for the wrapping `figure` element. */
	className?: string | string[];
}

/**
 * Satteri plugin to transform an image with alt text to a figure with
 * caption.
 *
 * Port of [`@microflash/rehype-figure`](https://github.com/naiyerasif/rehype-figure)
 * to a Satteri HAST plugin.
 *
 * @param options Optional settings.
 * @returns HAST plugin definition; pass the result to `hastPlugins`.
 */
export default function satteriFigure(
	options: SatteriFigureOptions = {},
): HastPluginDefinition {
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
							.filter(isImage)
							.map((image) =>
								isImageWithAlt(image) &&
								!isImageWithCaption(parent) &&
								!isImageLink(parent)
									? createFigure(image, options)
									: image,
							),
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
						(parent?.type === "element" &&
							parent.tagName === "p" &&
							hasOnlyImages(parent))
					) {
						return;
					}

					ctx.replaceNode(node, createFigure(node, options));
				},
			},
		],
	});
}

function hasOnlyImages(
	node: Readonly<HastNode> | undefined,
): node is Readonly<HastElement> {
	return (
		node?.type === "element" &&
		node.children.every(
			(child) =>
				isImage(child) ||
				(child.type === "text" && whitespaceRe.test(child.value)),
		)
	);
}

function isImage(node: Readonly<HastNode>): node is Readonly<HastImage> {
	return node.type === "element" && node.tagName === "img";
}

function isImageWithAlt(
	node: Readonly<HastNode> | undefined,
): node is Readonly<HastImage> {
	return (
		isDefinedNode(node) &&
		isImage(node) &&
		Boolean(node.properties.alt) &&
		Boolean(node.properties.src)
	);
}

function isImageWithCaption(node: Readonly<HastNode> | undefined): boolean {
	return (
		node?.type === "element" &&
		node.tagName === "figure" &&
		node.children.some(
			(child) => child.type === "element" && child.tagName === "figcaption",
		)
	);
}

function isImageLink(node: Readonly<HastNode> | undefined): boolean {
	return node?.type === "element" && node.tagName === "a";
}

function isDefinedNode(
	node: Readonly<HastNode> | undefined,
): node is Readonly<HastNode> {
	return node !== undefined;
}

function createFigure(
	image: Readonly<HastImage>,
	options: SatteriFigureOptions,
): HastElement {
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

function toClasses(className: SatteriFigureOptions["className"]): string[] {
	if (!className) {
		return [];
	}

	return (Array.isArray(className) ? className : [className])
		.flatMap((value) => String(value).split(/\s+/))
		.filter(Boolean);
}
