export interface ScriptContext {
  // Core plugin methods
  log: (msg: string) => void;
  updateStatus: (status: string, type?: string) => void;
  updateLastAction: (action: string) => void;
  wait: (min: number, max?: number) => Promise<void>;
  
  // Entity and world functions
  getOrderedWorldEntities: () => any[];
  getOrderedGroundEntities: (range?: number) => any[];
  getOrderedNPCs: () => any[];
  getClosestEntity: (name: string) => any;
  getClosestEntityUncontested: (name: string) => any;
  getClosestGroundItem: (name: string, range?: number) => any;
  getClosestEntityByUniqueId: (uniqueId: number) => any;
  getClosestEntityByDefId: (defId: number) => any;
  getClosestGroundItemById: (id: number) => any;
  getClosestNPC: (name: string) => any;
  getClosestNPCById: (id: number) => any;
  getClosestNPCByType: (type: number) => any;
  getClosestOutOfCombatNPC: (name: string) => any;
  getClosestNPCTargettingPlayer: (name: string) => any;
  getPlayerTarget: () => any;
  
  // Player functions
  getPlayerPosition: () => any;
  getPlayerX: () => number;
  getPlayerZ: () => number;
  getPlayerMapLevel: () => number;
  getPlayerHealth: () => number;
  getPlayerMaxHealth: () => number;
  getPlayerHarvestingLevel: () => number;
  getPlayerMiningLevel: () => number;
  isPlayerMoving: () => boolean;
  
  // State functions
  getState: () => number;
  isSkilling: () => boolean;
  isBanking: () => boolean;
  isStunned: () => boolean;
  isShopping: () => boolean;
  isSmelting: () => boolean;
  isSmithing: () => boolean;
  isPotionMaking: () => boolean;
  isThieving: () => boolean;
  isAwaitingItemAction: () => boolean;
  isUsingDoor: () => boolean;
  isTeleporting: () => boolean;
  areWorldEntitiesLoading: () => boolean;
  
  // Inventory functions
  isInventoryFull: () => boolean;
  isInventoryEmpty: () => boolean;
  getInventoryCount: () => number;
  getInventoryItemCount: (name: string) => number;
  getInventoryItemCountById: (id: number) => number;
  dropInventory: () => Promise<void>;
  dropItem: (name: string) => Promise<void>;
  dropAllItemsByName: (name: string) => Promise<void>;
  dropItemBySlot: (slot: number) => Promise<void>;
  
  // Action functions
  attackEntity: (entity: any) => boolean;
  doAction1OnEntity: (entity: any) => boolean;
  doAction2OnEntity: (entity: any) => boolean;
  doAction3OnEntity: (entity: any) => boolean;
  
  // Spell functions
  getSpellByName: (name: string) => any;
  getSpellById: (id: number) => any;
  castTeleportSpell: (spellName: string) => Promise<boolean>;
  castSpellOnItem: (spellName: string, itemName: string) => boolean;
  
  // Item functions
  getFoodHealAmount: (foodName: string) => number;
  useItemAction1: (itemName: string) => Promise<boolean>;
  useItemAction1BySlot: (slot: number) => Promise<void>;
  useItemOnEntity: (itemName: string, entityName: string) => void;
  useItemOnItemOption1: (itemName: string, targetItemName: string, number?: number) => Promise<void>;
  useItemOnItemOption2: (itemName: string, targetItemName: string, number?: number) => Promise<void>;
  
  // Crafting functions
  smeltItemById: (id: number, amount?: number) => void;
  smithItemById: (id: number, amount?: number) => void;
  potionMakeItemById: (id: number, amount?: number) => void;
  
  // Banking functions
  depositAllItems: () => Promise<void>;
  depositItem: (itemName: string, amount: number) => Promise<void>;
  withdrawItem: (itemName: string, amount: number, asIOU?: boolean) => Promise<void>;
  
  // Shop functions
  toggleAutoRetaliate: () => void;
  buyShopStockByName: (itemName: string, amount: number) => Promise<void>;
  getShopStockByName: (itemName: string) => number;
  
  // Utility functions
  calculateDistance2D: (pos1: any, pos2: any) => number;
  
  // Movement functions
  walkTo: (x: number, z: number, level?: number) => Promise<void>;
  walkToOnce: (x: number, z: number) => void;
  
  // Door functions
  openDoor: (doorId: number) => Promise<void>;
  
  // Player detection functions
  checkForPlayers: (accounts: string[]) => Promise<void>;
  arePlayersAround: () => Promise<boolean>;
  
  // Chat functions
  sendChatMessage: (message: string, color: any) => void;
  
  // Sound functions
  buzzer: () => void;
  messageWarn: () => void;
  loggedInNotify: () => void;
  
  // Script control
  isScriptRunning: () => boolean;
  stopScript: () => void;
  onStop: () => void;
  
  // Global variables (for compatibility)
  runScript: boolean;
  skilling: boolean;
  myAccounts: string[];
  chatColors: any;
  entityManager: any;
  worldEntities: Map<any, any>;
} 