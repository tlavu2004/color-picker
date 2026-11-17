# Continuous selection on the source tab

Implemented on `feat/continuous-selection`. This replaces the earlier separate snapshot window with an on-tab frozen-image overlay and persistent magnifier, following the updated interaction design.

## Use

1. Load the rebuilt `dist/` extension and reload it after upgrading. The added scripting permission may require acknowledging the browser's extension permission prompt.
2. On an ordinary HTTP/HTTPS page, open the popup. Leave **Continuous selection** off for the original single-pick native EyeDropper.
3. Enable the checkbox and click **Start continuous selection**. The popup closes after the overlay is ready; no capture window opens.
4. Move the mouse to inspect enlarged pixels and their HEX value. The highlighted center pixel is the one selected by a click.
5. Click several pixels. Each accepted click saves one color and keeps the overlay and magnifier open. The status reports the last successfully saved HEX and history count.
6. **Move controls** cycles the instruction panel through the corners so it does not permanently hide sample points.
7. **Esc** or **Stop** removes the overlay and magnifier, restores focus, and returns normal interaction to the source page. Open the popup to view/copy saved colors. Copy remains explicit; choosing a pixel never writes the clipboard.
8. To capture new content, exit and start another session. An old overlay is removed before a new capture, so the extension never intentionally samples its own earlier overlay.

## Frozen view and lifecycle

The overlay displays a screenshot of the visible tab viewport, not a live page or whole-screen feed. Page JavaScript may continue running underneath; only the displayed view is frozen. Wheel and touch scrolling are blocked during selection. Resizing, viewport scaling changes, page scrolling, or pagehide end the overlay to avoid mismatched coordinates. Pinch zoom must be reset before starting.

The magnifier is custom canvas rendering with smoothing disabled and a marked center pixel. It remains visible after clicks. The native EyeDropper API still ends after one color and is used only by the default single-pick path. Dedicated keyboard pixel stepping, configurable zoom, and a full precision grid remain future work.

The modal overlay makes the underlying page inert during selection. Its own canvas click handlers prevent normal click actions; clicking a source-page link through the overlay must not navigate. Esc/Stop removes the modal entirely, rather than leaving a blank capture window. Already accepted save requests can finish after exit; no further pixels are accepted after stopping.

## Permissions, data, and page isolation

- Uses **activeTab** and **scripting** only for a user-started session on the selected source tab; retains **storage** for colors. No broad host permission, automatic content script, or background worker is added.
- Restricted browser pages, extension stores, and other pages that prohibit script injection cannot use this overlay. Use the native picker there. Injection/capture errors are reported in the popup.
- The captured PNG is passed directly to an isolated-world injected function, decoded as an ImageBitmap, and drawn in a closed shadow tree. It is not placed in local/session storage, a page-visible image URL, or a separate window.
- The closed shadow tree prevents ordinary page DOM code from directly querying the screenshot canvas. It is not presented as a general security boundary against the browser or developer tools.
- Constructed style sheets and bitmap decoding avoid relying on page inline-style or image-source policies. The screenshot is released when the overlay is removed; nothing is uploaded.
- All global listeners, loading timers, scheduled preview frames, and the active-session callback are removed on exit. Restarting does not stack overlays.
- Native and overlay selection retain the newest **10** normalized distinct HEX colors in `chrome.storage.local.colors`. Rapid clicks are serialized to avoid lost updates within a session. Persistence errors are shown and the next click can retry.

## Code

- `src/services/continuousSelection.ts`: source checks, removal of a prior overlay, capture, active-tab validation, and explicit injection.
- `src/content/overlay.ts`: self-contained injected functions, modal/shadow UI, magnifier, pixel mapping, queued persistence, and cleanup. All runtime helpers stay inside the injected function because Chrome serializes it without module imports.
- `src/services/pickColor.ts`: native picking and the matching ten-color history policy. Keep both storage paths aligned when changing the policy.
- Vite builds only the popup entry again. The old `src/snapshot/` window and session-transfer code have been removed.

## Verification

Run `npm run lint`, `npm run test:typecheck`, `npm test`, `npm run test:coverage`, `npm run build`, and `npm run verify:build`.

There are 31 mocked tests for native selection, popup/clipboard behavior, capture ordering, restricted/changed source handling, persistent magnifier, three rapid selections, ten-color storage, save retries, Esc/Stop, focus restoration, restart, viewport changes, control movement, scroll blocking, decoding timeout, and self-contained function serialization. A separate local Chrome headless smoke check also passed bitmap decoding and constructed styles under restrictive CSP, a modal closed-shadow magnifier, three successive pixel saves, Esc cleanup, and focus restoration. That check used generated image data and mocked storage, so actual extension capture/injection permissions and real websites still need the manual check below.

Manual checklist:

- Verify native single-pick still works with the checkbox off.
- On a known flat-color page, enable continuous selection and confirm the overlay appears on the same tab, with no extra window.
- Move across color boundaries and confirm the center pixel and preview HEX match the selected color. Repeat after page zoom and on a scaled display.
- Click three colors rapidly; confirm the overlay/magnifier stays open and all colors are retained in newest-first order.
- Use Move controls and sample the area formerly under the panel. Clicking the panel must not save a pixel.
- Try a link/button underneath the screenshot; it must only select a color, not activate the source control.
- Press Esc and separately test Stop. The image and magnifier must disappear and normal page clicks/scrolling must return.
- Start again and confirm there is only one overlay, without old UI in the captured pixels.
- Reopen the popup and copy a saved color explicitly. Restricted-page errors must leave the popup usable.

## Integration

This branch still needs the normal update from the latest main before its PR is merged. Preserve the history branch's popup grid and the CI branch's verification workflow when resolving conflicts. Localization is implemented on another branch; overlay/popup labels here are English until that integration. Precision work beyond this basic magnifier remains deferred.
