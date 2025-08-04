# Highlite Example Plugin Template

A template repository for creating plugins for the HighLite client. This template showcases the basic structure, lifecycle methods, and how to use static resources like HTML, CSS, images, and audio files.

> **📋 This is a Template Repository**  
> Use this template to quickly create your own HighLite plugin by clicking the "Use this template" button on GitHub, or generate a new repository from this template.

## Getting Started

### Prerequisites

- Node.js (v22 or higher recommended)
- Yarn package manager (v4.9.1 or compatible)

### Installation

1. **Use this template**: Click the "Use this template" button on GitHub to create a new repository based on this template
2. **Clone your new repository**: 
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_PLUGIN_NAME.git
   cd YOUR_PLUGIN_NAME
   ```
3. **Install dependencies**:

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

The built plugin will be available in the `dist/` directory as `ExamplePlugin.js`.

## Project Structure

```
Example-Plugin/
├── src/
│   ├── ExamplePlugin.ts    # Main plugin class
│   └── types.d.ts          # TypeScript type declarations for static resources
├── resources/
│   ├── css/
│   │   └── base.css        # Stylesheet for the plugin
│   ├── html/
│   │   └── html.html       # HTML template
│   ├── images/
│   │   └── image.png       # Example image asset
│   └── sounds/
│       └── sound.mp3       # Exammple audio asset
├── package.json            # Project configuration and dependencies
├── rollup.config.mjs       # Build configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Configuration

### Plugin Configuration

The main plugin class extends the base `Plugin` class from `@highlite/plugin-api`:

```typescript
class ExamplePlugin extends Plugin {
    pluginName = "ExamplePlugin";
    author: string = "Your Name";  // Update this with your name
    
    // Plugin lifecycle methods
    init(): void { }
    start(): void { }
    stop(): void { }
}
```

### Build Configuration

The plugin uses Rollup for bundling with the following features:

- **TypeScript compilation** - Transpiles TypeScript to JavaScript
- **Static resource inlining** - HTML and CSS files are bundled as strings
- **Asset handling** - Images and audio files are inlined (with size limits)
- **ES Module output** - Modern module format for compatibility

Key configuration options in `rollup.config.mjs`:

- Image files: Inlined up to 1MB
- Audio files: Inlined up to 5MB
- HTML/CSS: Always inlined as strings

## Using Static Resources

This example demonstrates how to import and use various types of static resources:

### HTML Templates

```typescript
import htmlContent from "../resources/html/html.html";

// Use in your plugin
document.getElementById("app")!.innerHTML = htmlContent;
```

### CSS Stylesheets

```typescript
import styles from "../resources/css/base.css";

// Inject styles into the document
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);
```

### Images

```typescript
import imageSrc from "../resources/images/image.png";

// Use the image source
const img = document.createElement('img');
img.src = imageSrc;
```

### Audio Files

```typescript
import audioSrc from "../resources/sounds/sound.mp3";

// Use the audio source
const audio = new Audio(audioSrc);
audio.play();
```

### Type Declarations

The `types.d.ts` file provides TypeScript support for importing static resources:

- Image formats: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`
- Audio formats: `.mp3`, `.wav`
- Web assets: `.css`, `.html`

### Development Tips

1. **Resource Management**: Keep resource files organized in the `resources/` directory
2. **Debugging**: Use the `this.log()` method for development debugging

### Customization

To customize this template for your own plugin:

1. **Rename your plugin**: Update the `pluginName` and `author` properties in `src/ExamplePlugin.ts`
2. **Update package.json**: 
   - Change the `name` field to match your plugin name (e.g., `"YourPluginName"`)
   - Update the `main` field if you rename the main TypeScript file (e.g., `"src/YourPluginName.ts"`)
   - Rerun `yarn install` to make the worksapce properly recognize the new package name
3. **Replace the HTML content** in `resources/html/html.html`
4. **Modify styles** in `resources/css/base.css`
5. **Add your own images and audio files** to the respective directories
6. **Implement your plugin logic** in the lifecycle methods
7. **Update this README** to describe your specific plugin functionality

## Testing Plugins

Testing your plugin locally is essential before publishing to the Plugin Hub. HighLite provides a convenient way to test plugins without going through the remote distribution process.

### Local Testing Setup

1. **Clone HighLiteDesktop**:
   ```bash
   git clone https://github.com/Highl1te/HighLiteDesktop.git
   cd HighLiteDesktop
   ```

2. **Build your plugin**:
   Navigate back to your plugin directory and build it:
   ```bash
   cd /path/to/your/plugin
   yarn build
   ```

3. **Copy the built plugin**:
   Copy your built plugin file to the HighLite plugins directory:
   ```bash
   cp dist/ExamplePlugin.js /path/to/HighLiteDesktop/src/renderer/client/plugins/
   ```

### Testing Guidelines

- **Plugin Location**: Place any built plugin (e.g., `PluginName.js`) in `HighliteDesktop/src/renderer/client/plugins/`
- **Automatic Loading**: Plugins in this directory are automatically loaded by the client
- **Name Conflicts**: If testing an existing Plugin Hub plugin, temporarily use a different name to avoid conflicts with the remotely pulled version
- **Hot Reloading**: After making changes, rebuild your plugin and replace the file in the plugins directory

### Testing Workflow

1. Make changes to your plugin code
2. Run `yarn build` to create the updated plugin file
3. Copy the new build to the HighLite plugins directory
4. Restart HighLite to load the updated plugin
5. Test your plugin functionality
6. Repeat as needed

### Debugging Tips

- Use `this.log()` method in your plugin for debugging output
- Check the HighLite console for any error messages
- Verify your plugin follows the correct lifecycle methods (`init()`, `start()`, `stop()`)
- Ensure all static resources are properly bundled and accessible

## License

This project is licensed under the terms specified in the LICENSE file.
