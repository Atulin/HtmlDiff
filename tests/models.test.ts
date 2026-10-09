import { describe, test, expect } from "bun:test";
import { Action } from "../src/Action";
import { Match } from "../src/Match";
import MatchOptions from "../src/MatchOptions";
import { Mode } from "../src/Mode";
import Operation from "../src/Operation";

describe("Match", () => {
	test("stores start positions and size", () => {
		const match = new Match(2, 3, 5);
		expect(match.startInOld).toBe(2);
		expect(match.startInNew).toBe(3);
		expect(match.size).toBe(5);
	});

	test("computes the end of the match in each input", () => {
		const match = new Match(2, 3, 5);
		expect(match.endInOld).toBe(7);
		expect(match.endInNew).toBe(8);
	});

	test("size is mutable", () => {
		const match = new Match(0, 0, 1);
		match.size = 10;
		expect(match.endInOld).toBe(10);
	});

	test("an empty match has identical start and end positions", () => {
		const match = new Match(4, 4, 0);
		expect(match.endInOld).toBe(4);
		expect(match.endInNew).toBe(4);
	});
});

describe("Operation", () => {
	test("stores the action and the affected ranges", () => {
		const operation = new Operation(Action.replace, 1, 2, 3, 4);
		expect(operation.action).toBe(Action.replace);
		expect(operation.startInOld).toBe(1);
		expect(operation.endInOld).toBe(2);
		expect(operation.startInNew).toBe(3);
		expect(operation.endInNew).toBe(4);
	});
});

describe("MatchOptions", () => {
	test("defaults to zeroed/disabled options", () => {
		const options = new MatchOptions();
		expect(options.blockSize).toBe(0);
		expect(options.repeatingWordsAccuracy).toBe(0);
		expect(options.ignoreWhitespaceDifferences).toBe(false);
	});

	test("fields can be configured", () => {
		const options = new MatchOptions();
		options.blockSize = 4;
		options.repeatingWordsAccuracy = 0.5;
		options.ignoreWhitespaceDifferences = true;
		expect(options.blockSize).toBe(4);
		expect(options.repeatingWordsAccuracy).toBe(0.5);
		expect(options.ignoreWhitespaceDifferences).toBe(true);
	});
});

describe("Action", () => {
	test("defines the five action kinds", () => {
		expect(Action).toEqual({
			equal: 0,
			delete: 1,
			insert: 2,
			none: 3,
			replace: 4,
		});
	});
});

describe("Mode", () => {
	test("defines the four parsing modes", () => {
		expect(Mode).toEqual({
			character: 0,
			tag: 1,
			whitespace: 2,
			entity: 3,
		});
	});
});
