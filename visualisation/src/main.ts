import { DataFrame } from './data/DataFrame';
import { SankeyDiagram } from './sankey';
import { URLAnalysis } from './url/URLAnalysis';
import { URLWidget } from './url/URLWidget';
import { DataTable } from './visualisation/DataTable';

const df = DataFrame.fromHTMLTable(document.getElementById("sparql-response"));
/*console.log(df);

/*
console.info("Column names:");
for (let name of df.columnNames()) {
    console.log(name);
}

console.info("Values:");
for (let column of df.columns()) {
    for (let value of column.values()) {
        console.log(value);
    }
}

console.info("Country codes of sameAs column:");
for (let url of df.column("sameAs")) {
    const analysis = new URLAnalysis(url);

    console.log([url, analysis.countryCode]);
    console.log(analysis.path);
}
*/

//new SankeyDiagram(df.column("genre"));

/*
console.info("Replacing all URLs by widgets...");
const tableCellNodes = document.querySelectorAll("#sparql-response td");
for (let node of tableCellNodes) {
    try {
        // Replace the cell content by the widget's node
        const widget = new URLWidget(encodeURI(node.textContent));

        node.innerHTML = "";
        node.appendChild(widget.node);
    }
    catch (error) {
        console.log(error);
        // Ignore this cell (it doesn't contain any valid URL)
    }
}
*/

const table = new DataTable(df);

document.querySelector("#sparql-response").remove();
document.querySelector("body").append(table.node);

table.updateStyle();