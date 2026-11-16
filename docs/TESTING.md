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
- Coverage is shown in the Actions job summary and uploaded as an artifact. The package artifact contains `color-picker-extension.zip` and its checksum, with `manifest.json` at the ZIP root. Download and extract the ZIP before using Load unpacked. Reports/packages are retained for 14 days.
- **Release package** runs only on a pushed `v*` tag. It calls the same verification workflow, then a separate publishing job (10-minute timeout) downloads that exact artifact, checks the tag against the verified manifest version, verifies SHA-256, and publishes the ZIP/checksum to a GitHub release. It never rebuilds the archive after verification.
- Only the release publishing job has contents-write permission. No Chrome Web Store deployment, credential setup, or automatic tag creation is configured. The same-tag release concurrency group does not cancel an active publication.
- Before releasing, update `public/manifest.json` and keep package metadata consistent. A manifest version of `1.0` requires tag `v1.0`. Do not push a version tag until ready to publish.
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

## History and CI integration status

The history and CI branches originally started at commit `a069d30`. CI has since been merged into `main` and incorporated into this history branch. The current service stores at most ten distinct colors; the old 50-color limit describes legacy data only.

`tests/pickColor.test.mjs` has been removed in favor of Vitest. The five cases in `tests/history.integration.test.tsx` run on this branch because its history service is present. A skipped history suite here should be investigated rather than treated as an expected baseline result.

Run all checks above after resolving merge conflicts and before completing the merge commit. Use that run's test counts and coverage results; earlier results from separate branches are not a substitute for checking the final merged tree. For subsequent continuous-selection and localization PRs, preserve the ten-color service/UI, shared CI configuration, and all relevant tests when resolving conflicts.

## Dependency audit

Compatible dependency updates were applied while adding the test toolchain. The remaining npm audit findings are in development tooling (`typescript-eslint` and its transitive minimatch dependency). Do not use `npm audit fix --force` blindly: the reported remediation changes the toolchain outside the current compatible update. Review upgrades separately; these dependencies are not shipped in the browser bundle.
