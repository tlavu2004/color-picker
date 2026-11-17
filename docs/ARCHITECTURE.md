# Color Picker architecture

## Stack and entry

Chrome Manifest V3 packages a React 19 + TypeScript popup, built with Vite 7. Vite is a development/build tool, not an extension runtime. The sole HTML entry is `src/index.html`, mounted by `src/main.tsx`.

The default Pick Color and continuous mode both capture the source tab and inject the same self-contained, isolated-world picker. A boolean mode controls whether it exits after a successful save or keeps accepting pixels. Native EyeDropper is available through a separate explicit button. A module service worker restores the popup after custom selection; there is no automatically injected content script.

## Source responsibilities

- `src/components/`: popup coordination, the default-off continuous switch, and color-result/copy UI.
- `src/styles/`: popup CSS.
- `src/services/pickColor.ts`: native picking and ten-color storage normalization, migration, and saving.
- `src/services/tabSelection.ts`: prepare/capture/validate/inject orchestration and launch-port handshake.
- `src/background/`: completion-message validation, session state, source lifecycle invalidation, and popup restoration.
- `src/content/overlay.ts`: serialized stop/install functions with all runtime helpers enclosed; modal closed-shadow overlay, pixel magnifier, queued storage writes, and cleanup.
- `tests/`: Vitest service, popup, and overlay tests with mocked browser/canvas APIs.
- `scripts/verify-build.mjs`: verifies manifest, popup/icons, and built HTML entry assets.
- `docs/`: architecture, feature status, continuous-mode guide, and deferred precision investigation.

## Startup and selection

The Native screen picker button under Advanced opens EyeDropper during its button gesture and stores one normalized HEX; Escape preserves the prior result. Copy is explicit and retains its two-second disabled confirmation.

Tab-picker startup queries the source tab, rejects unsupported URL schemes, removes an old overlay, captures the source window, checks the active tab is unchanged, and injects the PNG plus captured viewport dimensions. The injected function rejects changed or pinch-zoomed viewports. A loading timeout cleans up stalled image decoding.

The image is decoded without a DOM image URL and drawn on a viewport-sized canvas inside a closed shadow root. A native modal dialog places the overlay above page content and makes underlying controls inert. Constructed styles isolate the picker layout from page CSS. Pointer movement updates a magnifier on animation frames; every click reads that click's captured coordinates directly instead of using a potentially stale preview.

Continuous mode keeps the magnifier open after saving; a promise queue serializes its accepted writes. Single mode accepts only one click while saving and removes the overlay after success. A failed save unlocks single mode for retry without closing it. The panel provides status, error feedback, Stop, and Move to next corner; it never copies automatically. Esc/Stop removes the modal, screenshot, magnifier, listeners, timers, pending preview frame, and active-session callback. It restores previous focus. Viewport changes, source scrolling, and pagehide also stop the session. Accepted writes may finish after visual cleanup.

## Storage and permissions

`chrome.storage.local.colors` contains the newest ten distinct uppercase HEX values. Legacy history is normalized and trimmed. The injected storage path cannot import module helpers, so its matching ten-color policy is enclosed and tested separately. Screenshots are never written to local or session storage and are never uploaded.

The manifest requests storage, activeTab, and scripting. Script injection is explicit, top-frame-only, and user initiated; broad website host access is not requested. Browser-restricted pages may reject injection even when capture is possible; the UI reports failure and native single-pick remains the alternative.

The view is frozen, not the underlying application's execution. It does not track page updates, animations, scrolling, other apps, or browser chrome. Stop and restart to capture fresh content. Closed shadow DOM reduces ordinary host-page access to the screenshot canvas but is not a general browser security boundary.

## Build and verification

Run `npm run build` and load `dist/` unpacked. Reload after rebuilding so the new scripting permission and popup code are applied. The old snapshot HTML/window entry and session transfer are removed.

Run lint, test typechecking, Vitest, coverage, and `verify:build`. Coverage includes the popup, services, and injected module and excludes only the mounting entry. Tests include serialization of injected functions and DOM cleanup, but capture/injection/top-layer behavior still needs a real Chrome check.

See [continuous selection](CONTINUOUS_SELECTION.md) for behavior and manual checks, [feature status](FEATURES.md) for branch scope, and the [backlog](BACKLOG.md) for deferred advanced precision work.

## Popup restoration

Chrome/Edge 127+ is required for action.openPopup. The action popup closes after the custom picker is armed. A launch port lets the worker wait until it really closes, avoiding a close/reopen race for fast selections. After save success or Esc/Stop, the overlay sends completion only after accepted writes settle.

Session metadata and the last custom mode are stored in in-memory storage.session, not screenshots. The worker validates extension, tab, frame, document ID, and random session ID; it consumes each completion once. It rechecks the source tab URL, active tab, and focused window before opening the popup. Navigation, tab closure/activation away, superseding sessions, viewport cleanup, and expired sessions do not request a popup in another context. Metadata allows normal worker restarts without losing a pending return.

If Chrome refuses popup opening, saved colors remain intact and a dot badge allows a manual icon click. Opening the popup clears the badge. Native mode keeps the existing popup visible and is isolated in the collapsed Advanced section with an explanation of that limitation.