import { Column } from '../dataStructures/DataFrame';
import { URLAnalysis } from '../analyses/URLAnalysis';

const SPACE_BETWEEN_COLUMNS = 400;
const SPACE_BETWEEN_ROWS = 50;
const MAX_SIZE_NODE = 200;
const MIN_SIZE_NODE = 5;
const TEXT_FONT_SIZE = 60;
const SVG_NAME_SPACE = "http://www.w3.org/2000/svg";

type EdgeProperties = {
    nb: number, // number of url taking that edge
    path: SVGPathElement,  // path element representing the edge
    drawn: boolean // is the path drawn
};

type EleProperties = { 
    nb: number, // Number of url with that element
    x: number, y: number, width: number, height: number, // Visual property of the element
    fromX: number, fromY: number, // Where to draw egdes that come from this element
    toX: number, toY: number, // Where to draw egdes that go to this element
    next: Map<string, EdgeProperties>, // Map of edges coming from this element
    rectangle: SVGRectElement, text: SVGTextElement, // Visual representation of the element
    drawn: boolean // Is the element displayed
};

type SankeyColumn = { 
    height: number, width: number, // Visual properties of the column
    elements: Map<string, EleProperties>, // Map of elements in the columns
    columnHolder: SVGGElement , columnTitle: SVGTextElement, // Visual representation of the column
    previousColumn: SankeyColumn, nextColumn: SankeyColumn
};

/**
 * A class to draw a Sankey diagram
 */
export class SankeyDiagram {
    /**
     * Holder of sankey diagram
     */
    holder: HTMLElement;
    /**
     * Svg of sankey diagram
     */
    svg: SVGSVGElement;
    pathButtonsHolder: HTMLElement;

    /**
     * Data column represented by the sankey diagram
     */
    dataColumn: Column;

    subdomainsColumns: Map<number, SankeyColumn>;
    domainColumn: SankeyColumn;
    pathColumns: Map<number, SankeyColumn>;

    /**
     * Number of URL in the sankey diagram
     */
    urlNumber: number;
    /**
     * The maximum proportion of one url in the dataColumn
     */
    maxProportion: number;
    /**
     * Current highlighted element of sankey diagram
     */
    currentHighlight: { element: string; elementColumn: SankeyColumn; };

    indexLastPathColumnDrawn: number;

    constructor(column: Column, parent: HTMLElement) {
        this.dataColumn = column
        
        this.subdomainsColumns = new Map();
        this.domainColumn = this.getEmptySankeyColumn();
        this.pathColumns = new Map();

        this.holder = document.createElement("div");
        
        this.holder.classList.add("sankey");

        this.svg = document.createElementNS(SVG_NAME_SPACE, "svg");

        this.pathButtonsHolder = document.createElement("div");
        this.pathButtonsHolder.id = "path-buttons-holder";

        this.holder.appendChild(this.svg);
        this.holder.appendChild(this.pathButtonsHolder);
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
        this.svg.innerHTML = '<defs><filter id="whiteOutlineEffect" ><feMorphology in="SourceAlpha" result = "MORPH" operator = "dilate" radius = "3" /><feColorMatrix in="MORPH" result = "WHITENED" type = "matrix" values = "-1 0 0 1 0, 0 -1 0 1 0, 0 0 -1 1 0, 0 0 0 1 0" /><feMerge><feMergeNode in="WHITENED" /><feMergeNode in="SourceGraphic" /></feMerge>< /filter>< /defs>';

        

        this.computeColumns();
        this.drawColumns();
        this.drawEdges();
    }

    /**
     * Computes whats needed to draw the columns
     */
    private computeColumns(): void {
        for (let url of this.dataColumn) {
            try{
                let analysis = new URLAnalysis(url);
                this.urlNumber += 1;

                let domain = analysis.domain + "." + analysis.tld;
                let path = analysis.path;
                let subdomains = analysis.subdomains;

                /** Count Elements and edges for every columns */
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

            /** Set previous and next columns for every columns */
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
                    this.pathColumns.get(i - 1).nextColumn = this.pathColumns.get(i);
                    this.pathColumns.get(i).previousColumn = this.pathColumns.get(i - 1);
                } else {
                    this.domainColumn.nextColumn = this.pathColumns.get(i);
                    this.pathColumns.get(i).previousColumn = this.domainColumn;
                }
            }
        }
    }

    /**
     * Add one Element to a snakey column
     * @param column Sankey column of the element
     * @param ele The Element to count
     */
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

    /**
     * Counts a next element for an element
     * @param element Element to add a next one
     * @param next Name of the next one
     */
    private countNext(element: EleProperties, next: string) {
        if (!element.next.has(next)) {
            element.next.set(next, this.getEmptyEdgeProperties());
        }
        element.next.get(next).nb += 1;
        if (element.next.get(next).nb > this.maxProportion) {
            this.maxProportion = element.next.get(next).nb;
        }
    }

    /**
     * Draws every sankey columns
     */
    private drawColumns() {
        let x = 0;
        for (let i = this.subdomainsColumns.size - 1; i > -1; i--) {
            this.drawColumn(this.subdomainsColumns.get(i), x , (i == 0) ? "Subdomains" : "");
            x += this.subdomainsColumns.get(i).width + SPACE_BETWEEN_COLUMNS;
        }
        
        this.drawColumn(this.domainColumn, x, "Domain");
        x += this.domainColumn.width + SPACE_BETWEEN_COLUMNS

        this.drawColumn(this.pathColumns.get(0), x, "Path");
        x += this.pathColumns.get(0).width + SPACE_BETWEEN_COLUMNS;
        this.indexLastPathColumnDrawn = 0;

        if (this.pathColumns.size > this.indexLastPathColumnDrawn) {
            this.addPathButton("+", () => {
                if (this.indexLastPathColumnDrawn < this.pathColumns.size) {
                    this.indexLastPathColumnDrawn += 1;
                    this.drawColumn(this.pathColumns.get(this.indexLastPathColumnDrawn), x, "");
                    x += this.pathColumns.get(this.indexLastPathColumnDrawn).width + SPACE_BETWEEN_COLUMNS;
                    this.drawEdge(this.pathColumns.get(this.indexLastPathColumnDrawn).previousColumn, this.pathColumns.get(this.indexLastPathColumnDrawn));
                    if (this.currentHighlight !== undefined) {
                        this.highLight(this.currentHighlight.element, this.currentHighlight.elementColumn);
                    }
                }
            });

            this.addPathButton("-", () => {
                if (this.indexLastPathColumnDrawn > 0) {
                    x -= this.pathColumns.get(this.indexLastPathColumnDrawn).width + SPACE_BETWEEN_COLUMNS;
                    this.removeColumn(this.pathColumns.get(this.indexLastPathColumnDrawn));
                    this.removeEdge(
                        this.pathColumns.get(this.indexLastPathColumnDrawn).previousColumn, 
                        this.pathColumns.get(this.indexLastPathColumnDrawn));
                    this.indexLastPathColumnDrawn -= 1;
                    if (this.currentHighlight !== undefined) {
                        this.highLight(this.currentHighlight.element, this.currentHighlight.elementColumn);
                    }
                }
            });
        }
    }

    /**
     * Draws a specic sankey column
     * @param column Snakey Column to draw
     * @param x X position of the sankey column
     * @param columnTitle Title of the column
     * @param [to] Last index of the column elements to draw
     * @param [from] First index of the column elements to draw
     */
    private drawColumn(column: SankeyColumn, x: number, columnTitle: string, to: number = 5, from: number = 0): void {
        let y = 0;

        // Remove the column is already drawn
        if (column.columnHolder.parentNode !== null) {
            column.columnHolder.innerHTML = '';
            column.columnHolder.parentNode.removeChild(column.columnHolder);
        }

        this.svg.appendChild(column.columnHolder);

        this.drawColumnTitle(column, columnTitle);

        let sortedElements = this.sortSankeyColumnElements(column);

        for (let i = Math.min(sortedElements.length - 1, from); i < Math.min(sortedElements.length, to); i++){
            this.drawElement(sortedElements[i].key, sortedElements[i].ele, x, y, column);
            y += sortedElements[i].ele.height + SPACE_BETWEEN_ROWS;
        }

        // Add a minus button
        if (to > 5 ) {
            y += this.addButton(column.columnHolder, x, y, "-", () => {
                this.removeEdges();
                this.removeNode(column);
                this.drawColumn(column, x, columnTitle, to - 5);
                this.drawEdges();
                if (this.currentHighlight !== undefined) {
                    this.highLight(this.currentHighlight.element, this.currentHighlight.elementColumn);
                }
                // Adapt if necessary the viewBox property of the sankey svg
                let vB = this.svg.getAttribute("viewBox").split(",");
                let height = this.maxHeight();
                this.svg.setAttribute("viewBox", `0,${vB[1]},${vB[2]},${height + SPACE_BETWEEN_ROWS + TEXT_FONT_SIZE}`);
            });
            y += SPACE_BETWEEN_ROWS;
        }

        // Add a plus button
        if (to < column.elements.size) {
            y += this.addButton(column.columnHolder, x, y, "+", () => {
                this.removeEdges();
                this.drawColumn(column, x, columnTitle, to + 5);
                this.drawEdges();
                if (this.currentHighlight !== undefined) {
                    this.highLight(this.currentHighlight.element, this.currentHighlight.elementColumn);
                }
            });
            y += SPACE_BETWEEN_ROWS;
        }

        column.height = y;

        // Set width of every rectangle in the column based on the biggest one
        let rects = column.columnHolder.getElementsByTagNameNS(SVG_NAME_SPACE, "rect");
        for (let i = 0; i < rects.length; i++) {
            rects.item(i).setAttribute("width", column.width.toString());
        }

        // Set the width property for each element
        column.elements.forEach(element => {
            element.fromX = element.toX + column.width;
            element.width = column.width;
        });

        // Center the text of each element 
        let text = column.columnHolder.getElementsByTagNameNS(SVG_NAME_SPACE, "text");
        for (let i = 0; i < text.length; i++) {
            text[i].setAttribute("x", (x + column.width / 2).toString());
        }

        // Adapt if necessary the viewBox property of the sankey svg
        let vB = this.svg.getAttribute("viewBox").split(",");
        let width = Math.max(x + column.width, parseFloat(vB[2]));
        let height = Math.max(column.height + SPACE_BETWEEN_ROWS + TEXT_FONT_SIZE, parseFloat(vB[3]));
        this.svg.setAttribute("viewBox", `0,-${TEXT_FONT_SIZE + SPACE_BETWEEN_ROWS},${width},${height}`);
    }

    /**
     * Draws the title of a sankey column
     * @param column The sankey column
     * @param columnTitle The title
     */
    private drawColumnTitle(column: SankeyColumn, columnTitle: string) {
        column.columnHolder.appendChild(column.columnTitle);
        column.columnTitle.innerHTML = columnTitle;
        column.columnTitle.setAttribute("y", (-SPACE_BETWEEN_ROWS).toString());
        column.columnTitle.style.fontSize = `${TEXT_FONT_SIZE}px`;

        column.width = column.columnTitle.getBBox().width;
    }

    /**
     * Draws a sankey column element
     * @param k Name of the element
     * @param e Element property of the element
     * @param x x-position of the element
     * @param y y-position of the element
     * @param column Column og the sankey element
     */
    private drawElement(k: string, e: EleProperties, x: number, y: number, column: SankeyColumn) {
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
        e.text.setAttribute("alignment-baseline", "middle");
        //e.text.style.fill = (percentage < 0.3) ? "black" : "white";
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
        e.drawn = true;
    }

    /**
     * Adds a button to a sankey column
     * @param column Sankey column where to add the button
     * @param x X position of the button
     * @param y Y position of the button
     * @param label Label of the button
     * @param callBack Callback for when the button is clicked
     * @returns the height of the button 
     */
    private addButton(parent: SVGElement, x: number, y: number, label: string, callBack: () => void): number {
        let button = document.createElementNS(SVG_NAME_SPACE, "g");
        let buttonRect = document.createElementNS(SVG_NAME_SPACE, "rect");
        let buttonText = document.createElementNS(SVG_NAME_SPACE, "text");

        button.classList.add("button");

        buttonRect.setAttribute("x", x.toString());
        buttonRect.setAttribute("y", y.toString());
        buttonRect.setAttribute("height", "50");
        buttonRect.setAttribute("width", "50");
        buttonRect.style.fill = this.getFillColor(1 - Math.min(1, y / this.urlNumber));

        buttonText.setAttribute("x", x.toString());
        buttonText.setAttribute("y", (y + 25).toString());
        buttonText.setAttribute("alignment-baseline", "middle");
        buttonText.innerHTML = label;

        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            callBack();
        });

        button.appendChild(buttonRect);
        button.appendChild(buttonText);
        parent.appendChild(button);

        return 50;
    }

    private addPathButton(label: string, callBack: () => void) {
        let button = document.createElement("button");
        button.classList.add("button");

        button.innerHTML = label;

        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            callBack();
        });

        this.pathButtonsHolder.appendChild(button);
    }

    /**
     * Draws the edges of the sankey diagram
     */
    private drawEdges() {
        for (let i = this.subdomainsColumns.size - 1; i > -1; i--) {
            this.drawEdge(this.subdomainsColumns.get(i), this.subdomainsColumns.get(i).nextColumn);
        }

        for (let i = 0; i <= this.indexLastPathColumnDrawn; i++) {
            this.drawEdge(this.pathColumns.get(i).previousColumn, this.pathColumns.get(i));
        }
    }

    /**
     * Draws edges between two sankey columns
     * @param fromColumn 
     * @param toColumn 
     */
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

    private removeColumn(column: SankeyColumn) {
        this.removeNode(column);
        if (column.columnHolder.parentNode) {
            column.columnHolder.parentNode.removeChild(column.columnHolder);
        }
        let vB = this.svg.getAttribute("viewBox").split(",");
        this.svg.setAttribute("viewBox", `0,${vB[1]},${parseFloat(vB[2]) - column.width - SPACE_BETWEEN_COLUMNS},${vB[3]}`);
    }

    private removeNode(column: SankeyColumn) {
        column.elements.forEach((ele) => {
            ele.drawn = false;
        })
    }

    private removeEdges() {
        for (let i = this.subdomainsColumns.size - 1; i > -1; i--) {
            this.removeEdge(this.subdomainsColumns.get(i), this.subdomainsColumns.get(i).nextColumn);
        }

        for (let i = 0; i <= this.indexLastPathColumnDrawn; i++) {
            this.removeEdge(this.pathColumns.get(i).previousColumn, this.pathColumns.get(i));
        }
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

    private maxHeight(): number {
        let maxHeight = 0;
        for (let i = this.subdomainsColumns.size - 1; i >= 0; i--) {
            maxHeight = Math.max(this.subdomainsColumns.get(i).height, maxHeight);
        }

        maxHeight = Math.max(this.domainColumn.height, maxHeight);

        for (let i = 0; i < this.pathColumns.size; i++) {
            maxHeight = Math.max(this.pathColumns.get(i).height, maxHeight);
        }
        return maxHeight;
    }
}