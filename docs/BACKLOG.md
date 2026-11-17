# Development backlog

## Precise pixel selection

Status: advanced precision controls are deferred to a future feature PR.

User observation: moving the mouse in the native EyeDropper can appear to skip pixels, making thin borders difficult to target. The cause is not yet confirmed. This observation originally concerned the native EyeDropper. The current default picker maps pointer coordinates onto a frozen tab screenshot and provides a custom magnifier in both single and continuous modes. Native EyeDropper remains an explicit alternative under Advanced.

### Investigation

- Record browser version, mouse DPI, pointer speed, pointer acceleration, display resolution/scaling, browser zoom, and monitor setup.
- Compare lower mouse DPI and pointer speed, changing one setting at a time.
- Compare pointer acceleration enabled/disabled and browser zoom at 100%.
- Compare monitors with different display scaling; distinguish screen pixels from CSS and source-image pixels.
- Establish whether the behavior comes from pointer movement, display scaling, or the browser's native picker before choosing an implementation.

### Possible feature

Build on the existing frozen-tab picker and magnifier. Investigate keyboard movement by one captured-image pixel, configurable zoom, and a dedicated precision grid. Retain native EyeDropper as an explicit alternative; automatic native reopening is not a continuous-selection mechanism.

Evaluate capture permissions, coordinate mapping across zoom/DPI, multiple monitors, and the limitation that a captured image freezes page content. Native EyeDropper does not expose controls for magnification or pointer step size; verify browser capabilities again during implementation.

Acceptance criteria for a future precision mode:

- A user can target a one-pixel border reliably.
- Keyboard movement selects adjacent image pixels without skipping.
- The selected HEX matches the captured pixel, including images, gradients, and composited transparency.
- Cancellation leaves the previously saved color and clipboard unchanged.
- Validate across relevant zoom/scaling settings and document the capture scope and limitations.

Reference: https://wicg.github.io/eyedropper-api/

## Review Node version configuration in a separate PR

Consider removing `.node-version` and configuring Node 24 directly in GitHub Actions. Keep the current file until that PR; workflows currently read it through `node-version-file`.

- Find and update every workflow reference before deleting the file.
- Keep the chosen Node version consistent with `package.json` engines and the setup/testing documentation.
- Document the effect on local version managers, then validate the shared CI and release verification configuration.
- This is deferred configuration cleanup, not part of the continuous-selection feature.
