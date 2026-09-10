export default [
	{
		title: "image with alt text as plaintext",
		input: `![Image](http://example.com/test.png)`,
		expected: `<figure><img src="http://example.com/test.png" alt="Image"><figcaption>Image</figcaption></figure>\n`,
	},
	{
		title: "image with alt text and custom classes",
		input: `![Image](http://example.com/test.png)`,
		options: {
			className: "figure",
		},
		expected: `<figure class="figure"><img src="http://example.com/test.png" alt="Image"><figcaption>Image</figcaption></figure>\n`,
	},
	{
		title: "image with alt text containing markdown",
		input: `![Image with **strong** _emphasis_](http://example.com/test.png)`,
		expected: `<figure><img src="http://example.com/test.png" alt="Image with strong emphasis"><figcaption>Image with strong emphasis</figcaption></figure>\n`,
	},
	{
		title: "image with no alt text",
		input: `![](http://example.com/test.png)`,
		expected: `<img src="http://example.com/test.png" alt="">\n`,
	},
	{
		title: "raw image markup with caption",
		input: `<figure><img src="http://example.com/captioned.png" alt="Captioned image"><figcaption><em>Captioned image</em></figcaption></figure>`,
		expected: `<figure><img src="http://example.com/captioned.png" alt="Captioned image"><figcaption><em>Captioned image</em></figcaption></figure>\n`,
	},
	{
		title: "raw image markup without caption",
		input: `<img src="http://example.com/captioned.png" alt="Captioned image">`,
		expected: `<img src="http://example.com/captioned.png" alt="Captioned image">\n`,
	},
	{
		title: "link with image",
		input: `[![Image](http://example.com/test.png)](http://example.com)`,
		expected: `<p><a href="http://example.com"><img src="http://example.com/test.png" alt="Image"></a></p>\n`,
	},
	{
		title: "paragraph with only images",
		input: `\n\n![Image 1](http://example.com/test1.png)\n![Image 2](http://example.com/test2.png)\n\n`,
		expected: `<figure><img src="http://example.com/test1.png" alt="Image 1"><figcaption>Image 1</figcaption></figure><figure><img src="http://example.com/test2.png" alt="Image 2"><figcaption>Image 2</figcaption></figure>\n`,
	},
	{
		title: "paragraph with no images",
		input: `A paragraph bereft of images`,
		expected: `<p>A paragraph bereft of images</p>\n`,
	},
];
