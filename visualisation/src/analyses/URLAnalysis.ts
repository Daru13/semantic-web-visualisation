import countries from "../utils/Countries";


export class URLAnalysis {
    url: URL;
    href: string;
    title: string | null;
    protocol: string;
    tld: string;
    domain: string;
    subdomains: string[];
    path: string[];
    anchor: string;
    parameters: URLSearchParams;
    country: string | null;
    countryCode: string | null;

    constructor(href: string) {
        this.url = new URL(href);
        this.analyse();
    }

    private analyse(): void {
        // General information
        const hostnameParts = this.url.hostname.split(".");
        this.url = this.url;
        this.href = this.url.href;
        this.protocol = this.url.protocol.slice(0, -1);
        this.tld = hostnameParts.pop();
        this.domain = hostnameParts.pop();
        this.subdomains = hostnameParts;
        this.path = this.url.pathname.slice(1).split("/");
        this.anchor = this.url.hash.slice(1);
        this.parameters = this.url.searchParams;

        // Country
        const countryCode = this.extractCountryCode();
        this.country = countries[countryCode] ?? null;
        this.countryCode = countryCode;

        // Title
        const title = this.extractTitle();
        this.title = title;
    }

    private extractTitle(): string | null {
        return null; // TODO
    }

    private extractCountryCode(): string | null {
        // 1. Country code as the last subdomain
        const lastSubdomain = this.url.hostname.slice(
            0,
            this.url.hostname.indexOf(".")
        ).toUpperCase();

        if (countries.hasOwnProperty(lastSubdomain)) {
            return lastSubdomain;
        }

        // 2. Country code as the first path element
        const firstPathElement = this.url.pathname.slice(
            1,
            this.url.hostname.indexOf("/", 1)
        ).toUpperCase();

        if (countries.hasOwnProperty(firstPathElement)) {
            return firstPathElement;
        }


        // 3. Country code as the TLD
        const tld = this.url.hostname.slice(
            this.url.hostname.lastIndexOf(".")
        ).toUpperCase();

        if (countries.hasOwnProperty(tld)) {
            return tld;
        }

        return null;
    }

    public get(param: string): string {
        switch(param) {
            case "countryCode":
                return this.countryCode;
            case "domain":
                return this.domain;
            case "protocol":
                return this.protocol;
            default:
                console.error("No parameter of name: ", param);
        }
    }
}