# Localization

Implemented independently on `feat/localization`, starting from main `a069d30`.

## Behavior

- A compact Language selector offers Auto, English, and Tiếng Việt.
- Auto follows `navigator.language`, recognizes Vietnamese locales, and falls back to English for other languages.
- The preference is stored as `chrome.storage.local.language`; colors are untouched.
- Popup labels, copy confirmation, errors, accessible labels, document title, and document language update together.
- Explicit language changes are saved before applying them. A failed save keeps the previous selection and displays a translated error.
- Auto responds to browser language changes. Storage and browser-language listeners are removed on unmount.
- Copy remains explicit with the same two-second confirmation. The wider fixed button accommodates both translations.

Translation dictionaries are in `src/i18n/messages.ts`; the language hook is in `src/i18n/useLanguage.ts`. The manifest's product name and description remain English. No external translation service or new permission is used.

## Checks

Use Node.js 22.22.2+ or 24.15.0+. Run `npm ci`, `npm run build`, `npm run lint`, `npm run test:typecheck`, `npm test`, and `npm run verify:build`. Vitest is included on this feature branch so tests run before the independent CI PR is merged.

Twelve tests cover the unchanged native selection service and language resolution, translated copy feedback, persistence/reopening, save failures, and browser-language changes. Native EyeDropper still needs a browser check.

Manual check: reload the built extension, switch between the three options, close/reopen the popup, select and copy a color, and verify translated errors and labels fit without moving the copy button. Test Auto with both English and Vietnamese browser language settings.

## Independent PR integration

This branch retains main's existing 50-color data behavior. The history PR separately changes that limit to ten. When integrating, preserve the history UI, feed its labels through this dictionary, and retain both sets of tests. The snapshot/precision views are separate PRs and will also need translations when combined. CI workflows remain on `ci/tests-and-coverage`; this branch includes only the test tooling needed to verify its own feature.
