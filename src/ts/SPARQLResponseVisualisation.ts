import { DataFrame } from "./dataStructures/DataFrame";
import { DataTable } from "./components/DataTable";
import { URLAnalysis } from './analyses/URLAnalysis';
import { ColumnAnalysis } from './analyses/ColumnAnalysis';


export enum ResponseDataCellType {
    Text,
    URL
}


export interface ResponseDataCell<T = ResponseDataCellType> {
    type: T;
}


export interface TextResponseDataCell extends ResponseDataCell<ResponseDataCellType.Text> {
    type: ResponseDataCellType.Text;
    text: string;
}


export interface URLResponseDataCell extends ResponseDataCell<ResponseDataCellType.URL> {
    type: ResponseDataCellType.URL;
    analysis: URLAnalysis;
}


export type ResponseData = DataFrame<ResponseDataCell>;


export class SPARQLResponseVisualisation {
    private responseData: ResponseData;
    private columnAnalyses: Map<string, ColumnAnalysis>;

    constructor() {
        this.responseData = null;
        this.columnAnalyses = new Map();

        this.init();
    }

    private init(): void {
        this.loadResponseData();
        this.analyseColumns();
        this.display();
    }

    private loadResponseData(): void {
        const responseTableNode = document.getElementById("sparql-response");
        this.responseData = (DataFrame.fromHTMLTable(responseTableNode) as DataFrame<string>)
            .map(cell => {
                try {
                    const analysis = new URLAnalysis(encodeURI(cell));

                    return {
                        type: ResponseDataCellType.URL,
                        analysis: analysis
                    };
                }
                catch (_) {
                    return {
                        type: ResponseDataCellType.Text,
                        analysis: cell
                    };
                }
            });
    }

    private analyseColumns(): void {
        for (let column of this.responseData.columns()) {
            const analysis = new ColumnAnalysis(column);
            this.columnAnalyses.set(column.name, analysis);
        }
    }

    private display(): void {
        const dataTable = new DataTable(this.responseData, this.columnAnalyses);

        document.querySelector("#sparql-response").remove();
        document.querySelector("body").append(dataTable.node);

        dataTable.updateDimensions();
    }
}