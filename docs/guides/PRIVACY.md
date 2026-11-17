# Privacy

Applies to Color Picker version 1.0.0. Last updated: November 17, 2026.

## Processing on your device

Color Picker has no account, analytics, advertising, or extension-operated backend. The extension code does not upload screenshots, colors, preferences, or browsing data to a server. GitHub, browser services, and any future store listing have their own policies.

## Stored data

- **Local extension storage:** up to ten distinct HEX colors and the Auto/English/Vietnamese preference. These are not stored through the Chrome Sync API.
- **Session storage:** the last custom selection mode and popup-return metadata, including a random session ID, source URL, tab/window/document identifiers, timestamps, and lifecycle flags. These support returning to the correct source context, not browsing-history tracking. Metadata is consumed or removed during lifecycle cleanup; records older than 30 minutes cannot reopen the popup. Session storage is cleared when the browser session ends or the extension is reloaded/disabled; expiry is validated when records are processed, not by a scheduled deletion timer.
- **Screenshots:** a user-started custom session captures the visible tab once. The image is processed in memory by an isolated picker and is not written to extension local/session storage or uploaded. Exiting releases the picker image resources. The image may contain anything visible in the captured viewport; start selection only when you intend to capture that content.

Native selection uses the browser EyeDropper and stores the selected HEX value. It does not use the extension's tab screenshot workflow.

## Permissions

| Permission | Purpose |
| --- | --- |
| `storage` | Save colors, language preference, and temporary session metadata |
| `activeTab` | Access the active source tab for a user-started capture |
| `scripting` | Install and remove the custom picker on the source document |

There are no broad host permissions or automatic content scripts. The extension reads the active source URL and identifiers to validate capture and popup return. The closed shadow tree reduces ordinary page access to the screenshot canvas; it is not a security boundary against browser tools.

## Clipboard and deletion

The clipboard changes only when you press Copy. It remains available to your operating system and other applications according to their behavior; clearing extension history does not clear the clipboard.

Clear history removes saved colors, while retaining the language preference. Removing the extension removes its extension storage. Ending selection removes the overlay and screenshot resources; already accepted color saves may finish afterward.

## Contact

Contact the maintainer at [truongleanhvu20052004@gmail.com](mailto:truongleanhvu20052004@gmail.com) for privacy questions. Do not include sensitive screenshots or source URLs in public issues.
