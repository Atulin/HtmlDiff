import { describe, test, expect } from "bun:test";
import MatchFinder from "../src/MatchFinder";
import MatchOptions from "../src/MatchOptions";

function options(blockSize = 1, accuracy = 1.0, ignoreWhitespace = false): MatchOptions {
	const opts = new MatchOptions();
	opts.blockSize = blockSize;
	opts.repeatingWordsAccuracy = accuracy;
	opts.ignoreWhitespaceDifferences = ignoreWhitespace;
	return opts;
}

describe("MatchFinder", () => {
	test("findMatch locates a common sequence", () => {
		const finder = new MatchFinder(["a", "b", "c"], ["x", "a", "b", "y"], 0, 3, 0, 4, options());
		const match = finder.findMatch();
		expect(match).not.toBeNull();
		expect(match!.startInOld).toBe(0);
		expect(match!.startInNew).toBe(1);
		expect(match!.size).toBe(2);
	});

	test("findMatch returns null when there is nothing in common", () => {
		const finder = new MatchFinder(["a"], ["b"], 0, 1, 0, 1, options());
		expect(finder.findMatch()).toBeNull();
	});

	test("findMatch works with block sizes larger than 1", () => {
		const finder = new MatchFinder(["a", "b", "c", "d"], ["p", "a", "b", "c", "q"], 0, 4, 0, 5, options(2));
		const match = finder.findMatch();
		expect(match).not.toBeNull();
		expect(match!.startInOld).toBe(0);
		expect(match!.startInNew).toBe(1);
		expect(match!.size).toBe(3);
	});

	test("normalizeForIndex strips tag attributes", () => {
		const finder = new MatchFinder([], [], 0, 0, 0, 0, options());
		expect(finder.normalizeForIndex('<a href="x">')).toBe("<a>");
		expect(finder.normalizeForIndex("word")).toBe("word");
	});

	test("matching is attribute-agnostic", () => {
		const finder = new MatchFinder(['<a href="x">', "b"], ['<a href="y">', "b"], 0, 2, 0, 2, options());
		const match = finder.findMatch();
		expect(match).not.toBeNull();
		expect(match!.size).toBe(2);
	});

	test("normalizeForIndex collapses whitespace when ignoring whitespace differences", () => {
		const on = new MatchFinder([], [], 0, 0, 0, 0, options(1, 1.0, true));
		expect(on.normalizeForIndex("&nbsp;")).toBe(" ");
		const off = new MatchFinder([], [], 0, 0, 0, 0, options(1, 1.0, false));
		expect(off.normalizeForIndex("&nbsp;")).toBe("&nbsp;");
	});

	test("findMatch ignores whitespace differences when configured", () => {
		const finder = new MatchFinder(["a", " ", "b"], ["a", "&nbsp;", "b"], 0, 3, 0, 3, options(1, 1.0, true));
		const match = finder.findMatch();
		expect(match).not.toBeNull();
		expect(match!.size).toBe(3);
	});

	test("removeRepeatingWords drops overly frequent words", () => {
		const words = Array(10).fill("a");
		const drop = new MatchFinder(["a", "b"], words, 0, 2, 0, 10, options(1, -8));
		expect(drop.findMatch()).toBeNull();
	});

	test("repeating words under the threshold are kept", () => {
		const words = Array(10).fill("a");
		const keep = new MatchFinder(["a", "b"], words, 0, 2, 0, 10, options(1, 1.0));
		expect(keep.findMatch()).not.toBeNull();
	});

	test("indexNewWords builds an index of word blocks", () => {
		const finder = new MatchFinder(["a", "b", "c"], ["a", "b", "c", "d"], 0, 3, 0, 4, options());
		finder.indexNewWords();
		const index = finder["wordIndices"];
		expect(index.size).toBeGreaterThan(0);
		expect(index.has("a")).toBe(true);
		expect(index.has("b")).toBe(true);
		expect(index.has("c")).toBe(true);
		expect(index.get("c")).toEqual([2]);
	});
});
