import { Column } from './data/DataFrame';
import * as d3 from "d3";
import { URLAnalysis } from './url/URLAnalysis';

const SPACE_BETWEEN_COLUMNS = 400;
const SPACE_BETWEEN_ROWS = 50;

export class SankeyDiagram {
    column: Column;
    holder: d3.Selection<any, any, any, any>;

    constructor(column: Column) {
        this.column = column
        this.holder = d3.select("body")
            .append("div")
                .classed("sankey", true)
                .append("svg");

        this.setupUI();
    }

    setupUI() {
        let skeleton: Record<string, Record<string, Record<string, number>>> = { protocol: {}, countryCode: {}, domain: {} };
        let pairs: Record<string, Record<string, string[]>> = {};
        let urls = [];
        let urlanalysis;

        for (let value of this.column) {
            if (validURL(value)){
                urls.push(value);
            }
        }

        for (let url of urls) {
            urlanalysis = new URLAnalysis(url);
            let keys = Object.keys(skeleton);
            for (let i = 0; i < keys.length; i++) {
                let urlProperty = urlanalysis.get(keys[i]);
                if (!skeleton[keys[i]].hasOwnProperty(urlProperty)) {
                    skeleton[keys[i]][urlProperty] = {height: 0, fromX: 0, fromY: 0, toX: 0, toY:0, width: 0}
                }
                skeleton[keys[i]][urlProperty]["height"] += 1;

                if (i < keys.length - 1) {
                    let nextUrlProperty = urlanalysis.get(keys[i + 1]);
                    if (!pairs.hasOwnProperty(urlProperty)) {
                        pairs[urlProperty] = {};
                    }

                    if (!pairs[urlProperty].hasOwnProperty(nextUrlProperty)) {
                        pairs[urlProperty][nextUrlProperty] = [];
                    }

                    pairs[urlProperty][nextUrlProperty].push(url);
                }
            }
        }

        let x = 0; 
        let y = 0;
        let height = 0;
        let columnHolder;
        let maxWidth = 0;
        let maxHeight = 0;

        for (let param of Object.keys(skeleton)) {
            y = 0;
            columnHolder = this.holder.append("g");
            maxWidth = 0;

            for (let val of Object.keys(skeleton[param])) {
                height = skeleton[param][val]["height"]
                let text = columnHolder.append("text")
                    .attr("x", x)
                    .attr("y", y + height / 2)
                    .text(val);
                
                let width = text.node().getComputedTextLength() + 10;

                maxWidth = Math.max(width, maxWidth);

                skeleton[param][val]["fromX"] = x;
                skeleton[param][val]["toX"] = x;
                skeleton[param][val]["fromY"] = y;
                skeleton[param][val]["toY"] = y;

                y += SPACE_BETWEEN_ROWS + height;
            }

            maxHeight = Math.max(maxHeight, y - SPACE_BETWEEN_ROWS);

            for (let val of Object.keys(skeleton[param])) {
                skeleton[param][val]["width"] = maxWidth;
                skeleton[param][val]["fromX"] += maxWidth;
                columnHolder.selectAll("text")
                    .attr("x", (skeleton[param][val]["fromX"] + skeleton[param][val]["toX"])/2)
                    .style("text-anchor", "middle");
            }
            x += SPACE_BETWEEN_COLUMNS + maxWidth;
        }

        this.holder.attr("viewBox", `0,0,${x - SPACE_BETWEEN_COLUMNS},${maxHeight}`);

        let keys = Object.keys(skeleton);
        for (let i = 0; i < keys.length - 1; i++) {
            for(let value of Object.keys(skeleton[keys[i]])) {
                for(let nextValue of Object.keys(pairs[value])){
                    for(let url of pairs[value][nextValue]){
                        let x1 = skeleton[keys[i]][value]["fromX"];
                        let y1 = skeleton[keys[i]][value]["fromY"];

                        let x2 = skeleton[keys[i + 1]][nextValue]["toX"];
                        let y2 = skeleton[keys[i + 1]][nextValue]["toY"];
                        let el = this.holder.append("path")
                        .datum(url)
                        .attr("d", `M${x1},${y1} L${x2},${y2}`)
                        .style("stroke", "black")
                        .node();

                        el.addEventListener("mouseover", (e) => {
                            d3.select("body")
                            .append("div")
                            .attr("id", `url-popup`)
                            .style("position", "absolute")
                            .style("top", `${e.pageY - 5}px`)
                            .style("left", `${e.pageX + 10}px`)
                            .style("background", "white")
                            .text(url);
                            d3.select(el).style("stroke", "red");
                        })

                        el.addEventListener("mouseout", () => {
                            d3.select(`#url-popup`).remove();
                            d3.select(el).style("stroke", "black");
                        })
                        
                        skeleton[keys[i]][value]["fromY"] += 1;
                        skeleton[keys[i + 1]][nextValue]["toY"] += 1;
                    }
                }
            }
        }
    }
}

function validURL(str: string): boolean {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}