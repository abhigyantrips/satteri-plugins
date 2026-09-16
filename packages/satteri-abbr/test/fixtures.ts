import type { CompileOptions } from "satteri";
import type { SatteriAbbrOptions } from "../index.js";

export interface Scenario {
	title: string;
	input: string;
	options: SatteriAbbrOptions;
	features?: CompileOptions["features"];
	expected: string;
}

const htmlDef = "HyperText Markup Language";
const htmlAbbr = `<abbr title="${htmlDef}">HTML</abbr>`;

const scenarios: Scenario[] = [
	{
		title: "single occurrence",
		input: `HTML is the backbone of the web.`,
		options: { abbreviations: { HTML: htmlDef } },
		expected: `<p>${htmlAbbr} is the backbone of the web.</p>\n`,
	},
	{
		title: "multiple occurrences are all wrapped by default",
		input: `HTML is great. I love HTML.`,
		options: { abbreviations: { HTML: htmlDef } },
		expected: `<p>${htmlAbbr} is great. I love ${htmlAbbr}.</p>\n`,
	},
	{
		title: "firstOnly wraps only the first occurrence",
		input: `HTML is great. I love HTML.`,
		options: { abbreviations: { HTML: htmlDef }, firstOnly: true },
		expected: `<p>${htmlAbbr} is great. I love HTML.</p>\n`,
	},
	{
		title: "aliases expand to the same definition",
		input: `html and HTML`,
		options: {
			abbreviations: { HTML: { definition: htmlDef, aliases: ["html"] } },
		},
		expected: `<p><abbr title="${htmlDef}">html</abbr> and ${htmlAbbr}</p>\n`,
	},
	{
		title: "matching respects word boundaries",
		input: `HTMLified is not HTML.`,
		options: { abbreviations: { HTML: htmlDef } },
		expected: `<p>HTMLified is not ${htmlAbbr}.</p>\n`,
	},
	{
		title: "longest form wins",
		input: `HTTPS and HTTP`,
		options: {
			abbreviations: {
				HTTP: "HyperText Transfer Protocol",
				HTTPS: "HyperText Transfer Protocol Secure",
			},
		},
		expected: `<p><abbr title="HyperText Transfer Protocol Secure">HTTPS</abbr> and <abbr title="HyperText Transfer Protocol">HTTP</abbr></p>\n`,
	},
	{
		title: "term with non-word characters",
		input: `I like C++ a lot.`,
		options: { abbreviations: { "C++": "C Plus Plus" } },
		expected: `<p>I like <abbr title="C Plus Plus">C++</abbr> a lot.</p>\n`,
	},
	{
		title: "term surrounded by punctuation",
		input: `(HTML)`,
		options: { abbreviations: { HTML: htmlDef } },
		expected: `<p>(${htmlAbbr})</p>\n`,
	},
	{
		title: "inline code is ignored",
		input: "`HTML`",
		options: { abbreviations: { HTML: htmlDef } },
		expected: `<p><code>HTML</code></p>\n`,
	},
	{
		title: "fenced code block is ignored",
		input: "```\nHTML\n```",
		options: { abbreviations: { HTML: htmlDef } },
		expected: `<pre><code>HTML\n</code></pre>\n`,
	},
	{
		title: "link text is ignored",
		input: `[HTML](http://example.com)`,
		options: { abbreviations: { HTML: htmlDef } },
		expected: `<p><a href="http://example.com">HTML</a></p>\n`,
	},
	{
		title: "existing abbr markup is ignored when raw HTML is reparsed",
		input: `<abbr title="${htmlDef}">HTML</abbr>`,
		options: { abbreviations: { HTML: htmlDef } },
		features: { rawHtml: true },
		expected: `<p><abbr title="${htmlDef}">HTML</abbr></p>\n`,
	},
	{
		title: "unreparsed raw HTML is opaque to ancestor checks",
		input: `<abbr title="${htmlDef}">HTML</abbr>`,
		options: { abbreviations: { HTML: htmlDef } },
		expected: `<p><abbr title="${htmlDef}">${htmlAbbr}</abbr></p>\n`,
	},
	{
		title: "term inside emphasis is wrapped",
		input: `*HTML*`,
		options: { abbreviations: { HTML: htmlDef } },
		expected: `<p><em>${htmlAbbr}</em></p>\n`,
	},
	{
		title: "custom ignore list replaces the default",
		input: `[HTML](http://example.com) and \`HTML\``,
		options: { abbreviations: { HTML: htmlDef }, ignore: ["code"] },
		expected: `<p><a href="http://example.com">${htmlAbbr}</a> and <code>HTML</code></p>\n`,
	},
	{
		title: "empty abbreviations leave the document unchanged",
		input: `HTML is great.`,
		options: { abbreviations: {} },
		expected: `<p>HTML is great.</p>\n`,
	},
];

export default scenarios;
