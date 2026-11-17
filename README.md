# Color Picker

A Chrome Manifest V3 extension built with React 19, TypeScript, and Vite 7. Use the same magnifier on a frozen tab view for single or continuous selection. A separate native screen picker remains available as an explicit alternative.

## Localization

Choose Auto / English / Tiếng Việt in the popup. Auto follows the browser language with English fallback. The preference is saved locally. See [localization](docs/LOCALIZATION.md).

## Current features

Retain up to ten distinct colors, newest first. The history grid lets you view previous colors without copying; Clear history removes them. Legacy histories are trimmed to ten. Copy is explicit and shows a disabled Copied! button for two seconds after success. English and Vietnamese are supported, with Auto following the browser language. The product name Color Picker stays unchanged.

## Install from GitHub Releases

Requires desktop Chrome or Edge 127+. No Node.js installation or local build is needed for this method.

1. Open [Releases](https://github.com/tlavu2004/color-picker-extension/releases) and choose a published version. If there is no release yet, use the source-build instructions below.
2. Under **Assets**, download `color-picker-extension.zip`. Use this extension package rather than GitHub's automatically generated **Source code** archives.
3. Extract the ZIP into a permanent folder. The selected folder must directly contain `manifest.json`; keep the extracted files in place while the extension is installed.
4. Open `chrome://extensions` or `edge://extensions`, enable **Developer mode**, and click **Load unpacked**.
5. Select the extracted folder, then open Color Picker from the browser's extensions menu. Pin it to the toolbar if desired.

For updates, download and extract the new release into the same folder, replacing the previous files, then click **Reload** on the extension's card. Reopen the popup and acknowledge any new permission prompt. Loading a different folder as another unpacked extension may create a separate installation with separate saved data. GitHub ZIP installations do not update automatically.

Each release also provides `color-picker-extension.zip.sha256`. To check the ZIP on Windows, run `Get-FileHash ./color-picker-extension.zip -Algorithm SHA256` and compare the hash with the checksum file.

Before a release is published, reviewers can download the **color-picker-extension** artifact from a successful GitHub Actions run for the intended commit. Extract the artifact first, then extract its inner `color-picker-extension.zip` and follow the same Load unpacked steps. An Actions artifact is a review build, not a published release.

## Build from source

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
- [Privacy and local data handling](docs/PRIVACY.md)
- [Changelog](CHANGELOG.md)

## Author

Developed and maintained by **Trương Lê Anh Vũ** — [@tlavu2004](https://github.com/tlavu2004).

## Contributing

1. Fork the repository and create a branch from the latest `main`, using a name such as `feat/your-feature`, `fix/your-fix`, or `docs/your-update`.
2. Install dependencies with `npm ci` and make focused changes. Update the English documentation and both English/Vietnamese UI translations when relevant.
3. Run the checks in [testing and delivery](docs/TESTING.md). For picker or UI changes, also check the built extension in Chrome/Edge.
4. Use conventional commit messages, such as `feat: add a feature`, `fix: correct picker behavior`, or `docs: update setup instructions`.
5. Push your branch to your fork and open a pull request targeting `main`. Describe the change, how it was verified, and include screenshots for visible UI changes.

For bug reports, include reproduction steps, expected and actual behavior, browser/extension versions, and relevant zoom or display-scaling settings. Avoid including sensitive page content in screenshots or logs.

For security vulnerabilities, contact [the maintainer](mailto:truongleanhvu20052004@gmail.com) privately instead of publishing exploit details in an issue.

## License

This project is licensed under the [MIT License](LICENSE). The release archive includes the project license notice. Third-party dependencies retain their respective licenses.
