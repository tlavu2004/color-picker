# Color Picker

A Chrome Manifest V3 extension built with React 19, TypeScript, and Vite 7. Use native EyeDropper for one pixel, or continuous selection with a persistent magnifier directly on a frozen view of the source tab.

## Run locally

Use desktop Chrome/Edge 112+ and Node.js 22.22.2+ or 24.15.0+ on this standalone branch.

```powershell
npm ci
npm run build
npm run verify:build
```

Open `chrome://extensions` or `edge://extensions`, enable Developer mode, and Load unpacked this project's `dist/` directory. After editing, rebuild and Reload the extension. This update adds scripting permission; acknowledge a browser permission prompt if shown. Close any old snapshot window from the previous implementation.

## Pick colors

- Checkbox off: **Pick Color** opens native EyeDropper for one pixel; Esc cancels.
- Checkbox on: **Start continuous selection** captures the visible tab, opens an overlay with a magnifier on the same tab, and closes the popup. No separate capture window is created.
- Move the pointer to inspect enlarged pixels and a HEX preview. Click multiple points to save their colors without closing the magnifier.
- Use **Move controls** to reach pixels covered by the instructions.
- **Esc** or **Stop** removes the image and magnifier and returns to the page. Open the popup to explicitly **Copy** the saved color; picking never changes the clipboard.
- Saves retain the newest **10** distinct colors. Rapid clicks are serialized so one selection does not overwrite another.

The displayed tab image is frozen; page code can continue running beneath it. Scrolling is blocked during selection. Resize, viewport changes, source scrolling, or navigation end the overlay. Stop and start again to capture new content. Advanced grid/keyboard precision controls remain deferred.

## Permissions and data

Requests **storage**, **activeTab**, and **scripting** for user-started capture/injection. No automatic content script, background worker, broad website access, account, or server upload is used. The screenshot stays in the isolated picker and is not written to local/session storage. Ordinary HTTP/HTTPS pages support the overlay subject to browser injection restrictions; use native picking on restricted pages.

## Checks

```powershell
npm run lint
npm run test:typecheck
npm test
npm run test:coverage
npm run build
npm run verify:build
```

The 32 mocked tests cover the native service, popup/clipboard, overlay startup/serialization, magnifier, repeated selection, save errors, cleanup, and coordinate mapping. Real tab capture, top-layer interaction, and page CSS/CSP behavior still require browser checks. See the continuous-selection guide for a checklist.

`npm run dev` and `npm run preview` serve `/src/index.html` for layout work only; a loaded extension is required for capture and scripting. Before merging, update this branch from the latest main and preserve its history UI and CI setup.

## Documentation

- [Continuous selection behavior and browser checklist](docs/CONTINUOUS_SELECTION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Feature status](docs/FEATURES.md)
- [Deferred advanced precision investigation](docs/BACKLOG.md)
