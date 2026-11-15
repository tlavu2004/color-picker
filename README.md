# Color Picker

Browser extension built with React, TypeScript and Vite. Pick a screen pixel using the browser's native EyeDropper, save its HEX value, and copy it.

## Run locally

Use Node.js 22.12+ (validated with Node.js 24) and desktop Chrome or Edge with EyeDropper support.

```powershell
npm ci
npm run build
```

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**, click **Load unpacked**, and select this project's `dist` directory.
3. Open the extension popup and click **Pick Color**. Click a pixel to select it, or press **Esc** to cancel.
4. The selected HEX value is saved. Click **Copy** when you want to copy it; picking a color does not change the clipboard. Reopening the popup restores the latest saved color.

Each click on **Pick Color** starts one selection. After selecting a pixel or cancelling with **Esc**, click **Pick Color** again for the next selection.

After editing: run `npm run build`, reload the extension on the extensions page, and reopen the popup. When upgrading from the old version, also refresh existing web tabs to remove its injected picker and styles.

`npm run dev` serves the popup at `/src/popup/popup.html` for layout work; extension storage requires loading the built extension.

## Checks

```powershell
npm run build
npm run lint
npm test
```

The automated tests mock EyeDropper and storage. They cover immediate opening during user activation, normalized HEX values, deduplication, the 50-color limit, cancellation, and failure handling. They do not replace an actual browser check.

Manual review:

- Opening or clicking a web page should not activate the picker or change page styles.
- Pick pixels from an image, a gradient, and a translucent element; compare their visible colors.
- Pick repeatedly, and cancel with Esc; the previous saved color should survive cancellation.
- Close and reopen the popup; the latest selected color should remain available for copying.
- Paste the copied value into a text field and confirm it matches the displayed HEX.

## Browser support and permissions

Requires the native EyeDropper API. Unsupported browsers display a message; there is no CSS-based fallback because it cannot reliably sample images or composited colors. Results use sRGB HEX.

Only the `storage` extension permission is requested. No content script, background worker, or website access is required. Up to 50 distinct colors are retained locally; the popup displays the latest color.
