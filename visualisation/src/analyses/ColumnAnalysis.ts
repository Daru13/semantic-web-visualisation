import { Column } from '../dataStructures/DataFrame';
import { URLAnalysis } from './URLAnalysis';
import { MapCounter } from '../utils/MapCounter';


export enum CellType {
    Empty,
    Text,
    URL
}


export class ColumnAnalysis {
    dataframeColumn: Column;

    cellTypes: MapCounter<CellType>;
    protocols: MapCounter<string>;
    subdomains: MapCounter<string>;
    domains: MapCounter<string>;
    tlds: MapCounter<string>;
    paths: MapCounter<string>;

    pairs: Map<string, Map<string, number>>;

    properties: string[] = ["protocol", "subdomains", "domain", "tld", "path"];

    constructor(dataframeColumn: Column) {
        this.dataframeColumn = dataframeColumn;
        
        this.cellTypes = MapCounter.fromEnum(CellType);
        this.protocols = new MapCounter();
        this.subdomains = new MapCounter();
        this.domains = new MapCounter();
        this.tlds = new MapCounter();
        this.paths = new MapCounter();
        
        this.pairs = new Map();

        this.init();
        this.analyse();
    }

    private init() {
    }

    analyse() {
        let analysis;
        for (let cell of this.dataframeColumn) {
            try {
                analysis = new URLAnalysis(cell);
                this.cellTypes.count(CellType.URL);

                for (let i = 0; i < this.properties.length; i++) {
                    this.countPropertyValue(analysis, this.properties[i]);
                    if (i < this.properties.length - 1) {
                        this.updatePairs(analysis, i);
                    }
                }
            } catch (error) {
                if (cell === undefined
                ||  cell === null
                ||  cell.toString().trim() === "") {
                    this.cellTypes.count(CellType.Empty);
                }
                else {
                    this.cellTypes.count(CellType.Text);
                }
            }
        }
    }

    private countPropertyValue(analysis: URLAnalysis, property: string){
        let analysisValue = this.getValue(analysis, property);
        this.getCounter(property).count(analysisValue);
    }

    private updatePairs(analysis: URLAnalysis, property: number) {
        let firstValue = this.getValue(analysis, this.properties[property]);
        let secondValue = this.getValue(analysis, this.properties[property + 1]);
        let temp;

        if (!this.pairs.has(firstValue)) {
            temp = new Map();
            temp.set(secondValue, 1)
            this.pairs.set(firstValue, temp);
        } else {
            if (!this.pairs.get(firstValue).has(secondValue)) {
                this.pairs.get(firstValue).set(secondValue, 0);
            }
            temp = this.pairs.get(firstValue).get(secondValue);
            this.pairs.get(firstValue).set(secondValue, temp + 1);
        }
    }

    private getValue(analysis: URLAnalysis, property: string): string {
        switch (property) {
            case "protocol":
                return analysis.protocol;

            case "domain":
                return analysis.domain;

            case "subdomains":
                return analysis.subdomains[0];

            case "tld":
                return analysis.tld;
            
            case "path":
                return analysis.path[0];

            default:
                console.log("Unkown property", property);
        }
    }

    getCounter(property: string): MapCounter {
        switch (property) {
            case "protocol":
                return this.protocols;

            case "domain":
                return this.domains;

            case "subdomains":
                return this.subdomains;

            case "tld":
                return this.tlds;

            case "path":
                return this.paths;

            default:
                console.log("Unkown property", property);
        }
    }
}