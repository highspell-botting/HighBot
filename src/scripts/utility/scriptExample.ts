import { BaseScript } from '../../core/BaseScript';

// Extends BaseScript to inherit core functionality for script execution
export class ScriptExample extends BaseScript {
  async execute(): Promise<void> {
    // Destructure context methods for easier access to plugin functionality
    const { updateStatus, checkForPlayers, wait, isSkilling, isInventoryFull, getInventoryItemCount, useItemOnItemOption1, doAction1OnEntity, getClosestEntity, isBanking, depositItem } = this.context;

    // Set initial status to indicate script is running
    updateStatus("Running Script...", "active");

    // Main loop: Continues as long as the script is running
    while (this.plugin.isScriptRunning) {
      // Check if the player is not currently skilling (e.g., chopping or carving)
      if (!isSkilling()) {
        // Check for nearby players (likely for safety or interaction)
        await checkForPlayers(this.context.myAccounts);

        // Branch: Handle full inventory
        if (isInventoryFull()) {
          // Check if there are Oak Logs in inventory
          if (getInventoryItemCount("Oak Logs") > 0) {
            // Update status and carve Oak Logs into bows using Knife
            updateStatus("Carving Logs...");
            await useItemOnItemOption1("Knife", "Oak Logs", 28);

            // Inner loop: Wait until all Oak Logs are carved
            while (getInventoryItemCount("Oak Logs") > 0) {
              updateStatus("Carving...");
              await wait(5000); // Wait 5 seconds between checks
            }
          } else {
            // No Oak Logs, head to bank
            doAction1OnEntity(getClosestEntity("Bank Chest")); // Interact with nearest Bank Chest
            updateStatus("Walking to bank...");

            // Inner loop: Wait until banking interface is active
            while (!isBanking()) {
              updateStatus("Walking...");
              await wait(5000); // Wait 5 seconds between checks
            }

            // Bank items
            updateStatus("Banking Items...");
            await depositItem("Unstrung Oak Bow", 28); // Deposit all Unstrung Oak Bows
            await wait(5000); // Wait 5 seconds for stability
            if (getInventoryItemCount("Lucky Logs") > 0) {
              await depositItem("Lucky Logs", 28); // Deposit Lucky Logs if present
            }
            await wait(5000); // Wait 5 seconds for stability
          }
        } else {
          // Branch: Inventory not full, look for Oak Tree to chop
          updateStatus("Looking For Tree...");
          const tree = getClosestEntity("Oak Tree"); // Find nearest Oak Tree
          if (tree) {
            doAction1OnEntity(tree); // Interact with tree (e.g., chop)
          }
          await wait(5000); // Wait 5 seconds before next iteration
        }
      } else {
        // Branch: Player is skilling, wait and check again
        updateStatus("Busy, waiting...", "warning");
        await wait(5000); // Wait 5 seconds before next iteration
      }
    }
  }
} 