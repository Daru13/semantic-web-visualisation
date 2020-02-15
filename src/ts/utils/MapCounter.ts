export class MapCounter<T = any> {
    counters: Map<T, number>;

    constructor(keys: T[] = []) {
        this.counters = new Map();
        this.init(keys);
    }

    private init(keys: T[]): void {
        for (let key of keys) {
            this.zero(key);
        }
    }

    zero(key: T): void {
        this.counters.set(key, 0);
    }

    count(key: T, increment: number = 1): void {
        if (! this.counters.has(key)) {
            this.zero(key);
        }

        const currentCount = this.counters.get(key);
        this.counters.set(key, currentCount + increment);
    }

    countOf(key: T): number {
        if (! this.counters.has(key)) {
            return 0;
        }

        return this.counters.get(key);
    }

    sortedEntries(): { key: T, count: number }[] {
        let temp: { key: T, count: number }[] = [];

        this.counters.forEach((v, k, _) => {
            let i = 0;
            while (i < temp.length && temp[i].count > v) {
                i += 1;
            }
            temp.splice(i, 0, { key: k, count: v });
        })

        return temp;
    }

    static fromEnum(enumeration: object): MapCounter {
        const enumKeys = Object.values(enumeration).filter(v => !isNaN(Number(v)));
        return new MapCounter(enumKeys);
    }
}