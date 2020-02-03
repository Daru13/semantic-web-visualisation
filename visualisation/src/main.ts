import { DataFrame } from './data/DataFrame';
import { SankeyDiagram } from './Visualizations/Sankey';
import { URLWidget } from './url/URLWidget';

const df = DataFrame.fromHTMLTable(document.getElementById("sparql-response"));

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

function sankey(column: string) {
    new SankeyDiagram(df.column(column));
}

(window as any)["sankey"] = sankey; 