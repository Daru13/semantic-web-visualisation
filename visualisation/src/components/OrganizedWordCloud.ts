import { Column } from '../dataStructures/DataFrame';
import { URLAnalysis } from '../analyses/URLAnalysis';
import { ColumnAnalysis } from '../analyses/ColumnAnalysis';
import { MapCounter } from '../utils/MapCounter';

export class OrganizedWordCloud {
    holder: HTMLDivElement;
    wordCount: MapCounter<string>;

    constructor(column: Column, parent: HTMLDivElement) {
        this.holder = document.createElement("div");
        this.holder.classList.add("word-cloud");
        parent.appendChild(this.holder);

        this.wordCount = new MapCounter();
        this.setupUI(column);
    }

    private setupUI(column: Column): void {
        this.countWords(column);
        this.drawCloud(column);
    }
    
    private countWords(column: Column): void {
        let analyse;
        let word;
        for (let url of column) {
            try {
                analyse = new URLAnalysis(url);
                word = analyse.path[analyse.path.length - 1];
                this.wordCount.count(this.normalizeWord(word));
            } catch (error) {
                word = url;
                let words = word.split(/,|;|\/| - | et /g);
                words.forEach((w: string) => {
                    this.wordCount.count(this.normalizeWord(w));
                })
            }
        }
    }

    private normalizeWord(word: string): string {
        word = decodeURI(word);
        word = word.toLowerCase();
        word = word.replace(/"| etc|\(.*\)/gi, "");
        word = word.replace(/_/g, " ");
        word = word.trim();
        return word;
    } 

    private drawCloud(column: Column): void {
        let topHolder: HTMLDivElement;
        let textHolder: HTMLDivElement;
        let wordNb = 0;

        this.wordCount.sortedEntries().forEach(({ key: text, count: count }) => {
            if (wordNb === 0) {
                topHolder = document.createElement("div")
                topHolder.classList.add("top-10");
                this.holder.appendChild(topHolder);
            } else if (wordNb === 10) {
                topHolder = document.createElement("div")
                topHolder.classList.add("top-50");
                this.holder.appendChild(topHolder);
            } else if (wordNb === 50) {
                topHolder = document.createElement("div")
                topHolder.classList.add("others");
                this.holder.appendChild(topHolder);
            }

            textHolder = document.createElement("div");
            textHolder.classList.add("word");
            textHolder.innerText = text;
            textHolder.style.background = `hsl(194, 100%, ${count / column.length() * (80 - 30) + 30}%)` // L in [30, 80]

            topHolder.appendChild(textHolder);
            wordNb += 1;
        });
    }
}