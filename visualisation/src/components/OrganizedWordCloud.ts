import { Column } from '../dataStructures/DataFrame';
import { URLAnalysis } from '../analyses/URLAnalysis';
import { ColumnAnalysis } from '../analyses/ColumnAnalysis';

export class OrganizedWordCloud {
    holder: HTMLDivElement;
    wordCount: Map<string, number>;

    constructor(column: Column) {
        this.holder = document.createElement("div");
        this.holder.classList.add("word-cloud");
        document.body.appendChild(this.holder);
        this.wordCount = new Map();
        
        this.countWords(column);
        this.setupUI(column);
    }
    
    private countWords(column: Column): void {
        let analyse;
        let word;
        for (let url of column) {
            try {
                analyse = new URLAnalysis(url);
                word = analyse.path[analyse.path.length - 1];
                word = decodeURI(word);
                word = word.toLowerCase();
                word = word.replace(/\(.*\)/g, "");
                word = word.replace(/_/g, " ");
                word = word.trim();
                this.addWord(word);
            } catch (error) {
                word = url;
                let words = word.split(/,|;|\/| - | et /g);
                words.forEach((w: string) => {
                    w = w.toLowerCase();
                    w = w.replace(/"| etc|/gi, "");
                    w = w.trim();
                    this.addWord(w);
                })
            }
        }
    }

    private addWord(word: string): void {
        if (!this.wordCount.has(word)) {
            this.wordCount.set(word, 0);
        }
        let count = this.wordCount.get(word) + 1;
        this.wordCount.set(word, count);
    } 

    private setupUI(column: Column): void {
        let topHolder: HTMLDivElement;
        let textHolder: HTMLDivElement;
        let wordNb = 0;

        this.sortMap(this.wordCount).forEach(({ key: text, val: count }) => {
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

    private sortMap(map: Map<string, number>): { key: string, val: number }[] {
        let temp: { key: string, val: number }[] = [];

        map.forEach((v, k, _) => {
            let i = 0;
            while (i < temp.length && temp[i].val > v) {
                i += 1;
            }
            temp.splice(i, 0, { key: k, val: v });
        })

        return temp;
    }
}