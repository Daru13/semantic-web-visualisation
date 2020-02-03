import { Column } from '../dataStructures/DataFrame';
import * as d3 from "d3";
import { ColumnAnalysis } from '../analyses/ColumnAnalysis';
import { URLAnalysis } from '../analyses/URLAnalysis';

export class OrganizedWordCloud {
    holder: HTMLDivElement;
    wordCount: Map<string, number>;

    constructor(column: Column) {
        this.holder = document.createElement("div");
        this.holder.classList.add("word-cloud");
        document.body.appendChild(this.holder);
        this.wordCount = new Map();
        
        this.countWords(column);
        this.setupUI();
    }
    
    private countWords(column: Column): void {
        let analyse;
        let word;
        for (let url of column) {
            try {
                analyse = new URLAnalysis(url);
                word = analyse.path[analyse.path.length - 1];
                word = word.replace(/^\(.*\)$/, "");
                word = word.replace(/_/, " ");
                if (word[word.length - 1] === " ") {
                    word = word.slice(0, -1)
                }
                this.addWord(word);
            } catch (error) {
                this.addWord(word);
            }
        }
        console.log(this.wordCount);
    }

    private addWord(word: string): void {
        if (!this.wordCount.has(word)) {
            this.wordCount.set(word, 0);
        }
        let count = this.wordCount.get(word) + 1;
        this.wordCount.set(word, count);
    } 

    private setupUI(): void {
        this.holder.style.display = "flex";
        this.holder.style.position = "absolute";
        this.holder.style.flexWrap = "wrap";
        this.holder.style.background = "white";
        
        let textHolder;

        this.sortMap(this.wordCount).forEach(({ key: text, val: count }) => {
            textHolder = document.createElement("div");
            textHolder.classList.add("word-cloud-text-holder");
            textHolder.innerText = text;
            textHolder.style.margin = "2px";
            textHolder.style.border = "2px solid black";

            this.holder.appendChild(textHolder);
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