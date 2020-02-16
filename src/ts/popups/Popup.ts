export class Popup {
    private static nbOpenPopups = 0;

    private holder: HTMLDivElement;
    private maskBackground: HTMLDivElement;
    readonly content: HTMLDivElement;

    private title: string;
    private onClose: () => void;

    constructor(title = "", displayMask = false) {
        this.holder = document.createElement("div");
        this.holder.classList.add("popup");

        this.content = document.createElement("div");
        this.content.classList.add("popup-content");

        this.onClose = () => { };
        this.title = title;

        this.init(displayMask);
    }

    init(displayMask: boolean): void {
        if (displayMask) {
            this.initMask();
        }
        this.initUI();
        this.display();
    }

    initUI(): void {
        let titleBar = document.createElement("div");
        titleBar.classList.add("popup-titlebar");
        this.holder.appendChild(titleBar);


        let title = document.createElement("h2");
        title.textContent = this.title;
        title.classList.add("popup-title");
        titleBar.appendChild(title);

        let closeButton = document.createElement("button");
        closeButton.classList.add("popup-close-button");
        closeButton.addEventListener("click", () => { this.close(); } );
        closeButton.innerHTML = "Close";
        titleBar.appendChild(closeButton);

        this.holder.appendChild(this.content);
    }

    display(): void {
        Popup.nbOpenPopups += 1;
        document.body.classList.add("popup-displayed");

        document.body.appendChild(this.holder);
    }

    initMask(): void {
        this.maskBackground = document.createElement("div");
        this.maskBackground.classList.add("background-mask");
        this.maskBackground.addEventListener("click", () => { this.close(); });

        document.body.appendChild(this.maskBackground);
    }

    setTitle(title: string): void {
        this.title = title;
        this.holder.querySelector(".popup-title").innerHTML = this.title;
    }

    setMaxHeightContent(maxHeight: number): void {
        let computedStyle = window.getComputedStyle(this.content, null);
        let paddingTop = parseInt(computedStyle.getPropertyValue("padding-top"));
        let paddingBottom = parseInt(computedStyle.getPropertyValue("padding-bottom"));
        
        this.content.style.maxHeight = `${maxHeight - paddingTop - paddingBottom}px`;
    }

    center(): void {
        let popupBoundingBox = this.holder.getBoundingClientRect();
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
    
        let top = (windowHeight / 2) - (popupBoundingBox.height / 2);
        let left = (windowWidth / 2) - (popupBoundingBox.width / 2);

        this.holder.style.top = `${top}px`;
        this.holder.style.left = `${left}px`;
    }

    maximize(): void {
        this.holder.classList.add("maximized");
    }

    close(): void {
        Popup.nbOpenPopups -= 1;
        if (Popup.nbOpenPopups === 0) {
            document.body.classList.remove("popup-displayed");
        }

        if (this.maskBackground !== undefined) {
            this.maskBackground.remove();
        }

        this.holder.remove();
        this.onClose();
    }

    setOnClose(onClose: () => void): void {
        this.onClose = onClose;
    }
}