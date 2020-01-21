import { DataFrame } from './data/DataFrame';

const df = DataFrame.fromHTMLTable(document.getElementById("sparql-response"));
console.log(df);

console.info("Column names:");
for (let name of df.columnNames()) {
    console.log(name);
}

console.info("Values:");
for (let row of df.rows()) {
    console.log(row);
}