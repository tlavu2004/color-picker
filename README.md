# Color Picker

A Chrome Manifest V3 extension built with React 19, TypeScript, and Vite 7. Use the same magnifier on a frozen tab view for single or continuous selection. A separate native screen picker remains available as an explicit alternative.

## Localization

Choose Auto / English / Tiếng Việt in the popup. Auto follows the browser language with English fallback. The preference is saved locally. See [localization](docs/LOCALIZATION.md).

## Current features

Retain up to ten distinct colors, newest first. The history grid lets you view previous colors without copying; Clear history removes them. Legacy histories are trimmed to ten. Copy is explicit and shows a disabled Copied! button for two seconds after success. English and Vietnamese are supported, with Auto following the browser language. The product name Color Picker stays unchanged.

## Run locally

Use desktop Chrome/Edge 127+ and Node.js 24.15.0+ (24.x), matching `.node-version` and CI.

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

The displayed tab image is frozen; page code can continue running beneath it. Scrolling is blocked during selection. Resize, viewport changes, or navigation end the overlay. Stop and start again to capture new content. Advanced grid/keyboard precision controls remain deferred.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite; open `/src/index.html` on the URL printed in the terminal for layout work |
| `npm run build` | Check TypeScript and build the unpacked extension into `dist/` |
| `npm run preview` | Serve the production build for layout inspection at `/src/index.html` |
| `npm run lint` | Lint TypeScript and TSX source |
| `npm test` | Run Vitest service and popup tests |

## Permissions and data

Requests **storage**, **activeTab**, and **scripting** for user-started capture/injection. No automatic content script, broad website access, account, or server upload is used. A small module service worker restores the popup for completed/cancelled custom sessions. The screenshot stays in the isolated picker and is not written to local/session storage. Ordinary HTTP/HTTPS pages support the overlay subject to browser injection restrictions; use native picking on restricted pages.

## Verification

```powershell
npm run lint
npm run test:typecheck
npm test
npm run test:coverage
npm run build
npm run verify:build
```

Vitest and React Testing Library cover history, native selection, popup/clipboard, overlay startup, magnification, queued saves, cleanup, and popup restoration with mocked browser APIs. Real capture, permissions, focus, and page interaction require browser verification. See [testing and delivery](docs/TESTING.md) and the [continuous-selection checklist](docs/CONTINUOUS_SELECTION.md).

`npm run dev` and `npm run preview` serve `/src/index.html` for layout work; use the built extension for browser APIs.

## CI and delivery

GitHub Actions verifies PRs targeting main and pushes to main on Node.js 24, using a shared verify workflow. Feature branch pushes do not duplicate PR checks; use manual dispatch when needed. Coverage is shown in the job summary and uploaded with a verified extension ZIP and SHA-256 checksum. Pushing a matching version tag publishes that same verified archive to a GitHub release, without rebuilding; no Web Store deployment is configured. See [testing and delivery](docs/TESTING.md) before creating a release tag.

## Documentation

- [Localization behavior and verification](docs/LOCALIZATION.md)
- [Architecture and source layout](docs/ARCHITECTURE.md)
- [Existing features and planned work](docs/FEATURES.md)
- [Precision selection investigation backlog](docs/BACKLOG.md)
- [Continuous selection behavior and browser checklist](docs/CONTINUOUS_SELECTION.md)
- [Testing, coverage, and delivery](docs/TESTING.md)
