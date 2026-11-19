# Features and plans

## Implemented

- **Single selection:** Pick Color opens a frozen view of the visible HTTP/HTTPS tab with a custom pixel magnifier. One successful save ends selection.
- **Continuous selection:** a default-off switch uses the same magnifier; multiple clicks save colors until Esc or Stop.
- **Native alternative:** Advanced exposes Native screen picker for one screen pixel. It keeps the popup visible and is disabled while continuous selection is enabled.
- **History:** retain the newest ten distinct uppercase HEX colors locally. Repicking moves a color to the front; selecting a history swatch only changes the displayed result. Clear history removes saved colors. Legacy data is normalized and trimmed to ten on load.
- **Feedback:** display the selected color and HEX in the popup; the overlay shows the last successfully saved swatch, HEX, history count, and persistence errors.
- **Explicit copy:** only Copy changes the clipboard. Copied! disables the button for two seconds after success.
- **Lifecycle:** Esc/Stop removes the custom picker and restores page interaction. The popup returns after queued saves settle when the source tab/window remains active. The worker validates session/document identity; a badge supports manual reopening if the browser refuses automatic return.
- **Pixel consistency:** clicking uses one sample for the preview and save, preserving fractional pointer coordinates at color/text boundaries.
- **Controls:** move instructions between four corners. Wheel/touch scrolling is blocked during selection; actual viewport changes end the frozen session.
- **Testing and delivery:** Vitest, React Testing Library, source coverage, Node 24 GitHub Actions, verified ZIP/checksum packaging, and tag-triggered GitHub releases. Coverage is informational; Web Store deployment is not configured.

Screenshots remain transient and are never uploaded or saved in extension storage. The custom picker requires storage, activeTab, and scripting permissions; it is explicitly started and has no automatic content script or broad host permissions.

## Localization

English and Vietnamese are integrated across the popup, history, and custom picker. Auto follows the browser language with English fallback; preferences are persisted locally. The product name Color Picker stays unchanged. Browser-native dialogs follow browser settings. See [localization](LOCALIZATION.md).

## Future work, not scheduled for immediate implementation

Advanced precision controls remain deferred: keyboard stepping by one captured pixel, configurable zoom, and a dedicated precision grid. Investigate mouse DPI, acceleration, display scaling, browser zoom, and multiple monitors before attributing skipped pixels to application code. The current magnifier does not implement these controls.

See [the investigation backlog](BACKLOG.md), [continuous selection](CONTINUOUS_SELECTION.md), and [testing and delivery](TESTING.md).
