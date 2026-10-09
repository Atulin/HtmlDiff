export default class MatchOptions {
	public blockSize: number;
	public repeatingWordsAccuracy: number;
	public ignoreWhitespaceDifferences: boolean;

	constructor() {
		this.blockSize = 0;
		this.repeatingWordsAccuracy = 0.0;
		this.ignoreWhitespaceDifferences = false;
	}
}
