# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Type-check + bundle (run before testing)
npm run compile

# Watch mode during development
npm run watch

# Package as .vsix for distribution
npm run package
```

`compile` runs `tsc --noEmit` for type checking, then `esbuild` to produce `out/extension.js`. The two steps are separate so TypeScript errors surface before bundling.

To launch the Extension Development Host, open this folder in VS Code and press **F5**.

## Architecture

The extension reads `/** … */` Javadoc comments directly from Java **source files** and renders them as HTML in a VS Code bottom panel. It does **not** look for or generate pre-built Javadoc HTML files.

### Data flow

```
Cursor move (debounce, default 400 ms)
  → JavadocExtractor.extractJavadocAtCursor()
      1. Cursor is inside a /** … */ block  → extract that block directly
      2. vscode.executeDefinitionProvider  → open the definition's source file
         → find /** … */ above the declaration line
      3. Fallback: search backward in the current file
  → JavadocParser.parseJavadocToHtml()
      → strip /** */ delimiters, leading " * "
      → description HTML is passed through as-is
      → block tags (@param, @return, @throws …) are converted to <dl> sections
      → inline tags ({@code}, {@link}, {@literal}) are converted inline
  → JavadocViewProvider.show(html)
      → webviewView.webview.html = html
```

### Key source files

| File | Responsibility |
|---|---|
| [src/extension.ts](src/extension.ts) | `activate` — registers provider, commands, cursor-change listeners |
| [src/JavadocViewProvider.ts](src/JavadocViewProvider.ts) | `WebviewViewProvider` — owns the bottom-panel webview (`javadocLens.previewView`) |
| [src/JavadocExtractor.ts](src/JavadocExtractor.ts) | Locates and extracts the raw `/** … */` comment for the cursor position |
| [src/JavadocParser.ts](src/JavadocParser.ts) | Converts the raw comment string to a complete HTML page |

### Panel registration

`contributes.viewsContainers.panel` → `javadocLensPanel` → `contributes.views.javadocLensPanel` (type `webview`). This places the panel next to Terminal/Output/Problems.

### Important constraints

- **`moduleResolution: "node"`** (not `"bundler"`) — required because `module: "commonjs"`. TypeScript 5.x does not support `"bundler"` with `"commonjs"`.
- **`enableScripts: false`** — the webview HTML is static; no JS is needed because the parser generates complete HTML server-side.
- **CSP**: `default-src 'none'; style-src 'unsafe-inline'` — no external resources, no scripts.
- **No runtime dependencies** — only VS Code API and Node built-ins. All devDependencies are MIT/Apache-2.0.

### Sample files

`sample/src/com/example/` contains four Java files for manual testing:
- `PlainClass.java` — plain-text Javadoc (no HTML decorations)
- `StyledClass.java` — rich Javadoc with `<b>`, `<table>`, `<pre>{@code}`, `@param`, `@return`, `@throws`, `@deprecated`
- `DeprecatedClass.java` — `@Deprecated` class with migration notes
- `Main.java` — uses the other three classes; place cursor on their names to test cross-file extraction via `executeDefinitionProvider`
