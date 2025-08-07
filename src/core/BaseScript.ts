import { ScriptContext } from '../types/ScriptContext';

export abstract class BaseScript {
  protected plugin: any;
  protected context: ScriptContext;

  constructor(plugin: any) {
    this.plugin = plugin;
    this.context = this.createScriptContext();
  }

  protected createScriptContext(): ScriptContext {
    const plugin = this.plugin;
    return {
      // Core plugin methods
      log: (msg: string) => plugin.log(msg),
      updateStatus: (status: string, type?: string) => plugin.updateStatus(status, type),
      updateLastAction: (action: string) => plugin.updateLastAction(action),
      wait: (min: number, max?: number) => plugin.wait(min, max),
      
      // Entity and world functions
      getOrderedWorldEntities: () => plugin.getOrderedWorldEntities(),
      getOrderedGroundEntities: (range?: number) => plugin.getOrderedGroundEntities(range),
      getOrderedNPCs: () => plugin.getOrderedNPCs(),
      getClosestEntity: (name: string) => plugin.getClosestEntity(name),
      getClosestEntityUncontested: (name: string) => plugin.getClosestEntityUncontested(name),
      getClosestGroundItem: (name: string, range?: number) => plugin.getClosestGroundItem(name, range),
      getClosestEntityByUniqueId: (uniqueId: number) => plugin.getClosestEntityByUniqueId(uniqueId),
      getClosestEntityByDefId: (defId: number) => plugin.getClosestEntityByDefId(defId),
      getClosestGroundItemById: (id: number) => plugin.getClosestGroundItemById(id),
      getClosestNPC: (name: string) => plugin.getClosestNPC(name),
      getClosestNPCById: (id: number) => plugin.getClosestNPCById(id),
      getClosestNPCByType: (type: number) => plugin.getClosestNPCByType(type),
      getClosestOutOfCombatNPC: (name: string) => plugin.getClosestOutOfCombatNPC(name),
      getClosestNPCTargettingPlayer: (name: string) => plugin.getClosestNPCTargettingPlayer(name),
      getPlayerTarget: () => plugin.getPlayerTarget(),
      
      // Player functions
      getPlayerPosition: () => plugin.getPlayerPosition(),
      getPlayerX: () => plugin.getPlayerX(),
      getPlayerZ: () => plugin.getPlayerZ(),
      getPlayerMapLevel: () => plugin.getPlayerMapLevel(),
      getPlayerHealth: () => plugin.getPlayerHealth(),
      getPlayerMaxHealth: () => plugin.getPlayerMaxHealth(),
      getPlayerHarvestingLevel: () => plugin.getPlayerHarvestingLevel(),
      getPlayerMiningLevel: () => plugin.getPlayerMiningLevel(),
      isPlayerMoving: () => plugin.isPlayerMoving(),
      
      // State functions
      getState: () => plugin.getState(),
      isSkilling: () => plugin.isSkilling(),
      isBanking: () => plugin.isBanking(),
      isStunned: () => plugin.isStunned(),
      isShopping: () => plugin.isShopping(),
      isSmelting: () => plugin.isSmelting(),
      isSmithing: () => plugin.isSmithing(),
      isPotionMaking: () => plugin.isPotionMaking(),
      isThieving: () => plugin.isThieving(),
      isAwaitingItemAction: () => plugin.isAwaitingItemAction(),
      isUsingDoor: () => plugin.isUsingDoor(),
      isTeleporting: () => plugin.isTeleporting(),
      areWorldEntitiesLoading: () => plugin.areWorldEntitiesLoading(),
      
      // Inventory functions
      isInventoryFull: () => plugin.isInventoryFull(),
      isInventoryEmpty: () => plugin.isInventoryEmpty(),
      getInventoryCount: () => plugin.getInventoryCount(),
      getInventoryItemCount: (name: string) => plugin.getInventoryItemCount(name),
      getInventoryItemCountById: (id: number) => plugin.getInventoryItemCountById(id),
      dropInventory: () => plugin.dropInventory(),
      dropItem: (name: string) => plugin.dropItem(name),
      dropAllItemsByName: (name: string) => plugin.dropAllItemsByName(name),
      dropItemBySlot: (slot: number) => plugin.dropItemBySlot(slot),
      
      // Action functions
      attackEntity: (entity: any) => plugin.attackEntity(entity),
      doAction1OnEntity: (entity: any) => plugin.doAction1OnEntity(entity),
      doAction2OnEntity: (entity: any) => plugin.doAction2OnEntity(entity),
      doAction3OnEntity: (entity: any) => plugin.doAction3OnEntity(entity),
      
      // Spell functions
      getSpellByName: (name: string) => plugin.getSpellByName(name),
      getSpellById: (id: number) => plugin.getSpellById(id),
      castTeleportSpell: (spellName: string) => plugin.castTeleportSpell(spellName),
      castSpellOnItem: (spellName: string, itemName: string) => plugin.castSpellOnItem(spellName, itemName),
      
      // Item functions
      getFoodHealAmount: (foodName: string) => plugin.getFoodHealAmount(foodName),
      useItemAction1: (itemName: string) => plugin.useItemAction1(itemName),
      useItemAction1BySlot: (slot: number) => plugin.useItemAction1BySlot(slot),
      useItemOnEntity: (itemName: string, entityName: string) => plugin.useItemOnEntity(itemName, entityName),
      useItemOnItemOption1: (itemName: string, targetItemName: string, number?: number) => plugin.useItemOnItemOption1(itemName, targetItemName, number),
      useItemOnItemOption2: (itemName: string, targetItemName: string, number?: number) => plugin.useItemOnItemOption2(itemName, targetItemName, number),
      
      // Crafting functions
      smeltItemById: (id: number, amount?: number) => plugin.smeltItemById(id, amount),
      smithItemById: (id: number, amount?: number) => plugin.smithItemById(id, amount),
      potionMakeItemById: (id: number, amount?: number) => plugin.potionMakeItemById(id, amount),
      
      // Banking functions
      depositAllItems: () => plugin.depositAllItems(),
      depositItem: (itemName: string, amount: number) => plugin.depositItem(itemName, amount),
      withdrawItem: (itemName: string, amount: number, asIOU?: boolean) => plugin.withdrawItem(itemName, amount, asIOU),
      
      // Shop functions
      toggleAutoRetaliate: () => plugin.toggleAutoRetaliate(),
      buyShopStockByName: (itemName: string, amount: number) => plugin.buyShopStockByName(itemName, amount),
      getShopStockByName: (itemName: string) => plugin.getShopStockByName(itemName),
      
      // Utility functions
      calculateDistance2D: (pos1: any, pos2: any) => plugin.calculateDistance2D(pos1, pos2),
      
      // Movement functions
      walkTo: (x: number, z: number, level?: number) => plugin.walkTo(x, z, level),
      walkToOnce: (x: number, z: number) => plugin.walkToOnce(x, z),
      
      // Door functions
      openDoor: (doorId: number) => plugin.openDoor(doorId),
      
      // Player detection functions
      checkForPlayers: (accounts: string[]) => plugin.checkForPlayers(accounts),
      arePlayersAround: () => plugin.arePlayersAround(),
      
      // Chat functions
      sendChatMessage: (message: string, color: any) => plugin.sendChatMessage(message, color),
      
      // Sound functions
      buzzer: () => plugin.buzzer(),
      messageWarn: () => plugin.messageWarn(),
      loggedInNotify: () => plugin.loggedInNotify(),
      
      // Script control
      isScriptRunning: () => plugin.isScriptRunning,
      stopScript: () => plugin.stopScript(),
      onStop: () => plugin.onStop(),
      
      // Global variables (for compatibility)
      runScript: plugin.runScript,
      skilling: plugin.skilling,
      myAccounts: plugin.myAccounts || [],
      chatColors: plugin.chatColors,
      entityManager: plugin.entityManager,
      worldEntities: plugin.worldEntities
    };
  }

  // Common helper methods all scripts can use

  protected async manageFood(
    foodName: string, 
    foodHealAmount: number, 
    resetCallback?: () => Promise<void>
  ): Promise<boolean> {
    const { log, getPlayerHealth, getPlayerMaxHealth, useItemAction1, getInventoryItemCount, stopScript, buzzer, sendChatMessage } = this.context;
    
    while (getPlayerHealth() < getPlayerMaxHealth() - foodHealAmount || getPlayerHealth() <= getPlayerMaxHealth() * 0.2) {
      if (getInventoryItemCount(foodName) > 0) {
        await useItemAction1(foodName);
      } else {
        log("Out of food!");
        if (resetCallback) {
          await resetCallback(); // Call the reset function
          return true;
        } else {
          stopScript();
          buzzer();
          sendChatMessage('Out of food!', 'Warning');
          console.error("Out of food!");
          log("Out of Food!");
        }
        return false; // Indicate that the script should stop
      }
    }
    return true; // Indicate that food was managed successfully
  }

  protected async lootItems(lootNameArray: string[], searchRange: number): Promise<void> {
    const { log, getClosestGroundItem, doAction1OnEntity, wait } = this.context;
    
    for (const item of lootNameArray) {
      log(`Looking for ground item...`);
      let groundItem = getClosestGroundItem(item, searchRange);
      while (groundItem) {
        doAction1OnEntity(groundItem);
        await wait(600); // Allow time for the pickup
        groundItem = getClosestGroundItem(item, searchRange); // Revalidate ground item
      }
    }
  }

  protected async attackNPC(npcName: string, counter: { value: number }): Promise<void> {
    const { log, getClosestNPCTargettingPlayer, getClosestOutOfCombatNPC, attackEntity, wait } = this.context;
    
    log("Waiting and finding NPC...")
    if (getClosestNPCTargettingPlayer(npcName)) {
      attackEntity(getClosestNPCTargettingPlayer(npcName));
    } else {
      let npc = getClosestOutOfCombatNPC(npcName);
      if (npc) {
        log("Found NPC - Attacking...");
        attackEntity(npc);
        counter.value = 0;
      }
    }
    await wait(600); // Allow time for the attack
  }

  protected async handleWaiting(counter: { value: number; xp: number }): Promise<void> {
    const { log, isPlayerMoving, getPlayerTarget, attackEntity, walkTo, wait, entityManager } = this.context;
    
    //add a check if the current target has 0 hp or something, remove slow waits and test
    if(!isPlayerMoving() && getPlayerTarget().CurrentTarget === undefined){
      let target = getPlayerTarget()
      //await walkTo(getPlayerTarget().CurrentGamePosition.X, getPlayerTarget().CurrentGamePosition.Z)
      //await wait(1200);
      attackEntity(target)
      log("Blocked - Walking to target...")
      await wait(2400);

    } else {
      log("Fighting...")
      await wait(600);
      let lastxp = counter.xp
      let currentxp = entityManager.MainPlayer.Hitpoints.XP
      if (lastxp >= currentxp){
        counter.value++
      } else {
        counter.xp = currentxp
        counter.value = 0
      }
      if(counter.value >= 35){
        await walkTo(getPlayerTarget().CurrentGamePosition.X, getPlayerTarget().CurrentGamePosition.Z)
        log("Counter Hit 35")
        counter.value = 0
      }
    }
  }
} 