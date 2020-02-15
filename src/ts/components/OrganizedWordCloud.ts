import { Column } from '../dataStructures/DataFrame';
import { URLAnalysis } from '../analyses/URLAnalysis';
import { ColumnAnalysis } from '../analyses/ColumnAnalysis';
import { MapCounter } from '../utils/MapCounter';

export class OrganizedWordCloud {
    holder: HTMLElement;
    wordCount: MapCounter<string>;

    constructor(column: Column, parent: HTMLElement, numberOfWords: number = column.length()) {
        this.holder = document.createElement("div");
        this.holder.classList.add("word-cloud");
        parent.appendChild(this.holder);

        this.wordCount = new MapCounter();
        this.setupUI(column, numberOfWords);
    }

    private setupUI(column: Column, numberOfWords: number): void {
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
            textHolder.innerText = text;

            const proportion = count / maxCount;
            const luminance = proportion * (45 - 10) + 10;
            textHolder.style.background = `hsl(202, 100%, ${luminance}%)`;

            categoryHolder.appendChild(textHolder);
        }
    }
}