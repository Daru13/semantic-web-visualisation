import { Series } from '../dataStructures/Series';
import { ColumnAnalysis, CellType } from '../analyses/ColumnAnalysis';
import { COUNTRIES_TO_CODES } from '../utils/Countries';
import { SankeyDiagram } from './SankeyDiagram';
import { OrganizedWordCloud } from './OrganizedWordCloud';
import { Popup } from '../popups/Popup';

export class Dashboard {
    node: HTMLElement;

    private column: Series;
    private columnAnalysis: ColumnAnalysis;

    constructor(column: Series, analysis: ColumnAnalysis) {
        this.column = column;
        this.columnAnalysis = analysis;

        this.init();
    }

    private init(): void {
        this.createNode();
    }

    private createNode(): void {
        this.node = document.createElement("div");
        this.node.classList.add("dashboard");

        this.createColumnName();
        this.createDataTypeVisualisation();
        this.createTopCountriesVisualisation();
        this.createTopDomainsVisualisation();
        this.createWordCloudPreview();
        this.createOtherVisualisationsDisplayButtons();
    }

    private createColumnName() {
        const columnNameNode = document.createElement("h2");
        columnNameNode.classList.add("column-name");
        columnNameNode.textContent = this.column.name;

        this.node.append(columnNameNode);
    }

    private createDataTypeVisualisation(): void {
        const visualisationNode = document.createElement("div");
        visualisationNode.classList.add("distribution-chart");

        const listTitleNode = document.createElement("h4");
        listTitleNode.textContent = "Cell type distribution";
        visualisationNode.append(listTitleNode);

        const chartNode = document.createElement("div");
        chartNode.classList.add("chart-container");
        visualisationNode.append(chartNode);

        function addLabel(name: string, percent: number) {
            const labelNode = document.createElement("div");
            labelNode.classList.add("chart-label");
            chartNode.append(labelNode);

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

        chartNode.append(segmentContainerNode);
        addSegment("url-cells-area", urlCellsPercent);
        addSegment("text-cells-area", textCellsPercent);

        addLabel("Text", textCellsPercent);

        this.node.append(visualisationNode);
    }

    private createTopCountriesVisualisation(): void {
        const visualisationNode = document.createElement("div");
        visualisationNode.classList.add("top-list", "top-countries-list");

        const listTitleNode = document.createElement("h4");
        listTitleNode.textContent = "Top URL countries";
        visualisationNode.append(listTitleNode);

        function addCountry(country: string, percent: number, isAggregate: boolean = true) {
            const listEntryNode = document.createElement("div");
            listEntryNode.classList.add("list-entry");
            visualisationNode.append(listEntryNode);

            if (isAggregate) {
                listEntryNode.classList.add("aggregate");
            }
            
            if (country === null || country === undefined) {
                country = "Unknown";
            }
            
            // Label
            if (isAggregate) {
                const flagPlaceholderNode = document.createElement("span");
                flagPlaceholderNode.classList.add("flag-placeholder");
                listEntryNode.append(flagPlaceholderNode);
            }
            else {
                const flagNode = document.createElement("span");
                const countryCode = country === "Unknown" ? "unknown" : COUNTRIES_TO_CODES[country].toLowerCase();

                flagNode.classList.add("flag", `flag-${countryCode}`);
                listEntryNode.append(flagNode);
            }

            const countryNameNode = document.createElement("span");
            countryNameNode.classList.add("name");
            countryNameNode.textContent = country;
            listEntryNode.append(countryNameNode);

            const percentAsText = percent > 0.99 && percent < 1.0 ? ">99%"
                                : percent < 0.01 && percent > 0.0 ? "<1%"
                                : `${(percent * 100).toFixed(0)}%`;
            const percentNode = document.createElement("span");
            percentNode.classList.add("percent");
            percentNode.textContent = percentAsText;
            listEntryNode.append(percentNode);

            // Bar chart
            const barContainerNode = document.createElement("div");
            barContainerNode.classList.add("bar-container");
            listEntryNode.append(barContainerNode);

            const barNode = document.createElement("div");
            barNode.classList.add("bar");
            barNode.style.width = `${(percent * 100).toFixed(1)}%`;
            barContainerNode.append(barNode);
        }

        const maxTopCountries = 4;
        const counters = this.columnAnalysis.countries.counters;
        const totalCount = [...counters.values()]
            .reduce((sum, count) => sum + count, 0);
        const sortedCountriesWithPercents = [...counters.entries()]
            .map(([country, count]) => {
                return {
                    country: country,
                    percent: count / totalCount
                };
            })
            .sort((o1, o2) => o2.percent - o1.percent);

        const topCountriesWithPercents = sortedCountriesWithPercents
            .slice(0, maxTopCountries);
        const remainingCountriesPercent = 1 - topCountriesWithPercents
            .reduce((sum, obj) => sum + obj.percent, 0);
        
        for (let countryWithPercent of topCountriesWithPercents) {
            addCountry(countryWithPercent.country, countryWithPercent.percent, false);
        }

        if (remainingCountriesPercent > 0) {
            addCountry("Others", remainingCountriesPercent, true)
        }

        this.node.append(visualisationNode);
    }

    private createTopDomainsVisualisation(): void {
        const visualisationNode = document.createElement("div");
        visualisationNode.classList.add("top-list", "top-domains-list");

        const listTitleNode = document.createElement("h4");
        listTitleNode.textContent = "Top URL domains";
        visualisationNode.append(listTitleNode);

        function addDomain(domain: string, percent: number, isAggregate: boolean = true) {
            const listEntryNode = document.createElement("div");
            listEntryNode.classList.add("list-entry");
            visualisationNode.append(listEntryNode);

            if (isAggregate) {
                listEntryNode.classList.add("aggregate");
            }

            // Domain
            const domainNode = document.createElement("span");
            domainNode.classList.add("name");
            domainNode.textContent = domain;
            listEntryNode.append(domainNode);

            // Percent
            const percentAsText = percent > 0.99 && percent < 1.0 ? ">99%"
                                : percent < 0.01 && percent > 0.0 ? "<1%"
                                : `${(percent * 100).toFixed(0)}%`;
            const percentNode = document.createElement("span");
            percentNode.classList.add("percent");
            percentNode.textContent = percentAsText;
            listEntryNode.append(percentNode);

            // Bar chart
            const barContainerNode = document.createElement("div");
            barContainerNode.classList.add("bar-container");
            listEntryNode.append(barContainerNode);

            const barNode = document.createElement("div");
            barNode.classList.add("bar");
            barNode.style.width = `${(percent * 100).toFixed(1)}%`;
            barContainerNode.append(barNode);
        }

        const maxTopDomains = 4;

        const counters = this.columnAnalysis.domains.counters;
        const totalCount = [...counters.values()]
            .reduce((sum, count) => sum + count, 0);
        const sortedDomainsWithPercents = [...counters.entries()]
            .map(([country, count]) => {
                return {
                    country: country,
                    percent: count / totalCount
                };
            })
            .sort((o1, o2) => o2.percent - o1.percent);

        const topDomainsWithPercents = sortedDomainsWithPercents
            .slice(0, maxTopDomains);
        const remainingDomainsPercent = 1 - topDomainsWithPercents
            .reduce((sum, obj) => sum + obj.percent, 0);
        
        for (let domainWithPercent of topDomainsWithPercents) {
            addDomain(domainWithPercent.country, domainWithPercent.percent, false);
        }

        if (remainingDomainsPercent > 0) {
            addDomain("Others", remainingDomainsPercent, true)
        }

        this.node.append(visualisationNode);
    }

    private createWordCloudPreview() {
        const visualisationNode = document.createElement("div");
        visualisationNode.classList.add("word-cloud-preview");

        const listTitleNode = document.createElement("h4");
        listTitleNode.textContent = "Top keywords";
        visualisationNode.append(listTitleNode);

        new OrganizedWordCloud(this.column, visualisationNode, 10);

        this.node.append(visualisationNode);
    }

    private createOtherVisualisationsDisplayButtons() {
        const buttonAreaNode = document.createElement("div");
        buttonAreaNode.classList.add("display-buttons-area");

        const displaySankeyDiagramButton = document.createElement("button");
        displaySankeyDiagramButton.type = "button";
        displaySankeyDiagramButton.textContent = "URL structures";
        displaySankeyDiagramButton.classList.add("display-sankey-diagram");
        displaySankeyDiagramButton.addEventListener("click", () => {
            let popup = new Popup(`URL structures — ${this.column.name} column`);
            popup.maximize();
            new SankeyDiagram(this.column, popup.content);
        });
        buttonAreaNode.append(displaySankeyDiagramButton);

        const displayWordCloudButton = document.createElement("button");
        displayWordCloudButton.type = "button";
        displayWordCloudButton.textContent = "All keywords";
        displayWordCloudButton.classList.add("display-word-cloud");
        displayWordCloudButton.addEventListener("click", () => {
            let popup = new Popup(`Keywords — ${this.column.name} column`);
            popup.maximize();
            new OrganizedWordCloud(this.column, popup.content);
        });
        buttonAreaNode.append(displayWordCloudButton);

        this.node.append(buttonAreaNode);
    }
}