import { DataFrame } from "./dataStructures/DataFrame";
import { DataTable } from "./components/DataTable";
import { URLAnalysis } from './analyses/URLAnalysis';


export enum ResponseDataCellType {
    Url,
    RawText
}


export interface ResponseDataCell<T extends ResponseDataCellType = ResponseDataCellType.RawText> {
    type: T;
    content: T extends ResponseDataCellType.Url ? URLAnalysis : string; 
}


export type ResponseData = DataFrame<ResponseDataCell>;


export class SPARQLResponseVisualisation {
    private responseData: ResponseData;

    constructor() {
        this.responseData = null;

        this.init();
    }

    private init(): void {
        this.loadResponseData();
        this.display();
    }

    private loadResponseData(): void {
        const responseTableNode = document.getElementById("sparql-response");
        this.responseData = DataFrame.fromHTMLTable(responseTableNode);
    }

    private display(): void {
        const dataTable = new DataTable(this.responseData);

        document.querySelector("#sparql-response").remove();
        document.querySelector("body").append(dataTable.node);

        dataTable.updateDimensions();
    }
}