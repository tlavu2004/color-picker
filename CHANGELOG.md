# Changelog

Notable changes are recorded here. Version 1.0.0 is under documentation review before republishing. Its GitHub Release has been removed; the signed tag remains on the earlier commit until a separate release decision. No publication date is assigned here.

## 1.0.0

### Features

- Shared frozen-tab picker and pixel magnifier for single and continuous selection.
- Default-off continuous switch, Esc/Stop cleanup, movable controls, and popup restoration when the source context remains active.
- Explicit native screen picker under Advanced for browser-supported screen sampling, disabled while continuous selection is enabled.
- Matching preview/save samples at text edges, including fractional pointer coordinates.
- Ten-color local history with deduplication, legacy migration, swatch selection, and clearing.
- Explicit HEX copying with a two-second disabled Copied! confirmation.
- English/Vietnamese UI with Auto language detection and a persisted preference; the Color Picker product name stays unchanged.

### Quality and distribution

- Vitest and React Testing Library tests, informational source coverage, and Node 24 CI.
- Verified extension ZIP and SHA-256 checksum; version tags trigger GitHub Releases. Chrome Web Store publishing is not configured.
- MIT license, bundled license notice, privacy documentation, and contribution guidance.

### Known limitations

- Custom picking uses a frozen visible HTTP/HTTPS tab image, rather than a live or whole-screen view. Restricted pages require the native alternative.
- Chrome/Edge 127+ is required. Browser-specific capture, focus, and popup behavior still needs manual verification.
- Keyboard pixel stepping, configurable zoom, and advanced precision controls remain deferred.
