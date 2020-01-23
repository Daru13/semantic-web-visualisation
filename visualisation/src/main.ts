import { DataFrame } from './data/DataFrame';
import { SankeyDiagram } from './sankey';
import { URLAnalysis } from './url/URLAnalysis';

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

console.info("Country codes of sameAs column:");
for (let url of df.column("sameAs")) {
    const analysis = new URLAnalysis(url);
    console.log([url, analysis.countryCode]);
}

new SankeyDiagram(df);
