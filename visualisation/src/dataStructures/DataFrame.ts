import { Series, Cell } from './Series';


export type Column = Series;


export class DataFrame {
    private readonly content: Map<string, Column>;

    constructor(content: Map<string, Column>) {
        this.content = content;
    }

    length(): number {
        return Math.max(...[...this.columns()].map(c => c.length()));
    }

    column(name: string): Column {
        return this.content.get(name);
    }

    columns(): IterableIterator<Column> {
        return this.content.values();
    }

    columnNames(): IterableIterator<string> {
        return this.content.keys();
    }

    row(index: number): Cell[] {
        const values = [];

        for (let column of this.content.values()) {
            values.push(column.get(index));
        }

        return values;
    }

    * rows(start?: number, length?: number): IterableIterator<Cell[]> {
        const columnContentIterators: IterableIterator<Cell[]>[] = [];
        for (let column of this.content.values()) {
            columnContentIterators.push(column.values(start, length));
        }

        for (;;) {
            let oneIteratorIsDone = true;

            const values = [];
            for (let iterator of columnContentIterators) {
                const iteration = iterator.next();
                if (iteration.done) {
                    values.push(null); 
                }
                else {
                    values.push(iteration.value);
                    oneIteratorIsDone = false;
                }
            }

            if (oneIteratorIsDone) {
                return;
            }
            
            yield values;
        }
    }

    * values(): IterableIterator<Cell> {
        for (let column of this.columns()) {
            for (let value of column.values()) {
                yield value;
            }
        }
    }

    static fromHTMLTable(tableNode: HTMLElement) {
        const rows = tableNode.querySelectorAll("tr");
        if (rows.length === 0) {
            return new DataFrame(new Map());
        }

        const nbColumns = rows[0].children.length;
        const columnNames = [];
        for (let colIndex = 0; colIndex < nbColumns; colIndex++) {
            columnNames.push(rows[0].children[colIndex].textContent);
        }

        const content = new Map();
        for (let colIndex = 0; colIndex < nbColumns; colIndex++) {
            const columnContent = [];
            for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
                columnContent.push(rows[rowIndex].children[colIndex].textContent);
            }

            const name = columnNames[colIndex];
            content.set(name, new Series(columnContent, name));
        }
        
        return new DataFrame(content);
    }
}