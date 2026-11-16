# Continuous selection feasibility

## Scope and outcome

Investigated as part of `feat/color-history`, at the user's request. This is a design investigation, not a claim that continuous native picking is implemented. The ten-color history feature is complete; no nonfunctional toggle is exposed.

Desired interaction: a default-off toggle starts a session, each click saves a color, and Esc ends the session. Clipboard writes remain explicit. Precision magnification and keyboard pixel stepping are outside this investigation's implementation scope.

## Native EyeDropper findings

The [EyeDropper specification](https://wicg.github.io/eyedropper-api/) requires transient activation before `open()`, suppresses page UI events while native picking is active, and closes the session after one selected color. Its options expose cancellation through an AbortSignal, not a persistent or multi-select mode.

The [Chromium chooser implementation](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/eye_dropper_chooser_impl.cc) explicitly consumes transient activation while creating the chooser. A promise continuation or timer is not a new trusted click in the extension document. Repeated `open()` calls after selection cannot be treated as a supported continuous-selection mechanism, even if a browser version happens to permit them.

This conclusion comes from API and source inspection. A physical multi-click browser experiment was not performed, and mock tests cannot establish browser activation behavior. No workaround attempts to simulate trusted clicks or bypass activation.

## Alternatives

| Approach | Scope and behavior | Costs and limits | Assessment |
| --- | --- | --- | --- |
| Repeat native open automatically | Would retain screen-wide native selection | No guaranteed fresh activation; cannot offer a reliable toggle | Reject as the default implementation |
| Explicit Pick next button | Every next pick is a real user action | Extra click between colors; not truly continuous | Supported by the existing single-pick UI, but should not be labeled continuous |
| Capture the visible tab once and pick repeatedly on a canvas | A stable extension page displays the captured image; each canvas click saves a pixel until Esc | Requires activeTab and capture; the image is frozen, covers only the visible tab, and needs correct scaling/coordinate mapping | Smallest credible implementation for a separate continuous mode |
| Capture a tab stream and pick from live frames | A persistent view samples a user-authorized tab stream | Requires tabCapture, explicit invocation, stream lifecycle management, persistent UI, and more testing | More complexity than the current extension needs |

The [tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-captureVisibleTab) requires activeTab or broad host access for `captureVisibleTab`, captures only the visible tab area, and limits calls to two per second. A rapid screenshot loop is therefore not a substitute for a live stream. The [tabCapture API](https://developer.chrome.com/docs/extensions/reference/api/tabCapture) is the alternative for an ongoing tab stream.

## Recommended design if continuous mode is approved

1. Keep native single-pick as the default and retain the current storage-only permissions for that path.
2. Label the alternative **Continuous selection from tab snapshot**, rather than suggesting screen-wide live picking.
3. Enabling the mode requires an explicit Start action to capture the target tab. Open a dedicated extension view with the image and session controls; do not rely on the action popup remaining focused while clicking the page.
4. Save each clicked captured pixel using the same ten-color deduplication policy. Never copy automatically. Keep the session open until Esc or Stop.
5. Expose a Refresh snapshot action. Do not imply the snapshot follows scrolling, animation, or later page changes.
6. Handle capture failure, tab changes, DPI/zoom mapping, view closure, and storage failure; release image data after the session ends.
7. Start without advanced magnification/keyboard stepping, which remains the separate precision-mode future work.

## Decision required before implementation

The native API cannot satisfy the original screen-wide continuous interaction with a toggle alone. The snapshot alternative changes capture permissions, scope, and the user flow. This PR records the investigation and recommended design; it does not silently add capture permissions or a different picking mode. Confirm snapshot-based behavior before implementing it.

Acceptance criteria for that follow-up: at least three colors per session without reopening the native chooser; newest ten distinct colors retained; Esc/Stop exits cleanly; no automatic copy; capture scope and frozen-image state are clear; supported scaling settings map clicks to the correct captured pixels.
