# Continuous selection from a tab snapshot

Implemented on `feat/continuous-selection`, created directly from main `a069d30`. Precision magnification, a pixel grid, and keyboard pixel stepping remain out of scope, as requested.

## Use

1. Load the built `dist/` extension in desktop Chrome/Edge 112 or later.
2. Open the popup on the source tab. The **Continuous selection from tab snapshot** checkbox defaults to off; native Pick Color remains available when it is off.
3. Enable it and click **Capture tab and pick**.
4. A separate extension window opens with a frozen image of the visible source tab. Click multiple pixels; every completed selection saves the color without closing the session.
5. Use the recent-color buttons to view a saved HEX. Click **Copy** explicitly to copy it; success disables the button with Copied! for two seconds.
6. **Refresh snapshot** captures the original source window again, provided its active tab is still the original source tab. It never silently switches the capture target to another tab.
7. **Esc** or **Stop** ends selection and releases the image from the view. Saved colors remain available for explicit copy. **Close window** closes the view. Start a new session from the popup to pick again.

This is not a live screen picker. It covers only the visible tab viewport at capture time, not browser chrome, other apps, offscreen page content, later scrolling, or animation. Captured pixels are mapped from the displayed image's bounds to its actual image dimensions; this is not a claim to fix native pointer/DPI behavior.

## Data and permissions

- Adds temporary **activeTab** permission for tab capture; retains **storage**. No broad host access, content script, service worker, or tabCapture stream is added.
- Screenshot PNG data is transferred through `chrome.storage.session` with a random session ID, not through local storage or a URL payload. It is consumed and removed when the view loads.
- Unconsumed transfers expire logically after five minutes and are pruned on the next capture; session storage is also cleared by browser/extension lifecycle. There is no background expiry timer.
- Refreshing the selection window itself after consumption cannot replay the transfer: start a new session from the popup. Refresh snapshot inside the loaded view is the supported refresh action.
- Source identity and capture time are displayed. Stopping clears the screenshot canvas and image state. Colors alone remain in local storage; nothing is sent to a server.
- Very large images can exceed the session-storage quota. Capture, permission, source-tab, quota, image-decoding, and storage failures are reported rather than opening an unusable view silently.
- Recent color storage is normalized/deduplicated to the newest **10** colors, shared by native and snapshot saves. Old 50-entry history is trimmed when the history service reads it. The dedicated popup history grid remains on the separate history branch.

See [Chrome tab capture](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-captureVisibleTab) and [session storage](https://developer.chrome.com/docs/extensions/reference/api/storage/). Chrome limits visible-tab captures to two per second; overly rapid Refresh clicks can report a browser capture-limit error while retaining the previous image.

## Implementation

- `src/services/snapshot.ts`: capture source selection, temporary session transfer, consumption, expiry checks, and window creation.
- `src/snapshot/SnapshotPicker.tsx`: image loading, repeated selection, explicit copy, refresh, and session stop.
- `src/snapshot/pixels.ts`: displayed-coordinate to captured-pixel mapping and HEX conversion.
- `src/services/pickColor.ts`: common ten-color storage policy for native and snapshot selection.
- Vite builds both `src/index.html` and `src/snapshot/index.html`. No background worker is needed.

Native EyeDropper cannot provide a guaranteed automatic multi-select loop: each open requires activation, and Chromium consumes it. This feature deliberately uses an explicit snapshot mode instead. References: [specification](https://wicg.github.io/eyedropper-api/) and [Chromium implementation](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/eye_dropper_chooser_impl.cc).

## Verification

Use `npm ci`, `npm run build`, `npm run verify:build`, `npm run lint`, `npm run test:typecheck`, `npm test`, and optionally `npm run test:coverage`.

The 29 automated tests cover the native service, popup/clipboard behavior, capture/session lifecycle, scaling and edge mapping, three successive colors without automatic copy, cancellation, refresh, legacy ten-color migration, quota errors, and storage failure recovery. Tests use mocked capture/canvas/browser APIs. They do not prove OS-level capture permissions or a real browser's screenshot/color pipeline.

Manual browser checklist:

- Verify toggle-off native selection still works and does not capture.
- Enable the toggle on a normal HTTPS page, then select three colors in the snapshot window.
- Compare selected HEX with known flat-color blocks in the source page.
- Verify Copy/Copied!, Esc/Stop, and retained saved colors.
- Change the source page content and Refresh snapshot; then change its active tab and verify refresh refuses the different target.
- Repeat with display scaling and a resized snapshot window to check coordinate mapping.
- Close/reopen and test capture failure or a closed source window.

## Independent branch integration

The branch starts from main and includes the test tooling it needs; it does not merge other feature or CI branches. When integrating all PRs, retain the history branch's popup grid and ten-color normalization, the localization branch's language setting, and the CI workflows. Translate the snapshot window's English labels through the localization dictionaries during integration. Preserve `saveColor`, both Vite entries, and the snapshot resource verification. The product language and native history UI on this standalone branch remain the main baseline apart from the snapshot feature.
