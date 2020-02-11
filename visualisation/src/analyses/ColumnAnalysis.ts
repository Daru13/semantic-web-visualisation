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

    properties: string[] = ["protocol", "subdomains", "domain", "tld", "path"];

    constructor(dataframeColumn: Column) {
        this.dataframeColumn = dataframeColumn;
        
        this.cellTypes = MapCounter.fromEnum(CellType);
        this.protocols = new MapCounter();
        this.subdomains = new MapCounter();
        this.domains = new MapCounter();
        this.tlds = new MapCounter();
        this.paths = new MapCounter();
        
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