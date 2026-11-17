# Color Picker

A Chrome Manifest V3 extension built with React 19, TypeScript, and Vite 7. Use the same magnifier on a frozen tab view for single or continuous selection. A separate native screen picker remains available as an explicit alternative.

## Run locally

Use desktop Chrome/Edge 127+ and Node.js 22.22.2+ or 24.15.0+ on this standalone branch.

```powershell
npm ci
npm run build
npm run verify:build
```

Open `chrome://extensions` or `edge://extensions`, enable Developer mode, and Load unpacked this project's `dist/` directory. After editing, rebuild and Reload the extension. This update adds scripting permission; acknowledge a browser permission prompt if shown. Close any old snapshot window from the previous implementation.

## Pick colors

- Switch off: **Pick Color** opens the tab overlay and magnifier. One click saves a color and closes the overlay only after the save succeeds.
- Switch on: **Start continuous selection** captures the visible tab, opens an overlay with a magnifier on the same tab, and closes the popup. No separate capture window is created.
- Both modes use the same enlarged pixels, center marker, and HEX preview. In continuous mode, click multiple points without closing the magnifier. If saving fails in single mode, the overlay stays open so you can retry.
- Under **Advanced**, **Native screen picker** explicitly opens the original EyeDropper for one screen pixel, including outside the tab. It is independent of the continuous switch and never selected automatically. It keeps the popup open and may obscure part of the screen; use the main tab picker for an unobstructed view.
- Use **Move to next corner** to reach pixels covered by the instructions.
- **Esc** or **Stop** removes the image and magnifier and returns to the page. The popup reopens automatically after saves finish if the same source tab/window is still active. It restores the selected mode and latest color; copying remains explicit.
- Saves retain the newest **10** distinct colors. Rapid clicks are serialized so one selection does not overwrite another.

The displayed tab image is frozen; page code can continue running beneath it. Scrolling is blocked during selection. Resize, viewport changes, source scrolling, or navigation end the overlay. Stop and start again to capture new content. Advanced grid/keyboard precision controls remain deferred.

## Permissions and data

Requests **storage**, **activeTab**, and **scripting** for user-started capture/injection. No automatic content script, broad website access, account, or server upload is used. A small module service worker restores the popup for completed/cancelled custom sessions. The screenshot stays in the isolated picker and is not written to local/session storage. Ordinary HTTP/HTTPS pages support the overlay subject to browser injection restrictions; use native picking on restricted pages.

## Checks

```powershell
npm run lint
npm run test:typecheck
npm test
npm run test:coverage
npm run build
npm run verify:build
```

The 52 mocked tests cover the native service, popup/clipboard, overlay startup/serialization, magnifier, repeated selection, save errors, cleanup, and coordinate mapping. Real tab capture, top-layer interaction, and page CSS/CSP behavior still require browser checks. See the continuous-selection guide for a checklist.

`npm run dev` and `npm run preview` serve `/src/index.html` for layout work only; a loaded extension is required for capture and scripting. Before merging, update this branch from the latest main and preserve its history UI and CI setup.

## Documentation

- [Continuous selection behavior and browser checklist](docs/CONTINUOUS_SELECTION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Feature status](docs/FEATURES.md)
- [Deferred advanced precision investigation](docs/BACKLOG.md)
