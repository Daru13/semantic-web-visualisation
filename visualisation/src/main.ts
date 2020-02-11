import { DataFrame } from './dataStructures/DataFrame';
import { DataTable } from './components/DataTable';
import { OrganizedWordCloud } from './components/OrganizedWordCloud';
import { SankeyDiagram } from './components/SankeyDiagram';

const df = DataFrame.fromHTMLTable(document.getElementById("sparql-response"));


// Data table initialisation
const table = new DataTable(df);

document.querySelector("#sparql-response").remove();
document.querySelector("body").append(table.node);

table.updateStyle();
new SankeyDiagram(df.column("genre"));