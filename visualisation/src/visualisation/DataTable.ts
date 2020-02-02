import { DataFrame } from "../data/DataFrame";
import { URLWidget } from "../url/URLWidget";
import { Dashboard } from "./Dashboard";


interface DataTablePage {
    pageNumber: number;
    node: HTMLElement;
}


export class DataTable {
    private content: DataFrame;

    node: HTMLElement;
    private headerNode: HTMLElement;
    private contentContainerNode: HTMLElement;
    private dashboardContainerNode: HTMLElement;

    private cachedPages: Map<number, DataTablePage>;
    private currentPage: number;
    private pageLength: number;
    private nbPages: number;

    private updateStyleCallback: () => void;

    constructor(content: DataFrame) {
        this.content = content;
        const contentLength = content.length();

        this.cachedPages = new Map();
        this.currentPage = 1;
        this.pageLength = 50;
        this.nbPages = contentLength % this.pageLength === 0
                     ? contentLength / this.pageLength
                     : Math.ceil(contentLength / this.pageLength);

        this.updateStyleCallback = () => this.updateStyle();
        
        this.init();
    }

    private init(): void {
        this.createNode();
        this.updateContent();

        this.startUpdatingStyleOnWindowResize();
    }

    private getPage(pageNumber: number): DataTablePage {
        if (this.cachedPages.has(pageNumber)) {
            return this.cachedPages.get(pageNumber);
        }
        else {
            const page = this.createPage(pageNumber);
            this.cachedPages.set(pageNumber, page);

            return page;
        }
    }

    private createPage(pageNumber: number): DataTablePage {
        const node = document.createElement("table");
        const firstRowIndex = this.pageLength * (pageNumber - 1);
            
        for (let rowCells of this.content.rows(firstRowIndex, this.pageLength)) {
            const rowNode = document.createElement("tr");
            rowNode.classList.add("row");
            node.appendChild(rowNode);

            for (let cell of rowCells) {
                const cellNode = document.createElement("td");

                try {
                    const widget = new URLWidget(encodeURI(cell));
                    cellNode.appendChild(widget.node);
                }
                catch (_) {
                    cellNode.textContent = cell;
                }

                rowNode.appendChild(cellNode);
            }
        }
        
        return {
            pageNumber: pageNumber,
            node: node
        };
    }

    private createNode(): void {
        this.node = document.createElement("div");
        this.node.classList.add("data-table");

        this.createHeader();
        this.createContentContainer();
        this.createDashboardContainer();
        this.createDashboards();
    }

    private createHeader(): void {
        this.headerNode = document.createElement("div");
        this.headerNode.classList.add("header");
        
        for (let columnName of this.content.columnNames()) {
            const columnNameNode = document.createElement("div");
            columnNameNode.textContent = columnName;

            this.headerNode.appendChild(columnNameNode);
        }

        this.node.appendChild(this.headerNode);
    }

    private createContentContainer(): void {
        this.contentContainerNode = document.createElement("div");
        this.contentContainerNode.classList.add("content");

        this.node.appendChild(this.contentContainerNode);
    }

    private createDashboardContainer(): void {
        this.dashboardContainerNode = document.createElement("div");
        this.dashboardContainerNode.classList.add("dashboard-container");

        this.node.appendChild(this.dashboardContainerNode);
    }

    private createDashboards(): void {
        for (let column of this.content.columns()) {
            const dashboard = new Dashboard(column);
            this.dashboardContainerNode.append(dashboard.node);
        }
    }

    private updateContent(): void {
        // Clear the current content
        this.contentContainerNode.children[0]?.remove();

        // Inject the current page
        const page = this.getPage(this.currentPage);
        this.contentContainerNode.append(page.node);
    }

    private updateColumnWidths() {
        const firstRowCellNodes = this.contentContainerNode.querySelector("tr").children;
        const widths = [];
        for (let cellNode of firstRowCellNodes) {
            widths.push(cellNode.getBoundingClientRect().width);
        }

        for (let i = 0; i < widths.length; i++) {
            const width = widths[i];
            (this.headerNode.childNodes[i] as HTMLElement).style.width = `${width}px`;
            (this.dashboardContainerNode.childNodes[i] as HTMLElement).style.width = `${width}px`;
        }
    }

    updateStyle() {
        this.updateColumnWidths();
    }

    startUpdatingStyleOnWindowResize() {
        window.addEventListener("resize", this.updateStyleCallback);
    }

    stopUpdatingStyleOnWindowResize() {
        window.removeEventListener("resize", this.updateStyleCallback);
    }

    static fromHTMLTable(contentContainerNode: HTMLElement): DataTable {
        const df = DataFrame.fromHTMLTable(contentContainerNode);
        return new DataTable(df);
    }
}