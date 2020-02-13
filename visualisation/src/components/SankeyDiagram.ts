import { Column } from '../dataStructures/DataFrame';
import { ColumnAnalysis } from '../analyses/ColumnAnalysis'
import { URLAnalysis } from '../analyses/URLAnalysis';

const SPACE_BETWEEN_COLUMNS = 400;
const SPACE_BETWEEN_ROWS = 50;
const TEXT_FONT_SIZE = 60;
const SVG_NAME_SPACE = "http://www.w3.org/2000/svg";

type EdgeProperties = {number: number, path: SVGPathElement, drawn: boolean};

type EleProperties = { height: number, fromX: number, fromY: number, toX: number, toY: number, next: Map<string, EdgeProperties>, rectangle: SVGRectElement, text: SVGTextElement, drawn: boolean};

type SankeyColumn = { height: number, width: number, elements: Map<string, EleProperties>, columnHolder: SVGGElement , columnTitle: SVGTextElement};

export class SankeyDiagram {
    holder: HTMLDivElement;
    svg: SVGSVGElement;

    dataColumn: Column;
    dataColumnAnalysis: ColumnAnalysis;

    subdomainsColumns: Map<number, SankeyColumn>;
    domainColumn: SankeyColumn;
    pathColumns: Map<number, SankeyColumn>;

    constructor(column: Column, parent: HTMLDivElement) {
        this.dataColumn = column
        this.dataColumnAnalysis = new ColumnAnalysis(this.dataColumn);
        
        this.subdomainsColumns = new Map();
        this.domainColumn = this.getEmptySankeyColumn();
        this.pathColumns = new Map();

        this.holder = document.createElement("div");
        
        this.holder.id = "sankey-holder";
        this.holder.classList.add("sankey");

        this.svg = document.createElementNS(SVG_NAME_SPACE, "svg");
        this.svg.setAttribute("viewBox", "0,0,0,0");

        this.holder.appendChild(this.svg);
        parent.appendChild(this.holder);

        this.setupUI();
    }

    private setupUI(): void {
        this.computeColumns();
        this.drawColumns();
        this.drawEdges();
    }

    private computeColumns(): void {
        for (let url of this.dataColumn) {
            try{
                let analysis = new URLAnalysis(url);
                let domain = analysis.domain + "." + analysis.tld;
                let path = analysis.path;
                let subdomains = analysis.subdomains;

                this.countSankeyColumnElement(this.domainColumn, domain);
                this.countNext(this.domainColumn.elements.get(domain), path[0]);

                for (let i = 0; i < path.length; i++) {
                    if (!this.pathColumns.has(i)) {
                        this.pathColumns.set(i, this.getEmptySankeyColumn());
                    }
                    this.countSankeyColumnElement(this.pathColumns.get(i), path[i]);
                    if (i < path.length - 1) {
                        this.countNext(this.pathColumns.get(i)
                            .elements.get(path[i]), path[i + 1]);
                    }
                }

                for (let i = 0; i < subdomains.length; i++) {
                    if (!this.subdomainsColumns.has(i)) {
                        this.subdomainsColumns.set(i, this.getEmptySankeyColumn());
                    }
                    this.countSankeyColumnElement(this.subdomainsColumns.get(i), subdomains[i]);
                    if (i < subdomains.length - 1) {
                        this.countNext(this.subdomainsColumns.get(i)
                            .elements.get(subdomains[i]), subdomains[i + 1]);
                    } else {
                        this.countNext(this.subdomainsColumns.get(i)
                            .elements.get(subdomains[i]), domain);
                    }
                }
            } catch { }
        }
    }

    private countSankeyColumnElement(column: SankeyColumn, ele: string): void {
        if (!column.elements.has(ele)) {
            let eleProperty = this.getEmptyEleProperties();
            column.elements.set(ele, eleProperty);
        }
        column.elements.get(ele).height += 1;
    }

    private countNext(element: EleProperties, next: string) {
        if (!element.next.has(next)) {
            element.next.set(next, this.getEmptyEdgeProperties());
        }
        element.next.get(next).number += 1;
    }

    private drawColumns() {
        let x = 0;
        for (let i = this.subdomainsColumns.size - 1; i > -1; i--) {
            this.drawColumn(this.subdomainsColumns.get(i), x , (i == 0) ? "Subdomains" : "");
            x += this.subdomainsColumns.get(i).width + SPACE_BETWEEN_COLUMNS;
        }
        
        this.drawColumn(this.domainColumn, x, "Domain");
        x += this.domainColumn.width + SPACE_BETWEEN_COLUMNS

        this.drawColumn(this.pathColumns.get(0), x, "Path");
        x += this.pathColumns.get(0).width;
    }

    private drawColumn(column: SankeyColumn, x: number, columnTitle: string, to: number = 5, from: number = 0): void {
        let y = 0;
        let percentage;

        if (column.columnHolder.parentNode !== null) {
            column.columnHolder.innerHTML = '';
            column.columnHolder.parentNode.removeChild(column.columnHolder);
        }

        this.svg.appendChild(column.columnHolder);

        column.columnHolder.appendChild(column.columnTitle);
        column.columnTitle.innerHTML = columnTitle;
        column.columnTitle.setAttribute("y", (-SPACE_BETWEEN_ROWS).toString());
        column.columnTitle.style.fontSize = `${TEXT_FONT_SIZE}px`;

        column.width = column.columnTitle.getBBox().width;

        let sortedElements = this.sortSankeyColumnElements(column);

        for (let i = Math.min(sortedElements.length - 1, from); i < Math.min(sortedElements.length, to); i++){
            let k = sortedElements[i].key;
            let e = sortedElements[i].ele;
            percentage = e.height / this.dataColumn.length();

            e.rectangle.setAttribute("x", x.toString());
            e.rectangle.setAttribute("y", y.toString());
            e.rectangle.setAttribute("height", e.height.toString());
            e.rectangle.setAttribute("fill", this.getFillColor(percentage));

            e.text.setAttribute("y", (y + e.height / 2).toString());
            e.text.style.fill = (e.height / this.dataColumn.length() < 0.3) ? "black" : "white";
            e.text.style.fontSize = `${Math.min(TEXT_FONT_SIZE * 2, Math.max(TEXT_FONT_SIZE / 2, 2 * TEXT_FONT_SIZE * percentage))}px`;
            e.text.innerHTML = k;

            column.columnHolder.appendChild(e.rectangle);
            column.columnHolder.appendChild(e.text);

            this.addToolTipEvents(e.rectangle, percentage * 100);

            let width = e.text.getBBox().width;
            if (width > column.width) {
                column.width = width;
            }

            column.elements.get(k).fromX = x;
            column.elements.get(k).fromY = y;
            column.elements.get(k).toX = x;
            column.elements.get(k).toY = y;

            y += e.height + SPACE_BETWEEN_ROWS;
            e.drawn = true;
        }

        if (to < column.elements.size) {
            let plusButton = document.createElementNS(SVG_NAME_SPACE, "g");
            let plusButtonRect = document.createElementNS(SVG_NAME_SPACE, "rect");
            let plusButtonText = document.createElementNS(SVG_NAME_SPACE, "text");
            
            plusButton.classList.add("plus-button");

            plusButtonRect.setAttribute("x", x.toString());
            plusButtonRect.setAttribute("y", y.toString());
            plusButtonRect.setAttribute("height", "50");
            plusButtonRect.style.fill = this.getFillColor(1 - Math.min(1, y / this.dataColumn.length()));

            plusButtonText.setAttribute("x", x.toString());
            plusButtonText.setAttribute("y", (y + 25).toString());
            plusButtonText.innerHTML = "+";

            plusButton.addEventListener("click", () => {
                this.drawColumn(column, x, columnTitle, to + 5);
                this.drawEdges();
            });

            plusButton.appendChild(plusButtonRect);
            plusButton.appendChild(plusButtonText);
            column.columnHolder.appendChild(plusButton);
            y += 50 + SPACE_BETWEEN_ROWS;
        }

        column.height = y;

        let rects = column.columnHolder.getElementsByTagNameNS(SVG_NAME_SPACE, "rect");
        for (let i = 0; i < rects.length; i++) {
            rects.item(i).setAttribute("width", column.width.toString());
        }

        column.elements.forEach(element => {
            element.fromX = element.toX + column.width;
        });

        let text = column.columnHolder.getElementsByTagNameNS(SVG_NAME_SPACE, "text");
        for (let i = 0; i < text.length; i++) {
            text[i].setAttribute("x", (x + column.width / 2).toString());
        }

        let vB = this.svg.getAttribute("viewBox").split(",");
        let width = Math.max(x + column.width, parseFloat(vB[2]));
        let height = Math.max(column.height + SPACE_BETWEEN_ROWS + TEXT_FONT_SIZE, parseFloat(vB[3]));
        this.svg.setAttribute("viewBox", `0, -${TEXT_FONT_SIZE + SPACE_BETWEEN_ROWS}, ${width}, ${height}`);
    }

    private drawEdges() {
        for (let i = this.subdomainsColumns.size - 1; i > -1; i--) {
            if (i !== 0) {
                this.drawEdge(this.subdomainsColumns.get(i), this.subdomainsColumns.get(i - 1));
            } else {
                this.drawEdge(this.subdomainsColumns.get(i), this.domainColumn);
            }
        }

        this.drawEdge(this.domainColumn, this.pathColumns.get(0));
    }

    private drawEdge(fromColumn: SankeyColumn, toColumn: SankeyColumn): void {
        for (let firstValue of fromColumn.elements.keys()) {
            let sortedNext = this.sortEdges(fromColumn.elements.get(firstValue).next);
            sortedNext.forEach(({ key: secondValue, edge: edge }) => {
                if (edge.drawn) {
                    return;
                }
                if (!(fromColumn.elements.get(firstValue).drawn && toColumn.elements.get(secondValue).drawn)) {
                    return;
                }
                let nb = edge.number;
                let ele = edge.path;
                this.svg.appendChild(ele);

                ele.setAttribute("d",
                    `M${fromColumn.elements.get(firstValue).fromX},${fromColumn.elements.get(firstValue).fromY} 
                    L${toColumn.elements.get(secondValue).toX},${toColumn.elements.get(secondValue).toY} 
                    L${toColumn.elements.get(secondValue).toX},${toColumn.elements.get(secondValue).toY + nb - 1} 
                    L${fromColumn.elements.get(firstValue).fromX},${fromColumn.elements.get(firstValue).fromY + nb - 1}`);
                ele.style.fill = this.getFillColor(nb / this.dataColumn.length());

                this.addToolTipEvents(ele, nb / this.dataColumn.length() * 100);

                fromColumn.elements.get(firstValue).fromY += nb;
                toColumn.elements.get(secondValue).toY += nb;

                edge.drawn = true;
            });
        }
    }

    private addToolTipEvents(element: SVGElement, percentage: number) {
        element.addEventListener("mouseenter", (e) => {
            let bbox = element.getBoundingClientRect();
            let holderBBox = document.getElementById("sankey-holder").getBoundingClientRect();

            let tooltip = document.createElement("div");
            tooltip.classList.add("tooltip");
            tooltip.innerHTML = percentage.toFixed(2) + "%"

            document.getElementById("sankey-holder").appendChild(tooltip);

            let tooltipBBox = tooltip.getBoundingClientRect();
            tooltip.style.top = `${bbox.top + bbox.height / 2 - tooltipBBox.height / 2 - holderBBox.top}px`;
            tooltip.style.left = `${bbox.left + bbox.width / 2 - tooltipBBox.width / 2 - holderBBox.left}px`;
        })

        element.addEventListener("mouseleave", (e) => {
            let tooltips = document.getElementsByClassName('tooltip');

            while (tooltips[0]) {
                tooltips[0].parentNode.removeChild(tooltips[0]);
            }​
        })
    }

    private getFillColor(percentage: number): string {
        return `hsl(220, 100%, ${Math.abs((percentage * (90 - 35) - 90))}%)`;
    }

    private getEmptyEdgeProperties(): EdgeProperties {
        return { number: 0, path: document.createElementNS(SVG_NAME_SPACE, "path"), drawn: false };
    }

    private getEmptySankeyColumn(): SankeyColumn {
        return { height: 0, width: 0, elements: new Map(), columnHolder: document.createElementNS(SVG_NAME_SPACE, "g"), columnTitle: document.createElementNS(SVG_NAME_SPACE, "text")};
    }

    private getEmptyEleProperties(): EleProperties {
        return { height: 0, fromX: 0, fromY: 0, toX: 0, toY: 0, next: new Map(), rectangle: document.createElementNS(SVG_NAME_SPACE, "rect"), text: document.createElementNS(SVG_NAME_SPACE, "text"), drawn: false };
    }

    private sortSankeyColumnElements(column: SankeyColumn): { key: string, ele: EleProperties }[] {
        let temp: { key: string, ele: EleProperties }[] = [];

        column.elements.forEach((v, k, _) => {
            let i = 0;
            while (i < temp.length && temp[i].ele.height > v.height) {
                i += 1;
            }
            temp.splice(i, 0, { key: k, ele: v });
        })

        return temp;
    }

    private sortEdges(edges: Map<string, EdgeProperties>): { key: string, edge: EdgeProperties }[] {
        let temp: { key: string, edge: EdgeProperties }[] = [];

        edges.forEach((v, k, _) => {
            let i = 0;
            while (i < temp.length && temp[i].edge.number > v.number) {
                i += 1;
            }
            temp.splice(i, 0, { key: k, edge: v });
        })

        return temp;
    }
}