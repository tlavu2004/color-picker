# Testing and delivery

## Local checks

Use Node.js 22.12+ or Node.js 24. Install the locked dependencies with `npm ci`, then run:

```powershell
npm run lint
npm run test:typecheck
npm test
npm run test:coverage
npm run build
npm run verify:build
```

`npm run test:watch` runs tests during development. Vitest transforms TypeScript directly and uses jsdom with React Testing Library. Browser APIs are mocked; no real user clipboard or extension storage is touched by tests. The old transpile-in-VM harness is replaced.

Tests cover restoration, local storage subscriptions and cleanup under StrictMode, selection/cancellation/retry, error handling, explicit clipboard writes, pending-copy disabling, the two-second cooldown, feedback reset, and timer cleanup. Service tests cover immediate opening, HEX normalization, newest-first bounded history, and native/storage failures.

## Coverage

`npm run test:coverage` generates text, HTML, LCOV, and JSON-summary reports in ignored `coverage/`. Open `coverage/index.html` locally. Coverage includes application TS/TSX source, including untested source files, and excludes only the React mounting entry `src/main.tsx`. Test files, configuration, and build output are outside the source include pattern.

No minimum percentage is enforced. The report measures mocked application behavior, not whether native EyeDropper works in Chrome. Do not use its percentage as a substitute for manual verification.

## GitHub Actions

- **CI** runs on main, feature/fix/CI branch pushes, PRs targeting main, and manual dispatch. It uses Node.js 22 and 24, `npm ci`, lint, test typechecking, coverage, build, and packaged-path verification.
- Coverage and unpacked extension artifacts are uploaded from the Node 24 job and retained for 14 days. Workflow permissions are read-only.
- **Release package** runs only when a `v*` tag is pushed. It repeats verification, checks that the tag is exactly `v` plus the manifest version, creates a ZIP with `manifest.json` at its root, and publishes it as a GitHub release asset.
- Before release, update `public/manifest.json` to the intended version and keep package metadata consistent. For example, a manifest version of `1.0` requires tag `v1.0`. Push a release tag only when ready to publish.
- The release job has repository-content write permission; it uses the built-in GitHub token. No Chrome Web Store deployment, credentials, or automatic tag creation are configured.

These workflow definitions are validated locally; hosted runner results become available after pushing and enabling Actions in the repository. No release tag is pushed as part of implementation.

## Manual browser verification

1. Build and load `dist/` as an unpacked extension; reload after rebuilding.
2. Confirm web pages keep their normal click behavior and styles.
3. Select pixels from an image, gradient, and translucent region; compare displayed colors.
4. Select again, cancel with Esc, then select again. The picker must return to ready, and cancellation must preserve the previous color.
5. Reopen the popup and confirm restoration.
6. Selection must not change the clipboard. Copy must paste the displayed HEX value.
7. Confirm Copied! appears only on the disabled button for two seconds, then returns to Copy; changing color clears confirmation.
8. When the independent history feature is merged, verify ten swatches, selecting old colors without copying, clearing history, and migration from the old 50-entry history.

## Integrating the independent branches

Both `feat/color-history` and `ci/tests-and-coverage` start at main commit `a069d30`. The CI branch tests the baseline with its 50-color storage bound. Its bounded-history contract also accepts the feature's stricter ten-color bound; the feature branch supplies explicit ten-color and migration tests in the old Node harness.

When merging both branches, retain the feature's service and UI changes. Remove the old `tests/pickColor.test.mjs` if Git reports a modify/delete conflict; port its history-migration and clear-history cases to Vitest and add grid interactions. The old VM harness is not part of the new `npm test` command. Then rerun all checks above against the combined code. README and feature-status documentation may also require combining their independent edits.

## Dependency audit

Compatible dependency updates were applied while adding the test toolchain. The remaining npm audit findings are in development tooling (`typescript-eslint` and its transitive minimatch dependency). Do not use `npm audit fix --force` blindly: the reported remediation changes the toolchain outside the current compatible update. Review upgrades separately; these dependencies are not shipped in the browser bundle.
