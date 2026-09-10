import assert from "node:assert/strict";
import { it } from "node:test";
import { markdownToHtml, type CompileOptions } from "satteri";
import satteriFigure, { type SatteriFigureOptions } from "../index.js";
import scenarios from "./fixtures.js";

function parse(
	markdown: string,
	options: SatteriFigureOptions = {},
): string {
	const parserOptions = {
		hastPlugins: [satteriFigure(options)],
	} satisfies CompileOptions;

	const result = markdownToHtml(markdown, parserOptions);

	if (result instanceof Promise) {
		throw new TypeError("satteri-figure unexpectedly returned an async plugin");
	}

	return result.html;
}

for (const { title, input, options = {}, expected } of scenarios) {
	it(`Test ${title}`, () => {
		assert.equal(parse(input, options), expected);
	});
}
