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

function collectWarnings(fn: () => void): string[] {
	const warnings: string[] = [];
	const original = console.warn;
	console.warn = (message?: unknown) => {
		warnings.push(String(message));
	};
	try {
		fn();
	} finally {
		console.warn = original;
	}
	return warnings;
}

it("Warns about raw abbr markup when rawHtml is disabled", () => {
	const warnings = collectWarnings(() => {
		parse('<abbr title="HyperText Markup Language">HTML</abbr>', {
			abbreviations: { HTML: "HyperText Markup Language" },
		});
	});
	assert.equal(warnings.length, 1);
	assert.match(warnings[0] ?? "", /rawHtml/);
});

it("Does not warn about raw abbr markup when rawHtml is enabled", () => {
	const warnings = collectWarnings(() => {
		parse(
			'<abbr title="HyperText Markup Language">HTML</abbr>',
			{ abbreviations: { HTML: "HyperText Markup Language" } },
			{ rawHtml: true },
		);
	});
	assert.equal(warnings.length, 0);
});

it("Does not warn when raw markup contains no abbr", () => {
	const warnings = collectWarnings(() => {
		parse("<span>HTML</span>", {
			abbreviations: { HTML: "HyperText Markup Language" },
		});
	});
	assert.equal(warnings.length, 0);
});
