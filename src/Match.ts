export class Match {
	readonly startInOld: number;
	readonly startInNew: number;
	public size: number;

	constructor(startInOld: number, startInNew: number, size: number) {
		this.startInOld = startInOld;
		this.startInNew = startInNew;
		this.size = size;
	}

	get endInOld(): number {
		return this.startInOld + this.size;
	}

	get endInNew(): number {
		return this.startInNew + this.size;
	}
}
