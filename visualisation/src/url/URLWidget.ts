import { URLAnalysis } from './URLAnalysis';


export class URLWidget {
    node: HTMLElement;
    private analysis: URLAnalysis;

    constructor(href: string) {
        this.analysis = new URLAnalysis(href);
        this.createNode();
    }

    createNode() {
        const node = document.createElement("div");
        node.classList.add("url-widget");
        this.node = node;

        /*
        const lock = document.createElement("span");
        lock.classList.add("protocol", this.analysis.protocol);
        node.appendChild(lock);
        */

        const flag = document.createElement("span");
        const flagCode = this.analysis.countryCode !== null
                       ? this.analysis.countryCode.toLowerCase()
                       : "unknown";
        flag.classList.add("country", "flag", "flag-" + flagCode);
        node.appendChild(flag);

        /*
        const subdomains = document.createElement("span");
        subdomains.classList.add("subdomains");
        subdomains.textContent = this.analysis.subdomains.join(".");
        node.appendChild(subdomains);
        */

        const domain = document.createElement("span");
        domain.classList.add("domain");
        domain.textContent = this.analysis.domain;
        node.appendChild(domain);

        /*
        const tld = document.createElement("span");
        tld.classList.add("tld");
        tld.textContent = this.analysis.tld;
        node.appendChild(tld);
        */

        const path = document.createElement("span");
        path.classList.add("path");
        path.innerHTML = `<span class="slash">/</span>`
                       + this.analysis.path.map(decodeURIComponent).join(`<span class="slash">/</span>`);
        node.appendChild(path);
    }
}