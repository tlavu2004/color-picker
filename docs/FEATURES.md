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

No misleading or disabled toggle is added. This item requires a separately agreed implementation approach before development; precision/capture work remains outside this branch.

References: [EyeDropper specification](https://wicg.github.io/eyedropper-api/), [Chromium chooser implementation](https://chromium.googlesource.com/chromium/src/+/main/content/browser/eye_dropper_chooser_impl.cc).

## Step 2: separate testing and CI branch

`ci/tests-and-coverage` starts independently from the same `main` baseline. It adds popup/clipboard tests, TypeScript source coverage, and GitHub Actions for verification and build artifacts. Its base still has the original 50-color service; the feature branch carries the change to 10. Resolve the service-test expectation to 10 when integrating the branches.

Coverage reports should be informational initially, without a mandatory percentage threshold. Native EyeDropper still needs manual browser verification.

## Step 3: localization proposal

Recommended for a Vietnamese/English audience, but not implemented in either current branch.

- Initially support English and Vietnamese, including labels, empty states, errors, accessibility text, and copy feedback.
- Default to browser language with English fallback.
- Provide a compact language setting with Auto / English / Tiếng Việt; persist the preference locally. A prominent binary toggle is unnecessary because Auto and additional languages do not fit a binary control.
- Ensure translated labels fit the popup, especially the Copy/Copied! button, without layout shifts.
- Decide between extension locale resources and application translation dictionaries during implementation; keep manifest and UI language behavior documented.
- Add tests for fallback, persistence, and translated interactions.

## Future work, not scheduled for immediate implementation

### Precise pixel selection

Investigate apparent skipped pixels before choosing an implementation. Compare mouse DPI, pointer speed/acceleration, display scaling, browser zoom, and multiple monitors.

A possible separate mode would capture the tab, magnify a pixel grid, and support one-image-pixel keyboard movement. It requires permission and coordinate-mapping review and freezes the captured page content. It is not implemented here.

See the [investigation backlog](BACKLOG.md).
