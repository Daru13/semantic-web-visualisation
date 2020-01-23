import { DataFrame } from './data/DataFrame';
import * as d3 from "d3";

const SPACE_BETWEEN_COLUMNS = 400;
const SPACE_BETWEEN_ROWS = 50;

export class SankeyDiagram {
    df: DataFrame;
    holder: d3.Selection<any, any, any, any>;

    constructor(df: DataFrame) {
        this.df = df
        this.holder = d3.select("body")
            .append("div")
                .classed("sankey", true)
                .append("svg");

        this.setupUI();
    }

    setupUI() {
        let skeleton: Record<string, Record<string, Record<string, number>>> = { protocol: {}, host: {} };
        let urls = [];
        let url;

        for (let column of this.df.columns()) {
            for (let value of column.values()) {
                urls.push(value);
            }
        }

        urls.sort();

        for (let value of urls) {
            url = new URL(value);
            if (!skeleton.protocol.hasOwnProperty(url.protocol)) {
                skeleton.protocol[url.protocol] = {height: 0, x: 0, y:0, width: 0}
            }
            skeleton.protocol[url.protocol]["height"] += 1;

            if (!skeleton.host.hasOwnProperty(url.host)) {
                skeleton.host[url.host] = { height: 0, x: 0, y: 0, width: 0 };
            }
            skeleton.host[url.host]["height"] += 1;
        }

        let x = 0; 
        let y = 0;
        let height = 0;
        let columnHolder;
        let maxWidth = 0;

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
                
                let width = text.node().getComputedTextLength();

                maxWidth = Math.max(width, maxWidth);

                skeleton[param][val]["x"] = x;
                skeleton[param][val]["y"] = y;

                y += SPACE_BETWEEN_ROWS + height;
            }

            for (let val of Object.keys(skeleton[param])) {
                skeleton[param][val]["width"] = maxWidth; 
                columnHolder.selectAll("text")
                    .attr("x", skeleton[param][val]["x"] + maxWidth/2)
                    .style("text-anchor", "middle");
            }
            x += SPACE_BETWEEN_COLUMNS + 20;
        }

        this.holder.attr("viewBox", `0,0,${x},${y}`);

        for (let value of urls) {
            url = new URL(value);

            let x1 = skeleton.protocol[url.protocol]["x"] + skeleton.protocol[url.protocol]["width"];
            let y1 = skeleton.protocol[url.protocol]["y"] + skeleton.protocol[url.protocol]["width"];

            let x2 = skeleton.host[url.host]["x"];
            let y2 = skeleton.host[url.host]["y"];

            let el = this.holder.append("path")
                .datum(value)
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
                        .text(value);
                d3.select(el).style("stroke", "red");
            })

            el.addEventListener("mouseout", (e) => {
                d3.select(`#url-popup`).remove();
                d3.select(el).style("stroke", "black");
            })
            
            skeleton.protocol[url.protocol]["y"] += 1;

            skeleton.host[url.host]["y"] += 1;
        }
    }
}