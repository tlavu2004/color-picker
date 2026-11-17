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

## Node version configuration — resolved

Decision: retain `.node-version` as the shared Node major-version configuration for local version managers, CI, and release verification.

- CI and release workflows already use `node-version-file: .node-version`, avoiding repeated version declarations.
- The file selects Node 24; `package.json` engines requires 24.15.0+ within that major version. These serve complementary purposes: selecting the toolchain and declaring its supported range.
- When upgrading Node, update this file, package engines, and setup/testing documentation together, then validate the shared verification workflow.
- No removal PR is planned. This review is complete; Node is build/test tooling and is not required by users installing the release ZIP.
