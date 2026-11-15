# Color Picker

A Chrome Manifest V3 extension built with React 19 and TypeScript, using Vite 7 for development and production builds. It samples a screen pixel with the browser's native EyeDropper and saves its sRGB HEX value locally.

## Localization

Choose Auto / English / Tiếng Việt in the popup. Auto follows the browser language with English fallback. The preference is saved locally. See [localization](docs/LOCALIZATION.md).

## Current features

- Select one pixel per click on **Pick Color**, including displayed colors from images, gradients, and composited transparency.
- Press **Esc** to cancel without changing the saved color or clipboard.
- View a color swatch and uppercase HEX value; reopening the popup restores the latest color.
- Click **Copy** to write the HEX value to the clipboard. Selection never copies automatically.
- The Copy button is disabled while writing. On success, it displays **Copied!** and stays disabled for two seconds before returning to **Copy**. Starting a new selection clears the confirmation.
- Retain up to 50 distinct colors locally, newest first. Selecting an existing color moves it to the front. Only the latest color is currently displayed; there is no history grid or clear-history action yet.
- Display errors when selection, storage, or clipboard operations fail, or when EyeDropper is unavailable.

Continuous selection, a recent-color interface, and a precision mode are not implemented. See [features and plans](docs/FEATURES.md) for their status.

## Run locally

Use Node.js 22.22.2+ or 24.15.0+ (validated with Node.js 24) and desktop Chrome or Edge with EyeDropper support.

From the repository root:

```powershell
npm ci
npm run build
```

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**, click **Load unpacked**, and select this project's **dist** directory.
3. Open Color Picker from the browser's extensions menu; pin it to the toolbar if desired.
4. Click **Pick Color**, then click a pixel to select it or press **Esc** to cancel.
5. Click **Copy** when you want the displayed HEX value on the clipboard.

Each click on Pick Color starts one selection. After selecting or cancelling, click it again for the next color.

After editing, run `npm run build`, click **Reload** on the extension's card, and reopen the popup. If upgrading from the original version that injected a picker and styles, also refresh existing web tabs to remove those old scripts and styles.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite; open `/src/index.html` on the URL printed in the terminal for layout work |
| `npm run build` | Check TypeScript and build the unpacked extension into `dist/` |
| `npm run preview` | Serve the production build for layout inspection at `/src/index.html` |
| `npm run lint` | Lint TypeScript and TSX source |
| `npm test` | Run native selection and localization tests |

The dev and preview pages do not provide the extension's Chrome Storage API. Use the built extension loaded from `dist/` to verify selection, persistence, and clipboard behavior together. Vite is a build/development tool; no Vite server is needed to use the installed extension.

## Source layout

```text
src/
├── index.html
├── main.tsx
├── components/
│   ├── Popup.tsx
│   └── ColorResult.tsx
├── styles/
│   └── popup.css
└── services/
    └── pickColor.ts
```

`public/` contains the manifest and extension icons. `tests/` contains the logic tests, and `docs/` contains architecture, feature plans, and the investigation backlog. The popup uses plain CSS, without Tailwind or Bootstrap.

## Verification

```powershell
npm run build
npm run lint
npm test
```

The six automated tests use mocked EyeDropper and storage APIs. They check that opening is requested synchronously, HEX normalization, deduplication, the 50-color limit, cancellation, unsupported browsers, and selection/storage failures. They do not prove browser user-activation behavior or native picker operation. Popup/clipboard tests, coverage reporting, and CI are planned for a separate PR.

Manual review in the loaded extension:

- Opening or clicking a web page must not activate the picker or change page styles.
- Pick pixels from an image, a gradient, and a translucent element; compare their displayed colors.
- Select a color, select another, then cancel a new selection with Esc. The previous saved color must survive cancellation, and Pick Color must become available again.
- Close and reopen the popup; the latest selected color must remain visible.
- Selecting a color must leave the clipboard unchanged. Clicking Copy must paste the displayed HEX value into a text field.
- After a successful copy, confirm that Copied! appears on the disabled button for two seconds, then returns to Copy. There must be no separate confirmation message.

## Browser support and permissions

The native EyeDropper API is required. Unsupported browsers display an error; there is no CSS-based fallback. Results represent displayed screen pixels in sRGB HEX, rather than original image pixels or CSS declarations.

Only the `storage` extension permission is requested. There is no content script, background worker, website-access permission, account synchronization, or server upload.

The browser controls the native magnifier and pointer movement. Precision concerns involving mouse DPI, display scaling, or zoom are recorded in the [investigation backlog](docs/BACKLOG.md); a custom precision mode is not part of the current implementation.

## Documentation

- [Localization behavior and verification](docs/LOCALIZATION.md)
- [Architecture and source layout](docs/ARCHITECTURE.md)
- [Existing features and planned work](docs/FEATURES.md)
- [Precision selection investigation backlog](docs/BACKLOG.md)
