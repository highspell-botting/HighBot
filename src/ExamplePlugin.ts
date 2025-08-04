import {Plugin, SettingsTypes} from "@highlite/plugin-api";
import { PanelManager } from "@highlite/plugin-api";
import ExampleHTML from "../resources/html/html.html";
import ExampleCSS from "../resources/css/base.css";
import ExampleImage from "../resources/images/icon.png";
import ExampleSound from "../resources/sounds/sample.mp3";

export default class ExamplePlugin extends Plugin {
    panelManager: PanelManager = new PanelManager();
    pluginName = "ExamplePlugin";
    author: string = "Your Name";

    constructor() {
        super()
        this.settings.ExampleSettings = {
            text: "Example Setting",
            type: SettingsTypes.checkbox,
            value: false,
            callback: () => this.exampleSettingCallback()
        }
    };

    private exampleSettingCallback() {
        this.warn("Setting Changed!");
    }

    init(): void {
    }

    start(): void {
        this.log("ExamplePlugin started");

        // Create Panel
        let panelItems : HTMLElement[] = this.panelManager.requestMenuItem('⚡️', 'Example Plugin')

        // Example HTML Inclusion
        panelItems[1].innerHTML = ExampleHTML;

        // Create Scoped CSS
        let styleTag : HTMLStyleElement = document.createElement("style");
        styleTag.innerText = `${ExampleCSS}`;
        panelItems[1].appendChild(styleTag);

        // Example Image Inclusion
        let imgTag : HTMLImageElement = panelItems[1].getElementsByTagName("img")[0];
        imgTag.src = ExampleImage;

        let buttonTag : HTMLButtonElement = panelItems[1].getElementsByTagName("button")[0];
        buttonTag.onclick = () => {
            // Play Audio
            let audioTag : HTMLAudioElement = document.createElement("audio");
            panelItems[1].appendChild(audioTag);
            audioTag.src = ExampleSound;
            audioTag.play().then(() => {
                audioTag.addEventListener("ended", () => {
                    audioTag.remove();
                })
            })
        }
    }

    stop(): void {
        this.log("ExamplePlugin stopped");
        this.panelManager.removeMenuItem('⚡️');
    }
}
