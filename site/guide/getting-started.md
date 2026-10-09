# Getting Started

HtmlDiff diffs two HTML blocks and returns a meshing of the two that includes
`<ins>` and `<del>` elements marking what was added, removed, or changed.

It is a TypeScript port of [HtmlDiff.NET](https://github.com/Rohland/htmldiff.net),
which is itself a C# port of the Ruby implementation,
[HtmlDiff](https://github.com/myobie/htmldiff/). This project is a maintained fork of
[htmldiff-js](https://github.com/hugsmidjan-is/htmldiff-js), rewritten in TypeScript with
ESM-only output.

## Installation

::: code-group

```bash [npm]
npm install @angius/htmldiff
```

```bash [bun]
bun add @angius/htmldiff
```

```bash [pnpm]
pnpm add @angius/htmldiff
```

```bash [yarn]
yarn add @angius/htmldiff
```

:::

## Usage

The package is ESM only and exports both a one-shot `diff` helper and the `HtmlDiff`
class.

```javascript
import { diff, HtmlDiff } from "@angius/htmldiff";

const oldHtml = "<p>Some <em>old</em> html here</p>";
const newHtml = "<p>Some <b>new</b> html goes here</p>";

// One-shot helper.
const result = diff(oldHtml, newHtml);

// ...or use the class directly, which allows configuring options.
const instance = new HtmlDiff(oldHtml, newHtml);
const sameResult = instance.build();
```

Both examples return:

```html
<p>
	Some <ins class="mod"><del class="diffmod">old</del></ins
	><b
		><ins class="mod"><ins class="diffmod">new</ins></ins></b
	>
	html <ins class="diffins">goes </ins>here
</p>
```

### Rendering the result

The returned string contains `<ins>` and `<del>` markup, so insert it as HTML:

```javascript
document.getElementById("diffHtml").innerHTML = diff(oldHtml, newHtml);
```

| Element / class | Meaning                          |
| --------------- | -------------------------------- |
| `ins.diffins`   | New content                      |
| `del.diffdel`   | Removed content                  |
| `ins.diffmod`   | Changed content (new side)       |
| `del.diffmod`   | Changed content (old side)       |
| `ins.mod`       | New styling around a special tag |

## Options

The `HtmlDiff` constructor takes the old and new HTML strings. The following public
options can be set on the instance before calling `build()`:

- `repeatingWordsAccuracy` (default `1.0`) — controls how aggressively frequently
  repeating words are ignored during matching. Setting it to a large value (e.g.
  `Infinity`) disables the filtering entirely.
- `ignoreWhiteSpaceDifferences` (default `false`) — when `true`, whitespace-only
  differences are treated as equal during matching.
- `orphanMatchThreshold` (default `0.0`) — when greater than `0`, isolated blocks that
  are shorter (measured in characters) than the surrounding gaps times this factor are
  dropped instead of rendered as unchanged.
- `addBlockExpression(exp)` — registers a regular expression that groups a text sequence
  as a single unit, so content matching the expression is compared as one block instead
  of word-by-word. Multiple expressions may be added; overlapping expressions throw an
  error.

```javascript
const htmlDiff = new HtmlDiff(oldHtml, newHtml);
htmlDiff.ignoreWhiteSpaceDifferences = true;
htmlDiff.orphanMatchThreshold = 0.25;
htmlDiff.addBlockExpression(/"[^"]*"/g);

const result = htmlDiff.build();
```

## Next steps

Head to the [interactive demo](/demo) to try HtmlDiff with your own snippets.
