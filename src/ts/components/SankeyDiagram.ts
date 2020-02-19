import { Column } from '../dataStructures/DataFrame';
import { ColumnAnalysis } from '../analyses/ColumnAnalysis'
import { URLAnalysis } from '../analyses/URLAnalysis';

const SPACE_BETWEEN_COLUMNS = 400;
const SPACE_BETWEEN_ROWS = 50;
const MAX_SIZE_NODE = 200;
const MIN_SIZE_NODE = 5;
const TEXT_FONT_SIZE = 60;
const SVG_NAME_SPACE = "http://www.w3.org/2000/svg";

type EdgeProperties = {
    nb: number, 
    path: SVGPathElement, 
    drawn: boolean };

type EleProperties = { 
    nb: number, 
    x: number, y: number, width: number, height: number, 
    fromX: number, fromY: number, toX: number, toY: number, 
    next: Map<string, EdgeProperties>, 
    rectangle: SVGRectElement, text: SVGTextElement, 
    drawn: boolean };

type SankeyColumn = { 
    height: number, width: number, 
    elements: Map<string, EleProperties>, 
    columnHolder: SVGGElement , columnTitle: SVGTextElement, 
    previousColumn: SankeyColumn, nextColumn: SankeyColumn };

export class SankeyDiagram {
    holder: HTMLElement;
    svg: SVGSVGElement;

    dataColumn: Column;
    dataColumnAnalysis: ColumnAnalysis;

    subdomainsColumns: Map<number, SankeyColumn>;
    domainColumn: SankeyColumn;
    pathColumns: Map<number, SankeyColumn>;

    urlNumber: number;
    maxProportion: number;
    currentHighlight: { element: string; elementColumn: SankeyColumn; };

    constructor(column: Column, parent: HTMLElement) {
        this.dataColumn = column
        this.dataColumnAnalysis = new ColumnAnalysis(this.dataColumn);
        
        this.subdomainsColumns = new Map();
        this.domainColumn = this.getEmptySankeyColumn();
        this.pathColumns = new Map();

        this.holder = document.createElement("div");
        
        this.holder.classList.add("sankey");

        this.svg = document.createElementNS(SVG_NAME_SPACE, "svg");

        this.holder.appendChild(this.svg);
        parent.appendChild(this.holder);

        this.urlNumber = 0;
        this.maxProportion = 0;

        this.setupUI();
    }

    private setupUI(): void {
        this.svg.setAttribute("viewBox", "0,0,0,0");
        this.svg.addEventListener("click", () => {
            this.setOpacitySvgElements("1");
            this.currentHighlight = undefined;
        });

        this.computeColumns();
        this.drawColumns();
        this.drawEdges();
    }

    private computeColumns(): void {
        for (let url of this.dataColumn) {
            try{
                let analysis = new URLAnalysis(url);
                this.urlNumber += 1;

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
                        this.countNext(
                            this.subdomainsColumns.get(i)
                                .elements.get(subdomains[i]), 
                            subdomains[i + 1]);
                    } else {
                        this.countNext(this.subdomainsColumns.get(i)
                            .elements.get(subdomains[i]), domain);
                    }
                }
            } catch { }

            for(let i = this.subdomainsColumns.size - 1; i >= 0; i--) {
                if (i > 1){
                    this.subdomainsColumns.get(i).nextColumn = this.subdomainsColumns.get(i - 1);
                    this.subdomainsColumns.get(i - 1).previousColumn = this.subdomainsColumns.get(i);
                } else {
                    this.subdomainsColumns.get(i).nextColumn = this.domainColumn;
                    this.domainColumn.previousColumn = this.subdomainsColumns.get(i);
                }
            }

            for (let i = 0; i < this.pathColumns.size; i++) {
                if (i > 0) {
                    if (i < this.pathColumns.size - 1) {
                        this.pathColumns.get(i - 1).nextColumn = this.pathColumns.get(i);
                        this.pathColumns.get(i).previousColumn = this.pathColumns.get(i - 1);
                    }
                } else {
                    this.domainColumn.nextColumn = this.pathColumns.get(i);
                    this.pathColumns.get(i).previousColumn = this.domainColumn;
                }
            }
        }
    }

    private countSankeyColumnElement(column: SankeyColumn, ele: string): void {
        if (!column.elements.has(ele)) {
            let eleProperty = this.getEmptyEleProperties();
            column.elements.set(ele, eleProperty);
        }
        column.elements.get(ele).nb += 1;
        if (column.elements.get(ele).nb > this.maxProportion) {
            this.maxProportion = column.elements.get(ele).nb;
        }
    }

    private countNext(element: EleProperties, next: string) {
        if (!element.next.has(next)) {
            element.next.set(next, this.getEmptyEdgeProperties());
        }
        element.next.get(next).nb += 1;
        if (element.next.get(next).nb > this.maxProportion) {
            this.maxProportion = element.next.get(next).nb;
        }
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

        if (column.columnHolder.parentNode !== null) {
            column.columnHolder.innerHTML = '';
            column.columnHolder.parentNode.removeChild(column.columnHolder);
        }

        this.svg.appendChild(column.columnHolder);

        this.drawColumnTitle(column, columnTitle);

        let sortedElements = this.sortSankeyColumnElements(column);

        for (let i = Math.min(sortedElements.length - 1, from); i < Math.min(sortedElements.length, to); i++){
            y = this.drawElement(sortedElements[i].key, sortedElements[i].ele, x, y, column);
        }

        if (to > 5 ) {
            y = this.addButton(column, x, y, "-", () => {
                this.removeEdges();
                this.removeNode(column);
                this.drawColumn(column, x, columnTitle, to - 5);
                this.drawEdges();
                if (this.currentHighlight !== undefined) {
                    this.highLight(this.currentHighlight.element, this.currentHighlight.elementColumn);
                }
            })
        }

        if (to < column.elements.size) {
            y = this.addButton(column, x, y, "+", () => {
                this.removeEdges();
                this.drawColumn(column, x, columnTitle, to + 5);
                this.drawEdges();
                if (this.currentHighlight !== undefined) {
                    this.highLight(this.currentHighlight.element, this.currentHighlight.elementColumn);
                }
            })
        }

        column.height = y;

        let rects = column.columnHolder.getElementsByTagNameNS(SVG_NAME_SPACE, "rect");
        for (let i = 0; i < rects.length; i++) {
            rects.item(i).setAttribute("width", column.width.toString());
        }

        column.elements.forEach(element => {
            element.fromX = element.toX + column.width;
            element.width = column.width;
        });

        let text = column.columnHolder.getElementsByTagNameNS(SVG_NAME_SPACE, "text");
        for (let i = 0; i < text.length; i++) {
            text[i].setAttribute("x", (x + column.width / 2).toString());
        }

        let vB = this.svg.getAttribute("viewBox").split(",");
        let width = Math.max(x + column.width, parseFloat(vB[2]));
        let height = Math.max(column.height + SPACE_BETWEEN_ROWS + TEXT_FONT_SIZE, parseFloat(vB[3]));
        this.svg.setAttribute("viewBox", `0,-${TEXT_FONT_SIZE + SPACE_BETWEEN_ROWS},${width},${height}`);
    }

    private drawColumnTitle(column: SankeyColumn, columnTitle: string) {
        column.columnHolder.appendChild(column.columnTitle);
        column.columnTitle.innerHTML = columnTitle;
        column.columnTitle.setAttribute("y", (-SPACE_BETWEEN_ROWS).toString());
        column.columnTitle.style.fontSize = `${TEXT_FONT_SIZE}px`;

        column.width = column.columnTitle.getBBox().width;
    }

    private drawElement(k: string, e: EleProperties, x: number, y: number, column: SankeyColumn): number {
        let percentage = e.nb / this.urlNumber;
        let height = Math.max(MIN_SIZE_NODE, percentage * MAX_SIZE_NODE);

        e.rectangle.setAttribute("x", x.toString());
        e.rectangle.setAttribute("y", y.toString());
        e.rectangle.setAttribute("height", height.toString());
        e.rectangle.setAttribute("fill", this.getFillColor(percentage));
        e.rectangle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.highLight(k, column);
        })

        e.text.setAttribute("y", (y + height / 2).toString());
        e.text.style.fill = (percentage < 0.3) ? "black" : "white";
        e.text.style.fontSize = `${TEXT_FONT_SIZE * 0.5}px`;
        e.text.innerHTML = k;

        column.columnHolder.appendChild(e.rectangle);
        column.columnHolder.appendChild(e.text);

        this.addToolTipEvents(e.rectangle, percentage * 100);

        let width = e.text.getBBox().width;
        if (width > column.width) {
            column.width = width;
        }

        e.x = x;
        e.y = y;
        e.fromX = x;
        e.fromY = y;
        e.toX = x;
        e.toY = y;
        e.height = height;

        y += height + SPACE_BETWEEN_ROWS;
        e.drawn = true;
        return y;
    }

    private addButton(column: SankeyColumn, x: number, y: number, label: string, callBack: () => void): number {
        let plusButton = document.createElementNS(SVG_NAME_SPACE, "g");
        let plusButtonRect = document.createElementNS(SVG_NAME_SPACE, "rect");
        let plusButtonText = document.createElementNS(SVG_NAME_SPACE, "text");

        plusButtonRect.setAttribute("x", x.toString());
        plusButtonRect.setAttribute("y", y.toString());
        plusButtonRect.setAttribute("height", "50");
        plusButtonRect.style.fill = this.getFillColor(1 - Math.min(1, y / this.urlNumber));

        plusButtonText.setAttribute("x", x.toString());
        plusButtonText.setAttribute("y", (y + 25).toString());
        plusButtonText.innerHTML = label;

        plusButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            callBack();
        });

        plusButton.appendChild(plusButtonRect);
        plusButton.appendChild(plusButtonText);
        column.columnHolder.appendChild(plusButton);
        y += 50 + SPACE_BETWEEN_ROWS;
        return y;
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
        this.sortSankeyColumnElements(fromColumn)
            .forEach(({key: firstValue, ele: firstElement}) => {
                let sortedNext = this.sortEdges(firstElement.next);
                sortedNext.forEach(({ key: secondValue, edge: edge }) => {
                    if (edge.drawn) {
                        return;
                    }
                    if (!(firstElement.drawn && toColumn.elements.get(secondValue).drawn)) {
                        return;
                    }
                    let secondElement = toColumn.elements.get(secondValue);

                    let percentage = edge.nb / this.urlNumber;
                    let height = Math.max(MIN_SIZE_NODE, percentage * MAX_SIZE_NODE);;
                    let ele = edge.path;
                    this.svg.appendChild(ele);

                    ele.setAttribute("d",
                        `M${firstElement.fromX},${firstElement.fromY} 
                        L${secondElement.toX},${secondElement.toY} 
                        L${secondElement.toX},${secondElement.toY + height} 
                        L${firstElement.fromX},${firstElement.fromY + height}`);
                    ele.style.fill = this.getFillColor(percentage);

                    this.addToolTipEvents(ele, percentage * 100);

                    if (firstElement.fromY - firstElement.y + height < firstElement.height) {
                        fromColumn.elements.get(firstValue).fromY += height;
                    }

                    if (secondElement.toY - secondElement.y + height < secondElement.height) {
                        secondElement.toY += height;
                    }
                    edge.drawn = true;
                });
        });
    }

    private removeNode(column: SankeyColumn) {
        column.elements.forEach((ele) => {
            ele.drawn = false;
        })
    }

    private removeEdges() {
        for (let i = this.subdomainsColumns.size - 1; i > -1; i--) {
            if (i !== 0) {
                this.removeEdge(this.subdomainsColumns.get(i), this.subdomainsColumns.get(i - 1));
            } else {
                this.removeEdge(this.subdomainsColumns.get(i), this.domainColumn);
            }
        }

        this.removeEdge(this.domainColumn, this.pathColumns.get(0));
    }

    private removeEdge(fromColumn: SankeyColumn, toColumn: SankeyColumn): void {
        for (let firstValue of fromColumn.elements.keys()) {
            let sortedNext = this.sortEdges(fromColumn.elements.get(firstValue).next);
            sortedNext.forEach(({ key: secondValue, edge: edge }) => {
                let ele = edge.path;
                if (ele.parentNode !== null) {
                    ele.parentNode.removeChild(ele);
                }

                fromColumn.elements.get(firstValue).fromX = fromColumn.elements.get(firstValue).x + fromColumn.elements.get(firstValue).width;
                fromColumn.elements.get(firstValue).fromY = fromColumn.elements.get(firstValue).y;
                toColumn.elements.get(secondValue).toX = toColumn.elements.get(secondValue).x;
                toColumn.elements.get(secondValue).toY = toColumn.elements.get(secondValue).y;

                edge.drawn = false;
            });
        }
    }

    private addToolTipEvents(element: SVGElement, percentage: number) {
        element.addEventListener("mouseenter", (e) => {
            let bbox = element.getBoundingClientRect();

            let tooltip = document.createElement("div");
            tooltip.classList.add("tooltip");
            tooltip.innerHTML = percentage.toFixed(2) + "%"
            tooltip.style.zIndex = "100000";

            document.body.appendChild(tooltip);

            let tooltipBBox = tooltip.getBoundingClientRect();
            let scrollTop = document.documentElement.scrollTop;
            let scrollLeft = document.documentElement.scrollLeft;
            tooltip.style.top = `${bbox.top + bbox.height / 2 - tooltipBBox.height / 2 +scrollTop}px`;
            tooltip.style.left = `${bbox.left + bbox.width / 2 - tooltipBBox.width / 2 + scrollLeft}px`;
        })

        element.addEventListener("mouseleave", (e) => {
            let tooltips = document.getElementsByClassName('tooltip');

            while (tooltips[0]) {
                tooltips[0].parentNode.removeChild(tooltips[0]);
            }​
        })
    }

    private highLight(element: string, elementColumn: SankeyColumn) {
        this.currentHighlight = {element: element, elementColumn: elementColumn};
        this.setOpacitySvgElements("0.1");
        let leftColumn = this.subdomainsColumns.get(this.subdomainsColumns.size - 1);
        leftColumn
            .elements
                .forEach((v, k, m) => {
                    this.highlightBefore(k, leftColumn, element, elementColumn);
                 })
        this.highlightAfter(element, elementColumn);
    }

    private highlightBefore(ele: string, column: SankeyColumn, element: string, elementColumn: SankeyColumn) {
        if (column === undefined) {
            return false;
        } else if (column === elementColumn) {
            let isPresentInNext = ele === element;
            if(isPresentInNext){
                column.elements.get(ele).rectangle.style.opacity = "1";
            }
            return isPresentInNext;
        } else {
            let isPresentInNext = false;
            column.elements.get(ele).next.forEach((v, k, m) => {
                if (this.highlightBefore(k, column.nextColumn, element, elementColumn)) {
                    isPresentInNext = true;
                    v.path.style.opacity = "1";
                }
            })
            if (isPresentInNext) {
                column.elements.get(ele).rectangle.style.opacity = "1";
            }
            return isPresentInNext;
        }
    }

    private highlightAfter(ele: string, column: SankeyColumn) {
        if (column === undefined) {
            return;
        }
        column.elements.get(ele).next.forEach((v, k, m) => {
            this.highlightAfter(k, column.nextColumn);
            v.path.style.opacity = "1";
        });
        column.elements.get(ele).rectangle.style.opacity = "1";
    }

    private setOpacitySvgElements(opacity: string) {
        this.svg.querySelectorAll("rect").forEach((e) => {
            e.style.opacity = opacity;
            console.log(opacity);
        });
        this.svg.querySelectorAll("path").forEach((e) => {
            e.style.opacity = opacity;
        });
    }

    private getFillColor(percentage: number): string {
        percentage = percentage / (this.maxProportion / this.urlNumber);
        return `hsl(202, ${percentage * 80 + 20}%, 60%`;
    }

    private getEmptyEdgeProperties(): EdgeProperties {
        return { nb: 0, path: document.createElementNS(SVG_NAME_SPACE, "path"), drawn: false };
    }

    private getEmptySankeyColumn(): SankeyColumn {
        return { 
            height: 0, width: 0, 
            elements: new Map(), 
            columnHolder: document.createElementNS(SVG_NAME_SPACE, "g"), columnTitle: document.createElementNS(SVG_NAME_SPACE, "text"), 
            previousColumn: undefined, nextColumn: undefined};
    }

    private getEmptyEleProperties(): EleProperties {
        return { 
            nb: 0, 
            x: 0, y: 0, width: 0, height: 0,
            fromX: 0, fromY: 0, toX: 0, toY: 0, 
            next: new Map(), 
            rectangle: document.createElementNS(SVG_NAME_SPACE, "rect"), text: document.createElementNS(SVG_NAME_SPACE, "text"), 
            drawn: false };
    }

    private sortSankeyColumnElements(column: SankeyColumn): { key: string, ele: EleProperties }[] {
        let temp: { key: string, ele: EleProperties }[] = [];

        column.elements.forEach((v, k, _) => {
            let i = 0;
            while (i < temp.length && temp[i].ele.nb > v.nb) {
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
            while (i < temp.length && temp[i].edge.nb > v.nb) {
                i += 1;
            }
            temp.splice(i, 0, { key: k, edge: v });
        })

        return temp;
    }
}