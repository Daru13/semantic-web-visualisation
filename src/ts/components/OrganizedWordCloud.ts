import { Column } from '../dataStructures/DataFrame';
import { URLAnalysis } from '../analyses/URLAnalysis';
import { MapCounter } from '../utils/MapCounter';
import tippy from 'tippy.js';

export class OrganizedWordCloud {
    parent: HTMLElement;
    holder: HTMLElement;
    wordCount: MapCounter<string>;
    wordToOriginal: Map<string, MapCounter<string>>;

    constructor(column: Column, parent: HTMLElement, numberOfWords: number = column.length()) {
        this.parent = parent;
        this.holder = document.createElement("div");
        this.holder.classList.add("word-cloud");
        parent.appendChild(this.holder);

        this.wordCount = new MapCounter();
        this.wordToOriginal = new Map();
        this.setupUI(column, numberOfWords);
    }

    private setupUI(column: Column, numberOfWords: number): void {
        // Description of the visualisation
        const description = document.createElement("p");
        description.classList.add("description");
        description.innerText = `Keywords are extracted from both URL and raw text nodes. They are transformed to lowercase, parentheses are removed, and the remaining strings are split on various substrings (such as underscores or "et").`;
        this.parent.prepend(description);

        this.countWords(column);
        this.drawCloud(numberOfWords);
    }
    
    private countWords(column: Column): void {
        let analyse;
        let word;
        for (let url of column) {
            try {
                analyse = new URLAnalysis(url);
                word = analyse.path[analyse.path.length - 1];
                this.countWord(word, url);
            } catch (error) {
                word = url;
                let words = word.split(/,|;|\/| - | et /g);
                words.forEach((w: string) => {
                    this.countWord(w, url);
                })
            }
        }
    }

    private countWord(word: string, url: string) {
        let normalizeWord = this.normalizeWord(word);
        this.wordCount.count(normalizeWord);
        if (!this.wordToOriginal.has(normalizeWord)) {
            this.wordToOriginal.set(normalizeWord, new MapCounter());
        }
        this.wordToOriginal.get(normalizeWord).count(url);
    }

    private normalizeWord(word: string): string {
        word = decodeURI(word);
        word = word.toLowerCase();
        word = word.replace(/"| etc|\(.*\)/gi, "");
        word = word.replace(/_/g, " ");
        word = word.trim();
        return word;
    } 

    private drawCloud(numberOfWords: number): void {
        let categoryHolder: HTMLDivElement;
        let textHolder: HTMLDivElement;
        let wordNb = 0;

        const words = this.wordCount.sortedEntries().slice(0, numberOfWords);

        const maxCount = words.reduce((currentMax, word) => Math.max(currentMax, word.count), 1);
        const maxProportion = maxCount;

        for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            if (wordIndex === 0 || wordIndex === 10 || wordIndex === 50) {
                categoryHolder = document.createElement("div")
                this.holder.appendChild(categoryHolder);

                const topHolderClass = wordIndex === 0 ? "top-10"
                                     : wordIndex === 10 ? "top-50"
                                     : "others"
                categoryHolder.classList.add(topHolderClass);
            }

            const text = words[wordIndex].key;
            const count = words[wordIndex].count;

            textHolder = document.createElement("div");
            textHolder.classList.add("word");
            this.addToolTip(textHolder, this.mapCounterToHTMLList(this.wordToOriginal.get(text)));
            textHolder.innerText = text;

            const proportion = count / maxCount;
            const luminance = proportion * (45 - 10) + 10;
            textHolder.style.background = `hsl(202, 100%, ${luminance}%)`;

            categoryHolder.appendChild(textHolder);
        }
    }

    private addToolTip(element: HTMLElement, innerHTML: string) {
        tippy(element, {
            content: innerHTML,
            interactive: true,
            maxWidth: window.innerWidth
        });
    }

    private mapCounterToHTMLList(map: MapCounter<string>) {
        let list = "";
        map.sortedEntries().forEach((entry) => {
            list += `<div style='font-family: "Roboto Mono", monospace;'>${entry.key}</div><div style='text-align:right;font-family: "Roboto Mono", monospace;'>${entry.count}</div>`;
        })

        return "<div style='display: grid; grid-template-columns: auto auto;grid-column-gap: 10px;'>" + list + "</div>";
    }
}