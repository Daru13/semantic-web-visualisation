export class Series<T> {
    private readonly name: string;
    private readonly content: T[];

    constructor(content: T[], name: string = "<undefined>") {
        this.name = name;
        this.content = content;
    }

    values(): IterableIterator<T> {
        return this.content.values();
    }

    get(index: number): T {
        return this.content[index];
    }
}