import { describe, test, expect } from "bun:test";
import { HtmlDiff } from "../src/Diff";

// Tests ported from https://github.com/Rohland/htmldiff.net/blob/master/Test.HtmlDiff/HtmlDiffSpecTests.cs

const delta = (oldText: string, newText: string) => new HtmlDiff(oldText, newText).build();

describe("HtmlDiff spec", () => {
	test.each([
		[
			"a word is here",
			"a nother word is there",
			'a<ins class="diffins">&nbsp;nother</ins> word is <del class="diffmod">here</del><ins class="diffmod">there</ins>',
		],
		["a c", "a b c", 'a <ins class="diffins">b </ins>c'],
		["a b c", "a c", 'a <del class="diffdel">b </del>c'],
		["a b c", "a <strong>b</strong> c", 'a <strong><ins class="mod">b</ins></strong> c'],
		["a b c", "a d c", 'a <del class="diffmod">b</del><ins class="diffmod">d</ins> c'],
		["<a title='xx'>test</a>", "<a title='yy'>test</a>", "<a title='yy'>test</a>"],
		["<img src='logo.jpg'/>", "", "<del class=\"diffdel\"><img src='logo.jpg'/></del>"],
		["", "<img src='logo.jpg'/>", "<ins class=\"diffins\"><img src='logo.jpg'/></ins>"],
		[
			"symbols 'should not' belong <b>to</b> words",
			'symbols should not belong <b>"to"</b> words',
			'symbols <del class="diffdel">\'</del>should not<del class="diffdel">\'</del> belong <b><ins class="diffins">"</ins>to<ins class="diffins">"</ins></b> words',
		],
		[
			"entities are separate amp;words",
			"entities are&nbsp;separate &amp;words",
			'entities are<del class="diffmod">&nbsp;</del><ins class="diffmod">&nbsp;</ins>separate <del class="diffmod">amp;</del><ins class="diffmod">&amp;</ins>words',
		],
		[
			"This is a longer piece of text to ensure the new blocksize algorithm works",
			"This is a longer piece of text to <strong>ensure</strong> the new blocksize algorithm works decently",
			'This is a longer piece of text to <strong><ins class="mod">ensure</ins></strong> the new blocksize algorithm works<ins class="diffins">&nbsp;decently</ins>',
		],
		[
			"By virtue of an agreement between xxx and the <b>yyy schools</b>, ...",
			"By virtue of an agreement between xxx and the <b>yyy</b> schools, ...",
			"By virtue of an agreement between xxx and the <b>yyy</b> schools, ...",
		],
		[
			"Some plain text",
			"Some <strong><i>plain</i></strong> text",
			'Some <strong><i><ins class="mod">plain</ins></i></strong> text',
		],
		[
			"Some <strong><i>formatted</i></strong> text",
			"Some formatted text",
			'Some <ins class="mod">formatted</ins> text',
		],
		[
			"Sigríður og Guðmundur",
			"Ákvæði á ekki viðmundsson um",
			'<del class="diffmod">Sigríður</del><ins class="diffmod">Ákvæði</ins> <del class="diffmod">og</del><ins class="diffmod">á</ins> <del class="diffmod">Guðmundur</del><ins class="diffmod">ekki viðmundsson um</ins>',
		],
		[
			"Some numbers 12,321 and another 32.123 foo.",
			"Some numbers 21.123 and another 321 foo,",
			'Some numbers <del class="diffmod">12,321</del><ins class="diffmod">21.123</ins> and another <del class="diffmod">32.123</del><ins class="diffmod">321</ins> foo<del class="diffmod">.</del><ins class="diffmod">,</ins>',
		],
		[
			"The Dealer.",
			"The Dealer info,",
			'The Dealer<del class="diffmod">.</del><ins class="diffmod">&nbsp;info,</ins>',
		],
		["Normalization Jörg Århus".normalize("NFD"), "Normalization Jörg Århus", "Normalization Jörg Århus"],
	])("old text '%s', new text '%s' gives delta '%s'", (oldText, newText, delta_expected) => {
		expect(delta(oldText, newText)).toBe(delta_expected);
	});
});
