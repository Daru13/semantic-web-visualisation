import { DataFrame } from './data/DataFrame';
import { SankeyDiagram } from './sankey';

const df = DataFrame.fromHTMLTable(document.getElementById("sparql-response"));
/*console.log(df);

console.info("Column names:");
for (let name of df.columnNames()) {
    console.log(name);
}

console.info("Values:");
for (let column of df.columns()) {
    for (let value of column.values()) {
        console.log(value);
    }
}*/

new SankeyDiagram(df);