# Highspell Botting Scripts - Writing Guide

This guide teaches you how to write scripts for the Highspell Botting system from scratch. Whether you're a complete beginner or an experienced developer, this document will help you understand the scripting language, available methods, and best practices. If you have any suggestions for methods, please feel free to leave an issue or make a pull request!

## Table of Contents

1. [Script Structure Overview](#script-structure-overview)
2. [Understanding the Script Loop](#understanding-the-script-loop)
3. [Available Methods and Functions](#available-methods-and-functions)
4. [Writing Your First Script](#writing-your-first-script)
5. [Common Script Patterns](#common-script-patterns)
6. [Script Categories and Organization](#script-categories-and-organization)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Script Structure Overview

Every script in the Highspell Botting system follows this basic structure:

```typescript
import { BaseScript } from '../../core/BaseScript';

export class ScriptYourScriptName extends BaseScript {
  async execute(parameter1: string, parameter2: number): Promise<void> {
    // Destructure commonly used methods from context
    const { log, updateStatus, wait, isSkilling, isInventoryFull } = this.context;
    
    // Main script loop
    while (this.plugin.isScriptRunning) {
      // Your script logic here
    }
  }
}
```

### Key Components:

- **BaseScript**: Every script extends this class to inherit common functionality
- **execute()**: The main method that runs your script logic
- **this.context**: Provides access to all game interaction methods
- **while loop**: Keeps your script running until manually stopped

## Understanding the Script Loop

The core of every script is the main loop that continuously runs until the script is stopped:

```typescript
while (this.plugin.isScriptRunning) {
  // Check current game state
  if (!isSkilling()) {
    // Perform actions when not busy
    updateStatus("Looking for target...");
    // ... your logic here
  } else {
    // Wait when player is busy
    updateStatus("Busy, waiting...", "warning");
    await wait(5000);
  }
}
```

### Loop Best Practices:

1. **Always check if the script is still running** - `this.plugin.isScriptRunning`
2. **Check player state before acting** - Use `isSkilling()`, `isBanking()`, etc.
3. **Include appropriate waits** - Use `await wait(ms)` to prevent excessive CPU usage
4. **Update status regularly** - Keep users informed with `updateStatus()`

## Available Methods and Functions

The `this.context` object provides access to all game interaction methods. Here are the most commonly used categories:

### Core Methods
```typescript
const { log, updateStatus, wait, updateLastAction } = this.context;

log("Your message here");                    // Log to console
updateStatus("Current action", "type");     // Update UI status
await wait(1000);                           // Wait 1 second
updateLastAction("Action description");     // Update last action display
```

### Player Information
```typescript
const { 
  getPlayerHealth, getPlayerMaxHealth, getPlayerPosition,
  getPlayerX, getPlayerZ, getPlayerMapLevel,
  isPlayerMoving, getPlayerHarvestingLevel, getPlayerMiningLevel 
} = this.context;

const health = getPlayerHealth();           // Current health
const maxHealth = getPlayerMaxHealth();     // Maximum health
const position = getPlayerPosition();       // {x, z, level}
const x = getPlayerX();                     // X coordinate
const z = getPlayerZ();                     // Z coordinate
const level = getPlayerMapLevel();          // Map level (floor)
```

### State Checking
```typescript
const { 
  isSkilling, isBanking, isStunned, isShopping,
  isSmelting, isSmithing, isPotionMaking, isThieving,
  isAwaitingItemAction, isUsingDoor, isTeleporting 
} = this.context;

if (isSkilling()) { /* player is performing a skill */ }
if (isBanking()) { /* player is at bank interface */ }
if (isStunned()) { /* player is stunned */ }
```

### Inventory Management
```typescript
const { 
  isInventoryFull, isInventoryEmpty, getInventoryCount,
  getInventoryItemCount, dropInventory, dropItem 
} = this.context;

if (isInventoryFull()) { /* inventory is full */ }
const count = getInventoryItemCount("Oak Logs");  // Count specific item
await dropItem("Oak Logs");                       // Drop specific item
await dropInventory();                            // Drop all items
```

### Entity Interaction
```typescript
const { 
  getClosestEntity, getClosestNPC, getClosestGroundItem,
  doAction1OnEntity, doAction2OnEntity, doAction3OnEntity,
  attackEntity 
} = this.context;

const tree = getClosestEntity("Oak Tree");        // Find nearest entity
const npc = getClosestNPC("Goblin");              // Find nearest NPC
const loot = getClosestGroundItem("Bones", 5);    // Find ground item within 5 tiles

doAction1OnEntity(tree);                          // Primary action (e.g., chop)
doAction2OnEntity(npc);                           // Secondary action
attackEntity(npc);                                // Attack entity
```

### Movement
```typescript
const { walkTo, walkToOnce, calculateDistance2D } = this.context;

await walkTo(100, 200, 0);                        // Walk to coordinates (x, z, radius)
walkToOnce(100, 200);                             // Walk once without waiting
const distance = calculateDistance2D(pos1, pos2); // Calculate distance between positions
```

### Banking
```typescript
const { depositAllItems, depositItem, withdrawItem } = this.context;

await depositAllItems();                          // Deposit all items
await depositItem("Oak Logs", 28);               // Deposit specific amount
await withdrawItem("Knife", 1);                  // Withdraw item
```

### Item Usage
```typescript
const { 
  useItemAction1, useItemOnItemOption1, useItemOnItemOption2,
  getFoodHealAmount 
} = this.context;

await useItemAction1("Bread");                    // Use item (e.g., eat food)
await useItemOnItemOption1("Knife", "Oak Logs");  // Use item on another item
const healAmount = getFoodHealAmount("Bread");    // Get food healing amount
```

### Combat
```typescript
const { 
  getPlayerTarget, getClosestOutOfCombatNPC,
  getClosestNPCTargettingPlayer 
} = this.context;

const target = getPlayerTarget();                 // Get current combat target
const npc = getClosestOutOfCombatNPC("Goblin");   // Find non-combat NPC
```

### Safety and Player Detection -- Currently disabled but can be re-enabled.
```typescript
const { checkForPlayers, arePlayersAround } = this.context;

await checkForPlayers(this.context.myAccounts);   // Check for known players
const playersNearby = await arePlayersAround();   // Check if any players nearby
```

## Writing Your First Script

Let's create a simple woodcutting script to demonstrate the basics:

```typescript
import { BaseScript } from '../../core/BaseScript';

export class ScriptWoodcutter extends BaseScript {
  async execute(treeName: string, logName: string): Promise<void> {
    // Destructure commonly used methods
    const { log, updateStatus, wait, isSkilling, isInventoryFull, 
            getClosestEntity, doAction1OnEntity, getInventoryItemCount,
            getClosestEntity: getBank, isBanking, depositItem } = this.context;
    
    log(`Starting Woodcutter script for ${treeName}`);
    updateStatus("Starting woodcutting...", "active");
    
    // Main script loop
    while (this.plugin.isScriptRunning) {
      // Check if player is not currently chopping
      if (!isSkilling()) {
        // Check for nearby players (safety)
        await this.context.checkForPlayers(this.context.myAccounts);
        
        // Handle full inventory
        if (isInventoryFull()) {
          updateStatus("Inventory full, going to bank...");
          
          // Find and click on bank
          const bank = getBank("Bank Chest");
          if (bank) {
            doAction1OnEntity(bank);
            
            // Wait until banking interface opens
            while (!isBanking()) {
              updateStatus("Walking to bank...");
              await wait(2000);
            }
            
            // Deposit logs
            updateStatus("Depositing logs...");
            await depositItem(logName, 28);
            await wait(1000);
          }
        } else {
          // Find and chop tree
          updateStatus(`Looking for ${treeName}...`);
          const tree = getClosestEntity(treeName);
          
          if (tree) {
            updateStatus(`Chopping ${treeName}...`);
            doAction1OnEntity(tree);
          }
          
          await wait(3000);
        }
      } else {
        // Player is chopping, wait
        updateStatus("Chopping...", "warning");
        await wait(5000);
      }
    }
  }
}
```

## Common Script Patterns

### Pattern 1: Resource Gathering (Woodcutting, Mining, Fishing)
```typescript
while (this.plugin.isScriptRunning) {
  if (!isSkilling()) {
    if (isInventoryFull()) {
      // Bank items
    } else {
      // Find and interact with resource
    }
  } else {
    // Wait while skilling
  }
}
```

### Pattern 2: Combat Scripts
```typescript
while (this.plugin.isScriptRunning) {
  // Check health and eat food
  await this.manageFood(foodName, foodHealAmount);
  
  if (!getPlayerTarget() || target is dead) {
    // Loot items and find new target
    await this.lootItems(lootArray, searchRange);
    await this.attackNPC(npcName, counter);
  } else {
    // Wait during combat
    await this.handleWaiting(counter);
  }
}
```

### Pattern 3: Crafting Scripts
```typescript
while (this.plugin.isScriptRunning) {
  if (!isSkilling()) {
    if (needMaterials) {
      // Withdraw materials from bank
    } else if (hasMaterials) {
      // Craft items
    } else {
      // Bank finished products
    }
  } else {
    // Wait while crafting
  }
}
```

## Script Categories and Organization

Scripts are organized into categories based on their primary activity:

- **combat/**: Fighting, range training, boss scripts
- **mining/**: All mining activities
- **gathering/**: Woodcutting, fishing, thieving, harvesting
- **crafting/**: Smithing, cooking, fletching, potion making
- **utility/**: Teleports, watchdog, eating, buying items

### Creating a New Script

1. **Choose the right category** for your script
2. **Create the file** with naming convention: `scriptYourScriptName.ts`
3. **Extend BaseScript** and implement the `execute()` method
4. **Add to the main orchestrator** (see below)
5. **Add metadata** for the UI (see below)

### Adding Your Script to the System

After creating your script file, you need to register it:

```typescript
// In HighspellBottingScripts.ts
import { ScriptYourScriptName } from './scripts/category/scriptYourScriptName';

export class HighspellBottingScripts {
  private initializeScripts(): void {
    this.scripts.set('scriptYourScriptName', new ScriptYourScriptName(this.plugin));
  }

  async scriptYourScriptName(param1: string, param2: number): Promise<void> {
    const script = this.scripts.get('scriptYourScriptName') as ScriptYourScriptName;
    return script.execute(param1, param2);
  }
}
```

### Adding Script Metadata

The types of script parameters are located in `src/types/ScriptTypes.ts`
Add metadata for the UI in `metadata/ScriptMetadata.ts`:

```typescript
scriptYourScriptName: {
  name: "Your Script Display Name",
  description: "What your script does",
  parameters: [
    { name: "param1", label: "Parameter 1", type: "text", placeholder: "Enter value" },
    { name: "param2", label: "Parameter 2", type: "number", placeholder: "0" }
  ]
}
```

## Best Practices

### 1. Always Include Safety Checks
```typescript
// Check for players regularly
await this.context.checkForPlayers(this.context.myAccounts); //Currently disabled but can be edited to be re-enabled

// Check script is still running
if (!this.plugin.isScriptRunning) return;
```

### 2. Use Appropriate Waits
```typescript
// Short waits for quick actions
await wait(600);

// Longer waits for skilling activities
await wait(5000);

// Very short waits for rapid checks
await wait(100);

//Randomized waits (between 2500,7500)
await wait(2500,7500);
```

### 3. Provide Clear Status Updates
```typescript
updateStatus("Looking for target...");           // Normal status
updateStatus("Health low, eating...", "warning"); // Warning status
updateStatus("Script complete!", "success");     // Success status
```

### 4. Handle Edge Cases
```typescript
// Check if entity exists before interacting
const tree = getClosestEntity("Oak Tree");
if (tree) {
  doAction1OnEntity(tree);
} else {
  updateStatus("No trees found nearby");
  await wait(5000);
}
```

### 5. Use Helper Methods from BaseScript
```typescript
// For combat scripts
await this.manageFood(foodName, foodHealAmount);
await this.lootItems(lootArray, searchRange);
await this.attackNPC(npcName, counter);
await this.handleWaiting(counter);
```

### 6. Log Important Events
```typescript
log(`Starting script with parameters: ${param1}, ${param2}`);
log(`Killed ${counter.value} ${npcName}`);
log(`Script completed successfully`);
```

## Troubleshooting

### Common Issues

1. **Script not responding**: Check if you're using `await wait()` in your loops
2. **Actions not working**: Verify the entity exists before interacting
3. **Infinite loops**: Ensure you have proper exit conditions
4. **Performance issues**: Use appropriate wait times between actions

### Debugging Tips

1. **Use console logging**: `log("Debug message")` to track script flow
2. **Check player state**: Use state checking methods to understand what the player is doing
3. **Verify coordinates**: Use `getPlayerPosition()` to check player location
4. **Test incrementally**: Build your script step by step

### Getting Help


- Review the `ScriptContext` interface for available methods
- Use the `BaseScript` helper methods for common tasks
- Test your script with simple parameters first

## Advanced Topics

### Custom Helper Methods
You can add private methods to your script class:

```typescript
export class ScriptAdvanced extends BaseScript {
  private async customHelper(): Promise<void> {
    // Your custom logic here
  }
  
  async execute(): Promise<void> {
    await this.customHelper();
    // Main script logic
  }
}
```

### Complex State Management
For complex scripts, consider using state machines:

```typescript
enum ScriptState {
  GATHERING,
  BANKING,
  CRAFTING
}

let currentState = ScriptState.GATHERING;

while (this.plugin.isScriptRunning) {
  switch (currentState) {
    case ScriptState.GATHERING:
      // Gathering logic
      break;
    case ScriptState.BANKING:
      // Banking logic
      break;
    case ScriptState.CRAFTING:
      // Crafting logic
      break;
  }
}
```

This guide should give you everything you need to start writing effective scripts for the Highspell Botting system. Start with simple scripts and gradually build up to more complex automation! 