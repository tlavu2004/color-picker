# Color Picker

A Chrome Manifest V3 extension built with React 19, TypeScript, and Vite 7. Use native EyeDropper for one screen pixel, or enable continuous selection to pick multiple colors from a frozen tab snapshot.

## Run locally

Use desktop Chrome/Edge 112+ and Node.js 22.22.2+ or 24.15.0+.

```powershell
npm ci
npm run build
npm run verify:build
```

Open `chrome://extensions` or `edge://extensions`, enable Developer mode, and Load unpacked this project's `dist/` directory. After edits, rebuild and Reload the extension. If upgrading from the original injected picker, refresh old web tabs as well.

## Select colors

- Leave the continuous-selection checkbox off to use native **Pick Color**. Select one pixel or press Esc to cancel.
- Enable **Continuous selection from tab snapshot**, then click **Capture tab and pick**. A separate window displays a frozen image of the visible source tab. Click several pixels without ending the session.
- In the selection window, **Refresh snapshot** captures the original source tab again if it remains active in its source window. **Esc/Stop** ends selection; **Close window** closes the view.
- Copy is always explicit. **Copy** changes to **Copied!** and disables for two seconds on success. Picking never overwrites the clipboard.
- Native and snapshot saves retain the newest **10** distinct colors locally. The popup restores the latest color; the snapshot window also displays recent-color buttons. The separate popup history-grid PR adds browsing/clearing to the popup.

The image is not a live screen, and covers only the captured visible tab area. It does not follow scrolling or animation. Precision magnification, grid, and keyboard pixel stepping are deferred.

## Permissions and data

This branch requests **storage** and **activeTab** for explicit tab capture. There is no background worker, content script, broad host access, account, or server upload. Screenshot transfer uses temporary in-memory session storage and is consumed once; colors use local storage. A large screenshot can exceed session quota and report an error.

## Development and tests

```powershell
npm run lint
npm run test:typecheck
npm test
npm run test:coverage
npm run build
npm run verify:build
```

The branch has 29 tests using Vitest, React Testing Library, and mocked browser/canvas APIs. Real capture permissions and native color behavior still require manual browser checks. `npm run dev` and `npm run preview` serve `/src/index.html` for layout work, but do not replace a loaded extension.

The snapshot guide includes a manual checklist and explains transient image lifecycle and source validation. All feature branches start independently from main; this branch does not include localization or GitHub Actions workflows from the other PRs.

## Documentation

- [Continuous selection behavior, checks, and limitations](docs/CONTINUOUS_SELECTION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Feature and branch status](docs/FEATURES.md)
- [Deferred precision investigation](docs/BACKLOG.md)
