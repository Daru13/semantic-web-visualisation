import { Series } from './Series';

export type Column = Series<any>;

export class DataFrame {
    private readonly content: Map<string, Column>;

    constructor(content: Map<string, Column>) {
        this.content = content;
    }

    columns(): IterableIterator<Column> {
        return this.content.values();
    }

    columnNames(): IterableIterator<string> {
        return this.content.keys();
    }

    * rows(): IterableIterator<any> {
        const columnContentIterators: IterableIterator<any>[] = [];
        for (let column of this.content.values()) {
            columnContentIterators.push(column.values());
        }

        let someIteratorCanContinue = true;
        while (someIteratorCanContinue) {
            someIteratorCanContinue = false;

            const values = [];
            for (let iterator of columnContentIterators) {
                const iteration = iterator.next();
                if (iteration.done) {
                    values.push(null); 
                }
                else {
                    values.push(iteration.value);
                    someIteratorCanContinue = true;
                }
            }
            
            yield values;
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