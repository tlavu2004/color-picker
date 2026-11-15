# Color Picker architecture

## Stack and entries

Chrome Manifest V3 packages React 19 + TypeScript interfaces, built with Vite 7. Vite is a development/build tool, not the extension runtime. This branch has two trusted extension entries:

- `src/index.html` → `src/main.tsx` → `components/Popup.tsx`.
- `src/snapshot/index.html` → `snapshot/main.tsx` → `snapshot/SnapshotPicker.tsx`.

There is no content script, background service worker, or broad host access. The manifest requests storage and activeTab. Chrome 112+ is required for the session-storage quota used by screenshot transfer.

## Source responsibilities

- `src/components/`: popup coordination and color result UI.
- `src/styles/`: popup CSS.
- `src/services/pickColor.ts`: native EyeDropper and shared ten-color storage (normalization, legacy migration, save, clear).
- `src/services/snapshot.ts`: capture source checks, temporary screenshot transfer, session consumption and selection-window creation.
- `src/snapshot/`: persistent snapshot-selection window, coordinate conversion, and its styles.
- `tests/`: Vitest service, popup, snapshot, and coordinate tests with mocked browser APIs.
- `scripts/verify-build.mjs`: verifies the popup, icons, and assets for all built HTML entries.
- `docs/`: feature status, architecture, snapshot guide, and the future precision investigation backlog.

## Native flow

Pick Color calls EyeDropper synchronously within the button interaction. One selected sRGB HEX value is normalized and saved; Esc cancels without changing colors or clipboard. The popup restores the latest stored color and subscribes to local changes. Copy is explicit with a two-second disabled Copied! confirmation. Listeners and timers are cleaned up on unmount.

## Continuous snapshot flow

The checkbox defaults off. When enabled, capture the active source tab before creating a separate extension window. Transfer the PNG and source identity through a random key in in-memory session storage. The new window consumes/deletes that transfer, draws the image on a canvas at its actual pixel dimensions, and maps displayed click coordinates to captured pixel coordinates.

Each completed click uses the shared save operation, retains the session, and updates recent colors. An operation guard prevents overlapping writes. Esc/Stop releases image state and clears the canvas; previously selected colors remain available for explicit copy. Refresh captures only the original source window when its active tab still matches the recorded source tab.

Snapshot loading intentionally does not use StrictMode's development double effect, because the transfer is single-use. Async image callbacks and session state updates are guarded against unmount/stop.

## Storage and lifecycle

`chrome.storage.local.colors` contains at most ten distinct uppercase HEX values, newest first. Reading the history service normalizes legacy entries and trims old 50-color history. Native and snapshot selection share the same save function. Images are never placed in local color history.

A `color-picker-snapshot:<uuid>` entry in `storage.session` contains a PNG, source IDs/title, and capture time. It is removed on successful load, removed when window creation fails, rejected after five minutes, and pruned on later capture. No background expiry job or server upload is used. Very large PNGs may exceed session quota and produce a visible error.

## Build and tests

Run `npm run build` to typecheck and build both entries into `dist/`; install `dist/` with Load unpacked. Run `npm run verify:build` to verify entry assets. Vite dev pages alone do not provide extension storage/capture permissions.

Vitest and React Testing Library use jsdom and mocked APIs. Run `npm run test:typecheck`, `npm run lint`, `npm test`, and `npm run test:coverage`. Coverage excludes only the two mounting entries; there is no percentage gate. Native picking and real tab capture still require manual browser verification.

See [continuous selection](CONTINUOUS_SELECTION.md) for behavior, permissions, limitations, and checks. [Feature status](FEATURES.md) distinguishes independent PRs. [Precision investigation](BACKLOG.md) remains future work.
