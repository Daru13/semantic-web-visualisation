import { Series, Cell } from '../dataStructures/Series';
import { ColumnAnalysis, CellType } from '../analyses/ColumnAnalysis';
import { MapCounter } from '../utils/MapCounter';
import { COUNTRIES_TO_CODES } from '../utils/Countries';
import { voronoi } from 'd3';

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
        const visualisationNode = document.createElement("div");
        visualisationNode.classList.add("top-countries-list");

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

    }
}