import { Series, Cell } from '../dataStructures/Series';
import { ColumnAnalysis, CellType } from '../analyses/ColumnAnalysis';

export class Dashboard {
    node: HTMLElement;

    private column: Series;
    private columnAnalysis: ColumnAnalysis;

    constructor(column: Series) {
        this.column = column;
        this.columnAnalysis = new ColumnAnalysis(column);

        this.init();
    }

    private init(): void {
        this.createNode();
    }

    private createNode(): void {
        this.node = document.createElement("div");
        this.node.classList.add("dashboard");

        this.createDataTypeVisualisation();
        this.createTopCountriesVisualisation();
        this.createTopDomainsVisualisation();
    }

    private createDataTypeVisualisation(): void {
        const visualisationNode = document.createElement("div");
        visualisationNode.classList.add("distribution-chart");

        function addLabel(name: string, percent: number) {
            const labelNode = document.createElement("div");
            labelNode.classList.add("chart-label");
            visualisationNode.append(labelNode);

            const nameNode = document.createElement("span");
            nameNode.classList.add("type");
            nameNode.textContent = name;
            labelNode.appendChild(nameNode);

            const percentAsText = percent > 0.99 && percent < 1.0 ? ">99%"
                                : percent < 0.01 && percent > 0.0 ? "<1%"
                                : `${(percent * 100).toFixed(0)}%`;
            const percentNode = document.createElement("span");
            percentNode.classList.add("percent");
            percentNode.textContent = percentAsText;
            labelNode.appendChild(percentNode);
        }
        
        const segmentContainerNode = document.createElement("div");
        segmentContainerNode.classList.add("chart");

        function addSegment(className: string, percent: number) {
            const segmentNode = document.createElement("div");
            segmentNode.classList.add("chart-area", className);
            segmentNode.style.width = `${(percent * 100).toFixed(1)}%`;
            segmentContainerNode.append(segmentNode);
        }

        const counter = this.columnAnalysis.cellTypes;
        const urlCellsCount = counter.countOf(CellType.URL);
        const textCellsCount = counter.countOf(CellType.Text);
        const nbCountedCells = urlCellsCount + textCellsCount;

        const urlCellsPercent = urlCellsCount / nbCountedCells;
        const textCellsPercent = textCellsCount / nbCountedCells;

        addLabel("URL", urlCellsPercent);

        visualisationNode.append(segmentContainerNode);
        addSegment("url-cells-area", urlCellsPercent);
        addSegment("text-cells-area", textCellsPercent);

        addLabel("Text", textCellsPercent);

        this.node.append(visualisationNode);
    }

    private createTopCountriesVisualisation(): void {

    }

    private createTopDomainsVisualisation(): void {

    }
}