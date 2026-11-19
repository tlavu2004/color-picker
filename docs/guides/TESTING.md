# Testing and delivery

## Local checks

Use Node.js 24.15.0+ (24.x). Install the locked dependencies with `npm ci`, then run:

```powershell
npm run lint
npm run test:typecheck
npm test
npm run test:coverage
npm run coverage:summary
npm run build
npm run verify:build
```

`npm run test:watch` runs tests during development. Vitest transforms TypeScript directly and uses jsdom with React Testing Library. Browser APIs are mocked; no real user clipboard or extension storage is touched by tests. The old transpile-in-VM harness is replaced.

Tests cover restoration, local storage subscriptions and cleanup under StrictMode, selection/cancellation/retry, error handling, explicit clipboard writes, pending-copy disabling, the two-second cooldown, feedback reset, and timer cleanup. Service tests cover immediate opening, HEX normalization, newest-first bounded history, and native/storage failures. History integration tests cover ten-color migration, swatch selection, repicking, clearing, and operation/failure states.

## Coverage

`npm run test:coverage` generates text, HTML, LCOV, and JSON-summary reports in ignored `coverage/`. Open `coverage/index.html` locally. Coverage includes application TS/TSX source, including untested source files, and excludes only the React mounting entry `src/main.tsx`. Test files, configuration, and build output are outside the source include pattern.

No minimum percentage is enforced. The report measures mocked application behavior, not whether native EyeDropper works in Chrome. Do not use its percentage as a substitute for manual verification.

## GitHub Actions

- `.node-version` selects Node 24 for both workflows and local version managers; package engines require 24.15.0+ within Node 24. This extension uses Node for build/test only, so multi-version runtime compatibility is not a project requirement.
- **CI** runs on PRs targeting main, pushes to main, and manual dispatch. It does not also run on feature-branch pushes, avoiding duplicate push/PR runs. Stale runs for the same PR/ref are cancelled.
- **Extension verification** is a reusable workflow called by CI and release. Its read-only job has a 15-minute timeout and runs `npm ci`, lint, test typechecking, tests/coverage, build, asset checks, ZIP packaging, and SHA-256 generation.
- Coverage is shown in the Actions job summary and uploaded as an artifact. The package artifact contains `color-picker.zip` and its checksum, with `manifest.json` and the project `LICENSE` at the ZIP root. Download and extract the ZIP before using Load unpacked. Reports/packages are retained for 14 days.
- **Release package** runs only on a pushed `v*` tag. It calls the same verification workflow, then a separate publishing job (10-minute timeout) downloads that exact artifact, checks the tag against the verified manifest version, verifies SHA-256, and publishes the ZIP/checksum to a GitHub release. It never rebuilds the archive after verification.
- Only the release publishing job has contents-write permission. No Chrome Web Store deployment, credential setup, or automatic tag creation is configured. The same-tag release concurrency group does not cancel an active publication.
- Before releasing, update `public/manifest.json` and keep package metadata consistent. The prepared version is `1.0.0` in the manifest, package, and lockfile; its release tag is `v1.0.0`. Do not push a version tag until ready to publish.
- Third-party Actions are pinned to verified full commit SHAs. Dependabot checks npm dependencies weekly and GitHub Actions monthly, grouping compatible npm updates and Actions updates into reviewable PRs.

Run `npm run coverage:summary` after coverage to preview the job summary locally. The summary uses report counters, has no coverage threshold, and reports missing output without claiming coverage. The summary formatter has its own tests. A new workflow can be checked with actionlint; hosted CI runs when a PR is opened/updated, on main, or through manual dispatch. No release tag is pushed as part of implementation.

## Manual browser verification

1. Build and load `dist/` as an unpacked extension; reload after rebuilding.
2. Confirm web pages keep their normal click behavior and styles.
3. Select pixels from an image, gradient, and translucent region; compare displayed colors.
4. Select again, cancel with Esc, then select again. The picker must return to ready, and cancellation must preserve the previous color.
5. Reopen the popup and confirm restoration.
6. Selection must not change the clipboard. Copy must paste the displayed HEX value.
7. Confirm Copied! appears only on the disabled button for two seconds, then returns to Copy; changing color clears confirmation.
8. Verify up to ten swatches, selecting old colors without copying, clearing history, and migration from the old 50-entry history.

## History regression checks

The service stores at most ten distinct colors. Fifty-color histories describe legacy migration inputs only. All cases in `tests/history.integration.test.tsx` should run; an unexpectedly skipped history suite needs investigation.

Use results from the current commit after resolving conflicts or changing behavior. Earlier test counts and coverage reports do not establish the state of a different build.

## Dependency review

Use `npm audit` to obtain current dependency findings; this document does not maintain a snapshot of audit results. Review the affected package, whether it reaches the browser bundle, and the proposed compatibility changes before upgrading. Do not run `npm audit fix --force` without reviewing the toolchain changes it proposes.

## Custom picker verification

The custom picker and worker tests cover capture/injection ordering, single and continuous modes, pixel mapping, serialized saves, errors, cleanup, session validation, and popup restoration. Follow the [continuous-selection browser checklist](CONTINUOUS_SELECTION.md) for real capture, scrolling, focus, and popup behavior. Native tests explicitly use Advanced → Native screen picker.

## Publish version 1.0.0

1. Review and merge the release-preparation PR into `main`. Wait for CI on that main commit to pass.
2. Download the verified CI package, extract it, and load it unpacked. Check English/Vietnamese/Auto, single and continuous selection, Esc/Stop and popup return, ten-color history, and explicit copying. Browser-native dialogs follow the browser language.
3. Update the local main with a clean working tree:

   ```powershell
   git switch main
   git pull --ff-only origin main
   ```

4. Confirm `public/manifest.json`, `package.json`, and the root metadata in `package-lock.json` all contain version `1.0.0`. Confirm the intended release commit is checked out and check whether `v1.0.0` exists locally or remotely. If it exists, stop before tagging: deleting a GitHub Release does not delete its Git tag. An existing tag still points to its original commit. Do not delete or move it as part of documentation review; agree on the version/tag strategy before republishing.
5. For a version whose tag does not already exist, create and verify the signed tag, then push only that tag:

   ```bash
   git tag -s v1.0.0 -m "Color Picker v1.0.0"
   git tag -v v1.0.0
   git push origin v1.0.0
   ```

6. The tag push starts Release package. It verifies the tagged commit, checks the tag matches the manifest, and publishes the verified ZIP and SHA-256 checksum to GitHub Releases. Let the workflow create the release; do not manually pre-create one with the same tag.
7. Confirm the workflow succeeded and both assets are present. Users extract the ZIP and load that folder unpacked; this does not install or publish the extension through Chrome Web Store.

Documentation branches do not publish a release. Advanced precision controls remain deferred. The `.node-version` review is resolved: retain the file as shared Node configuration. See the [backlog](BACKLOG.md).
