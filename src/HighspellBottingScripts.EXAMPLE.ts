// EXAMPLE HIGHSPELL BOTTING SCRIPTS - New Modular Structure
// This file serves as the main orchestrator for all individual script files
// This is an example version showing the structure without exposing all implementations

import { SCRIPT_METADATA } from './metadata/ScriptMetadata';

// ========================================
// IMPORT STATEMENTS - EXAMPLE STRUCTURE
// ========================================
// The following imports show the structure for different script categories
// Only scriptFighter and scriptExample are actually included in this example file

// Combat Scripts
import { ScriptFighter } from './scripts/combat/scriptFighter';

// Gathering Scripts
// import { ScriptRiverFish } from './scripts/gathering/scriptRiverFish';

// Crafting Scripts

// import { ScriptSmeltBronze } from './scripts/crafting/scriptSmeltBronze';

// Mining Scripts
// import { ScriptMineBronze } from './scripts/mining/scriptMineBronze';

// Utility Scripts
// import { ScriptBuyStock } from './scripts/utility/scriptBuyStock';

// ========================================
// EXAMPLE SCRIPT IMPORTS
// ========================================
// These are the only scripts actually imported in this example file
import { ScriptExample } from './scripts/utility/scriptExample';

export class HighspellBottingScripts {
  private plugin: any;
  private scripts: Map<string, any> = new Map();

  constructor(plugin: any) {
    this.plugin = plugin;
    this.initializeScripts();
  }

  private initializeScripts(): void {
    // ========================================
    // SCRIPT INITIALIZATION - EXAMPLE STRUCTURE
    // ========================================
    // The following sections show how scripts are organized by category
    // Only scriptFighter and scriptExample are actually initialized in this example file

    // Combat Scripts
    this.scripts.set('scriptFighter', new ScriptFighter(this.plugin));
    
    // Gathering Scripts
    // this.scripts.set('scriptRiverFish', new ScriptRiverFish(this.plugin));;
    
    // Mining Scripts
    // this.scripts.set('scriptMineBronze', new ScriptMineBronze(this.plugin));
    
    // Crafting Scripts
    // this.scripts.set('scriptSmeltBronze', new ScriptSmeltBronze(this.plugin));
    
    
    // Utility Scripts
    // this.scripts.set('scriptBuyStock', new ScriptBuyStock(this.plugin));

    // ========================================
    // EXAMPLE SCRIPT INITIALIZATION
    // ========================================
    // These are the only scripts actually initialized in this example file
    this.scripts.set('scriptExample', new ScriptExample(this.plugin));
  }

  // ========================================
  // SCRIPT EXECUTION METHODS - EXAMPLE STRUCTURE
  // ========================================
  // The following methods show the pattern for exposing scripts through a unified interface
  // Only scriptFighter and scriptExample methods are actually implemented in this example file

  // Combat Scripts
  async scriptFighter(
    npcName: string, 
    lootNameArray: string[], 
    foodName: string, 
    lookForRareLoot: boolean = false, 
    searchRange: number = 0
  ): Promise<void> {
    const script = this.scripts.get('scriptFighter') as ScriptFighter;
    return script.execute(npcName, lootNameArray, foodName, lookForRareLoot, searchRange);
  }

  async scriptExample(): Promise<void> {
    const script = this.scripts.get('scriptExample') as ScriptExample;
    return script.execute();
  }

  // ========================================
  // UTILITY METHODS
  // ========================================
  // These methods are always available regardless of which scripts are loaded

  // Expose metadata for the UI
  getScriptMetadata(): Record<string, any> {
    return SCRIPT_METADATA;
  }

  // Helper method to check if a script exists
  hasScript(scriptName: string): boolean {
    return this.scripts.has(scriptName);
  }

  // Get list of available scripts
  getAvailableScripts(): string[] {
    return Array.from(this.scripts.keys());
  }
} 