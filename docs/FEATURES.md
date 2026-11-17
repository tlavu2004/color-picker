# Features and branch status

## Implemented on feat/continuous-selection

- Shared single/continuous tab overlay with the same magnifier, Escape cancellation, HEX restoration, and explicit Copy/Copied! behavior.
- Single mode exits after one successful save and blocks duplicate clicks while pending; failed saves keep it open for retry.
- A Native screen picker under collapsed Advanced opens the browser EyeDropper explicitly, without silently changing the primary experience.
- A default-off Continuous selection switch. Start captures and overlays the visible source tab; it does not open another window.
- A custom persistent magnifier with non-smoothed enlarged pixels, center-pixel marker, and HEX preview.
- Repeated clicks save colors while the overlay stays active. Accepted writes are serialized and retain the newest ten distinct colors.
- Esc/Stop removes the entire overlay and restores page interaction. Move to next corner lets the user reach pixels hidden under the instruction panel.
- The modal blocks clicks through to the source page. Wheel/touch scrolling is suppressed without ending selection; viewport changes and navigation end the session. Background/nested scroll events do not close the frozen view.
- Screenshot data is kept in the injected picker only, not persistent or session storage. No server upload or broad host access is added. A small background worker manages returning to the popup.
- Capture/injection/decoding errors are reported; storage errors allow retry without ending the picker.
- Custom single-save or Esc/Stop completion reopens the popup in the still-active source context after pending writes finish. The custom mode and latest color are restored. Navigation/tab changes and lifecycle abandonment do not force a popup.
- Tests cover native/popup behavior, startup, rapid selection, magnifier persistence, serialized injection, cleanup, and background return races.

See [continuous selection](CONTINUOUS_SELECTION.md) for details. The picture is a frozen tab viewport; underlying page JavaScript may continue running. Stop and restart for fresh content.

## Other review branches

- `feat/color-history`: popup history grid, clear history, and migration to ten colors. Retain these changes when updating this branch from main.
- `feat/localization`: Auto / English / Tiếng Việt and translated popup behavior; integrate translations for the new overlay controls as well.
- `ci/tests-and-coverage`: shared verification workflows, coverage reports, and release packaging. Preserve the current main version during integration.

The branches were created independently from main. This change replaces the earlier separate snapshot window on the same continuous-selection branch, without merging the PR into main.

## Deferred

Advanced precision mode with a full pixel grid, configurable zoom, and arrow-key movement is not implemented. The basic magnifier is included to support the updated continuous-selection interaction. See the [backlog](BACKLOG.md) for further DPI/scaling investigation.
