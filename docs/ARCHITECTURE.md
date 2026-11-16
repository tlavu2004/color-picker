# Color Picker architecture

This document replaces `color-picker-extension.txt` and describes the structure after the bug fixes and source cleanup.

## Technology

- **Chrome Manifest V3** declares the extension, icons, popup, and permissions.
- **React 19 + TypeScript** implement the popup interface and application logic.
- **Vite 7** provides the development server and production build; it is not an extension background runtime.
- **EyeDropper API** opens the browser's native pixel picker and returns an sRGB HEX color.
- **Chrome Storage API** stores color history locally.
- **Clipboard API** writes to the clipboard only when the user clicks Copy.

The current version has no background service worker or content script. Those components in the original text outline were removed when selection switched to the native EyeDropper.

## Source layout

```text
color-picker-extension/
├── public/
│   ├── manifest.json
│   └── icons/                    # Icons referenced by the manifest
├── src/
│   ├── index.html                # Popup HTML entry
│   ├── main.tsx                  # Mounts React with StrictMode
│   ├── components/
│   │   ├── Popup.tsx             # Coordinates state and interactions
│   │   └── ColorResult.tsx       # Color swatch, HEX, and Copy/Copied! button
│   ├── styles/
│   │   └── popup.css             # Popup styles
│   └── services/
│       └── pickColor.ts          # Opens EyeDropper and saves history
├── tests/
│   ├── pickColor.test.ts         # Native selection and storage tests
│   ├── Popup.test.tsx            # Popup and clipboard interactions
│   ├── history.integration.test.tsx # Runs when history feature is present
│   ├── browserMocks.ts           # Browser API mocks
│   └── setup.ts                  # DOM matchers and cleanup
├── docs/
│   ├── ARCHITECTURE.md
│   ├── FEATURES.md
│   ├── TESTING.md                # Local checks, CI, and release packaging
│   └── BACKLOG.md                # Investigations and development proposals
├── README.md                     # Setup, build, and manual verification
├── vite.config.ts
├── vitest.config.ts
├── scripts/verify-build.mjs      # Verifies the built extension's asset paths
├── .github/workflows/            # CI and tag-triggered release packaging
├── tsconfig*.json
└── package.json
```

The application has a single popup entry, so `index.html` and `main.tsx` live directly in `src/` without an extra `popup/` directory. Code is grouped by responsibility: components in `components/`, styles in `styles/`, and selection/storage logic in `services/`. Directories are not created for unimplemented features. `Popup.tsx` still manages storage subscriptions, clipboard interactions, and UI state because the application is small.

## Runtime flow

1. The manifest opens `src/index.html` from the extension package.
2. `main.tsx` mounts `Popup`, which subscribes to storage changes and loads the latest color.
3. Clicking Pick Color calls `pickColor()`. EyeDropper opens before any `await` to preserve user activation.
4. Selecting a pixel returns a HEX value. The service converts it to uppercase, reads history, and saves the selected color at the front. Duplicates are removed, and at most 50 colors are retained.
5. The popup displays the saved color. Reopening the popup reads the first history entry.
6. Clicking Copy writes the HEX value to the clipboard. The button is disabled while writing. On success, it displays Copied! and stays disabled for two seconds before returning to Copy. There is no separate Copied! message.
7. Starting a new selection or receiving a color-history storage change clears the copy confirmation. Cancelling with Esc does not save a color or change the clipboard.

EyeDropper, storage, and clipboard errors are displayed in the popup. The storage listener and copy-confirmation timer are cleaned up when the component unmounts. Only the latest color has a visible result; there is no history grid yet.

## Data and permissions

`chrome.storage.local` stores a `colors: string[]` key, for example `['#AABBCC', '#123456']`. Entries are ordered newest first, with at most 50 distinct colors. Data is not synchronized through an account or sent to a server.

The manifest requests only the `storage` permission. The current architecture does not require website access, `activeTab`, `scripting`, or tab capture. A future precision mode based on captured images would require another review of permissions and data scope.

## Build and verification

`npm run build` runs TypeScript and then Vite. Vite uses `src/index.html` as its entry, writes output to `dist/`, and copies `public/`. The manifest in `dist/` points to the corresponding HTML entry. Use Load unpacked with `dist`, not `src`.

`npm run dev` serves the interface at `/src/index.html`. The development page does not replace an extension environment with the Chrome Storage API.

`npm test` runs Vitest and React Testing Library with jsdom and mocked browser APIs. `npm run test:typecheck` checks test TypeScript. `npm run test:coverage` generates V8 coverage mapped to application source, excluding only the mounting entry. CI and release reuse `.github/workflows/verify.yml` on Node.js 24, selected through `.node-version`. Coverage is summarized in Actions. The verification job uploads a ZIP and SHA-256 checksum; the release job downloads and publishes that verified archive without rebuilding. See [testing and delivery](TESTING.md) for details and manual verification.

## Limitations

- A desktop browser with EyeDropper support is required; the UI reports an error if the API is unavailable.
- Each opening selects one color; continuous selection is not implemented.
- The browser controls the cursor and magnifier. The extension does not receive pointer coordinates or movement events during native selection.
- The result is the displayed pixel's sRGB HEX value, rather than a CSS declaration or an original image pixel before zoom/compositing.
- Mock tests do not verify native behavior; manual Chrome/Edge checks are still required.

For DPI/scaling investigation details, see the [backlog](BACKLOG.md). For product status, see [features and plans](FEATURES.md).

Reference: [EyeDropper specification](https://wicg.github.io/eyedropper-api/).
