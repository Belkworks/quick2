/**
 * @internal
 */
export class Chain<T> {
	constructor(protected readonly value: T) {}

	done() {
		return this.value;
	}

	thru<U extends defined>(thru: (value: T) => U) {
		return new Chain(thru(this.value));
	}

	/**
	 * Attempt to turn the value into a {@link NumberChain}.
	 */
	number() {
		assert(typeIs(this.value, "number"), "Expected number");
		return new NumberChain(this.value);
	}

	bool() {
		assert(typeIs(this.value, "boolean"), "Expected boolean");
		return new BoolChain(this.value);
	}

	typeOf() {
		return new Chain(typeOf(this.value));
	}

	typeIs(t: keyof CheckableTypes) {
		return new BoolChain(typeIs(this.value, t));
	}

	passes(predicate: (value: T) => boolean) {
		return new BoolChain(predicate(this.value));
	}

	isNil() {
		return new BoolChain(this.value === undefined);
	}
}

export function chain<T>(value: T) {
	return new Chain(value);
}

/**
 * @internal
 */
export class BoolChain extends Chain<boolean> {
	flip() {
		return new BoolChain(!this.value);
	}

	and(other: boolean) {
		return new BoolChain(this.value && other);
	}

	or(other: boolean) {
		return new BoolChain(this.value || other);
	}

	xor(other: boolean) {
		return new BoolChain(this.value !== other);
	}
}

export function bool(value: boolean) {
	return new BoolChain(value);
}

/**
 * @internal
 */
export class NumberChain extends Chain<number> {
	multiply(other: number) {
		return new NumberChain(this.value * other);
	}

	double() {
		return this.multiply(2);
	}

	add(other: number) {
		return new NumberChain(this.value + other);
	}

	sub(other: number) {
		return new NumberChain(this.value - other);
	}

	div(other: number) {
		return new NumberChain(this.value / other);
	}

	mul(other: number) {
		return new NumberChain(this.value * other);
	}

	mod(other: number) {
		return new NumberChain(this.value % other);
	}

	ceil() {
		return new NumberChain(math.ceil(this.value));
	}

	floor() {
		return new NumberChain(math.floor(this.value));
	}

	round() {
		return new NumberChain(math.round(this.value));
	}

	gt(other: number) {
		return new BoolChain(this.value > other);
	}

	lt(other: number) {
		return new BoolChain(this.value < other);
	}

	gte(other: number) {
		return new BoolChain(this.value >= other);
	}

	lte(other: number) {
		return new BoolChain(this.value <= other);
	}
}

export function number(value: number) {
	return new NumberChain(value);
}

export type Predicate<T> = (item: T, index: number, array: readonly T[]) => boolean;
export type Transformer<T, U> = (item: T, index: number, array: readonly T[]) => U;

/**
 * @internal
 */
export class ArrayChain<T extends defined> extends Chain<T[]> {
	/**
	 * Get the size of the array.
	 */
	size() {
		return new NumberChain(this.value.size());
	}

	filter(predicate: Predicate<T>) {
		return new ArrayChain(this.value.filter(predicate));
	}

	reject(predicate: Predicate<T>) {
		return this.filter((item, index, array) => !predicate(item, index, array));
	}

	partition(predicate: Predicate<T>) {
		const pass: T[] = [];
		const fail: T[] = [];
		this.value.forEach((item, index, array) => {
			if (predicate(item, index, array)) pass.push(item);
			else fail.push(item);
		});
		return new ArrayChain([pass, fail] as [T[], T[]]);
	}

	map<U extends defined>(thru: Transformer<T, U>) {
		return new ArrayChain<U>(this.value.map(thru));
	}

	without(...items: T[]) {
		const set = new Set(items);
		return this.filter((item) => !set.has(item));
	}

	/**
	 * Get the item at the given index.
	 */
	at(index: number) {
		return new Chain(this.value[index - 1]);
	}

	/**
	 * Get the item at the given index (zero indexed)
	 */
	at0(index: number) {
		return new Chain(this.value[index]);
	}

	/**
	 * Get the first item in the array.
	 */
	head() {
		return this.at(0);
	}

	/**
	 * Get the last item in the array.
	 */
	last() {
		return this.at(this.value.size() - 1);
	}

	slice(start = 0, stop = this.value.size()) {
		const slice = [];
		for (const item of this.value) {
			if (start >= stop) break;
			start++;
			slice.push(item);
		}
		return new ArrayChain(slice);
	}

	tail() {
		return this.slice(1);
	}

	initial() {
		return this.slice(0, this.value.size() - 1);
	}

	take(count: number) {
		return this.slice(0, count);
	}

	reverse() {
		const reversed = [];
		for (const item of this.value) reversed.unshift(item);
		return new ArrayChain(reversed);
	}

	/**
	 * Get the index of the given item.
	 */
	indexOf(item: T) {
		const idx = this.value.indexOf(item) + 1;
		return new Chain(idx === 0 ? undefined : idx);
	}

	find(predicate: Predicate<T>) {
		return new Chain(this.value.find(predicate));
	}

	/**
	 * Check if the array includes the given item.
	 */
	includes(item: T) {
		return new BoolChain(this.value.includes(item));
	}

	/**
	 * Check if every item in the array passes the given predicate.
	 */
	every(predicate: Predicate<T>) {
		return new BoolChain(this.value.every(predicate));
	}

	/**
	 * Check if any item in the array passes the given predicate.
	 */
	some(predicate: Predicate<T>) {
		return new BoolChain(this.value.some(predicate));
	}

	/**
	 * Check if none of the items in the array pass the given predicate.
	 */
	none(predicate: Predicate<T>) {
		return this.every((item, index, array) => !predicate(item, index, array));
	}

	numbers() {
		return new NumberArrayChain(
			this.value.map((n) => {
				const num = tonumber(n);
				assert(typeIs(num, "number"), `Expected ${n} to be a number`);
				return num;
			}),
		);
	}

	// TODO: reduce
	// TODO: maxBy
	// TODO: minBy
}

/**
 * @internal
 */
export class NumberArrayChain extends ArrayChain<number> {
	/**
	 * Get the sum of the array.
	 */
	sum() {
		return new NumberChain(this.value.reduce((a, b) => a + b, 0));
	}

	/**
	 * Get the smallest number in the array.
	 */
	min() {
		return new NumberChain(this.value.reduce((a, b) => math.min(a, b)));
	}

	/**
	 * Get the largest number in the array.
	 */
	max() {
		return new NumberChain(this.value.reduce((a, b) => math.max(a, b)));
	}

	/**
	 * Get the average of the array.
	 */
	mean() {
		return this.sum().div(this.value.size());
	}
}

export function array<T extends defined>(value: T[]) {
	return new ArrayChain(value);
}

/**
 * Get children of an instance.
 */
export function children(parent: Instance) {
	return array(parent.GetChildren());
}

const Players = game.GetService("Players");

/**
 * Get all players in the game.
 */
export function players() {
	return array(Players.GetPlayers());
}

/**
 * Get all players in the game except the local player.
 */
export function others() {
	return players().without(Players.LocalPlayer);
}
