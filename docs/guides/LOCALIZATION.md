# Localization

## Behavior

- The Language selector offers Auto, English, and Tiếng Việt. Auto follows `navigator.language`, uses Vietnamese for Vietnamese locales, and falls back to English otherwise.
- Preferences are persisted in `chrome.storage.local.language`, independently of the ten-color history. Failed writes preserve the previous preference and report an error.
- The product name **Color Picker** stays unchanged in both languages, including the popup heading and document title.
- Popup controls, history, copy feedback, accessible labels, and custom picker instructions/status/errors are translated. The document language follows the selected UI language.
- The custom picker receives a plain translation dictionary at launch. Its language stays fixed for that session; reopening uses the latest preference. The injected function contains all runtime helpers and imports no modules.
- Native EyeDropper and browser permission dialogs are controlled by the browser; their language cannot be set by this extension.
- Auto responds to browser language changes in the popup. Storage and language listeners are cleaned up on unmount.
- Copy remains explicit with the two-second disabled confirmation. The fixed button width accommodates both languages.

## Code

`src/i18n/messages.ts` contains popup/history translations and language resolution. `overlayMessages.ts` contains serializable picker translations; `useLanguage.ts` handles preferences and document metadata. No translation service or additional permission is used. The manifest name and description remain English.

## Verification

Use Node.js 24.15.0+ (24.x). Run the checks in [testing and delivery](TESTING.md). Tests cover language resolution, preference persistence, copy feedback, errors, history labels, and translated overlay selection. Browser API mocks do not replace real capture/focus checks.

Reload the built extension, switch all three options, and reopen the popup. Confirm the product name is unchanged. In Vietnamese, check history selection/clearing, both custom modes, Stop/move controls, saved-color feedback, and explicit copying. Verify Advanced/native behavior separately, and test Auto with English and Vietnamese browser settings.
