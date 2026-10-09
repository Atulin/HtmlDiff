import { Action } from "./Action";
import { Match } from "./Match";
import MatchFinder from "./MatchFinder";
import MatchOptions from "./MatchOptions";
import Operation from "./Operation";
import { isTag, wrapText } from "./Utils";
import { convertHtmlToListOfWords } from "./WordSplitter";

// This value defines balance between speed and memory utilization. The higher it is the faster it works and more memory consumes.
const MatchGranuarityMaximum = 4;

const specialCaseClosingTags = new Map([
	["</strong>", 0],
	["</em>", 0],
	["</b>", 0],
	["</i>", 0],
	["</big>", 0],
	["</small>", 0],
	["</u>", 0],
	["</sub>", 0],
	["</strike>", 0],
	["</s>", 0],
	["</dfn>", 0],
]);

const specialCaseOpeningTagRegex = /<((strong)|(b)|(i)|(dfn)|(em)|(big)|(small)|(u)|(sub)|(sup)|(strike)|(s))[>\s]+/gi;

let sumLength = (t: number, n: string) => t + n.length;

export class HtmlDiff {
	private content: any[];
	private newText: string | null;
	private oldText: string | null;
	private specialTagDiffStack: any[];
	private newWords: string[];
	private oldWords: string[];
	private matchGranularity: number;
	private readonly blockExpressions: RegExp[];
	public repeatingWordsAccuracy: number;
	public ignoreWhiteSpaceDifferences: boolean;
	public orphanMatchThreshold: number;

	constructor(oldText: string, newText: string) {
		this.content = [];
		this.newText = newText.normalize("NFC");
		this.oldText = oldText.normalize("NFC");

		this.specialTagDiffStack = [];
		this.newWords = [];
		this.oldWords = [];
		this.matchGranularity = 0;
		this.blockExpressions = [];

		this.repeatingWordsAccuracy = 1.0;
		this.ignoreWhiteSpaceDifferences = false;
		this.orphanMatchThreshold = 0.0;
	}

	public build(): string | null {
		if (this.oldText === this.newText) {
			return this.newText;
		}

		this.splitInputsIntoWords();

		this.matchGranularity = Math.min(MatchGranuarityMaximum, this.oldWords.length, this.newWords.length);
		let operations = this.operations();

		for (let item of operations) {
			this.performOperation(item);
		}

		return this.content.join("");
	}

	public addBlockExpression(exp: RegExp): void {
		this.blockExpressions.push(exp);
	}

	private splitInputsIntoWords(): void {
		this.oldWords = convertHtmlToListOfWords(this.oldText, this.blockExpressions);

		//free memory, allow it for GC
		this.oldText = null;

		this.newWords = convertHtmlToListOfWords(this.newText, this.blockExpressions);

		//free memory, allow it for GC
		this.newText = null;
	}

	private performOperation(opp: Operation): void {
		switch (opp.action) {
			case Action.equal:
				this.processEqualOperation(opp);
				break;
			case Action.delete:
				this.processDeleteOperation(opp, "diffdel");
				break;
			case Action.insert:
				this.processInsertOperation(opp, "diffins");
				break;
			case Action.none:
				break;
			case Action.replace:
				this.processReplaceOperation(opp);
				break;
		}
	}

	private processReplaceOperation(opp: Operation): void {
		this.processDeleteOperation(opp, "diffmod");
		this.processInsertOperation(opp, "diffmod");
	}

	private processInsertOperation(opp: Operation, cssClass: string): void {
		let text = this.newWords.filter((_, pos) => pos >= opp.startInNew && pos < opp.endInNew);
		this.insertTag("ins", cssClass, text);
	}

	private processDeleteOperation(opp: Operation, cssClass: string): void {
		let text = this.oldWords.filter((_, pos) => pos >= opp.startInOld && pos < opp.endInOld);
		this.insertTag("del", cssClass, text);
	}

	private processEqualOperation(opp: Operation): void {
		let result = this.newWords.filter((_, pos) => pos >= opp.startInNew && pos < opp.endInNew);
		this.content.push(result.join(""));
	}

	private insertTag(tag: string, cssClass: string, words: string[]): void {
		while (words.length) {
			let nonTags = this.extractConsecutiveWords(words, (x) => !isTag(x));

			let specialCaseTagInjection = "";
			let specialCaseTagInjectionIsbefore = false;

			if (nonTags.length !== 0) {
				let text = wrapText(nonTags.join(""), tag, cssClass);
				this.content.push(text);
			} else {
				if (specialCaseOpeningTagRegex.test(words[0])) {
					const matchedTag = words[0].match(specialCaseOpeningTagRegex);

					if (!matchedTag) {
						continue;
					}

					const matched = "<" + matchedTag[0].replace(/(<|>| )/g, "") + ">";
					this.specialTagDiffStack.push(matched);
					specialCaseTagInjection = '<ins class="mod">';
					if (tag === "del") {
						words.shift();

						while (words.length > 0 && specialCaseOpeningTagRegex.test(words[0])) {
							words.shift();
						}
					}
				} else if (specialCaseClosingTags.has(words[0])) {
					let openingTag = this.specialTagDiffStack.length === 0 ? null : this.specialTagDiffStack.pop();

					// If we didn't have an opening tag, and we don't have a match with the previous tag used
					if (openingTag === null || openingTag !== words[words.length - 1].replace(/\//g, "")) {
						//do nothing
					} else {
						specialCaseTagInjection = "</ins>";
						specialCaseTagInjectionIsbefore = true;
					}

					if (tag === "del") {
						words.shift();

						while (words.length > 0 && specialCaseClosingTags.has(words[0])) {
							words.shift();
						}
					}
				}

				if (words.length === 0 && specialCaseTagInjection.length === 0) {
					break;
				}

				if (specialCaseTagInjectionIsbefore) {
					this.content.push(specialCaseTagInjection + this.extractConsecutiveWords(words, isTag).join(""));
				} else {
					this.content.push(this.extractConsecutiveWords(words, isTag).join("") + specialCaseTagInjection);
				}
			}
		}
	}

	private extractConsecutiveWords(words: string[], condition: (word: string) => boolean): string[] {
		let indexOfFirstTag = null;

		for (let i = 0; i < words.length; i++) {
			let word = words[i];

			if (i === 0 && word === " ") {
				words[i] = "&nbsp;";
			}

			if (!condition(word)) {
				indexOfFirstTag = i;
				break;
			}
		}

		if (indexOfFirstTag !== null) {
			let items = words.filter((s, pos) => pos >= 0 && pos < indexOfFirstTag);
			if (indexOfFirstTag > 0) {
				words.splice(0, indexOfFirstTag);
			}

			return items;
		}

		let items = words.filter((s, pos) => pos >= 0 && pos < words.length);
		words.splice(0, words.length);
		return items;
	}

	private operations(): Operation[] {
		let positionInOld = 0;
		let positionInNew = 0;
		let operations: Operation[] = [];

		let matches = this.matchingBlocks();
		matches.push(new Match(this.oldWords.length, this.newWords.length, 0));

		let matchesWithoutOrphans = this.removeOrphans(matches);

		for (let match of matchesWithoutOrphans) {
			if (match === null) {
				continue;
			}

			let matchStartsAtCurrentPositionInOld = positionInOld === match.startInOld;
			let matchStartsAtCurrentPositionInNew = positionInNew === match.startInNew;

			let action;

			if (!matchStartsAtCurrentPositionInOld && !matchStartsAtCurrentPositionInNew) {
				action = Action.replace;
			} else if (matchStartsAtCurrentPositionInOld && !matchStartsAtCurrentPositionInNew) {
				action = Action.insert;
			} else if (!matchStartsAtCurrentPositionInOld) {
				action = Action.delete;
			} else {
				action = Action.none;
			}

			if (action !== Action.none) {
				operations.push(
					new Operation(action, positionInOld, match.startInOld, positionInNew, match.startInNew),
				);
			}

			if (match.size !== 0) {
				operations.push(
					new Operation(Action.equal, match.startInOld, match.endInOld, match.startInNew, match.endInNew),
				);
			}

			positionInOld = match.endInOld;
			positionInNew = match.endInNew;
		}

		return operations;
	}

	private *removeOrphans(matches: Match[]): Generator<Match | null, void, unknown> {
		let prev = new Match(0, 0, 0);
		let curr: Match | null = null;

		for (let next of matches) {
			if (curr === null) {
				prev = new Match(0, 0, 0);
				curr = next;
				continue;
			}

			if (
				(prev.endInOld === curr.startInOld && prev.endInNew === curr.startInNew) ||
				(curr.endInOld === next.startInOld && curr.endInNew === next.startInNew)
			) {
				yield curr;
				prev = curr;
				curr = next;
				continue;
			}

			let oldDistanceInChars = this.oldWords.slice(prev.endInOld, next.startInOld).reduce(sumLength, 0);
			let newDistanceInChars = this.newWords.slice(prev.endInNew, next.startInNew).reduce(sumLength, 0);
			let currMatchLengthInChars = this.newWords.slice(curr.startInNew, curr.endInNew).reduce(sumLength, 0);
			if (currMatchLengthInChars > Math.max(oldDistanceInChars, newDistanceInChars) * this.orphanMatchThreshold) {
				yield curr;
			}

			prev = curr;
			curr = next;
		}

		yield curr;
	}

	private matchingBlocks(): Match[] {
		let matchingBlocks: Match[] = [];
		this.findMatchingBlocks(0, this.oldWords.length, 0, this.newWords.length, matchingBlocks);
		return matchingBlocks;
	}

	private findMatchingBlocks(
		startInOld: number,
		endInOld: number,
		startInNew: number,
		endInNew: number,
		matchingBlocks: Match[],
	): void {
		let match = this.findMatch(startInOld, endInOld, startInNew, endInNew);

		if (match !== null) {
			if (startInOld < match.startInOld && startInNew < match.startInNew) {
				this.findMatchingBlocks(startInOld, match.startInOld, startInNew, match.startInNew, matchingBlocks);
			}

			matchingBlocks.push(match);

			if (match.endInOld < endInOld && match.endInNew < endInNew) {
				this.findMatchingBlocks(match.endInOld, endInOld, match.endInNew, endInNew, matchingBlocks);
			}
		}
	}

	private findMatch(startInOld: number, endInOld: number, startInNew: number, endInNew: number): Match | null {
		for (let i = this.matchGranularity; i > 0; i--) {
			let options = new MatchOptions();
			options.blockSize = i;
			options.repeatingWordsAccuracy = this.repeatingWordsAccuracy;
			options.ignoreWhitespaceDifferences = this.ignoreWhiteSpaceDifferences;

			let finder = new MatchFinder(
				this.oldWords,
				this.newWords,
				startInOld,
				endInOld,
				startInNew,
				endInNew,
				options,
			);
			let match = finder.findMatch();
			if (match !== null) {
				return match;
			}
		}

		return null;
	}
}

export function diff(oldText: string, newText: string): string | null {
	return new HtmlDiff(oldText, newText).build();
}
