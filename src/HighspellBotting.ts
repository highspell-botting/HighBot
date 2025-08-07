import { Plugin, SettingsTypes, UIManager, PanelManager, Reflector, HookManager, DatabaseManager} from "@highlite/plugin-api";
import { HighspellBottingScripts } from "./HighspellBottingScripts";
import { SCRIPT_METADATA } from "./metadata/ScriptMetadata";
import { ScriptMetadata } from "./types/ScriptTypes";
import BottingPanelHTML from "../resources/html/botting-panel.html";
import BottingPanelCSS from "../resources/css/botting-panel.css";

// Interfaces for game objects
interface GamePosition {
  X: number;
  Z: number;
  Y?: number;
}

interface GameEntity {
  EntityID?: number;
  EntityTypeID?: number;
  id?: number;
  TypeID?: number;
  Name?: string;
  CurrentGamePosition?: GamePosition;
  Actions?: number[];
  AreResourcesExhausted?: boolean;
  Def?: any;
  CurrentState?: any;
  CurrentTarget?: any;
  Hitpoints?: {
    CurrentLevel: number;
    Level: number;
  };
}

interface GameItem {
  _id?: number;
  Def?: {
    ID: number;
    Name: string;
    InventoryActions?: number[];
    EdibleEffects?: Array<{
      Amount: number;
      Type?: string;
    }>;
  };
  Amount?: number;
  IsIOU?: boolean;
}

interface GameSpell {
  _id?: number;
  Name?: string;
  Type?: number;
  Recipe?: {
    Ingredients?: Array<{
      ItemID: number;
      Amount: number;
    }>;
  };
}

interface GamePlayer {
  EntityID: number;
  CurrentGamePosition: GamePosition;
  CurrentMapLevel: number;
  Hitpoints: {
    CurrentLevel: number;
    Level: number;
  };
  Skills?: {
    Skills?: Array<{
      CurrentLevel: number;
    }>;
  };
  Inventory?: {
    Items: (GameItem | null)[];
  };
  CurrentState?: {
    isMoving?: () => boolean;
    getCurrentState?: () => number;
    _targetId?: number;
  };
  CurrentTarget?: any;
}

interface GameManagers {
  EntityManager?: {
    Instance?: {
      MainPlayer?: GamePlayer;
      Players?: GamePlayer[];
      NPCs?: GameEntity[];
    };
  };
  WorldEntityManager?: {
    Instance?: {
      _worldEntities?: GameEntity[];
    };
  };
  GroundItemManager?: {
    Instance?: {
      GroundItems?: GameEntity[];
      _groundItems?: GameEntity[];
    };
  };
  WorldMapManager?: {
    Instance?: {
      AreWorldEntitiesLoading?: boolean;
    };
  };
  ItemManager?: {
    Instance?: {
      IsAwaitingItemAction?: boolean;
      invokeInventoryAction?: (menuType: number, action: number, slot: number, item: GameItem) => void;
      emitCreateItemActionPacket?: (menuType: number, itemId: number, amount: number) => void;
      emitInventoryItemActionPacket?: (action: number, menuType: number, slot: number, itemId: number, amount: number, isIOU: boolean) => void;
      useItemOnEntity?: (item: GameItem, entity: GameEntity) => void;
    };
  };
  ChatManager?: {
    Instance?: any;
  };
  ChatMessage?: {
    getChatType?: () => any;
    getChatMessageType?: () => any;
    getMessage?: () => string;
    getOriginalMessage?: () => string;
    getDuplicateMessageCount?: () => number;
    getElement?: () => HTMLElement;
    getNameElement?: () => any;
    getMessageElement?: () => any;
  };
  SocketManager?: {
    Instance?: {
      emitPacket?: (packet: any) => void;
      _handleWentThroughDoorPacket?: (e: any) => void;
      _handleTeleportToPacket?: (e: any) => void;
    };
  };
  SpellManager?: {
    Instance?: {
      castTeleportSpell?: (spell: GameSpell) => void;
      castSpellOnItem?: (spell: GameSpell, menuType: number, slot: number, itemId: number, isIOU: boolean) => void;
    };
  };
  SpellDefinitionManager?: {
    Instance?: {
      Defs?: Map<string, GameSpell>;
    };
  };
  TargetActionManager?: {
    handleTargetAction?: (action: number, entity: GameEntity) => boolean;
    handleWalkTo?: (x: number, z: number) => boolean;
  };
  UIManager?: any;
}

export default class HighspellBotting extends Plugin {
  // Plugin metadata
  pluginName = "HighBot";
  author = "highspell-botting";

  // Managers
  private panelManager: PanelManager = new PanelManager();
  private uiManager: UIManager = new UIManager();
  private hookManager: HookManager = new HookManager();
  private databaseManager: DatabaseManager = new DatabaseManager();

  // Game manager references
  private entityManager: any = null;
  private targetActionManager: any = null;
  private worldEntityManager: any = null;
  private groundItemManager: any = null;
  private worldMapManager: any = null;
  private itemManager: any = null;
  private chatManager: any = null;
  private chatMessage: any = null;
  private socketManager: any = null;
  private spellManager: any = null;
  private spellDefinitionManager: any = null;
  private UIManager: any = null;

  // UI elements
  private panelElement: HTMLElement | null = null;
  private currentScript = "scriptWoodcutting";

  // Cache for ordered entities
  private orderedWorldEntities: GameEntity[] = [];
  private lastEntityUpdate = 0;
  private entityUpdateInterval = 1000; // Update every second

  // Script management
  private scripts: HighspellBottingScripts | null = null;
  private isScriptRunning = false;
  private currentScriptFunction: any = null;
  private scriptInputs: Record<string, HTMLInputElement> = {};
  private scriptInterval: number | null = null;

  // State tracking
  private skilling = false;
  private usingDoor = false;
  private teleporting = false;
  private monitorRunning = false;

  // Original function references for restoration
  private originalHandleWentThroughDoorPacket: ((e: any) => void) | null = null;
  private originalAddChatMessage: ((e: any, t: any, i: any, n: any, r: any, s: any, a: any, o: any, l: any, h: any, c: any, u: any, d: any, p: any) => void) | null = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    super();

    // Settings for the plugin
    this.settings.enable = {
      text: "Enable HighBot",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => {
        if (this.settings.enable.value) {
          this.start();
        } else {
          this.stop();
        }
      }
    };

    this.settings.extendChatMessages = {
      text: "Extend Chat Messages",
      type: SettingsTypes.checkbox,
      value: false,
      callback: () => { }
    };
    this.settings.displayGlobalMessages = {
      text: "Display Global Messages",
      type: SettingsTypes.checkbox,
      value: true,
      callback: () => { }
    };
    this.settings.maxChatMessages = {
      text: "Max Chat Messages",
      type: SettingsTypes.range,
      value: 30,
      min: 10,
      max: 1000,
      callback: () => { }
    };
    this.settings.publicMessageWarning = {
      text: "Warn on Public Messages",
      type: SettingsTypes.checkbox,
      value: false,
      callback: () => { }
    };
    this.settings.loggedInNotify = {
      text: "Notify on Friend Login",
      type: SettingsTypes.checkbox,
      value: false,
      callback: () => { }
    };
  }

  // Database storage methods for parameter persistence
  private saveParameterOption(scriptName: string, paramName: string, value: string): void {
    try {
      const key = `scriptParams_${scriptName}_${paramName}`;
      
      // Initialize if not exists
      if (!this.data.parameterOptions) {
        this.data.parameterOptions = {};
      }
      if (!this.data.parameterOptions[key]) {
        this.data.parameterOptions[key] = [];
      }
      
      const existingData = this.data.parameterOptions[key];
      
      if (!existingData.includes(value)) {
        existingData.push(value);
        // No need to manually save - this.data is automatically persisted
      }
    } catch (error) {
      this.log(`Error saving parameter option: ${error}`);
    }
  }

  private loadParameterOptions(scriptName: string, paramName: string): string[] {
    try {
      const key = `scriptParams_${scriptName}_${paramName}`;
      
      // Initialize if not exists
      if (!this.data.parameterOptions) {
        this.data.parameterOptions = {};
      }
      if (!this.data.parameterOptions[key]) {
        this.data.parameterOptions[key] = [];
      }
      
      return this.data.parameterOptions[key];
    } catch (error) {
      this.log(`Error loading parameter options: ${error}`);
      return [];
    }
  }

  private removeParameterOption(scriptName: string, paramName: string, value: string): void {
    try {
      const key = `scriptParams_${scriptName}_${paramName}`;
      
      // Initialize if not exists
      if (!this.data.parameterOptions) {
        this.data.parameterOptions = {};
      }
      if (!this.data.parameterOptions[key]) {
        this.data.parameterOptions[key] = [];
      }
      
      const existingData = this.data.parameterOptions[key];
      const filteredData = existingData.filter((item: string) => item !== value);
      this.data.parameterOptions[key] = filteredData;
      // No need to manually save - this.data is automatically persisted
    } catch (error) {
      this.log(`Error removing parameter option: ${error}`);
    }
  }

  init(): void {
    this.log("Highspell Botting Plugin initialized");
  }

  start(): void {
    // Get manager references from gameHooks
    this.entityManager = this.gameHooks.EntityManager?.Instance;
    this.worldEntityManager = this.gameHooks.WorldEntityManager?.Instance;
    this.groundItemManager = this.gameHooks.GroundItemManager?.Instance;
    this.worldMapManager = this.gameHooks.WorldMapManager?.Instance;
    this.itemManager = this.gameHooks.ItemManager?.Instance;
    this.chatManager = this.gameHooks.ChatManager?.Instance;

    // Try to get ChatMessage from gameHooks first, then use Reflector if not available
    this.chatMessage = this.gameHooks.ChatMessage;
    if (!this.chatMessage) {
      // Use Reflector to find the iH class (ChatMessage) directly
      const chatMessageSignature = {
        methods: ['getChatType', 'getChatMessageType', 'getMessage', 'getOriginalMessage', 'getDuplicateMessageCount', 'getElement', 'getNameElement', 'getMessageElement'],
        contains: '_createControl'
      };

      try {
        const chatMessageClassInfo = Reflector.findClassBySignature(chatMessageSignature);
        if (chatMessageClassInfo) {
          // The ClassInfo object has a 'name' property with the obfuscated class name
          // We need to get the actual class constructor from the global scope
          this.hookManager.registerClass(chatMessageClassInfo.name, 'ChatMessage');
          this.chatMessage = this.gameHooks.ChatMessage;
          if (this.chatMessage) {
            this.log("Found ChatMessage class via Reflector:");
          } else {
            this.log("Warning: Found ChatMessage ClassInfo but could not get constructor");
          }
        } else {
          this.log("Warning: Could not find ChatMessage class via Reflector");
        }
      } catch (error) {
        this.log("Error finding ChatMessage via Reflector:", error);
      }
    }

    this.socketManager = this.gameHooks.SocketManager?.Instance;
    this.spellManager = this.gameHooks.SpellManager?.Instance;
    this.UIManager = this.gameHooks.UIManager;
    this.spellDefinitionManager = this.gameHooks.SpellDefinitionManager?.Instance;
    this.targetActionManager = this.gameHooks.TargetActionManager;

    // Initialize script system
    this.scripts = new HighspellBottingScripts(this);
    this.isScriptRunning = false;
    this.currentScriptFunction = null;
    this.scriptInputs = {};

    // Initialize state variables
    this.skilling = false;
    this.usingDoor = false;
    this.teleporting = false;
    this.monitorRunning = false;

    this.overrideMethods();


    // Log manager availability for debugging
    this.log("Manager initialization:");
    this.log(`EntityManager: ${!!this.entityManager}`);
    this.log(`WorldEntityManager: ${!!this.worldEntityManager}`);
    this.log(`GroundItemManager: ${!!this.groundItemManager}`);
    this.log(`WorldMapManager: ${!!this.worldMapManager}`);
    this.log(`ItemManager: ${!!this.itemManager}`);
    this.log(`ChatManager: ${!!this.chatManager}`);
    this.log(`ChatMessage: ${!!this.chatMessage}`);
    this.log(`SocketManager: ${!!this.socketManager}`);
    this.log(`SpellManager: ${!!this.spellManager}`);
    this.log(`UIManager: ${!!this.UIManager}`);
    this.log(`SpellDefinitionManager: ${!!this.spellDefinitionManager}`);
    this.log(`TargetActionManager: ${!!this.targetActionManager}`);

    this.createBottingPanel();

    // Initialize audio context for buzzer functionality
    this.initializeAudioContext();
  }

  stop(): void {
    this.log("Highspell Botting Plugin stopped");

    // Remove panel menu item
    this.panelManager.removeMenuItem('💎');

    // Clear references
    this.entityManager = null;
    this.targetActionManager = null;
    this.worldEntityManager = null;
    this.groundItemManager = null;
    this.worldMapManager = null;
    this.itemManager = null;
    this.chatManager = null;
    this.chatMessage = null;
    this.socketManager = null;
    this.spellManager = null;
    this.originalAddChatMessage = null;
    this.panelElement = null;

    // Clear caches
    this.orderedWorldEntities = [];
    this.lastEntityUpdate = 0;

    // Stop any running script
    this.stopCurrentScript();

    // Restore original SocketManager functions if we overrode them
    if (this.socketManager && this.originalHandleWentThroughDoorPacket) {
      this.socketManager._handleWentThroughDoorPacket = this.originalHandleWentThroughDoorPacket;
      this.originalHandleWentThroughDoorPacket = null;
      this.log("Restored original SocketManager._handleWentThroughDoorPacket");
    }

    if (this.socketManager && this.originalHandleTeleportToPacket) {
      this.socketManager._handleTeleportToPacket = this.originalHandleTeleportToPacket;
      this.originalHandleTeleportToPacket = null;
      this.log("Restored original SocketManager._handleTeleportToPacket");
    }

    if (this.socketManager && this.originalHandlePublicMessagePacket) {
      this.socketManager._handlePublicMessagePacket = this.originalHandlePublicMessagePacket;
      this.originalHandlePublicMessagePacket = null;
      this.log("Restored original SocketManager._handlePublicMessagePacket");
    }

    // Clear script references
    this.scripts = null;
    this.isScriptRunning = false;
    this.currentScriptFunction = null;
    this.scriptInputs = {};
  }

  private overrideMethods(): void {
    // Override SocketManager's _handleWentThroughDoorPacket to track door usage
    if (this.socketManager && this.socketManager._handleWentThroughDoorPacket) {
      // Store the original function
      this.originalHandleWentThroughDoorPacket = this.socketManager._handleWentThroughDoorPacket;

      // Create our custom wrapper
      this.socketManager._handleWentThroughDoorPacket = (e: any) => {
        console.log("SocketManager - handleWentThroughDoorPacket received");
        console.log(e);

        try {
          let t = e[0];
          let i = e[1];

          // Check if the EntityID matches the MainPlayer's EntityID
          if (i == this.entityManager.MainPlayer.EntityID) {
            this.usingDoor = false;
            this.log("Door usage completed - setting usingDoor to false");
          }

          // Call the original function
          if (this.originalHandleWentThroughDoorPacket) {
            this.originalHandleWentThroughDoorPacket(e);
          }

        } catch (e) {
          console.error(e);
        }
      };

      this.log("Successfully overrode SocketManager._handleWentThroughDoorPacket");
    } else {
      this.log("Warning: SocketManager or _handleWentThroughDoorPacket not available");
    }

    // Override SocketManager's _handleTeleportToPacket to track teleporting
    if (this.socketManager && this.socketManager._handleTeleportToPacket) {
      // Store the original function BEFORE replacing it
      const originalFunction = this.socketManager._handleTeleportToPacket;

      // Create our custom wrapper
      this.socketManager._handleTeleportToPacket = (e: any) => {
        console.log("SocketManager - _handleTeleportToPacket received");
        console.log(e);

        try {
          // Check if this is the main player teleporting
          if (e[0] === this.entityManager.MainPlayer.EntityID) {
            this.teleporting = false;
            this.log("Teleport completed - setting teleporting to false");
          }

          // Call the original function directly
          originalFunction.call(this.socketManager, e);

        } catch (e) {
          console.error(e);
        }
      };

      this.log("Successfully overrode SocketManager._handleTeleportToPacket");
    } else {
      this.log("Warning: SocketManager or _handleTeleportToPacket not available");
    }

    // Override SocketManager's _handlePublicMessagePacket to track chat messages
    if (this.socketManager && this.socketManager._handlePublicMessagePacket) {
      // Store the original function BEFORE replacing it
      const originalFunction = this.socketManager._handlePublicMessagePacket;

      // Create our custom wrapper
      this.socketManager._handlePublicMessagePacket = (e: any) => {

        try {
          if (this.settings.publicMessageWarning.value) {
            this.messageWarn()
          }

          // Call the original function directly
          originalFunction.call(this.socketManager, e);

        } catch (e) {
          console.error(e);
        }
      };

      this.log("Successfully overrode SocketManager._handlePublicMessagePacket");
    } else {
      this.log("Warning: SocketManager or _handlePublicMessagePacket not available");
    }

    const chatMenuController = (this.UIManager).Manager.getController().ChatMenuController._chatMenuQuadrant._chatMenu;

    //Override friend logged in or out
    if (chatMenuController && chatMenuController._handleFriendLoggedInOrOut) {
      // Store the original function BEFORE replacing it
      const originalFunction = chatMenuController._handleFriendLoggedInOrOut;

      // Override
      chatMenuController._handleFriendLoggedInOrOut = (e: any, t: any) => {
        if (this.settings.loggedInNotify.value && t.IsOnline) {
          this.loggedInNotify()
        }
        originalFunction.call(chatMenuController, e, t);
      };
      this.log("Successfully overrode ChatMenuController._handleFriendLoggedInOrOut");
    } else {
      this.log("Warning: ChatMenuController or _handleFriendLoggedInOrOut not available");
    }

    //Override addChatMessage to control public message length
    if (chatMenuController && chatMenuController.addChatMessage) {
      // Store the original function BEFORE replacing it
      this.originalAddChatMessage = chatMenuController.addChatMessage;

      // e[e.Private = 0] = "Private",
      // e[e.Public = 1] = "Public",
      // e[e.Global = 2] = "Global",
      // e[e.Trade = 3] = "Trade",
      // e[e.Clan = 4] = "Clan"

      // e[e.Yellow = 0] = "Yellow",
      // e[e.Blue = 1] = "Blue",
      // e[e.Green = 2] = "Green",
      // e[e.Red = 3] = "Red",
      // e[e.Cyan = 4] = "Cyan",
      // e[e.Purple = 5] = "Purple",
      // e[e.Orange = 6] = "Orange",
      // e[e.White = 7] = "White",
      // e[e.Black = 8] = "Black",
      // e[e.Random = 9] = "Random",
      // e[e.Lime = 10] = "Lime",
      // e[e.Magenta = 11] = "Magenta",
      // e[e.Warning = 12] = "Warning"
      // Override
      chatMenuController.addChatMessage = (e: any, t: any, i: any, n: any, r: any, s: any, a: any, o: any, l: any, h: any, c: any, u: any, d: any, p: any) => {
        try {
          // Custom length for public messages (keep _publicMessages.length below 300)
          const maxPublicMessages = this.settings.maxChatMessages.value;

          // Remove oldest messages if we're at the limit
          for (; chatMenuController._publicMessages.length >= maxPublicMessages;) {
            chatMenuController._removeOldestChatMessage(chatMenuController._publicMessages, chatMenuController._publicMessageList);
          }

          // Check for duplicate messages
          if (l && chatMenuController._publicMessages.length > 0 &&
            chatMenuController._publicMessages[chatMenuController._publicMessages.length - 1].getOriginalMessage() === n) {
            chatMenuController._publicMessages[chatMenuController._publicMessages.length - 1].updateDuplicateMessageCount();
          } else if (s !== 2 || this.settings.displayGlobalMessages.value) { // 2 = wG.Global
            // Create new ChatMessage using the hooked constructor
            const newChatMessage = new this.chatMessage(e, t, i, n, r, s === 2 ? r : 0, s, a, o, h, u, d, p); // 0 = cF.Yellow
            chatMenuController._publicMessages.push(newChatMessage);
            chatMenuController._publicMessageList.appendChild(newChatMessage.getElement());

            // Scroll to bottom if needed
            const scrollThreshold = 50; // rH value
            if ((chatMenuController._publicMessageListContainer.scrollHeight - chatMenuController._publicMessageListContainer.scrollTop <= scrollThreshold || !c)) {
              chatMenuController._scrollToBottom();
            }
          }
        } catch (error) {
          console.error("Error in addChatMessage override:", error);
        }
      };
      this.log("Successfully overrode ChatMenuController.addChatMessage");
    } else {
      this.log("Warning: ChatMenuController or addChatMessage not available");
    }
  }

  // Create the main botting panel using PanelManager
  private createBottingPanel(): void {
    // Create panel menu item using PanelManager
    let panelItems: HTMLElement[] = this.panelManager.requestMenuItem('💎', 'HighBot');

    // Build script options - sorted alphabetically by name
    const scriptOptions = Object.entries(SCRIPT_METADATA)
      .sort(([, metadataA], [, metadataB]) => metadataA.name.localeCompare(metadataB.name))
      .map(([key, metadata]) =>
        `<option value="${key}">${metadata.name}</option>`
      ).join('');

    // Replace the placeholder in the HTML template
    const panelHTML = BottingPanelHTML.replace(
      '<!-- Script options will be dynamically inserted here -->',
      scriptOptions
    );

    // Add content to panel
    panelItems[1].innerHTML = panelHTML;

    // Add event listeners
    const scriptSelect = panelItems[1].querySelector('#script-select') as HTMLSelectElement;
    const runBtn = panelItems[1].querySelector('#run-script') as HTMLButtonElement;
    const stopBtn = panelItems[1].querySelector('#stop-script') as HTMLButtonElement;

    scriptSelect.onchange = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      this.currentScript = target.value;
      this.updateScriptPanel(panelItems[1]);
    };

    runBtn.onclick = () => this.runCurrentScript();
    stopBtn.onclick = () => this.stopCurrentScript();

    // Store reference to panel for updates
    this.panelElement = panelItems[1];

    // Create the initial script panel
    this.updateScriptPanel(panelItems[1]);

    // Add CSS styles
    const styleTag = document.createElement("style");
    styleTag.innerText = BottingPanelCSS;
    panelItems[1].appendChild(styleTag);
  }

  // Update the script panel based on selected script
  private updateScriptPanel(panelElement: HTMLElement): void {
    if (!panelElement) return;

    const scriptPanel = panelElement.querySelector('#script-panel');
    if (!scriptPanel) return;

    scriptPanel.innerHTML = "";

    if (!this.currentScript) {
      scriptPanel.innerHTML = "<p>Select a script to configure it.</p>";
      return;
    }

    const metadata = SCRIPT_METADATA[this.currentScript];
    if (!metadata) {
      scriptPanel.innerHTML = "<p>Unknown script selected.</p>";
      return;
    }

    this.createScriptPanel(scriptPanel, metadata);
  }

  // Create script panel based on metadata
  private createScriptPanel(scriptPanel: Element, metadata: ScriptMetadata): void {
    const container = document.createElement("div");

    // Add description
    if (metadata.description) {
      const descriptionDiv = document.createElement("div");
      descriptionDiv.className = "script-description";
      descriptionDiv.textContent = metadata.description;
      container.appendChild(descriptionDiv);
    }

    // Add parameter inputs
    if (metadata.parameters && metadata.parameters.length > 0) {
      for (const param of metadata.parameters) {
        const paramDiv = document.createElement("div");
        paramDiv.className = "input-group";
        paramDiv.style.position = "relative";
        paramDiv.style.marginBottom = "10px";

        const paramLabel = document.createElement("label");
        paramLabel.textContent = param.label + ":";
        paramLabel.style.display = "block";
        paramLabel.style.marginBottom = "5px";

        let paramInput: HTMLInputElement;
        
        if (param.type === "boolean") {
          paramInput = document.createElement("input");
          paramInput.type = "checkbox";
          paramInput.id = `param-${param.name}`;
          this.scriptInputs[param.name] = paramInput;
          
          paramDiv.appendChild(paramLabel);
          paramDiv.appendChild(paramInput);
          container.appendChild(paramDiv);
        } else {
          // Load saved options for text parameters
          const savedOptions = this.loadParameterOptions(this.currentScript, param.name);
          
          if (savedOptions.length > 0) {
            // Create custom dropdown container
            const dropdownContainer = document.createElement("div");
            dropdownContainer.className = "custom-dropdown";
            dropdownContainer.style.position = "relative";
            dropdownContainer.style.display = "block";
            dropdownContainer.style.width = "100%";
            
            paramInput = document.createElement("input");
            paramInput.type = "text";
            paramInput.placeholder = param.placeholder || "";
            paramInput.style.width = "100%";
            paramInput.style.boxSizing = "border-box";
            paramInput.style.position = "relative";
            paramInput.style.zIndex = "1";
            
            // Add visual indicator for array inputs
            if (param.type === "array") {
              paramInput.setAttribute("data-array", "true");
            }
            
            // Create dropdown list
            const dropdownList = document.createElement("div");
            dropdownList.className = "dropdown-list";
            dropdownList.style.display = "none";
            dropdownList.style.position = "absolute";
            dropdownList.style.top = "calc(100% + 2px)";
            dropdownList.style.left = "0";
            dropdownList.style.right = "0";
            dropdownList.style.backgroundColor = "white";
            dropdownList.style.border = "1px solid #ccc";
            dropdownList.style.borderRadius = "4px";
            dropdownList.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            dropdownList.style.maxHeight = "200px";
            dropdownList.style.overflowY = "auto";
            dropdownList.style.zIndex = "1000";
            
            // Populate dropdown with saved options
            savedOptions.forEach(option => {
              const optionDiv = document.createElement("div");
              optionDiv.className = "dropdown-option";
              optionDiv.style.padding = "8px 12px";
              optionDiv.style.cursor = "pointer";
              optionDiv.style.display = "flex";
              optionDiv.style.justifyContent = "space-between";
              optionDiv.style.alignItems = "center";
              optionDiv.style.borderBottom = "1px solid #eee";
              optionDiv.style.transition = "background-color 0.2s";
              
              // Add hover effect
              optionDiv.addEventListener("mouseenter", () => {
                optionDiv.style.backgroundColor = "#f5f5f5";
              });
              
              optionDiv.addEventListener("mouseleave", () => {
                optionDiv.style.backgroundColor = "white";
              });
              
              const optionText = document.createElement("span");
              optionText.textContent = option;
              
              const removeBtn = document.createElement("button");
              removeBtn.textContent = "×";
              removeBtn.style.background = "none";
              removeBtn.style.border = "none";
              removeBtn.style.color = "#999";
              removeBtn.style.cursor = "pointer";
              removeBtn.style.fontSize = "16px";
              removeBtn.style.fontWeight = "bold";
              removeBtn.style.padding = "0 4px";
              removeBtn.style.borderRadius = "2px";
              removeBtn.style.transition = "all 0.2s";
              removeBtn.title = "Remove this option";
              
              // Add hover effect for remove button
              removeBtn.addEventListener("mouseenter", () => {
                removeBtn.style.color = "red";
                removeBtn.style.backgroundColor = "#ffe6e6";
              });
              
              removeBtn.addEventListener("mouseleave", () => {
                removeBtn.style.color = "#999";
                removeBtn.style.backgroundColor = "transparent";
              });
              
              // Add click handlers - make the entire option div clickable
              optionDiv.addEventListener("click", () => {
                paramInput.value = option;
                dropdownList.style.display = "none";
              });
              
              removeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.removeParameterOption(this.currentScript, param.name, option);
                optionDiv.remove();
                if (dropdownList.children.length === 0) {
                  dropdownList.style.display = "none";
                }
              });
              
              optionDiv.appendChild(optionText);
              optionDiv.appendChild(removeBtn);
              dropdownList.appendChild(optionDiv);
            });
            
            // Show/hide dropdown on input focus/blur
            paramInput.addEventListener("focus", () => {
              if (dropdownList.children.length > 0) {
                dropdownList.style.display = "block";
              }
            });
            
            paramInput.addEventListener("blur", () => {
              // Delay hiding to allow for option clicks
              setTimeout(() => {
                dropdownList.style.display = "none";
              }, 200);
              
              const value = paramInput.value.trim();
              if (value && !savedOptions.includes(value)) {
                this.saveParameterOption(this.currentScript, param.name, value);
                // Add new option to dropdown
                const optionDiv = document.createElement("div");
                optionDiv.className = "dropdown-option";
                optionDiv.style.padding = "8px 12px";
                optionDiv.style.cursor = "pointer";
                optionDiv.style.display = "flex";
                optionDiv.style.justifyContent = "space-between";
                optionDiv.style.alignItems = "center";
                optionDiv.style.borderBottom = "1px solid #eee";
                optionDiv.style.transition = "background-color 0.2s";
                
                // Add hover effect
                optionDiv.addEventListener("mouseenter", () => {
                  optionDiv.style.backgroundColor = "#f5f5f5";
                });
                
                optionDiv.addEventListener("mouseleave", () => {
                  optionDiv.style.backgroundColor = "white";
                });
                
                const optionText = document.createElement("span");
                optionText.textContent = value;
                
                const removeBtn = document.createElement("button");
                removeBtn.textContent = "×";
                removeBtn.style.background = "none";
                removeBtn.style.border = "none";
                removeBtn.style.color = "#999";
                removeBtn.style.cursor = "pointer";
                removeBtn.style.fontSize = "16px";
                removeBtn.style.fontWeight = "bold";
                removeBtn.style.padding = "0 4px";
                removeBtn.style.borderRadius = "2px";
                removeBtn.style.transition = "all 0.2s";
                removeBtn.title = "Remove this option";
                
                // Add hover effect for remove button
                removeBtn.addEventListener("mouseenter", () => {
                  removeBtn.style.color = "red";
                  removeBtn.style.backgroundColor = "#ffe6e6";
                });
                
                removeBtn.addEventListener("mouseleave", () => {
                  removeBtn.style.color = "#999";
                  removeBtn.style.backgroundColor = "transparent";
                });
                
                // Add click handlers - make the entire option div clickable
                optionDiv.addEventListener("click", () => {
                  paramInput.value = value;
                  dropdownList.style.display = "none";
                });
                
                removeBtn.addEventListener("click", (e) => {
                  e.stopPropagation();
                  this.removeParameterOption(this.currentScript, param.name, value);
                  optionDiv.remove();
                  if (dropdownList.children.length === 0) {
                    dropdownList.style.display = "none";
                  }
                });
                
                optionDiv.appendChild(optionText);
                optionDiv.appendChild(removeBtn);
                dropdownList.appendChild(optionDiv);
              }
            });
            
            // Set input ID and store reference
            paramInput.id = `param-${param.name}`;
            this.scriptInputs[param.name] = paramInput;
            
            dropdownContainer.appendChild(paramInput);
            dropdownContainer.appendChild(dropdownList);
            paramDiv.appendChild(paramLabel);
            paramDiv.appendChild(dropdownContainer);
            container.appendChild(paramDiv);
          } else {
            paramInput = document.createElement("input");
            paramInput.type = param.type === "number" ? "number" : "text";
            paramInput.placeholder = param.placeholder || "";
            
            // Add visual indicator for array inputs
            if (param.type === "array") {
              paramInput.setAttribute("data-array", "true");
            }
            
            // Add event listener to save new values when no saved options exist
            paramInput.addEventListener("blur", () => {
              const value = paramInput.value.trim();
              if (value) {
                this.saveParameterOption(this.currentScript, param.name, value);
              }
            });
            
            paramInput.id = `param-${param.name}`;
            this.scriptInputs[param.name] = paramInput;
            
            paramDiv.appendChild(paramLabel);
            paramDiv.appendChild(paramInput);
            container.appendChild(paramDiv);
          }
        }
      }
    } else {
      // No parameters needed
      const noParamsDiv = document.createElement("div");
      noParamsDiv.className = "no-params";
      noParamsDiv.textContent = "This script requires no parameters.";
      container.appendChild(noParamsDiv);
    }

    scriptPanel.appendChild(container);
  }

  // Update status in the panel
  private updateStatus(message: string, type: string = "active"): void {
    if (!this.panelElement) return;

    const statusElement = this.panelElement.querySelector('#botting-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `status-value ${type}`;
    }
  }

  // Update last action in the panel
  private updateLastAction(action: string): void {
    if (!this.panelElement) return;

    const lastActionElement = this.panelElement.querySelector('#last-action');
    if (lastActionElement) {
      lastActionElement.textContent = action;
    }
  }

  // Parse parameter value based on its type
  private parseParameterValue(param: any, value: string): any {
    switch (param.type) {
      case "number":
        return parseInt(value, 10);
      case "boolean":
        return value === "true" || value === "on";
      case "array":
        return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
      default:
        return value;
    }
  }

  // Run the current script
  private runCurrentScript(): void {
    if (!this.currentScript) {
      this.log("No script selected");
      this.updateStatus("Error: No script selected", "error");
      return;
    }

    const metadata = SCRIPT_METADATA[this.currentScript];
    if (!metadata) {
      this.log("Unknown script selected");
      this.updateStatus("Error: Unknown script", "error");
      return;
    }

    // Stop any existing script
    this.stopCurrentScript();

    // Get script parameters
    const params: any[] = [];
    if (metadata.parameters && metadata.parameters.length > 0) {
      for (const param of metadata.parameters) {
        let value: string;
        
        if (param.type === "boolean") {
          value = this.scriptInputs[param.name]?.checked ? "true" : "false";
        } else {
          value = this.scriptInputs[param.name]?.value?.trim() || "";
        }
        
        if (!value && param.type !== "boolean") {
          this.log(`Missing required parameter: ${param.label}`);
          this.updateStatus(`Error: Missing ${param.label}`, "error");
          return;
        }
        
        // Save text parameter values to database for persistence
        if (param.type === "text" && value) {
          this.saveParameterOption(this.currentScript, param.name, value);
        }
        
        const parsedValue = this.parseParameterValue(param, value);
        params.push(parsedValue);
      }
    }

    // Start the script
    this.isScriptRunning = true;
    this.updateStatus(`Starting ${metadata.name}...`, "active");

    // Run the script function
    if (this.scripts && typeof this.scripts[this.currentScript as keyof HighspellBottingScripts] === 'function') {
      const scriptFunction = this.scripts[this.currentScript as keyof HighspellBottingScripts] as Function;
      this.currentScriptFunction = scriptFunction.apply(this.scripts, params);
    } else {
      this.log(`Script function ${this.currentScript} not found`);
      this.updateStatus("Error: Script function not found", "error");
      this.isScriptRunning = false;
    }
  }

  // Stop the current script
  private stopCurrentScript(): void {
    // Stop script execution
    this.isScriptRunning = false;

    // Clear any running intervals
    if (this.scriptInterval) {
      clearInterval(this.scriptInterval);
      this.scriptInterval = null;
    }

    // Clear current script function
    this.currentScriptFunction = null;

    this.log("Script stopped");
    this.updateStatus("Script stopped", "normal");
    this.updateLastAction("Script stopped");
  }

  // Get all available managers for debugging
  private getAllManagers(): Record<string, any> {
    return {
      entityManager: this.entityManager,
      targetActionManager: this.targetActionManager,
      worldEntityManager: this.worldEntityManager,
      UIManager: this.gameHooks.UIManager,
      groundItemManager: this.groundItemManager,
      worldMapManager: this.worldMapManager,
      itemManager: this.itemManager,
      chatManager: this.chatManager,
      socketManager: this.socketManager,
      spellManager: this.spellManager
    };
  }

  // Log all available managers for debugging
  private logAllManagers(): void {
    this.log("=== Available Managers ===");
    const managers = this.getAllManagers();
    Object.entries(managers).forEach(([name, manager]) => {
      if (manager) {
        this.log(`✓ ${name}: ${typeof manager}`);
      } else {
        this.log(`✗ ${name}: Not found`);
      }
    });
    this.log("========================");
  }

  // ========================================
  // HELPER FUNCTIONS (adapted from oldClient.js)
  // ========================================

  // Wait function with optional random range
  async wait(minMilliseconds: number, maxMilliseconds?: number): Promise<void> {
    return new Promise((resolve) => {
      const waitTime = maxMilliseconds
        ? Math.floor(Math.random() * (maxMilliseconds - minMilliseconds + 1)) + minMilliseconds
        : minMilliseconds;
      setTimeout(resolve, waitTime);
    });
  }

  // Calculate distance between two positions (matches oldClient.js format)
  calculateDistance2D(pos1: GamePosition, pos2: GamePosition): number {
    if (!pos1 || !pos2) return Infinity;
    return Math.sqrt(
      Math.pow(pos1.X - pos2.X, 2) +
      Math.pow(pos1.Z - pos2.Z, 2)
    );
  }

  // Get ordered world entities by distance from player
  getOrderedWorldEntities(): GameEntity[] {
    const now = Date.now();
    if (now - this.lastEntityUpdate < this.entityUpdateInterval) {
      return this.orderedWorldEntities;
    }

    if (!this.entityManager || !this.entityManager.MainPlayer) {
      this.log("MainPlayer not found!");
      return [];
    }

    const mainPlayerPosition = this.entityManager.MainPlayer._currentGamePosition;
    if (!mainPlayerPosition) {
      this.log("MainPlayer position not found!");
      return [];
    }

    // Get world entities from the manager
    const worldEntities = this.worldEntityManager._worldEntities || [];

    let entitiesWithDistance: Array<{ entity: GameEntity, distance: number }> = [];
    worldEntities.forEach((entity: GameEntity) => {
      if (entity && entity.CurrentGamePosition) {
        const distance = this.calculateDistance2D(mainPlayerPosition, entity.CurrentGamePosition);
        entitiesWithDistance.push({ entity, distance });
      }
    });

    entitiesWithDistance.sort((a, b) => a.distance - b.distance);
    this.orderedWorldEntities = entitiesWithDistance.map(item => item.entity);
    this.lastEntityUpdate = now;

    this.log(`Updated ordered entities: ${this.orderedWorldEntities.length} entities found`);


    return this.orderedWorldEntities;
  }

  // Get closest entity by name
  getClosestEntity(name: string): GameEntity | null {
    const ordered = this.getOrderedWorldEntities();
    return ordered.find(entity => {
      if (!entity || !entity.Name) return false;
      return entity.Name.toLowerCase() === name.toLowerCase() && !entity.AreResourcesExhausted;
    }) || null;
  }

  // Get closest uncontested entity by name
  getClosestEntityUncontested(name: string): GameEntity | null {
    const ordered = this.getOrderedWorldEntities();
    const entities = ordered.filter(entity => {
      if (!entity || !entity.Name) return false;
      return entity.Name.toLowerCase() === name.toLowerCase() && !entity.AreResourcesExhausted;
    });

    if (!entities.length) {
      this.log(`No ${name} entities found.`);
      return null;
    }

    // Get nearby players and their targets
    const players = this.entityManager?.Players || [];
    const playerTargets = players
      .filter(player => player && player.EntityID && player.CurrentState?._targetId)
      .map(player => player.CurrentState._targetId);

    // Find the first entity not targeted by any player
    let uncontested = entities.find(entity => !playerTargets.includes(entity.EntityTypeID || entity.id));
    if (uncontested) {
      this.log(`Found uncontested ${name} (ID: ${uncontested.EntityID || uncontested.id})`);
      return uncontested;
    }

    // Fallback to closest entity if all are contested
    this.log(`All ${name} entities contested, returning closest (ID: ${entities[0].EntityID || entities[0].id})`);
    return entities[0];
  }


  // Utility method to get player state
  getPlayerState(): any {
    if (!this.entityManager?.MainPlayer) return null;
    return this.entityManager.MainPlayer.getActionState?.() || this.entityManager.MainPlayer._actionState;
  }

  // Utility method to get player position
  getPlayerPosition(): GamePosition | null {
    if (!this.entityManager?.MainPlayer) return null;
    return this.entityManager.MainPlayer._currentGamePosition;
  }

  // Utility method to get player inventory
  getPlayerInventory(): any {
    if (!this.entityManager?.MainPlayer) return null;
    return this.entityManager.MainPlayer._inventory || this.entityManager.MainPlayer.inventory;
  }

  // Utility method to get world entities
  getWorldEntities(): GameEntity[] {
    if (!this.worldEntityManager) return [];
    return this.worldEntityManager._worldEntities || this.worldEntityManager.worldEntities || [];
  }

  // Utility method to get ground items
  getGroundItems(): GameEntity[] {
    if (!this.groundItemManager) return [];
    return this.groundItemManager._groundItems || this.groundItemManager.groundItems || [];
  }

  // Get ordered ground entities by distance
  getOrderedGroundEntities(range: number = 0): GameEntity[] {
    if (!this.entityManager?.MainPlayer || !this.groundItemManager) return [];

    const mainPlayerPosition = this.entityManager.MainPlayer._currentGamePosition;
    if (!mainPlayerPosition) return [];

    if (range === 0) range = 10000;

    const groundItems = this.groundItemManager.GroundItems || this.groundItemManager._groundItems || [];
    let entitiesWithDistance: Array<{ entity: GameEntity, distance: number }> = [];

    groundItems.forEach((entity: GameEntity) => {
      if (entity && entity.CurrentGamePosition) {
        const distance = this.calculateDistance2D(mainPlayerPosition, entity.CurrentGamePosition);
        if (distance < range) {
          entitiesWithDistance.push({ entity, distance });
        }
      }
    });

    entitiesWithDistance.sort((a, b) => a.distance - b.distance);
    return entitiesWithDistance.map(item => item.entity);
  }

  // Get ordered NPCs by distance
  getOrderedNPCs(): GameEntity[] {
    if (!this.entityManager?.MainPlayer) return [];

    const mainPlayerPosition = this.entityManager.MainPlayer._currentGamePosition;
    if (!mainPlayerPosition) return [];

    const npcs = this.entityManager.NPCs || [];
    let npcsWithDistance: Array<{ entity: GameEntity, distance: number }> = [];

    npcs.forEach((entity: GameEntity) => {
      if (entity && entity.CurrentGamePosition) {
        const distance = this.calculateDistance2D(mainPlayerPosition, entity.CurrentGamePosition);
        npcsWithDistance.push({ entity, distance });
      }
    });

    npcsWithDistance.sort((a, b) => a.distance - b.distance);
    return npcsWithDistance.map(item => item.entity);
  }

  // Get closest ground item by name
  getClosestGroundItem(name: string, range: number = 0): GameEntity | null {
    const ordered = this.getOrderedGroundEntities(range);
    return ordered.find(entity => entity.Def?.Name?.toLowerCase() === name.toLowerCase()) || null;
  }

  // Get closest entity by unique ID
  getClosestEntityByUniqueId(id: number): GameEntity | null {
    const ordered = this.getOrderedWorldEntities();
    return ordered.find(entity => entity.EntityTypeID === id && !entity.AreResourcesExhausted) || null;
  }

  // Get closest entity by definition ID
  getClosestEntityByDefId(id: number): GameEntity | null {
    const ordered = this.getOrderedWorldEntities();
    return ordered.find(entity => entity.Def?.ID === id && !entity.AreResourcesExhausted) || null;
  }

  // Get closest ground item by ID
  getClosestGroundItemById(id: number): GameEntity | null {
    const ordered = this.getOrderedGroundEntities();
    return ordered.find(entity => entity.EntityTypeID === id) || null;
  }

  // Get closest NPC by name
  getClosestNPC(name: string): GameEntity | null {
    const ordered = this.getOrderedNPCs();
    return ordered.find(entity => entity.Name?.toLowerCase() === name.toLowerCase()) || null;
  }

  // Get closest NPC by ID
  getClosestNPCById(id: number): GameEntity | null {
    const ordered = this.getOrderedNPCs();
    return ordered.find(entity => entity.EntityID === id) || null;
  }

  // Get closest NPC by type
  getClosestNPCByType(typeId: number): GameEntity | null {
    const ordered = this.getOrderedNPCs();
    return ordered.find(entity => entity.TypeID === typeId) || null;
  }

  // Get closest out of combat NPC
  getClosestOutOfCombatNPC(name: string): GameEntity | null {
    const ordered = this.getOrderedNPCs();
    return ordered.find(entity =>
      entity.Name?.toLowerCase() === name.toLowerCase() &&
      (entity.CurrentTarget === undefined || entity.CurrentTarget === null)
    ) || null;
  }

  // Get closest NPC targeting player
  getClosestNPCTargettingPlayer(name: string): GameEntity | null {
    const ordered = this.getOrderedNPCs();
    return ordered.find(entity =>
      entity.Name?.toLowerCase() === name.toLowerCase() &&
      entity.CurrentTarget?.EntityID === this.entityManager.MainPlayer.EntityID &&
      (entity.Hitpoints?.CurrentLevel || 0) > 0
    ) || null;
  }

  // Get player target
  getPlayerTarget(): any {
    return this.entityManager?.MainPlayer?.CurrentTarget;
  }

  // Get player X coordinate
  getPlayerX(): number {
    return this.entityManager?.MainPlayer?._currentGamePosition?.X || 0;
  }

  // Get player Z coordinate
  getPlayerZ(): number {
    return this.entityManager?.MainPlayer?._currentGamePosition?.Z || 0;
  }

  // Get player map level
  getPlayerMapLevel(): number {
    return this.entityManager?.MainPlayer?.CurrentMapLevel || 0;
  }

  // Get player health
  getPlayerHealth(): number {
    return this.entityManager?.MainPlayer?.Hitpoints?.CurrentLevel || 0;
  }

  // Get player max health
  getPlayerMaxHealth(): number {
    return this.entityManager?.MainPlayer?.Hitpoints?.Level || 0;
  }

  // Get player harvesting level
  getPlayerHarvestingLevel(): number {
    return this.entityManager?.MainPlayer?.Skills?.Skills?.[13]?.CurrentLevel || 0;
  }

  // Get player mining level
  getPlayerMiningLevel(): number {
    return this.entityManager?.MainPlayer?.Skills?.Skills?.[8]?.CurrentLevel || 0;
  }

  // Check if player is moving
  isPlayerMoving(): boolean {
    return this.entityManager?.MainPlayer?.CurrentState?.isMoving?.() || false;
  }

  // Get player state
  getState(): number {
    return this.entityManager?.MainPlayer?.CurrentState?.getCurrentState?.() || 0;
  }

  // Check if player is skilling
  isSkilling(): boolean {
    const skillingStates = [
      7,  // FishingState
      8,  // CookingState
      13, // WoodcuttingState
      14, // MiningState
      15, // HarvestingState
      16, // TreeShakingState
      17, // SmeltingState
      18, // SmithingState
      19, // CraftingState
      23, // EnchantingState
      28, // PotionMakingState
      30, // UsingSpinningWheelState
      32, // SmeltingKilnState
      34, // PickpocketingState
      36, // PicklockingState
    ];
    return skillingStates.includes(this.getState());
  }

  // Check if player is banking
  isBanking(): boolean {
    return this.getState() === 3; // BankingState
  }

  // Check if player is stunned
  isStunned(): boolean {
    return this.getState() === 35; // StunnedState
  }

  // Check if player is shopping
  isShopping(): boolean {
    return this.getState() === 6; // ShoppingState
  }

  // Check if player is smelting
  isSmelting(): boolean {
    return this.getState() === 17; // SmeltingState
  }

  // Check if player is smithing
  isSmithing(): boolean {
    return this.getState() === 18; // SmithingState
  }

  // Check if player is making potions
  isPotionMaking(): boolean {
    return this.getState() === 28; // PotionMakingState
  }

  // Check if player is thieving
  isThieving(): boolean {
    const thievingStates = [35, 34, 36]; // StunnedState, PickpocketingState, PicklockingState
    return thievingStates.includes(this.getState());
  }

  // Check if awaiting item action
  isAwaitingItemAction(): boolean {
    return this.itemManager?.IsAwaitingItemAction || false;
  }

  // Check if using door
  isUsingDoor(): boolean {
    return this.usingDoor || false;
  }

  // Check if teleporting
  isTeleporting(): boolean {
    return this.teleporting || false;
  }

  // Check if world entities are loading
  areWorldEntitiesLoading(): boolean {
    return this.worldMapManager?.AreWorldEntitiesLoading || false;
  }

  // Check if inventory is full
  isInventoryFull(): boolean {
    const items = this.entityManager?.MainPlayer?.Inventory?.Items || [];
    return items.every(item => item !== null);
  }

  // Check if inventory is empty
  isInventoryEmpty(): boolean {
    const items = this.entityManager?.MainPlayer?.Inventory?.Items || [];
    return items.every(item => item === null);
  }

  // Get inventory count
  getInventoryCount(): number {
    const items = this.entityManager?.MainPlayer?.Inventory?.Items || [];
    return items.filter(item => item !== null).length;
  }

  // Get inventory item count by name
  getInventoryItemCount(itemName: string): number {
    const items = this.entityManager?.MainPlayer?.Inventory?.Items || [];
    let count = 0;
    items.forEach(item => {
      if (item?.Def?.Name?.toLowerCase() === itemName.toLowerCase()) {
        count += item.Amount || 1;
      }
    });
    return count;
  }

  // Get inventory item count by ID
  getInventoryItemCountById(itemId: number): number {
    const items = this.entityManager?.MainPlayer?.Inventory?.Items || [];
    let count = 0;
    items.forEach(item => {
      if (item?.Def?.ID === itemId) {
        count += item.Amount || 1;
      }
    });
    return count;
  }

  // Attack entity
  attackEntity(gameWorldEntity: GameEntity): boolean {
    if (gameWorldEntity?.Actions?.includes(0)) {
      this.log(`Attacking entity: ${gameWorldEntity.Name || 'Unknown'}`);
      this.updateLastAction(`attackEntity ${gameWorldEntity.Name || 'Unknown'}`);
      return this.targetActionManager?.handleTargetAction?.(0, gameWorldEntity) || false;
    }
    return false;
  }

  // Perform action on entity
  doAction1OnEntity(gameWorldEntity: GameEntity): boolean {
    if (!gameWorldEntity || !gameWorldEntity.Actions || !gameWorldEntity.Actions[0]) {
      this.log("No valid action found for entity:", gameWorldEntity);
      return false;
    }

    const action = gameWorldEntity.Actions[0];
    this.log(`Performing action ${action} on entity: ${gameWorldEntity.Name || 'Unknown'}`);
    this.updateLastAction(`doAction1OnEntity ${gameWorldEntity.Name || 'Unknown'} (${action})`);

    // Use the target action manager
    return this.targetActionManager?.handleTargetAction?.(action, gameWorldEntity) || false;
  }

  // Do action 2 on entity
  doAction2OnEntity(gameWorldEntity: GameEntity): boolean {
    if (gameWorldEntity?.Actions?.[1]) {
      const action = gameWorldEntity.Actions[1];
      this.log(`Performing action ${action} on entity: ${gameWorldEntity.Name || 'Unknown'}`);
      this.updateLastAction(`doAction2OnEntity ${gameWorldEntity.Name || 'Unknown'} (${action})`);
      return this.targetActionManager?.handleTargetAction?.(action, gameWorldEntity) || false;
    }
    return false;
  }

  // Do action 3 on entity
  doAction3OnEntity(gameWorldEntity: GameEntity): boolean {
    if (gameWorldEntity?.Actions?.[2]) {
      const action = gameWorldEntity.Actions[2];
      this.log(`Performing action ${action} on entity: ${gameWorldEntity.Name || 'Unknown'}`);
      this.updateLastAction(`doAction3OnEntity ${gameWorldEntity.Name || 'Unknown'} (${action})`);
      return this.targetActionManager?.handleTargetAction?.(action, gameWorldEntity) || false;
    }
    return false;
  }

  // ========================================
  // MOVEMENT AND NAVIGATION FUNCTIONS (ported from oldClient.js)
  // ========================================

  // Walk to coordinates once
  async walkToOnce(x: number, z: number): Promise<boolean> {
    if (!this.targetActionManager) {
      this.log("TargetActionManager not available");
      return false;
    }
    this.log(`Walking to coordinates: (${x}, ${z})`);
    this.updateLastAction(`walkToOnce ${x}, ${z}`);
    return this.targetActionManager.handleWalkTo(x, z);
  }

  // Walk to coordinates with radius tolerance
  async walkTo(x: number, z: number, radius: number = 0): Promise<void> {
    if (!this.targetActionManager) {
      this.log("TargetActionManager not available");
      return;
    }

    // Generate random coordinates within the radius
    const targetX = x + (Math.random() * 2 - 1) * radius;
    const targetZ = z + (Math.random() * 2 - 1) * radius;

    this.log(`Walking to coordinates: (${x}, ${z}) with radius ${radius} (target: ${targetX.toFixed(1)}, ${targetZ.toFixed(1)})`);
    this.updateLastAction(`walkTo ${x}, ${z} (radius: ${radius})`);

    // Send the initial walk command
    this.targetActionManager.handleWalkTo(targetX, targetZ);

    let counter = 0;

    while (true) {
      // Check if player is within radius of original coordinates
      if (
        Math.abs(this.getPlayerX() - x) <= radius &&
        Math.abs(this.getPlayerZ() - z) <= radius
      ) {
        // Player is within the specified radius, break the loop
        break;
      }

      // Check if player is not moving and not within radius
      if (!this.isPlayerMoving() && (
        Math.abs(this.getPlayerX() - x) > radius ||
        Math.abs(this.getPlayerZ() - z) > radius
      )) {
        // Reissue walk command if player is stuck
        this.targetActionManager.handleWalkTo(targetX, targetZ);
        counter = 0; // Reset counter after reissuing command
      }

      await this.wait(1000); // Wait for 1 second
      counter++;

      // Reissue the walk command every 5 seconds as a fallback
      if (counter % 5 === 0) {
        this.targetActionManager.handleWalkTo(targetX, targetZ);
      }

      // If counter exceeds threshold, log failure and break
      if (counter >= 60) {
        this.log("Failed to walkTo - Terminating Script");
        this.updateStatus("Failed to walkTo", "error");
        throw new Error("Failed to walkTo - Terminating Script");
      }
    }
  }

  // Walk to coordinate object
  async walkToCoords(coordinates: GamePosition): Promise<void> {
    if (!this.targetActionManager) {
      this.log("TargetActionManager not available");
      return;
    }

    this.log(`Walking to coordinates: (${coordinates.X}, ${coordinates.Z})`);
    this.updateLastAction(`walkToCoords ${coordinates.X}, ${coordinates.Z}`);
    this.targetActionManager.handleWalkTo(coordinates.X, coordinates.Z);
    let counter = 0;

    while (this.getPlayerX() !== coordinates.X || this.getPlayerZ() !== coordinates.Z) {
      await this.wait(1000);
      counter++;
      if (counter >= 15) {
        this.targetActionManager.handleWalkTo(coordinates.X, coordinates.Z);
        counter = 0;
      }
    }
  }

  // Open door functionality
  async openDoor(entityTypeID: number): Promise<boolean> {
    if (!this.targetActionManager) {
      this.log("TargetActionManager not available");
      return false;
    }

    const gameWorldEntity = this.getClosestEntityByUniqueId(entityTypeID);
    if (gameWorldEntity?.Actions?.includes(6)) {
      this.log(`Opening door: ${gameWorldEntity.Name || 'Unknown'} (ID: ${entityTypeID})`);
      this.updateLastAction(`openDoor ${gameWorldEntity.Name || 'Unknown'} (ID: ${entityTypeID})`);
      this.targetActionManager.handleTargetAction(6, gameWorldEntity);
      this.usingDoor = true;
    } else {
      this.log("Error finding door.");
      this.usingDoor = false;
      this.isScriptRunning = false;
      this.updateStatus("Error finding door", "error");
      return false;
    }

    let counter = 0;
    while (this.isUsingDoor()) {
      this.log("Using door...");
      await this.wait(1000);
      counter++;
      if (counter % 15 === 0) {
        this.targetActionManager.handleTargetAction(6, gameWorldEntity);
      }
      if (counter === 30) {
        this.usingDoor = false;
        counter = 0;
        this.isScriptRunning = false;
        this.log("Error reaching door.");
        this.updateStatus("Error reaching door", "error");
        break;
      }
    }
    await this.wait(3200);
    return true;
  }

  // Get spell by name
  getSpellByName(spellName: string): GameSpell | null {
    if (!this.spellDefinitionManager?.Defs) return null;

    for (let [key, spell] of this.spellDefinitionManager.Defs) {
      if (spell.Name?.toLowerCase() === spellName.toLowerCase()) {
        return spell;
      }
    }
    return null;
  }

  // Get spell by ID
  getSpellById(spellId: number): GameSpell | null {
    if (!this.spellDefinitionManager?.Defs) return null;

    for (let [key, spell] of this.spellDefinitionManager.Defs) {
      if (spell._id === spellId) {
        return spell;
      }
    }
    return null;
  }

  // Cast teleport spell
  async castTeleportSpell(spellName: string): Promise<void> {
    const spell = this.getSpellByName(spellName);
    // 3 == teleport
    if (spell && spell.Type == 3) {
      let haveIngredients = true;
      if (spell.Recipe?.Ingredients) {
        for (let ingredient = 0; ingredient < spell.Recipe.Ingredients.length; ingredient++) {
          if (this.getInventoryItemCountById(spell.Recipe.Ingredients[ingredient].ItemID) < spell.Recipe.Ingredients[ingredient].Amount) {
            haveIngredients = false;
          }
        }
      }
      // 0 = window.menuTypes.Inventory
      // 2 = window.itemActionsEnum.drop
      if (haveIngredients) {
        this.spellManager?.castTeleportSpell?.(spell);
        this.teleporting = true;
      } else {
        console.error(`Missing Ingredients to cast spell: ${spell.Name}`);
        this.spellManager?.castTeleportSpell?.(spell);
        this.teleporting = true;
      }
    }
    let counter = 0;
    while (this.teleporting) {
      await this.wait(1000);
      counter++;
      console.log('Teleporting...');
      if (counter >= 15) {
        this.teleporting = false;
        counter = 0;
      }
    }
  }

  // Cast spell on item
  castSpellOnItem(spellName: string, itemName: string): boolean {
    const spell = this.getSpellByName(spellName);
    if (!spell) return false;

    const items = this.entityManager?.MainPlayer?.Inventory?.Items || [];
    let itemSlot = -1;
    let item: GameItem = {} as GameItem;

    for (let slot = 0; slot < items.length; slot++) {
      if (items[slot]?.Def?.Name?.toLowerCase() === itemName.toLowerCase()) {
        itemSlot = slot;
        item = items[slot];
        break;
      }
    }

    if (item && itemSlot !== -1 && item.Def && item.Def.InventoryActions) {
      this.log(`Casting spell ${spell.Name} on item ${itemName}`);
      this.updateLastAction(`castSpellOnItem ${spell.Name} on ${itemName}`);
      this.spellManager?.castSpellOnItem?.(spell, 0, itemSlot, item._id, item.IsIOU);
      return true;
    }

    return false;
  }

  // ========================================
  // ADDITIONAL HELPER FUNCTIONS FOR SCRIPTS
  // ========================================

  // Use item action 1 (eat, use, etc.)
  async useItemAction1(itemName: string): Promise<boolean> {
    const items = this.entityManager?.MainPlayer?.Inventory?.Items || [];
    let itemSlot = -1;
    let item: GameItem = {} as GameItem;

    for (let slot = 0; slot < items.length; slot++) {
      if (items[slot]?.Def?.Name?.toLowerCase() === itemName.toLowerCase()) {
        itemSlot = slot;
        item = items[slot];
        break;
      }
    }

    if (item && itemSlot !== -1 && item.Def && item.Def.InventoryActions) {
      this.log(`Using item action 1 on ${itemName}`);
      this.updateLastAction(`useItemAction1 ${itemName}`);
      this.itemManager?.invokeInventoryAction?.(0, item.Def.InventoryActions[0], itemSlot, item);
      while(this.isAwaitingItemAction()){
          await this.wait(100)
      }
      return true;
    }

    return false;
  }

  // Get food heal amount
  getFoodHealAmount(itemName: string): number {
    const items = this.entityManager.MainPlayer.Inventory.Items;
    let item: GameItem = {} as GameItem;
    for (let slot = 0; slot < items.length; slot++) {
      if (items[slot] && items[slot].Def.Name === itemName.toLowerCase()) {
        item = items[slot]
      }
    }
    // Check if item has edible effects and return the heal amount
    return item?.Def?.EdibleEffects?.[0]?.Amount || 0;
  }

  toggleSprint(enable: boolean): void {
    try {
      this.log(`Toggling sprint: ${enable ? 'enabled' : 'disabled'}`);
      this.updateLastAction(`toggleSprint ${enable ? 'enabled' : 'disabled'}`);
      // Emit packet to toggle sprint (Name: 59, Data: [1] for enable, [0] for disable)
      this.gameHooks.SocketManager.Instance.emitPacket({
        Name: 59,
        StrName: "59",
        Data: [enable ? 1 : 0]
      });
    } catch (error) {
      this.log("Failed to toggle sprint:", error);
    }
  }

  toggleAutoRetaliate(): void {
    try {
      // Get current auto-retaliate state
      const player = this.gameHooks.MainPlayer;
      if (!player || !player.Combat) {
        this.log("Player or Combat not available");
        return;
      }
      const currentState = player.Combat.AutoRetaliate;
      const newState = !currentState;

      this.log(`Toggling auto-retaliate: ${newState ? 'enabled' : 'disabled'}`);
      this.updateLastAction(`toggleAutoRetaliate ${newState ? 'enabled' : 'disabled'}`);

      // Emit packet to toggle auto-retaliate (Name: 47, Data: [1] for enable, [0] for disable)
      this.gameHooks.SocketManager.Instance.emitPacket({
        Name: 47,
        StrName: "47",
        Data: [newState ? 1 : 0]
      });
    } catch (error) {
      this.log("Failed to toggle auto-retaliate:", error);
    }
  }

  // ===========================================
  // ITEM MANAGER FUNCTIONS (ported from oldClient.js)
  // ===========================================

  // Drop inventory functions
  async dropInventory(): Promise<void> {
    this.log("Dropping entire inventory");
    this.updateLastAction("dropInventory");
    const items = this.entityManager.MainPlayer.Inventory.Items;
    for (let slot = 0; slot < items.length; slot++) {
      await this.dropItemBySlot(slot);
    }
  }

  async dropItem(itemName: string): Promise<void> {
    const items = this.entityManager.MainPlayer.Inventory.Items;
    let itemSlot = -1;
    let item = null;
    for (let slot = 0; slot < items.length; slot++) {
      if (items[slot]?.Def.Name === itemName.toLowerCase() && itemSlot === -1) {
        itemSlot = slot;
        item = items[slot];
        break;
      }
    }
    if (itemSlot !== -1) {
      this.log(`Dropping item: ${itemName}`);
      this.updateLastAction(`dropItem ${itemName}`);
      // 0 = window.menuTypes.Inventory
      // 2 = window.itemActionsEnum.drop
      this.itemManager?.invokeInventoryAction?.(0, 2, itemSlot, item);
    }
    while (this.isAwaitingItemAction()) {
      await this.wait(100);
    }
  }

  async dropAllItemsByName(itemName: string): Promise<void> {
    const items = this.entityManager.MainPlayer.Inventory.Items;
    let itemSlots: number[] = [];
    let item = null;
    for (let slot = 0; slot < items.length; slot++) {
      if (items[slot]?.Def.Name === itemName.toLowerCase()) {
        itemSlots.push(slot);
      }
    }
    if (itemSlots.length > 0) {
      this.log(`Dropping all items: ${itemName} (${itemSlots.length} items)`);
      this.updateLastAction(`dropAllItemsByName ${itemName} (${itemSlots.length} items)`);
      for (const slot of itemSlots) {
        // 0 = window.menuTypes.Inventory
        // 2 = window.itemActionsEnum.drop
        this.itemManager?.invokeInventoryAction?.(0, 2, slot, items[slot]);
        while (this.isAwaitingItemAction()) {
          await this.wait(100);
        }
      }
    }
  }

  async dropItemBySlot(slot: number): Promise<void> {
    const item = this.entityManager.MainPlayer.Inventory.Items[slot];
    if (item) {
      this.log(`Dropping item from slot ${slot}: ${item.Def?.Name || 'Unknown'}`);
      this.updateLastAction(`dropItemBySlot ${slot} (${item.Def?.Name || 'Unknown'})`);
      // 0 = window.menuTypes.Inventory
      // 2 = window.itemActionsEnum.drop
      this.itemManager?.invokeInventoryAction?.(0, 2, slot, item);
    }
    while (this.isAwaitingItemAction()) {
      await this.wait(100);
    }
  }

  // Shop functions
  async buyShopStockByName(itemName: string, amount: number): Promise<void> {
    if (this.getState() !== 2) // stateEnum.ShoppingState = 2
      return;

    const items = this.entityManager.MainPlayer.CurrentState.ShopItems.Items;
    let itemSlot = -1;
    let item: GameItem = {} as GameItem;
    for (let slot = 0; slot < items.length; slot++) {
      if (items[slot]?.Def.Name.toLowerCase() === itemName.toLowerCase() && itemSlot === -1) {
        itemSlot = slot;
        item = items[slot];
        break;
      }
    }
    if (item) {
      item.Amount = amount;
    }
    if (itemSlot !== -1) {
      this.log(`Buying ${amount} ${itemName} from shop`);
      this.updateLastAction(`buyShopStockByName ${itemName} (${amount})`);
      //2 = window.menuTypes.Shop
      //12 = window.itemActionsEnum.buy
      this.itemManager?.invokeInventoryAction?.(2, 12, itemSlot, item);
    }
    while (this.isAwaitingItemAction()) {
      await this.wait(100);
    }
  }

  getShopStockByName(itemName: string): number {
    if (this.entityManager.MainPlayer.CurrentState?.ShopItems) {
      const items = this.entityManager.MainPlayer.CurrentState.ShopItems.Items;
      let itemSlot = -1;
      let item: GameItem = {} as GameItem;
      for (let slot = 0; slot < items.length; slot++) {
        if (items[slot]?.Def.Name.toLowerCase() === itemName.toLowerCase() && itemSlot === -1) {
          itemSlot = slot;
          item = items[slot];
          break;
        }
      }
      return item?.Amount || 0;
    }
    return 0;
  }

  // Item action functions
  async useItemAction1BySlot(slot: number): Promise<void> {
    const item = this.entityManager.MainPlayer.Inventory.Items[slot];
    if (item) {
      this.log(`Using item action 1 from slot ${slot}: ${item.Def?.Name || 'Unknown'}`);
      this.updateLastAction(`useItemAction1BySlot ${slot} (${item.Def?.Name || 'Unknown'})`);
      // 0 = window.menuTypes.Inventory
      this.itemManager?.invokeInventoryAction?.(0, item.Def.InventoryActions[0], slot, item);
    }
    while (this.isAwaitingItemAction()) {
      await this.wait(100);
    }
  }

  useItemOnEntity(itemName: string, entity: GameEntity): void {
    const items = this.entityManager.MainPlayer.Inventory.Items;
    let itemSlot = -1;
    for (let slot = 0; slot < items.length; slot++) {
      if (items[slot]?.Def.Name === itemName.toLowerCase() && itemSlot === -1) {
        itemSlot = slot;
        break;
      }
    }
    if (itemSlot === -1) {
      console.error(`Item with name ${itemName} not found in inventory.`);
      return;
    }
    this.log(`Using item ${itemName} on entity: ${entity.Name || 'Unknown'}`);
    this.updateLastAction(`useItemOnEntity ${itemName} on ${entity.Name || 'Unknown'}`);
    this.itemManager?.useItemOnEntity?.(items[itemSlot], entity);
  }

  async useItemOnItemOption1(selectedItemName: string, targetItemName: string, number?: number): Promise<void> {
    // Get the player's inventory items
    const items = this.entityManager.MainPlayer.Inventory.Items;

    // Find the slots for the given item names
    let selectedItemSlot = -1;
    let targetItemSlot = -1;

    for (let slot = 0; slot < items.length; slot++) {
      if (items[slot]?.Def.Name === selectedItemName.toLowerCase() && selectedItemSlot === -1) {
        selectedItemSlot = slot;
      }
      if (items[slot]?.Def.Name === targetItemName.toLowerCase() && targetItemSlot === -1) {
        targetItemSlot = slot;
      }
      if (selectedItemSlot !== -1 && targetItemSlot !== -1) {
        break; // Stop searching if both items are found
      }
    }

    // Check if both items were found
    if (selectedItemSlot === -1) {
      console.error(`Item with name ${selectedItemName} not found in inventory.`);
      this.isScriptRunning = false;
      return;
    }
    if (targetItemSlot === -1) {
      console.error(`Item with name ${targetItemName} not found in inventory.`);
      this.isScriptRunning = false;
      return;
    }

    // Get items from slots
    const selectedItem = items[selectedItemSlot];
    const targetItem = items[targetItemSlot];

    this.log(`Using item ${selectedItemName} on item ${targetItemName} (option 1)`);
    this.updateLastAction(`useItemOnItemOption1 ${selectedItemName} on ${targetItemName}`);

    // Use the found slots to call the original function
    // Construct packet
    const packet = {
      StrName: "68", // GameActionsEnum.UseItemOnItem
      Data: [
        0,                          // 0 (menuTypeEnum.Inventory)
        selectedItemSlot,           // 0
        selectedItem.Def.ID,        // 154
        selectedItem.IsIOU ? 1 : 0, // 0 (false)
        targetItemSlot,             // 4
        targetItem.Def.ID,          // 66
        targetItem.IsIOU ? 1 : 0,   // 0 (false)
        0,                          // ItemOnItemActionResultIndex
        number || 0                 // 155
      ]
    };

    // Emit packet directly
    this.gameHooks.SocketManager.emitPacket(packet);
    while (this.isAwaitingItemAction() || this.isSkilling()) {
      await this.wait(100);
    }
  }

  async useItemOnItemOption2(selectedItemName: string, targetItemName: string, number?: number): Promise<void> {
    // Get the player's inventory items
    const items = this.entityManager.MainPlayer.Inventory.Items;

    // Find the slots for the given item names
    let selectedItemSlot = -1;
    let targetItemSlot = -1;

    for (let slot = 0; slot < items.length; slot++) {
      if (items[slot]?.Def.Name === selectedItemName.toLowerCase() && selectedItemSlot === -1) {
        selectedItemSlot = slot;
      }
      if (items[slot]?.Def.Name === targetItemName.toLowerCase() && targetItemSlot === -1) {
        targetItemSlot = slot;
      }
      if (selectedItemSlot !== -1 && targetItemSlot !== -1) {
        break; // Stop searching if both items are found
      }
    }

    // Check if both items were found
    if (selectedItemSlot === -1) {
      console.error(`Item with name ${selectedItemName} not found in inventory.`);
      this.isScriptRunning = false;
      return;
    }
    if (targetItemSlot === -1) {
      console.error(`Item with name ${targetItemName} not found in inventory.`);
      this.isScriptRunning = false;
      return;
    }

    // Get items from slots
    const selectedItem = items[selectedItemSlot];
    const targetItem = items[targetItemSlot];

    this.log(`Using item ${selectedItemName} on item ${targetItemName} (option 2)`);
    this.updateLastAction(`useItemOnItemOption2 ${selectedItemName} on ${targetItemName}`);

    // Use the found slots to call the original function
    // Construct packet
    const packet = {
      StrName: "68", // GameActionsEnum.UseItemOnItem
      Data: [
        0,                          // 0 (menuTypeEnum.Inventory)
        selectedItemSlot,           // 0
        selectedItem.Def.ID,        // 154
        selectedItem.IsIOU ? 1 : 0, // 0 (false)
        targetItemSlot,             // 4
        targetItem.Def.ID,          // 66
        targetItem.IsIOU ? 1 : 0,   // 0 (false)
        1,                          // ItemOnItemActionResultIndex
        number || 0                 // 155
      ]
    };

    // Emit packet directly
    this.gameHooks.SocketManager.emitPacket(packet);
    while (this.isAwaitingItemAction() || this.isSkilling()) {
      await this.wait(100);
    }
  }

  // Crafting functions
  smeltItemById(itemId: number, amount?: number): void {
    if (!this.isSmelting())
      return;
    if (this.isAwaitingItemAction())
      return void this.log("ItemManager - invokeInventoryAction - IsAwaitingItemAction = true, returning without invoking the action");
    this.log(`Smelting item ID ${itemId} (amount: ${amount || 1})`);
    this.updateLastAction(`smeltItemById ${itemId} (amount: ${amount || 1})`);
    //8 = window.menuTypes.Smelting
    this.itemManager?.emitCreateItemActionPacket?.(8, itemId, amount || 1);
  }

  smithItemById(itemId: number, amount?: number): void {
    if (!this.isSmithing())
      return;
    if (this.isAwaitingItemAction())
      return void this.log("ItemManager - invokeInventoryAction - IsAwaitingItemAction = true, returning without invoking the action");
    this.log(`Smithing item ID ${itemId} (amount: ${amount || 1})`);
    this.updateLastAction(`smithItemById ${itemId} (amount: ${amount || 1})`);
    //9 = window.menuTypes.Smithing
    this.itemManager?.emitCreateItemActionPacket?.(9, itemId, amount || 1);
  }

  potionMakeItemById(itemId: number, amount?: number): void {
    if (!this.isPotionMaking())
      return;
    if (this.isAwaitingItemAction())
      return void this.log("ItemManager - invokeInventoryAction - IsAwaitingItemAction = true, returning without invoking the action");
    this.log(`Making potion item ID ${itemId} (amount: ${amount || 1})`);
    this.updateLastAction(`potionMakeItemById ${itemId} (amount: ${amount || 1})`);
    //12 = window.menuTypes.PotionMaking
    this.itemManager?.emitCreateItemActionPacket?.(12, itemId, amount || 1);
  }

  // Banking functions
  async depositAllItems(): Promise<void> {
    //stateEnum.BankingState = 3
    if (this.getState() !== 3)
      return;

    this.log("Depositing all items to bank");
    this.updateLastAction("depositAllItems");
    const items = this.entityManager.MainPlayer.Inventory.Items;

    while (!this.isInventoryEmpty()) {
      let depositSlot = -1;
      let item: GameItem = {} as GameItem;
      let itemCount = 0;
      for (let slot = 0; slot < items.length; slot++) {
        if (items[slot] && depositSlot === -1) {
          depositSlot = slot;
          item = items[slot];
        }
        if (item && item.Def && item.Def.Name && items[slot]?.Def.Name == item.Def.Name && items[slot]?.IsIOU == item.IsIOU) {
          itemCount += item.Amount || 0;
        }
      }
      while (this.isAwaitingItemAction()) {
        await this.wait(600);
      }
      //0 = window.menuTypes.Inventory
      //9 = window.itemActionsEnum.deposit
      if (item && item.Def && item.Def.ID && item.Amount && item.IsIOU) {
        this.itemManager?.emitInventoryItemActionPacket?.(9, 0, depositSlot, item.Def.ID, item.Amount, item.IsIOU);
      } else if (item && item.Def && item.Def.ID) {
        this.itemManager?.emitInventoryItemActionPacket?.(9, 0, depositSlot, item.Def.ID, itemCount, item.IsIOU);
      }
    }
  }

  async depositItem(depositName: string, depositNumber: number): Promise<void> {
    //stateEnum.BankingState = 3
    if (this.getState() !== 3)
      return;

    const items = this.entityManager.MainPlayer.Inventory.Items;
    let depositSlot = -1;
    let item: GameItem = {} as GameItem;

    for (let slot = 0; slot < items.length; slot++) {
      if (items[slot] && items[slot].Def.Name === depositName.toLowerCase() && depositSlot === -1) {
        depositSlot = slot;
        item = items[slot];
        break;
      }
    }

    if (depositSlot === -1) {
      console.error(`Item with name ${depositName} not found in inventory.`);
      this.isScriptRunning = false;
      return;
    }

    this.log(`Depositing ${depositNumber} ${depositName} to bank`);
    this.updateLastAction(`depositItem ${depositName} (${depositNumber})`);

    //0 = window.menuTypes.Inventory
    //9 = window.itemActionsEnum.deposit
    if (item && item.Def && item.Def.ID)
      this.itemManager?.emitInventoryItemActionPacket?.(9, 0, depositSlot, item.Def.ID, depositNumber, item.IsIOU);
    while (this.isAwaitingItemAction()) {
      await this.wait(100);
    }
  }

  async withdrawItem(withdrawName: string, withdrawNumber: number, asIOU: boolean = false): Promise<void> {
    //stateEnum.BankingState = 3
    if (this.getState() !== 3)
      return;

    const items = this.entityManager.MainPlayer.BankStorageItems.Items;
    let withdrawSlot = -1;
    let item: GameItem = {} as GameItem;

    for (let slot = 0; slot < items.length; slot++) {
      if (items[slot] && items[slot].Def.Name === withdrawName.toLowerCase() && withdrawSlot === -1) {
        withdrawSlot = slot;
        item = items[slot];
        break;
      }
    }

    if (withdrawSlot === -1) {
      console.error(`Item with name ${withdrawName} not found in Bank.`);
      this.isScriptRunning = false;
      return;
    }

    this.log(`Withdrawing ${withdrawNumber} ${withdrawName} from bank${asIOU ? ' as IOU' : ''}`);
    this.updateLastAction(`withdrawItem ${withdrawName} (${withdrawNumber})${asIOU ? ' as IOU' : ''}`);

    //7 = window.itemActionsEnum.withdrawb
    //8 = window.itemActionsEnum.withdrawiou
    //1 = window.menuTypes.Bank
    if (item && item.Def && item.Def.ID && asIOU) {
      this.itemManager?.emitInventoryItemActionPacket?.(8, 1, withdrawSlot, item.Def.ID, withdrawNumber, item.IsIOU);
    } else if (item && item.Def && item.Def.ID) {
      this.itemManager?.emitInventoryItemActionPacket?.(7, 1, withdrawSlot, item.Def.ID, withdrawNumber, item.IsIOU);
    }
    while (this.isAwaitingItemAction()) {
      await this.wait(100);
    }
  }

  async checkForPlayers(ignorePlayers: string[] = []) {
    return 0;
    if (this.entityManager.Players.length > 0) {
      let playerName = '';
      const ignorePlayersLower = ignorePlayers.map(player => player.toLowerCase());
      for (let player of this.entityManager.Players) {
        if (!ignorePlayersLower.includes(player.Name.toLowerCase())) {
          playerName = player.Name;
          break; // Exit the loop once a player not in ignorePlayers is found
        }
      }
      if (playerName) {
        this.stopScript()
          (this.UIManager as any).Manager.getController().ChatMenuController.addInfoMessage(`PLAYER DETECTED: ${playerName}`, this.chatColors.Warning);
        this.warn()
        console.error(`PLAYER DETECTED: ${playerName}`)
      }
    }
  }

  async arePlayersAround(): Promise<boolean> {
    return this.entityManager.Players.length > 0;
  }

  chatColors = {
    Yellow: 0,
    Blue: 1,
    Green: 2,
    Red: 3,
    Cyan: 4,
    Purple: 5,
    Orange: 6,
    White: 7,
    Black: 8,
    Random: 9,
    Lime: 10,
    Magenta: 11,
    Warning: 12
  };

  async sendChatMessage(message: string, color: number = this.chatColors.Yellow): Promise<void> {
    (this.UIManager as any).Manager.getController().ChatMenuController.addInfoMessage(`${message}`, color);
  }

  private getChatColor(colorIndex: number): string {
    const colorMap: { [key: number]: string } = {
      0: '#FFFF00', // Yellow
      1: '#0000FF', // Blue
      2: '#00FF00', // Green
      3: '#FF0000', // Red
      4: '#00FFFF', // Cyan
      5: '#800080', // Purple
      6: '#FFA500', // Orange
      7: '#FFFFFF', // White
      8: '#000000', // Black
      9: '#FF00FF', // Random (Magenta)
      10: '#00FF00', // Lime
      11: '#FF00FF', // Magenta
      12: '#FFA500'  // Warning (Orange)
    };
    return colorMap[colorIndex] || '#FFFFFF';
  }

  private initializeAudioContext(): void {
    try {
      // Initialize audio context if it doesn't exist
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.log("Audio context initialized for buzzer functionality");
      }
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
    }
  }

  buzzer(): void {
    try {
      // Initialize audio context if it doesn't exist
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume audio context if it's suspended (required for autoplay policies)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.playBuzzerSound();
        }).catch(error => {
          console.warn('Failed to resume audio context:', error);
        });
      } else {
        this.playBuzzerSound();
      }
    } catch (error) {
      console.warn('Failed to initialize buzzer:', error);
    }
  }

  private playBuzzerSound(): void {
    try {
      if (!this.audioContext) return;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);

      const oscillator1 = this.audioContext.createOscillator();
      oscillator1.type = 'sawtooth';
      oscillator1.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator1.connect(gainNode);

      const oscillator2 = this.audioContext.createOscillator();
      oscillator2.type = 'sawtooth';
      oscillator2.frequency.setValueAtTime(500, this.audioContext.currentTime + 0.2);
      oscillator2.connect(gainNode);

      gainNode.connect(this.audioContext.destination);

      oscillator1.start(this.audioContext.currentTime);
      oscillator2.start(this.audioContext.currentTime + 0.2);

      oscillator1.stop(this.audioContext.currentTime + 0.2);
      oscillator2.stop(this.audioContext.currentTime + 0.4);
    } catch (error) {
      console.warn('Failed to play buzzer sound:', error);
    }
  }

  messageWarn(): void {
    try {
      // Initialize audio context if it doesn't exist
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume audio context if it's suspended (required for autoplay policies)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.playMessageWarn();
        }).catch(error => {
          console.warn('Failed to resume audio context:', error);
        });
      } else {
        this.playMessageWarn();
      }
    } catch (error) {
      console.warn('Failed to initialize buzzer:', error);
    }
  }

  private playMessageWarn(): void {
    try {
      if (!this.audioContext)
        return;

      const oscillator1 = this.audioContext.createOscillator();
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Set up first tone
      oscillator1.type = 'sawtooth';
      oscillator1.frequency.setValueAtTime(880, this.audioContext.currentTime); // First tone frequency (880Hz)

      // Set up second tone
      oscillator2.type = 'square';
      oscillator2.frequency.setValueAtTime(660, this.audioContext.currentTime + 0.15); // Second tone frequency (660Hz)

      // Reduce the volume to make it quieter
      gainNode.gain.setValueAtTime(0.01, this.audioContext.currentTime);

      // Connect oscillators to the gain node, and then to the destination (output)
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Start the oscillators
      oscillator1.start(this.audioContext.currentTime);
      oscillator2.start(this.audioContext.currentTime + 0.15); // Start the second tone slightly after the first

      // Stop the oscillators after a short duration
      oscillator1.stop(this.audioContext.currentTime + 0.3); // Play for 0.3 seconds
      oscillator2.stop(this.audioContext.currentTime + 0.45); // Play for 0.3 seconds
    } catch (error) {
      console.warn('Failed to play message warn:', error);
    }
  }

  loggedInNotify(): void {
    try {
      // Initialize audio context if it doesn't exist
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume audio context if it's suspended (required for autoplay policies)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.playLoggedInNotify();
        }).catch(error => {
          console.warn('Failed to resume audio context:', error);
        });
      } else {
        this.playLoggedInNotify();
      }
    } catch (error) {
      console.warn('Failed to initialize buzzer:', error);
    }
  }

  private playLoggedInNotify(): void {
    try {
      if (!this.audioContext)
        return;
      const oscillator1 = this.audioContext.createOscillator();
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Set up first tone (triangle wave, 440Hz, A4 note)
      oscillator1.type = 'triangle';
      oscillator1.frequency.setValueAtTime(440, this.audioContext.currentTime);

      // Set up second tone (triangle wave, 523.25Hz, C5 note)
      oscillator2.type = 'triangle';
      oscillator2.frequency.setValueAtTime(523.25, this.audioContext.currentTime + 0.15);

      // Set lower volume for subtle sound
      gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);

      // Connect oscillators to gain node and output
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Start and stop oscillators
      oscillator1.start(this.audioContext.currentTime);
      oscillator1.stop(this.audioContext.currentTime + 0.15); // First tone for 0.15 seconds
      oscillator2.start(this.audioContext.currentTime + 0.15); // Second tone starts after 0.15 seconds
      oscillator2.stop(this.audioContext.currentTime + 0.3); // Second tone for 0.15 seconds
    } catch (error) {
      console.warn('Failed to play logged in notify:', error);
    }
  }



  // Cleanup when plugin is destroyed
  destroy(): void {
    this.stop();

    // Clean up audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}