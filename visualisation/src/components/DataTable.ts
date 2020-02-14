import { DataFrame } from "../dataStructures/DataFrame";
import { SimplifiedURL } from "./SimplifiedURL";
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
    private pageBrowserNode: HTMLElement;
    private dashboardContainerNode: HTMLElement;

    private cachedPages: Map<number, DataTablePage>;
    private currentPage: DataTablePage;
    private currentPageNumber: number;
    private pageLength: number;
    private nbPages: number;

    private updateDimensionsCallback: () => void;
    private changePageCallback: (event: KeyboardEvent) => void;

    constructor(content: DataFrame) {
        this.content = content;
        const contentLength = content.length();

        this.cachedPages = new Map();
        this.currentPage = null;
        this.currentPageNumber = 1;
        this.pageLength = 50;
        this.nbPages = contentLength % this.pageLength === 0
                     ? contentLength / this.pageLength
                     : Math.ceil(contentLength / this.pageLength);
        
        this.init();
    }

    private init(): void {
        this.createNode();
        this.goToPage(this.currentPageNumber);

        this.initCallbacks();
        this.startUpdatingDimensionsOnWindowResize();
        this.startChangingPageOnKeyDown();
    }

    private initCallbacks() {
        // Style update
        this.updateDimensionsCallback = () => this.updateDimensions();

        // Page change
        this.changePageCallback = (event) => {
            const newPageNumber = event.code === "ArrowLeft" ? Math.max(1, this.currentPageNumber - 1)
                                : event.code === "ArrowRight" ? Math.min(this.nbPages, this.currentPageNumber + 1)
                                : this.currentPageNumber;
            
            if (newPageNumber !== this.currentPageNumber) {
                this.goToPage(newPageNumber);
            }
        }
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
        node.classList.add("page");

        const firstRowIndex = this.pageLength * (pageNumber - 1);
        const rows = this.content.rows(firstRowIndex, this.pageLength);
        let currentRowNumber = firstRowIndex + 1;

        for (let row of rows) {
            const rowNode = document.createElement("tr");
            node.appendChild(rowNode);

            // Row number
            const rowNumberNode = document.createElement("td");
            rowNumberNode.classList.add("row-number-cell");
            rowNumberNode.textContent = currentRowNumber.toString();
            rowNode.appendChild(rowNumberNode);

            currentRowNumber++;

            // Content
            for (let cell of row) {
                const cellNode = document.createElement("td");
                cellNode.classList.add("data-cell");

                try {
                    const simplifiedURL = new SimplifiedURL(encodeURI(cell));

                    const urlLinkNode = document.createElement("a");
                    urlLinkNode.setAttribute("href", cell);
                    urlLinkNode.setAttribute("target", "_blank");
                    urlLinkNode.append(simplifiedURL.node);

                    cellNode.append(urlLinkNode);
                    cellNode.classList.add("url");
                }
                catch (_) {
                    cellNode.textContent = cell;
                    cellNode.classList.add("text");
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
        this.createDashboardContainer();
        this.createDashboards();
        this.createContentContainer();
        this.createPageBrowser();
    }

    private createHeader(): void {
        this.headerNode = document.createElement("div");
        this.headerNode.classList.add("header");
        
        // Row number
        const rowNumberNode = document.createElement("div");
        rowNumberNode.textContent = "";
        this.headerNode.appendChild(rowNumberNode);

        // Content
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

    private createPageBrowser(): void {
        this.pageBrowserNode = document.createElement("div");
        this.pageBrowserNode.classList.add("page-browser");

        const previousPageButton = document.createElement("button");
        previousPageButton.classList.add("previous-page-button");
        previousPageButton.type = "button";
        previousPageButton.textContent = "";
        previousPageButton.addEventListener("click", () => {
            this.goToPage(Math.max(1, this.currentPageNumber - 1));
        });
        this.pageBrowserNode.append(previousPageButton);

        const currentPageInput = document.createElement("input");
        currentPageInput.classList.add("current-page-input");
        currentPageInput.textContent = this.currentPageNumber.toString();
        currentPageInput.addEventListener("change", () => {
            let newPageNumber = parseInt(currentPageInput.value, 10);

            if (!isNaN(newPageNumber)) {
                newPageNumber = Math.max(1, Math.min(this.nbPages, newPageNumber));
                this.goToPage(newPageNumber);
            }
        });
        this.pageBrowserNode.append(currentPageInput);

        const totalPageNumber = document.createElement("span");
        totalPageNumber.classList.add("total-page-number");
        totalPageNumber.textContent = this.nbPages.toString();
        this.pageBrowserNode.append(totalPageNumber);

        const nextPageButton = document.createElement("button");
        nextPageButton.classList.add("next-page-button");
        nextPageButton.type = "button";
        nextPageButton.textContent = "";
        nextPageButton.addEventListener("click", () => {
            this.goToPage(Math.min(this.nbPages, this.currentPageNumber + 1));
        });
        this.pageBrowserNode.append(nextPageButton);

        this.contentContainerNode.appendChild(this.pageBrowserNode);
    }

    private createDashboardContainer(): void {
        this.dashboardContainerNode = document.createElement("div");
        this.dashboardContainerNode.classList.add("dashboard-container");

        // Dashboard area controls
        // This block should be aligned with the row numbers
        const controlsAreaNode = document.createElement("div");
        controlsAreaNode.classList.add("controls");
        this.dashboardContainerNode.append(controlsAreaNode);

        this.node.appendChild(this.dashboardContainerNode);
    }

    private createDashboards(): void {
        for (let column of this.content.columns()) {
            const dashboard = new Dashboard(column);
            this.dashboardContainerNode.append(dashboard.node);
        }
    }

    private goToPage(pageNumber: number): void {
        this.currentPage = this.getPage(pageNumber);
        this.currentPageNumber = pageNumber;

        this.updateContent();
    }

    private updateContent(): void {
        // Remove the previous page
        this.contentContainerNode
            .querySelector(".page")
            ?.remove();

        // Inject the new page
        this.contentContainerNode.prepend(this.currentPage.node);

        // Update the page browser
        this.updatePageBrowser();
    }

    private updatePageBrowser() {
        const previousPageButton = this.pageBrowserNode.querySelector(".previous-page-button") as HTMLButtonElement;
        previousPageButton.disabled = this.currentPageNumber === 1;

        const currentPageInput = this.pageBrowserNode.querySelector(".current-page-input") as HTMLInputElement;
        currentPageInput.value = this.currentPageNumber.toString();

        const totalPageNumber = this.pageBrowserNode.querySelector(".total-page-number") as HTMLElement;
        totalPageNumber.textContent = this.nbPages.toString();

        const nextPageButton = this.pageBrowserNode.querySelector(".next-page-button") as HTMLButtonElement;
        nextPageButton.disabled = this.currentPageNumber === this.nbPages;
    }

    updateDimensions() {
        const documentStyle = getComputedStyle(document.documentElement);
        const minColumnWidth = parseInt(documentStyle.getPropertyValue("--min-column-width-px"), 10);
        const minRowNumberColumnWidth = parseInt(documentStyle.getPropertyValue("--min-row-number-column-width-px"), 10);
        const nbColumns = [...this.content.columns()].length;

        let style = "";

        // Update the widths of the columns
        const rowNumberColumnWidth = Math.max(
            minRowNumberColumnWidth,
            Math.floor(document.documentElement.clientWidth * 0.02)
        );
        const columnWidth = Math.max(
            minColumnWidth,
            Math.round((document.documentElement.clientWidth - rowNumberColumnWidth) / nbColumns)
        );
        
        style += `--column-width: ${columnWidth}px;\
                  --row-number-column-width: ${rowNumberColumnWidth}px;`;

        // Update the minimum width of the top container
        style += `min-width: ${(nbColumns * minColumnWidth) + minRowNumberColumnWidth}px;`;
        
        // Update the actual style attribute
        this.node.setAttribute("style", style);
    }

    startUpdatingDimensionsOnWindowResize() {
        window.addEventListener("resize", this.updateDimensionsCallback);
    }

    stopUpdatingDimensionsOnWindowResize() {
        window.removeEventListener("resize", this.updateDimensionsCallback);
    }

    startChangingPageOnKeyDown() {
        window.addEventListener("keydown", this.changePageCallback);
    }

    stopChangingPageOnKeyDown() {
        window.removeEventListener("keydown", this.changePageCallback);
    }

    static fromHTMLTable(contentContainerNode: HTMLElement): DataTable {
        const df = DataFrame.fromHTMLTable(contentContainerNode);
        return new DataTable(df);
    }
}