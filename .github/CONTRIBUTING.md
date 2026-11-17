# Contributing to Color Picker

Thank you for helping improve Color Picker. Bug reports, documentation corrections, translations, and focused code changes are welcome.

## Before starting

Check existing issues and the [feature plans](../docs/guides/FEATURES.md) and [backlog](../docs/guides/BACKLOG.md). Discuss substantial changes before implementation. Report vulnerabilities privately as described in [Security](SECURITY.md).

## Development

1. Fork the repository and create a branch from the latest `main`: `feat/your-feature`, `fix/your-fix`, or `docs/your-update`.
2. Use Node.js 24.15.0+ within Node 24, matching `.node-version` and package engines. Run `npm ci`.
3. Make focused changes; keep English documentation and English/Vietnamese translations consistent.
4. Run `npm run lint`, `npm run test:typecheck`, `npm test`, `npm run test:coverage`, `npm run build`, and `npm run verify:build`. See [testing and delivery](../docs/guides/TESTING.md).
5. For browser/UI changes, load `dist/` unpacked in Chrome/Edge 127+ and verify affected flows. Mocks do not prove native capture, focus, or picker behavior.
6. Use conventional commits, such as `fix: align selected pixel with preview`. Keep unrelated changes in separate commits.
7. Push to your fork and open a PR targeting `main`, explaining the behavior, validation, and any limitations. Include screenshots for visible changes.

## Reports and screenshots

For bugs, include reproduction steps, expected/actual behavior, extension/browser versions, picker mode, browser zoom, OS scaling, and mouse/display setup when relevant. Do not post personal browsing content, credentials, or sensitive logs.

Store documentation screenshots in `docs/images/` with descriptive names. Use neutral sample content and update image links when moving files. Feature requests should describe a user problem and expected workflow, including capture/privacy implications where relevant.

By contributing, you agree that your contributions are distributed under the project's [MIT License](../LICENSE). Follow the [Code of Conduct](../CODE_OF_CONDUCT.md).
