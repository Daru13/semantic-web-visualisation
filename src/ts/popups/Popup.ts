/** A class to create a pop up in the app */
export class Popup{
    /** The div classed as a pop up */
    private holder: HTMLDivElement;
    /** A mask apply behind the pop up to slightly hide the application */
    private maskBackground: HTMLDivElement;
    /** The content div inside the pop up */
    readonly content: HTMLDivElement;

    /** Title of the popup */
    private title: string;
    /** Function called when the pop up is closing */
    private onClose: () => void;

    constructor(displayMask = false) {
        this.holder = document.createElement("div");
        this.holder.classList.add("popup");

        this.content = document.createElement("div");
        this.content.classList.add("popup-content");

        if (displayMask) {
            this.initMask();
        }
        this.initUI();

        this.onClose = () => { };
        this.title = "";
    }

    /**
     * Inits ui of the pop up with a title div, a close button and a content div
     */
    initUI(): void {
        let t = this;

        let titleBar = document.createElement("div");
        titleBar.classList.add("popup-titlebar");
        this.holder.appendChild(titleBar);


        let title = document.createElement("h2");
        title.classList.add("popup-title");
        titleBar.appendChild(title);

        let closeButton = document.createElement("button");
        closeButton.classList.add("popup-close-button");
        closeButton.addEventListener("click", () => { t.close(); } );
        closeButton.innerHTML = "Close";
        titleBar.appendChild(closeButton);

        this.holder.appendChild(this.content);
        document.body.appendChild(this.holder);
    }

    /**
     * Inits the background mask
     */
    initMask(): void {
        let t = this;
        this.maskBackground = document.createElement("div");
        this.maskBackground.classList.add("background-mask");
        this.maskBackground.addEventListener("click", () => { t.close(); });

        document.body.appendChild(this.maskBackground);
    }

    /**
     * Sets the title of the pop up
     * @param title title to set
     */
    setTitle(title: string): void {
        this.title = title;
        this.holder.querySelector(".popup-title").innerHTML = this.title;
    }

    /**
     * Sets the max height for the content div
     * @param maxHeight the max size
     */
    setMaxHeightContent(maxHeight: number): void {
        let computedStyle = window.getComputedStyle(this.content, null);
        let paddingTop = parseInt(computedStyle.getPropertyValue("padding-top"));
        let paddingBottom = parseInt(computedStyle.getPropertyValue("padding-bottom"));
        
        this.content.style.maxHeight = `${maxHeight - paddingTop - paddingBottom}px`;
    }

    /** Centers the popup in the window */
    center(): void {
        let popupBoundingBox = this.holder.getBoundingClientRect();
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
    
        let top = (windowHeight / 2) - (popupBoundingBox.height / 2);
        let left = (windowWidth / 2) - (popupBoundingBox.width / 2);

        this.holder.style.top = `${top}px`;
        this.holder.style.left = `${left}px`;
    }

    /** Maximizes the popup */
    maximize(): void {
        this.holder.classList.add("maximized");
    }

    /**
     * Closes the popup and call onClose
     */
    close(): void {
        if (this.maskBackground !== undefined) {
            this.maskBackground.remove();
        }
        this.holder.remove();
        this.onClose();
    }

    /**
     * Sets onClose
     * @param onClose 
     */
    setOnClose(onClose: () => void): void {
        this.onClose = onClose;
    }
}