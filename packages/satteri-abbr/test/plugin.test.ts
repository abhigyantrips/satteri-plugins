import assert from "node:assert/strict";
import { it } from "node:test";
import { markdownToHtml, type CompileOptions } from "satteri";
import satteriAbbr, { type SatteriAbbrOptions } from "../index.js";
import scenarios from "./fixtures.js";

function parse(
	markdown: string,
	options: SatteriAbbrOptions,
	features: CompileOptions["features"] = {},
): string {
	const parserOptions = {
		features,
		hastPlugins: [satteriAbbr(options)],
	} satisfies CompileOptions;

	const result = markdownToHtml(markdown, parserOptions);

	if (result instanceof Promise) {
		throw new TypeError("satteri-abbr unexpectedly returned an async plugin");
	}

	return result.html;
}

for (const { title, input, options, features, expected } of scenarios) {
	it(`Test ${title}`, () => {
		assert.equal(parse(input, options, features), expected);
	});
}
