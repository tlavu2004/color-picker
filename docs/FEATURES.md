# Features and plans

## Implemented on feat/color-history

- Native EyeDropper selection, one pixel per explicit Pick Color action; Esc cancels.
- Uppercase sRGB HEX and color swatch; reopening restores the latest saved color.
- Explicit Copy with a disabled button while writing and a two-second Copied! confirmation.
- Up to **10** distinct recent colors, newest first, stored locally in `chrome.storage.local.colors`.
- A five-column recent-color grid. Selecting a swatch displays its HEX without copying or reordering stored history. Selecting an existing color with EyeDropper moves it to the front.
- Clear history removes all saved colors and clears the displayed result. Failures are reported without claiming success.
- Legacy history is normalized, deduplicated, and reduced from 50 to the newest 10 colors when loaded. Older entries beyond the limit are discarded.
- Loading and operation states prevent overlapping selection, copy, and history actions.
- No content scripts, background worker, website permissions, account synchronization, or server upload.

The baseline on `main` before this branch stored 50 colors but displayed only the latest one. The number 12 was an earlier layout suggestion; this branch consistently uses 10 for both storage and display.

## Continuous selection: native API limitation

A default-off toggle was proposed to select multiple colors until Esc. The native API requires transient user activation on each opening and suppresses page UI events during selection. An automatic reopen loop cannot be promised to work reliably; a native click is not an ordinary page click that renews activation.

No continuous-selection toggle or capture implementation is included in this history branch. The feasibility investigation is available in [continuous selection findings and alternatives](CONTINUOUS_SELECTION.md). Snapshot-based continuous selection has since been implemented separately on `feat/continuous-selection` and is awaiting integration.

References: [EyeDropper specification](https://wicg.github.io/eyedropper-api/), [Chromium chooser implementation](https://chromium.googlesource.com/chromium/src/+/main/content/browser/eye_dropper_chooser_impl.cc).

## Testing and CI inherited from main

- Vitest and React Testing Library cover service behavior, popup restoration, storage updates, selection/cancellation, clipboard errors, copy confirmation, and cleanup.
- Five history integration tests cover migration to ten colors, swatch selection, repicking, clearing, and operation/failure states. The history service is present on this branch, so these tests run rather than being skipped.
- V8 coverage maps to application TypeScript, excluding the mounting entry. Reports are informational, without a minimum percentage gate.
- GitHub Actions uses a shared Node 24 verification workflow for CI and releases, with coverage summaries, verified ZIP artifacts, and SHA-256 checksums.
- Version tags publish the verified archive to GitHub Releases without rebuilding. Chrome Web Store deployment is not configured.
- Native browser checks remain necessary because mocked APIs cannot verify the real EyeDropper interface.

The merged CI work replaces the old Node/VM test harness. See [testing and delivery](TESTING.md) for commands, coverage scope, workflows, and the manual checklist.

## Localization on a separate branch

`feat/localization` implements Auto / English / Tiếng Việt, a persisted preference, and translated popup labels, errors, and copy feedback. It has not been integrated into this history branch. When integrating, translate the history controls and preserve the ten-color behavior and tests.

## Future work, not scheduled for immediate implementation

### Precise pixel selection

Investigate apparent skipped pixels before choosing an implementation. Compare mouse DPI, pointer speed/acceleration, display scaling, browser zoom, and multiple monitors.

A possible approach is a separate mode using a captured tab image, a magnified pixel grid, and arrow keys that move by one image pixel. Evaluate permissions, coordinate mapping, and the limitation of frozen page content. Keep native selection as the default if this mode is added.

See the [investigation backlog and acceptance criteria](BACKLOG.md).

## Current branch scope

`feat/color-history` adds the ten-color popup grid, selecting previous colors without copying, clear history, and migration from the old 50-entry history. It incorporates the testing and CI work already merged into `main`.

Continuous selection and localization are implemented on separate review branches and are not part of this PR. Update each branch from the latest `main`, resolve shared UI/service/documentation changes, and rerun verification before merging. Precision selection remains deferred.
