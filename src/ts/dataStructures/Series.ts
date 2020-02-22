export type Cell<T = any> = T;


export class Series<T = any> {
    readonly name: string;
    private readonly content: Cell<T>[];

    constructor(content: Cell<T>[], name: string = "<undefined>") {
        this.name = name;
        this.content = content;
    }

    [Symbol.iterator]() {
        return this.values();
    }

    values(start?: number, length?: number): IterableIterator<Cell<T>> {
        start = start ?? 0;
        length = length ?? this.content.length;

        return this.content.slice(start, start + length).values();
    }

    get(index: number): Cell<T> {
        return this.content[index];
    }

    map<U>(f: (value: T) => U, name: string = this.name): Series<U> {
        return new Series(this.content.map(f), name);
    }

    length(): number {
        return this.content.length;
    }
}