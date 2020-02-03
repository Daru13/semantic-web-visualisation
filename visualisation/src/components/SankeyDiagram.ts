import { Column } from '../dataStructures/DataFrame';
import * as d3 from "d3";
import { ColumnAnalysis } from '../analyses/ColumnAnalysis'

const SPACE_BETWEEN_COLUMNS = 400;
const SPACE_BETWEEN_ROWS = 50;
const TEXT_FONT_SIZE = 60;

type elementProperties = { height: number, fromX: number, fromY: number, toX: number, toY: number };

export class SankeyDiagram {
    holder: d3.Selection<any, any, any, any>;

    column: Column;
    columnAnalysis: ColumnAnalysis;

    skeleton: Map<string, elementProperties>;

    properties: string[] = ["protocol", "subdomains", "domain", "tld", "path"];

    constructor(column: Column) {
        this.column = column
        this.columnAnalysis = new ColumnAnalysis(this.column);
        this.skeleton = new Map();
        this.holder = d3.select("body")
            .append("div")
            .attr("id", "sankey-holder")
            .classed("sankey", true)
            .append("svg");

        this.drawVertex();
        this.drawEdges();
    }

    private drawVertex() {
        let values;

        let x = 0;
        let y = 0;
        let maxWidth = 0;
        let maxHeight = 0;

        let columnHolder: d3.Selection<SVGGElement, any, any, any>;
        let text: d3.Selection<SVGTextElement, any, any, any>;
        let rect: d3.Selection<SVGRectElement, any, any, any>;
        let columnTitle: d3.Selection<SVGTextElement, any, any, any>;

        for (let i = 0; i < this.properties.length; i++) {
            columnHolder =
                this.holder.append("g")
                    .classed("sankey-column", true);
            y = 0;

            columnTitle =
                this.holder.append("text")
                    .attr("y", -SPACE_BETWEEN_ROWS)
                    .style("font-size", `${TEXT_FONT_SIZE}px`)
                    .text(this.properties[i]);

            maxWidth = columnTitle.node().getBBox().width;

            values = this.sortMap(this.columnAnalysis.getValues(this.properties[i]));
            values.forEach(({ key: k, val: v }) => {
                rect = columnHolder.append("rect")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("height", v)
                    .style("fill", this.getFillColor(v / this.column.length()));

                text = columnHolder.append("text")
                    .attr("y", y + v / 2)
                    .style("fill", (v / this.column.length() < 0.3) ? "black" : "white")
                    .style("font-size", `${Math.min(TEXT_FONT_SIZE * 2, Math.max(TEXT_FONT_SIZE / 2, 2 * TEXT_FONT_SIZE * v / this.column.length()))}px`)
                    .style("alignment-baseline", "middle")
                    .style("pointer-events", "none")
                    .text(k);

                this.addToolTipEvents(rect, v / this.column.length() * 100);

                let width = text.node().getBBox().width;
                maxWidth = (width > maxWidth) ? width : maxWidth;

                this.skeleton.set(k, { height: v, fromX: x, fromY: y, toX: x, toY: y });
                y += v + SPACE_BETWEEN_ROWS;
            });

            y -= SPACE_BETWEEN_ROWS;
            maxHeight = (maxHeight < y) ? y : maxHeight;

            values.forEach(({ key: k, val: v }) => {
                let eleProperty = this.skeleton.get(k);
                eleProperty.fromX = eleProperty.toX + maxWidth;
            });

            columnTitle
                .attr("x", x + maxWidth / 2)
                .style("text-anchor", "middle");

            columnHolder.selectAll("text")
                .attr("x", x + maxWidth / 2)
                .style("text-anchor", "middle");

            columnHolder.selectAll("rect")
                .attr("width", maxWidth);

            x += maxWidth + SPACE_BETWEEN_COLUMNS;
        }

        this.holder.selectAll(".sankey-column").each(function () {
            let bbox = (this as SVGGElement).getBBox();
            d3.select(this)
                .selectAll()
                .attr("transform", `translate(0,${maxHeight / 2 - bbox.height / 2})`)
        });


        this.holder.attr("viewBox", `0, -${TEXT_FONT_SIZE + SPACE_BETWEEN_ROWS}, ${x - SPACE_BETWEEN_COLUMNS + TEXT_FONT_SIZE}, ${maxHeight + SPACE_BETWEEN_ROWS + TEXT_FONT_SIZE}`);
    }

    private drawEdges() {
        let values;
        let map;

        for (let i = 0; i < this.properties.length - 1; i++) {
            values = this.sortMap(this.columnAnalysis.getValues(this.properties[i]));
            values.forEach(({ key: firstValue, val: _ }) => {
                map = this.columnAnalysis.pairs.get(firstValue)
                this.sortMap(map).forEach(({ key: secondValue, val: nb }) => {
                    if (!(this.skeleton.has(firstValue) && this.skeleton.has(secondValue))) {
                        return;
                    }
                    let ele = this.holder.append("path")
                        .attr("d",
                            `M${this.skeleton.get(firstValue).fromX},${this.skeleton.get(firstValue).fromY} 
                            L${this.skeleton.get(secondValue).toX},${this.skeleton.get(secondValue).toY} 
                            L${this.skeleton.get(secondValue).toX},${this.skeleton.get(secondValue).toY + nb - 1} 
                            L${this.skeleton.get(firstValue).fromX},${this.skeleton.get(firstValue).fromY + nb - 1}`)
                        .style("border", "none")
                        .style("fill", this.getFillColor(nb / this.column.length()));

                    this.addToolTipEvents(ele, nb / this.column.length() * 100);

                    this.skeleton.get(firstValue).fromY += nb;
                    this.skeleton.get(secondValue).toY += nb;
                })
            })
        }
    }

    private addToolTipEvents(element: d3.Selection<SVGElement, any, any, any>, percentage: number) {
        element.node().addEventListener("mouseenter", (e) => {
            let bbox = element.node().getBoundingClientRect();
            let holderBBox = document.getElementById("sankey-holder").getBoundingClientRect();

            let tooltip =
                d3.select("#sankey-holder").append("div")
                    .classed("tooltip", true)
                    .style("position", "absolute")
                    .style("pointer-events", "none")
                    .style("background", "white")
                    .text(percentage.toFixed(2) + "%");

            let tooltipBBox = tooltip.node().getBoundingClientRect();
            tooltip
                .style("top", `${bbox.top + bbox.height / 2 - tooltipBBox.height / 2 - holderBBox.top}px`)
                .style("left", `${bbox.left + bbox.width / 2 - tooltipBBox.width / 2 - holderBBox.left}px`)
        })

        element.node().addEventListener("mouseleave", (e) => {
            d3.selectAll(".tooltip").remove();
        })
    }

    private sortMap(map: Map<string, number>): { key: string, val: number }[] {
        let temp: { key: string, val: number }[] = [];

        map.forEach((v, k, _) => {
            let i = 0;
            while (i < temp.length && temp[i].val > v) {
                i += 1;
            }
            temp.splice(i, 0, { key: k, val: v });
        })

        return temp; //temp.slice(0,5);
    }

    private svgTextBbox(text: string, fontSize: number) {
        let ele = this.holder.append("text")
            .style("font-size", `${fontSize}}px`)
            .text(text);

        let bbox = ele.node().getBBox();
        ele.remove();

        return bbox;
    }

    private getFillColor(percentage: number) {
        return d3.interpolateBlues(percentage * 0.8 + 0.2);
    }
}