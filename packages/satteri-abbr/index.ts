import {
	defineHastPlugin,
	type HastContent,
	type HastNode,
	type HastPluginDefinition,
	type HastVisitorContext,
} from "satteri";

type HastElement = Extract<HastNode, { type: "element" }>;
type HastText = Extract<HastNode, { type: "text" }>;

/** Tag names of standard HTML elements. */
export type HtmlTagName =
	| "a"
	| "abbr"
	| "address"
	| "area"
	| "article"
	| "aside"
	| "audio"
	| "b"
	| "base"
	| "bdi"
	| "bdo"
	| "blockquote"
	| "br"
	| "button"
	| "canvas"
	| "caption"
	| "cite"
	| "code"
	| "col"
	| "colgroup"
	| "data"
	| "datalist"
	| "dd"
	| "del"
	| "details"
	| "dfn"
	| "dialog"
	| "div"
	| "dl"
	| "dt"
	| "em"
	| "embed"
	| "fieldset"
	| "figcaption"
	| "figure"
	| "footer"
	| "form"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "header"
	| "hgroup"
	| "hr"
	| "i"
	| "iframe"
	| "img"
	| "input"
	| "ins"
	| "kbd"
	| "label"
	| "legend"
	| "li"
	| "link"
	| "main"
	| "map"
	| "mark"
	| "menu"
	| "meta"
	| "meter"
	| "nav"
	| "noscript"
	| "object"
	| "ol"
	| "optgroup"
	| "option"
	| "output"
	| "p"
	| "picture"
	| "pre"
	| "progress"
	| "q"
	| "rp"
	| "rt"
	| "ruby"
	| "s"
	| "samp"
	| "script"
	| "search"
	| "section"
	| "select"
	| "slot"
	| "small"
	| "source"
	| "span"
	| "strong"
	| "style"
	| "sub"
	| "summary"
	| "sup"
	| "table"
	| "tbody"
	| "td"
	| "template"
	| "textarea"
	| "tfoot"
	| "th"
	| "thead"
	| "time"
	| "title"
	| "tr"
	| "track"
	| "u"
	| "ul"
	| "var"
	| "video"
	| "wbr";

/** Definition of a single abbreviation. */
export interface Abbreviation {
	/** The full definition, rendered as the `title` attribute of the `abbr` element. */
	definition: string;
	/** Additional written forms that also expand to the definition (e.g. lowercase variants). */
	aliases?: string[];
}

export interface SatteriAbbrOptions {
	/**
	 * Abbreviations to expand. Each key is the canonical written form; the
	 * value is either the definition itself or an object with a definition
	 * and aliases.
	 */
	abbreviations: Record<string, string | Abbreviation>;
	/** Wrap only the first occurrence of each abbreviation per document. Default: `false`. */
	firstOnly?: boolean;
	/** Ancestor tags whose text content is never matched. Default: `["a", "abbr", "code", "pre"]`. */
	ignore?: HtmlTagName[];
}

interface Term {
	key: string;
	definition: string;
}

const defaultIgnore: HtmlTagName[] = ["a", "abbr", "code", "pre"];
const wordCharRe = /\w/;

/**
 * Satteri plugin to wrap abbreviations in `abbr` elements with their
 * definitions.
 *
 * @param options Settings; `abbreviations` is required.
 * @returns HAST plugin definition; pass the result to `hastPlugins`.
 */
export default function satteriAbbr(
	options: SatteriAbbrOptions,
): HastPluginDefinition {
	const firstOnly = options.firstOnly ?? false;
	const ignore = new Set<string>(options.ignore ?? defaultIgnore);

	const forms = new Map<string, Term>();
	for (const [key, entry] of Object.entries(options.abbreviations)) {
		const term: Term = {
			key,
			definition: typeof entry === "string" ? entry : entry.definition,
		};
		const allForms = [key, ...(typeof entry === "string" ? [] : (entry.aliases ?? []))];
		for (const form of allForms) {
			if (form.length > 0 && !forms.has(form)) forms.set(form, term);
		}
	}

	if (forms.size === 0) {
		return defineHastPlugin({ name: "satteri-abbr" });
	}

	// Longest forms first, so e.g. `HTTPS` wins over `HTTP`.
	const pattern = [...forms.keys()]
		.sort((a, b) => b.length - a.length)
		.map(formPattern)
		.join("|");
	const matcher = new RegExp(pattern, "g");

	// Per-document state for `firstOnly`, reset by the `before` hook.
	let wrapped = new Set<string>();

	return defineHastPlugin({
		name: "satteri-abbr",
		before() {
			wrapped = new Set();
		},
		text(node, ctx) {
			if (hasIgnoredAncestor(node, ctx, ignore)) return;

			const value = node.value;
			const parts: HastContent[] = [];
			let lastIndex = 0;
			let changed = false;

			matcher.lastIndex = 0;
			let match: RegExpExecArray | null;
			while ((match = matcher.exec(value)) !== null) {
				const form = match[0];
				const term = forms.get(form);
				if (!term) continue;

				if (firstOnly) {
					if (wrapped.has(term.key)) continue;
					wrapped.add(term.key);
				}

				if (match.index > lastIndex) {
					parts.push({ type: "text", value: value.slice(lastIndex, match.index) });
				}
				parts.push(createAbbr(form, term.definition));
				lastIndex = match.index + form.length;
				changed = true;
			}

			if (!changed) return;

			if (lastIndex < value.length) {
				parts.push({ type: "text", value: value.slice(lastIndex) });
			}

			ctx.replaceNode(node, parts);
		},
	});
}

function hasIgnoredAncestor(
	node: Readonly<HastText>,
	ctx: HastVisitorContext,
	ignore: ReadonlySet<string>,
): boolean {
	let ancestor: Readonly<HastNode> | undefined = ctx.parent(node);
	while (ancestor) {
		if (ancestor.type === "element" && ignore.has(ancestor.tagName)) {
			return true;
		}
		ancestor = ctx.parent(ancestor);
	}
	return false;
}

function createAbbr(form: string, definition: string): HastElement {
	return {
		type: "element",
		tagName: "abbr",
		properties: { title: definition },
		children: [{ type: "text", value: form }],
	};
}

function formPattern(form: string): string {
	const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const lookbehind = wordCharRe.test(form[0] ?? "") ? "(?<!\\w)" : "";
	const lookahead = wordCharRe.test(form[form.length - 1] ?? "") ? "(?!\\w)" : "";
	return lookbehind + escaped + lookahead;
}
