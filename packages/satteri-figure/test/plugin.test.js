import assert from "node:assert/strict";
import { it } from "node:test";
import { markdownToHtml } from "satteri";
import satteriFigure from "../index.js";
import scenarios from "./fixtures.js";

function parse(markdown, options = {}) {
	return markdownToHtml(markdown, {
		hastPlugins: [satteriFigure(options)],
	}).html;
}

for (const { title, input, options = {}, expected } of scenarios) {
	it(`Test ${title}`, () => {
		assert.equal(parse(input, options), expected);
	});
}
