# Accessibility

Color Picker aims to keep its popup understandable and operable with common browser controls. Accessibility has not been independently audited, and this document does not claim WCAG conformance or complete assistive-technology support.

## Current support

- Popup actions use native buttons, a language select, and a labeled switch with disabled states.
- Keyboard focus indicators, HEX text alongside color swatches, and accessible names for history colors help users identify controls without relying only on color.
- English/Vietnamese labels follow the selected preference. The product name remains Color Picker.
- The custom overlay provides Stop, Escape cancellation, and a control that moves instructions between corners. It restores prior focus after closing.

## Known limitations

- Custom pixel sampling requires pointer input. Keyboard movement by one image pixel and a dedicated precision grid are not implemented.
- The magnifier is a visual aid; exact pixel selection is not currently accessible to all keyboard-only or screen-reader users.
- Native EyeDropper accessibility and interaction are controlled by the browser.
- Real screen-reader, high-contrast, reduced-motion, and broad zoom/scaling compatibility have not been comprehensively verified. Mock tests are not accessibility certification.

## Report a barrier

Open a bug report or email **truongleanhvu20052004@gmail.com**. Include the affected workflow, extension/browser/OS versions, input method or assistive technology, expected behavior, and a minimal example. Avoid sensitive screenshots. Describe your needs without disclosing medical or personal information.

Keyboard precision work is recorded in the [backlog](docs/guides/BACKLOG.md). Priorities depend on reproducibility, impact, and available maintenance time; no remediation date is promised.
