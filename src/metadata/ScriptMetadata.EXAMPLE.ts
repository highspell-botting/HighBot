import { ScriptMetadata } from '../types/ScriptTypes';

// EXAMPLE SCRIPT METADATA FILE
// This file contains metadata for all available scripts in the botting system.
// Each script entry includes:
// - name: Display name for the UI
// - description: What the script does
// - parameters: Array of configurable parameters (optional)

// CATEGORIES:
// - Combat: Fighting NPCs, training combat skills
// - Crafting: Making items, processing materials
// - Gathering: Collecting resources from the world
// - Mining: Mining ores and minerals
// - Utility: Helper scripts, teleports, etc.

export const SCRIPT_METADATA: Record<string, ScriptMetadata> = {
  // ========================================
  // COMBAT SCRIPTS
  // ========================================
  // These scripts handle various combat activities including fighting NPCs,
  // training ranged combat, and AFK combat with different features.

  // ========================================
  // CRAFTING SCRIPTS  
  // ========================================
  // Scripts for creating items, processing materials, and various crafting activities.
  // Includes scroll making, bow crafting, potion making, and smithing.

  // ========================================
  // GATHERING SCRIPTS
  // ========================================
  // Scripts for collecting resources from the world including woodcutting,
  // fishing, harvesting, and thieving activities.

  // ========================================
  // MINING SCRIPTS
  // ========================================
  // Scripts for mining various ores and minerals in different locations.
  // Includes power mining, guild mining, and specific ore targeting.

  // ========================================
  // UTILITY SCRIPTS
  // ========================================
  // Helper scripts for teleportation, eating, watchdog functionality, etc.

  // ========================================
  // EXAMPLE SCRIPT
  // ========================================
  // This is the only script included in this example file.
  // It demonstrates the basic structure of a script metadata entry.
  scriptExample: {
    name: "Example Script",
    description: "Cut oak trees and make unstrung oak bows and bank them. First ever script!",
    parameters: []
  },

  // ========================================
  // NOTES ON SCRIPT ORGANIZATION:
  // ========================================
  // - Scripts are organized by category for easier maintenance
  // - Each script has a unique identifier (e.g., scriptExample)
  // - Parameters are optional and define configurable options
  // - Descriptions should be clear and concise
  // - Names should be user-friendly for the UI
}; 