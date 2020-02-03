import { Column } from '../dataStructures/DataFrame';
import { URLAnalysis } from './URLAnalysis';


export class ColumnAnalysis {
    dataframeColumn: Column;

    protocols: Map<string, number>;
    subdomains: Map<string, number>;
    domains: Map<string, number>;
    tlds: Map<string, number>;
    paths: Map<string, number>;

    pairs: Map<string, Map<string, number>>;

    properties: string[] = ["protocol", "subdomains", "domain", "tld", "path"];

    constructor(dataframeColumn: Column) {
        this.dataframeColumn = dataframeColumn;
        
        this.protocols = new Map();
        this.subdomains = new Map();
        this.domains = new Map();
        this.tlds = new Map();
        this.paths = new Map();
        
        this.pairs = new Map();
        this.analyse();
    }

    analyse() {
        let analysis;
        for (let url of this.dataframeColumn) {
            try {
                analysis = new URLAnalysis(url);

                for (let i = 0; i < this.properties.length; i++) {
                    this.countPropertyValue(analysis, this.properties[i]);
                    if (i < this.properties.length - 1) {
                        this.updatePairs(analysis, i);
                    }
                }
            } catch (error) {
                
            }
        }
    }

    private countPropertyValue(analysis: URLAnalysis, property: string){
        let analysisValue = this.getValue(analysis, property);
        let values = this.getValues(property);

        if (!values.has(analysisValue)) {
            values.set(analysisValue, 0);
        }
        let temp = values.get(analysisValue);
        values.set(analysisValue, temp + 1);
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

    getValues(property: string): Map<string, number> {
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