export type Cell<T = any> = any;


export class Series<T = any> {
    private readonly name: string;
    private readonly content: Cell<T>[];

    constructor(content: Cell<T>[], name: string = "<undefined>") {
        this.name = name;
        this.content = content;
    }

    [Symbol.iterator]() {
        return this.values();
    }

    values(): IterableIterator<Cell<T>> {
        return this.content.values();
    }

    get(index: number): Cell<T> {
        return this.content[index];
    }

    length(): number {
        return this.content.length;
    }
}