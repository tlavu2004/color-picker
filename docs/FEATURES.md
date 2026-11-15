# Features and plans

This document distinguishes implemented behavior from proposals. Planned items are not release commitments.

## Implemented

| Feature | Current behavior |
| --- | --- |
| Pixel color selection | Pick Color opens the native EyeDropper to sample displayed colors from images, gradients, and composited regions |
| One color per selection | Selection ends after picking; click again for another color |
| Cancellation | Esc exits without changing the saved color or clipboard |
| Result display | Color swatch and uppercase sRGB HEX value |
| Local storage | Up to 50 distinct colors, newest first; selecting an existing color moves it to the front |
| Popup restoration | Reopening displays the latest color; storage changes update the result |
| Explicit copy | The clipboard changes only when Copy is clicked |
| Copy confirmation | The button displays Copied! and is disabled for two seconds; it is also disabled while writing, and its width stays fixed |
| Error feedback | Reports selection, storage, clipboard, or missing-EyeDropper errors so the user can retry |
| No page interference | No automatic picker activation, injected scripts/styles, or website-access permissions |

There is no interface for browsing the 50 stored colors yet. Fifty is the current storage limit, not the number of visible swatches.

## Proposed for the next feature PR

### Color history interface

- A recent-color grid, with 10 visible colors proposed. The earlier suggestion of 12 was only for a four-column, three-row layout, not a product requirement.
- Newest colors first, without duplicates when selecting an existing color.
- Click a swatch to view its HEX value. Copy remains a separate action and does not happen automatically.
- An action to clear history.
- During implementation, decide whether to retain 50 stored colors and display only 10, or reduce the storage limit as well. Existing data behavior has not changed.

### Continuous selection toggle: feasibility investigation required

- A toggle that defaults to off is proposed.
- Desired behavior: when enabled, select several colors in a session; Esc ends the session.
- Test EyeDropper's user-activation requirement before committing to reopening it automatically after each selection.
- If the native API cannot support the desired flow, evaluate alternatives and discuss them before implementation. This may become a separate PR.

Neither feature above is implemented in the current bug-fix branch.

## Implemented on ci/tests-and-coverage

- Vitest and React Testing Library cover service, popup restoration, storage updates, selection/cancellation/retry, clipboard failures, pending operations, copy feedback, and cleanup.
- V8 coverage maps to application TypeScript, excluding only the mounting entry; reports are informational with no minimum percentage gate.
- GitHub Actions runs verification on Node.js 22/24 and uploads coverage and unpacked extension artifacts.
- Version tags trigger verified ZIP packaging and GitHub release publication. Chrome Web Store deployment is not configured.
- Five feature-integration tests activate when the independent history feature is present. They are explicitly skipped on this baseline, which still stores 50 colors.
- Native browser checks remain necessary. See [testing and delivery](TESTING.md).

## Future work, not scheduled for immediate implementation

### Precise pixel selection

The user observed that the cursor appears to skip some pixels. The cause is unconfirmed. First compare mouse DPI, pointer speed/acceleration, display scaling, browser zoom, and multiple monitors.

A possible approach is a separate mode using a captured tab image, a magnified pixel grid, and arrow keys that move by one image pixel. Evaluate permissions, coordinate mapping, and the limitation of frozen page content. Keep native selection as the default if this mode is added.

See the [investigation backlog and acceptance criteria](BACKLOG.md).

## Baseline and independent branches

The merged `main` baseline at `a069d30` includes picker/storage/popup fixes, explicit clipboard behavior, copy feedback, and source/documentation cleanup. `ci/tests-and-coverage` adds test and delivery tooling without changing product behavior. `feat/color-history` independently adds the ten-color history UI and its roadmap.

Both current branches start from the same main commit; see the integration guidance in TESTING.md. Precision selection remains outside their implementation scope.
