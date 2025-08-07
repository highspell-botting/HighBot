# HighspellBotting Plugin

A comprehensive automation plugin for the HighLite client that provides a modular scripting system for various in-game activities including combat, mining, gathering, crafting, and utility tasks.

This repository comes with no in-built scripts, unfortunately. So you'll have to write your own using the examples included, build, and use! Have fun writing creative solutions to problems. If you have a need for a new method or have an improvement, please fork and make a pull request or open a github issue.

## Features

- **Modular Script System**: Organized script categories for different activities
- **Combat Automation**: Fighters, range training, and boss scripts
- **Resource Gathering**: Woodcutting, mining, fishing, thieving, and harvesting
- **Crafting Automation**: Smithing, cooking, fletching, and potion making
- **Utility Scripts**: Teleports, and item management
- **Safety Features**: Player detection and health monitoring
- **TypeScript Support**: Full type safety and IntelliSense support

## Getting Started

### Prerequisites

- Node.js (v22 or higher recommended)
- Yarn package manager (v4.9.1 or compatible)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/HighBot.git
   cd HighspellBotting
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

### Development

To build the plugin in development mode with file watching:

```bash
yarn dev
```

To build the plugin for production:

```bash
yarn build
```

The built plugin will be available in the `dist/` directory as `HighspellBotting.js`.

### Building the Distribution File

The main distribution file `HighspellBotting.js` is built from the TypeScript source files. Here's how the build process works:

1. **Source Files**: The main entry point is `src/HighspellBotting.ts`
2. **Script Modules**: Individual scripts are organized in `src/scripts/` by category
3. **Build Output**: The build process bundles everything into `dist/HighspellBotting.js`

#### Build Configuration

The plugin uses Rollup for bundling with the following features:

- **TypeScript compilation** - Transpiles TypeScript to JavaScript
- **Static resource inlining** - HTML and CSS files are bundled as strings
- **Asset handling** - Images and audio files are inlined (with size limits)
- **ES Module output** - Modern module format for compatibility

Key configuration options in `rollup.config.mjs`:

- Image files: Inlined up to 1MB
- Audio files: Inlined up to 5MB
- HTML/CSS: Always inlined as strings

#### Build Commands

```bash
# Development build with watching
yarn dev

# Production build
yarn build

# Clean build (remove dist folder first)
yarn clean && yarn build
```

## Project Structure

```
HighspellBotting/
├── src/
│   ├── HighspellBotting.ts           # Main plugin class
│   ├── HighspellBottingScripts.ts    # Script orchestrator
│   ├── core/
│   │   └── BaseScript.ts             # Base class for all scripts
│   ├── types/
│   │   ├── ScriptContext.ts          # Script context interface
│   │   └── ScriptTypes.ts            # Type definitions
│   ├── metadata/
│   │   └── ScriptMetadata.ts         # UI metadata for scripts
│   ├── scripts/
│   │   ├── combat/                   # Combat-related scripts
│   │   ├── mining/                   # Mining scripts
│   │   ├── gathering/                # Gathering scripts
│   │   ├── crafting/                 # Crafting scripts
│   │   └── utility/                  # Utility scripts
│   └── types.d.ts                    # TypeScript declarations
├── resources/
│   ├── css/
│   │   └── botting-panel.css         # Plugin UI styles
│   ├── html/
│   │   └── botting-panel.html        # Plugin UI template
│   ├── images/                       # Plugin images
│   └── sounds/                       # Plugin audio files
├── dist/
│   └── HighspellBotting.js           # Built plugin file
├── package.json                      # Project configuration
├── rollup.config.mjs                 # Build configuration
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # This file
```

## Writing Scripts

For detailed information on how to write scripts for this plugin, see the comprehensive guide:

**[📖 Script Writing Guide](src/README_SCRIPT_STRUCTURE.md)**

This guide covers:
- Script structure and basic concepts
- Available methods and functions
- Common script patterns
- Best practices and troubleshooting
- Advanced scripting techniques

### Quick Start for Script Writers

1. **Choose a category**: Place your script in the appropriate `src/scripts/` subdirectory
2. **Extend BaseScript**: All scripts should extend the `BaseScript` class
3. **Implement execute()**: This is your main script method
4. **Use the context**: Access game methods via `this.context`
5. **Follow patterns**: Use the established patterns for your script type

Example script structure:
```typescript
import { BaseScript } from '../../core/BaseScript';

export class ScriptYourScript extends BaseScript {
  async execute(param1: string, param2: number): Promise<void> {
    const { log, updateStatus, wait, isSkilling } = this.context;
    
    while (this.plugin.isScriptRunning) {
      if (!isSkilling()) {
        // Your script logic here
        updateStatus("Working...");
      } else {
        await wait(5000);
      }
    }
  }
}
```

## Plugin Configuration

The main plugin class extends the base `Plugin` class from `@highlite/plugin-api`:

```typescript
class HighspellBotting extends Plugin {
    pluginName = "HighBot";
    author: string = "Your Name";
    
    // Plugin lifecycle methods
    init(): void { }
    start(): void { }
    stop(): void { }
}
```

## Testing the Plugin

### Local Testing Setup

1. **Clone HighLiteDesktop**:
   ```bash
   git clone https://github.com/Highl1te/HighLiteDesktop.git
   cd HighLiteDesktop
   ```

2. **Build the plugin**:
   ```bash
   cd /path/to/HighBot
   yarn build
   ```

3. **Copy the built plugin**:
   ```bash
   cp dist/HighspellBotting.js /path/to/HighLiteDesktop/src/renderer/client/plugins/
   ```

### Testing Guidelines

- **Plugin Location**: Place `HighspellBotting.js` in `HighliteDesktop/src/renderer/client/plugins/`
- **Automatic Loading**: The plugin will be automatically loaded by the client
- **Hot Reloading**: After making changes, rebuild and replace the file in the plugins directory
- **Script Testing**: Test individual scripts through the plugin's UI interface

### Testing Workflow

1. Make changes to your plugin code or scripts
2. Run `yarn build` to create the updated plugin file
3. Copy the new build to the HighLite plugins directory
4. Restart HighLite to load the updated plugin
5. Test your plugin functionality and scripts
6. Repeat as needed

## Available Scripts

The plugin only includes one example script to get you started.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write your scripts following the [Script Writing Guide](src/README_SCRIPT_STRUCTURE.md)
4. Test your changes thoroughly
5. Submit a pull request

## License

This project is licensed under the terms specified in the LICENSE file.
