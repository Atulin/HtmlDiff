# HtmlDiff

[![Publish to NPM](https://github.com/Atulin/HtmlDiff/actions/workflows/publish.yml/badge.svg)](https://github.com/Atulin/HtmlDiff/actions/workflows/publish.yml)
[![NPM Downloads](https://img.shields.io/npm/dm/%40angius%2Fhtmldiff)](https://www.npmjs.com/package/@angius/htmldiff)
[![Coverage Status](https://coveralls.io/repos/github/Atulin/HtmlDiff/badge.svg)](https://coveralls.io/github/Atulin/HtmlDiff)

TypeScript port of [HtmlDiff.NET](https://github.com/Rohland/htmldiff.net) which is itself a C# port of the Ruby implementation, [HtmlDiff](https://github.com/myobie/htmldiff/). This project is a maintained fork of [htmldiff-js](https://github.com/hugsmidjan-is/htmldiff-js), rewritten in TypeScript with ESM-only output.

Project Description
------------------

Diffs two HTML blocks, and returns a meshing of the two that includes `<ins>` and `<del>` elements. The classes of these elements are `ins.diffins` for new code, `del.diffdel` for removed code, and `del.diffmod` and `ins.diffmod` for sections of code that have been changed.

For "special tags" (primarily style tags such as `<em>` and `<strong>`), `ins.mod` elements are inserted with the new styles.

Further description can be found at this [blog post](http://www.rohland.co.za/index.php/2009/10/31/csharp-html-diff-algorithm/) written by Rohland, the author of HtmlDiff.NET.

**Note**: The diffing algorithm isn't perfect. One example is that if a new `<p>` ends in the same string as the previous `<p>` tag did, two `<ins>` tags will be created: one starting at the beginning of the common string in the first `<p>` and one in the second `<p>` containing all the content up to the point the trailing common string begins. It's a little frustrating, but I didn't write the algorithm (and honestly don't really understand it); I only ported it.

Usage
-----

#### Install

```bash
npm install @angius/htmldiff
```

#### JavaScript (ESM)

```javascript
import { diff, HtmlDiff } from "@angius/htmldiff";

let oldHtml = document.getElementById("oldHtml");
let newHtml = document.getElementById("newHtml");
let diffHtml = document.getElementById("diffHtml");

// One-shot helper
diffHtml.innerHTML = diff(oldHtml.innerHTML, newHtml.innerHTML);

// ...or use the class directly, which allows configuring options
let result = new HtmlDiff(oldHtml.innerHTML, newHtml.innerHTML).build();
```

#### HTML

```html
<html>
	<body>
		<div id="oldHtml">
			<p>Some <em>old</em> html here</p>
		</div>

		<div id="newHtml">
			<p>Some <b>new</b> html goes here</p>
		</div>

		<div id="diffHtml"></div>
	</body>
</html>
```

### Options

The `HtmlDiff` constructor takes the old and new HTML strings. The following public options can be set on the instance before calling `build()`:

- `repeatingWordsAccuracy` (default `1.0`) — controls how aggressively frequently-repeating words are ignored during matching. Setting it to a large value (e.g. `Infinity`) disables the filtering entirely.
- `ignoreWhiteSpaceDifferences` (default `false`) — when `true`, whitespace-only differences are treated as equal during matching.
- `orphanMatchThreshold` (default `0.0`) — when greater than `0`, isolated blocks that are shorter (measured in characters) than the surrounding gaps times this factor are dropped instead of rendered as unchanged.
- `addBlockExpression(exp)` — registers a regular expression that groups a text sequence as a single unit, so content matching the expression is compared as one block instead of word-by-word. Multiple expressions may be added; overlapping expressions throw an error.

```javascript
const htmlDiff = new HtmlDiff(oldHtml, newHtml);
htmlDiff.ignoreWhiteSpaceDifferences = true;
htmlDiff.orphanMatchThreshold = 0.25;
htmlDiff.addBlockExpression(/"[^"]*"/g);
const result = htmlDiff.build();
```

Demo
----

There is no bundled demo, but the output should match the [htmldiff.net demo](https://github.com/Rohland/htmldiff.net/tree/master/Demo) with a slight exception in what appeared to be a bug, which was 'fixed'.

Development
-----------

```bash
bun install
bun test       # run the test suite
bun test:watch # run tests in watch mode
bun run build  # build ESM output to dist/
bun run lint   # lint
bun run fmt    # format
```

This project uses [Bun](https://bun.sh) as the runtime and package manager, [oxlint](https://oxc.rs/docs/guide/usage/linter) for linting, [oxfmt](https://oxc.rs/docs/guide/usage/formatter) for formatting, and [tsdown](http://tsdown.dev) for building.
