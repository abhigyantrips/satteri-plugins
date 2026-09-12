import {
	defineHastPlugin,
	type HastContent,
	type HastNode,
	type HastPluginDefinition,
} from "satteri";

export type { HastContent } from "satteri";

type HastElement = Extract<HastNode, { type: "element" }>;
type HastParagraph = HastElement & { tagName: "p" };

/** Placement of the paragraph permalink. */
export type Behavior = "prepend" | "append" | "before" | "after";

/** Information about the paragraph currently receiving a permalink. */
export interface ParagraphLinkInfo {
	/** The authored or generated fragment identifier. */
	id: string;
	/** One-based position among paragraphs accepted by `test`. */
	index: number;
}

/** Properties accepted by a HAST element. */
export type HastProperties = HastElement["properties"];

/** Build link content for a paragraph. */
export type BuildContent = (
	paragraph: Readonly<HastParagraph>,
	info: Readonly<ParagraphLinkInfo>,
) => HastContent | HastContent[];

/** Build link properties for a paragraph. */
export type BuildProperties = (
	paragraph: Readonly<HastParagraph>,
	info: Readonly<ParagraphLinkInfo>,
) => HastProperties;

/** Decide whether a top-level paragraph should receive a permalink. */
export type ParagraphTest = (paragraph: Readonly<HastParagraph>) => boolean;

export interface SatteriAutolinkParagraphsOptions {
	/** Where to place the link. Default: `"append"`. */
	behavior?: Behavior;
	/** Prefix used for generated IDs. Default: `"paragraph-"`. */
	prefix?: string;
	/** Static link content or a per-paragraph content builder. Default: `¶`. */
	content?: HastContent | HastContent[] | BuildContent;
	/** Static link properties or a per-paragraph properties builder. */
	properties?: HastProperties | BuildProperties;
	/** Synchronous predicate applied to top-level paragraphs before numbering. */
	test?: ParagraphTest;
}

const defaultProperties: HastProperties = {
	className: ["autolink-paragraph"],
	ariaLabel: "Link to this paragraph",
};

/**
 * Add permalink anchors to `p` elements that are direct children of the root.
 *
 * @param options Optional settings.
 * @returns HAST plugin definition; pass the result to `hastPlugins`.
 */
export default function satteriAutolinkParagraphs(
	options: SatteriAutolinkParagraphsOptions = {},
): HastPluginDefinition {
	const behavior = options.behavior ?? "append";
	const prefix = options.prefix ?? "paragraph-";

	return defineHastPlugin({
		name: "satteri-autolink-paragraphs",
		before(root, ctx) {
			const idCounts = collectIdCounts(root);
			const usedIds = new Set(idCounts.keys());
			let index = 0;

			for (const child of root.children) {
				if (!isParagraph(child) || (options.test && !options.test(child))) {
					continue;
				}

				index += 1;
				const authoredId = getId(child);
				const id = authoredId ?? createId(prefix, index, usedIds);

				if (authoredId === undefined) {
					ctx.setProperty(child, "id", id);
				} else if ((idCounts.get(authoredId) ?? 0) > 1) {
					ctx.report({
						message: `Duplicate authored id \"${authoredId}\" makes the paragraph permalink ambiguous`,
						node: child,
						severity: "warning",
					});
				}

				const info = { id, index } satisfies ParagraphLinkInfo;
				const link = createLink(child, info, options);
				const space: HastContent = { type: "text", value: " " };

				switch (behavior) {
					case "append":
						ctx.appendChild(child, [space, link]);
						break;
					case "prepend":
						ctx.prependChild(child, [link, space]);
						break;
					case "before":
						ctx.insertBefore(child, link);
						break;
					case "after":
						ctx.insertAfter(child, link);
						break;
				}
			}
		},
	});
}

function isParagraph(node: Readonly<HastNode>): node is Readonly<HastParagraph> {
	return node.type === "element" && node.tagName === "p";
}

function getId(node: Readonly<HastElement>): string | undefined {
	const id = node.properties.id;
	return typeof id === "string" && id.length > 0 ? id : undefined;
}

function collectIdCounts(root: Readonly<HastNode>): Map<string, number> {
	const counts = new Map<string, number>();
	const pending: Readonly<HastNode>[] = [root];

	while (pending.length > 0) {
		const node = pending.pop();
		if (!node) continue;

		if (node.type === "element") {
			const id = getId(node);
			if (id !== undefined) counts.set(id, (counts.get(id) ?? 0) + 1);
		}

		if ("children" in node) {
			for (const child of node.children) pending.push(child);
		}
	}

	return counts;
}

function createId(prefix: string, index: number, usedIds: Set<string>): string {
	const base = `${prefix}${index}`;
	let id = base;
	let suffix = 2;

	while (usedIds.has(id)) {
		id = `${base}-${suffix}`;
		suffix += 1;
	}

	usedIds.add(id);
	return id;
}

function createLink(
	paragraph: Readonly<HastParagraph>,
	info: Readonly<ParagraphLinkInfo>,
	options: SatteriAutolinkParagraphsOptions,
): HastElement {
	const configuredContent = options.content;
	const content =
		typeof configuredContent === "function"
			? configuredContent(paragraph, info)
			: (configuredContent ?? { type: "text", value: "¶" });
	const configuredProperties = options.properties;
	const properties =
		typeof configuredProperties === "function"
			? configuredProperties(paragraph, info)
			: configuredProperties;

	return {
		type: "element",
		tagName: "a",
		properties: {
			...defaultProperties,
			...properties,
			href: `#${info.id}`,
		},
		children: (Array.isArray(content) ? content : [content]) as HastElement["children"],
	};
}
