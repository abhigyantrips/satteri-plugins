import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	defineHastPlugin,
	markdownToHtml,
	type CompileOptions,
	type Data,
	type HastDiagnostic,
	type HastPluginDefinition,
} from "satteri";
import satteriAutolinkParagraphs, {
	type Behavior,
	type SatteriAutolinkParagraphsOptions,
} from "../index.js";

function compile(
	markdown: string,
	options: SatteriAutolinkParagraphsOptions = {},
	plugins: HastPluginDefinition[] = [],
	data: Data = {},
): { html: string; data: Data } {
	const parserOptions = {
		hastPlugins: [...plugins, satteriAutolinkParagraphs(options)],
		data,
	} satisfies CompileOptions;
	const result = markdownToHtml(markdown, parserOptions);

	if (result instanceof Promise) {
		throw new TypeError(
			"satteri-autolink-paragraphs unexpectedly returned an async plugin",
		);
	}

	return result;
}

function setIds(idsByText: Readonly<Record<string, string>>): HastPluginDefinition {
	return defineHastPlugin({
		name: "set-test-ids",
		before(root, ctx) {
			const pending = [...root.children];
			while (pending.length > 0) {
				const node = pending.pop();
				if (!node) continue;
				if (node.type === "element") {
					const id = idsByText[ctx.textContent(node)];
					if (id !== undefined) ctx.setProperty(node, "id", id);
				}
				if ("children" in node) pending.push(...node.children);
			}
		},
	});
}

describe("satteriAutolinkParagraphs", () => {
	it("adds sequential IDs and an accessible visible permalink by default", () => {
		assert.equal(
			compile("First paragraph.\n\nSecond paragraph.").html,
			'<p id="paragraph-1">First paragraph. <a class="autolink-paragraph" aria-label="Link to this paragraph" href="#paragraph-1">¶</a></p>\n<p id="paragraph-2">Second paragraph. <a class="autolink-paragraph" aria-label="Link to this paragraph" href="#paragraph-2">¶</a></p>\n',
		);
	});

	const behaviorCases: ReadonlyArray<[Behavior, string]> = [
		[
			"append",
			'<p id="paragraph-1">Text <a class="autolink-paragraph" aria-label="Link to this paragraph" href="#paragraph-1">¶</a></p>\n',
		],
		[
			"prepend",
			'<p id="paragraph-1"><a class="autolink-paragraph" aria-label="Link to this paragraph" href="#paragraph-1">¶</a> Text</p>\n',
		],
		[
			"before",
			'<a class="autolink-paragraph" aria-label="Link to this paragraph" href="#paragraph-1">¶</a><p id="paragraph-1">Text</p>\n',
		],
		[
			"after",
			'<p id="paragraph-1">Text</p><a class="autolink-paragraph" aria-label="Link to this paragraph" href="#paragraph-1">¶</a>\n',
		],
	];

	for (const [behavior, expected] of behaviorCases) {
		it(`supports ${behavior} behavior`, () => {
			assert.equal(compile("Text", { behavior }).html, expected);
		});
	}

	it("does not wrap paragraphs that already contain Markdown links", () => {
		assert.equal(
			compile("Read [the docs](https://example.com/docs).").html,
			'<p id="paragraph-1">Read <a href="https://example.com/docs">the docs</a>. <a class="autolink-paragraph" aria-label="Link to this paragraph" href="#paragraph-1">¶</a></p>\n',
		);
	});

	it("excludes paragraphs nested in blockquotes, lists, and footnotes", () => {
		const markdown = `Top-level.[^note]

> Quoted paragraph.

- First list paragraph.

  Second list paragraph.

[^note]: Footnote paragraph.`;
		const { html } = compile(markdown);

		assert.equal((html.match(/class="autolink-paragraph"/g) ?? []).length, 1);
		assert.match(html, /<p id="paragraph-1">Top-level\./);
		assert.doesNotMatch(html, /<blockquote>\s*<p id=/);
		assert.doesNotMatch(html, /<li>\s*<p id=/);
		assert.doesNotMatch(html, /Footnote paragraph\. <a class="autolink-paragraph"/);
	});

	it("filters before assigning paragraph indexes", () => {
		const { html } = compile("Skip this.\n\nKeep this.", {
			test(paragraph) {
				const first = paragraph.children[0];
				return first?.type === "text" && first.value.startsWith("Keep");
			},
		});

		assert.equal(
			html,
			'<p>Skip this.</p>\n<p id="paragraph-1">Keep this. <a class="autolink-paragraph" aria-label="Link to this paragraph" href="#paragraph-1">¶</a></p>\n',
		);
	});

	it("preserves a non-empty authored paragraph ID", () => {
		assert.equal(
			compile("Authored.", {}, [setIds({ "Authored.": "chosen-id" })]).html,
			'<p id="chosen-id">Authored. <a class="autolink-paragraph" aria-label="Link to this paragraph" href="#chosen-id">¶</a></p>\n',
		);
	});

	it("suffixes generated IDs that collide anywhere in the HAST", () => {
		assert.equal(
			compile("# Reserved\n\nParagraph.", {}, [
				setIds({ Reserved: "paragraph-1" }),
			]).html,
			'<h1 id="paragraph-1">Reserved</h1>\n<p id="paragraph-1-2">Paragraph. <a class="autolink-paragraph" aria-label="Link to this paragraph" href="#paragraph-1-2">¶</a></p>\n',
		);
	});

	it("reports warnings while preserving duplicate authored IDs", () => {
		const data: Data = {};
		const target = satteriAutolinkParagraphs();
		const observed = defineHastPlugin({
			...target,
			name: "observe-autolink-diagnostics",
			after(_root, ctx) {
				ctx.data.autolinkDiagnostics = [...ctx.getDiagnostics()];
			},
		});
		const parserOptions = {
			hastPlugins: [
				setIds({ "First.": "duplicate", "Second.": "duplicate" }),
				observed,
			],
			data,
		} satisfies CompileOptions;
		const result = markdownToHtml("First.\n\nSecond.", parserOptions);
		if (result instanceof Promise) throw new TypeError("unexpected async result");

		assert.match(result.html, /<p id="duplicate">First\./);
		assert.match(result.html, /<p id="duplicate">Second\./);
		const diagnostics = result.data.autolinkDiagnostics as HastDiagnostic[];
		assert.equal(diagnostics.length, 2);
		assert.ok(diagnostics.every(({ severity }) => severity === "warning"));
		assert.ok(
			diagnostics.every(({ message }) => message.includes('"duplicate"')),
		);
	});

	it("links multiple identical paragraphs independently", () => {
		const { html } = compile("Same.\n\nSame.");
		assert.match(html, /<p id="paragraph-1">Same\./);
		assert.match(html, /<p id="paragraph-2">Same\./);
	});

	it("supports static content and properties with authoritative href", () => {
		assert.equal(
			compile("Static.", {
				content: { type: "element", tagName: "span", properties: {}, children: [{ type: "text", value: "#" }] },
				properties: {
					className: ["custom-link"],
					href: "#wrong",
					title: "Copy paragraph link",
				},
			}).html,
			'<p id="paragraph-1">Static. <a class="custom-link" aria-label="Link to this paragraph" href="#paragraph-1" title="Copy paragraph link"><span>#</span></a></p>\n',
		);
	});

	it("calls content and properties builders with the paragraph and link info", () => {
		const calls: string[] = [];
		assert.equal(
			compile("One.\n\nTwo.", {
				prefix: "p-",
				content(paragraph, info) {
					calls.push(`content:${paragraph.tagName}:${info.id}:${info.index}`);
					return { type: "text", value: String(info.index) };
				},
				properties(paragraph, info) {
					calls.push(`properties:${paragraph.tagName}:${info.id}:${info.index}`);
					return {
						className: [`link-${info.index}`],
						ariaLabel: `Link to paragraph ${info.index}`,
					};
				},
			}).html,
			'<p id="p-1">One. <a class="link-1" aria-label="Link to paragraph 1" href="#p-1">1</a></p>\n<p id="p-2">Two. <a class="link-2" aria-label="Link to paragraph 2" href="#p-2">2</a></p>\n',
		);
		assert.deepEqual(calls, [
			"content:p:p-1:1",
			"properties:p:p-1:1",
			"content:p:p-2:2",
			"properties:p:p-2:2",
		]);
	});
});
