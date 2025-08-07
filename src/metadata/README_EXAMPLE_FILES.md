# Example Files for Repository

This directory contains example versions of the core TypeScript files used in the botting system. These files are provided for documentation and reference purposes, showing the structure and organization without exposing the full implementation details.

## Files Included

### ScriptMetadata.ts
- **Purpose**: Defines metadata for all available scripts in the system
- **Example Content**: Contains only the `scriptExample` entry to demonstrate structure
- **Categories**: Shows how scripts are organized by type (Combat, Crafting, Gathering, Mining, Utility)
- **Structure**: Demonstrates the `ScriptMetadata` interface with name, description, and parameters

### ScriptContext.ts  
- **Purpose**: Defines the interface that provides all available methods for scripts to interact with the game world
- **Example Content**: Contains the complete interface with detailed comments for each method category
- **Categories**: Core methods, Entity functions, Player functions, State functions, Inventory functions, etc.
- **Documentation**: Each method includes a brief description of its purpose

## How to Use These Files

1. **For Documentation**: These files show the structure and organization of the botting system
2. **For Development**: Use as reference when creating new scripts or understanding the API
3. **For Repository**: Provide these instead of the full implementation files to protect proprietary code

## File Structure

```
src/
├── metadata/
│   ├── ScriptMetadata.ts          # Example metadata file
│   └── README_EXAMPLE_FILES.md    # This file
└── types/
    └── ScriptContext.ts           # Example context interface
```

## Notes

- These are example files only and do not contain the full implementation
- The actual files contain many more script entries and may have additional methods
- Use these files as templates for understanding the system architecture
- All comments and structure are preserved to maintain clarity 