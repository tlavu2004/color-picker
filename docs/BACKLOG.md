# Development backlog

## Precise pixel selection

Status: investigate for a future feature PR; outside the current bug-fix scope.

User observation: moving the mouse in the native EyeDropper can appear to skip pixels, making thin borders difficult to target. The cause is not yet confirmed. The current extension delegates selection to `EyeDropper.open()` and does not process pointer coordinates.

### Investigation

- Record browser version, mouse DPI, pointer speed, pointer acceleration, display resolution/scaling, browser zoom, and monitor setup.
- Compare lower mouse DPI and pointer speed, changing one setting at a time.
- Compare pointer acceleration enabled/disabled and browser zoom at 100%.
- Compare monitors with different display scaling; distinguish screen pixels from CSS and source-image pixels.
- Establish whether the behavior comes from pointer movement, display scaling, or the browser's native picker before choosing an implementation.

### Possible feature

Keep the native picker as the default. Investigate an optional precision mode using a captured tab image, a magnified pixel grid, and arrow-key movement by one captured-image pixel.

Evaluate capture permissions, coordinate mapping across zoom/DPI, multiple monitors, and the limitation that a captured image freezes page content. Native EyeDropper does not expose controls for magnification or pointer step size; verify browser capabilities again during implementation.

Acceptance criteria for a future precision mode:

- A user can target a one-pixel border reliably.
- Keyboard movement selects adjacent image pixels without skipping.
- The selected HEX matches the captured pixel, including images, gradients, and composited transparency.
- Cancellation leaves the previously saved color and clipboard unchanged.
- Validate across relevant zoom/scaling settings and document the capture scope and limitations.

Reference: https://wicg.github.io/eyedropper-api/
