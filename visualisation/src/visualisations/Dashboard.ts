import { Series } from '../dataStructures/Series';

export class Dashboard {
    readonly node: HTMLElement;
    private column: Series;

    constructor(column: Series) {
        this.column = column;

        // TODO
        this.node = document.createElement("div");
        this.node.classList.add("dashboard");
    }
}