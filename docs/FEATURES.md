# Features and branch status

## Implemented on feat/continuous-selection

- Default native single-color selection, Esc cancellation, uppercase HEX display, latest-color restoration, and explicit Copy/Copied! behavior.
- A default-off Continuous selection from tab snapshot checkbox.
- A separate window showing a frozen visible-tab image; successive clicks save colors without reopening the native chooser.
- Recent-color buttons in the snapshot window, explicit copy, Refresh snapshot, Stop/Esc, and Close window.
- Original source-tab validation on refresh; no silent switch to another tab.
- In-memory, single-use image transfer with expiry checks and cleanup; no image stored in color history or uploaded.
- Shared newest-ten, distinct-color storage, including migration from legacy 50-color history.
- Vitest service, popup, session, canvas interaction, scaling, failure recovery, and clipboard tests.

See [continuous selection](CONTINUOUS_SELECTION.md). This is not a live screen-capture mode or the deferred precision mode.

## Other independently reviewable branches

Every branch starts from main `a069d30`; none is merged into main here.

- `feat/color-history`: ten-color popup grid, selecting older colors without copying, clearing, and legacy migration.
- `feat/localization`: Auto / English / Tiếng Việt, persisted preference, translated popup labels/errors and copy feedback. Snapshot labels are English on this standalone branch; apply the localization dictionary to this view when integrating.
- `ci/tests-and-coverage`: GitHub Actions verification on Node 22/24, coverage/artifacts, and tag-triggered GitHub release packaging.

These feature branches include shared test tooling to verify their code before CI is merged. When combining them, keep one copy of the tooling, retain all product changes and tests, and resolve shared Popup/service/documentation edits deliberately.

## Deferred by user decision

Precision selection with magnification, a pixel grid, and arrow-key movement is not implemented. See the [backlog](BACKLOG.md) for the DPI/scaling investigation. No extra future features have been introduced.
