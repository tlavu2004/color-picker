/** These functions are serialized by chrome.scripting. Keep all runtime helpers inside each function. */
export function stopOverlay() {
  const scope = window as Window & { __colorPickerStop?: () => void };
  scope.__colorPickerStop?.();
  return { width: innerWidth, height: innerHeight, scale: window.visualViewport?.scale ?? 1 };
}

export async function installOverlay(dataUrl: string, viewport: { width: number; height: number; scale: number }, continuous = false): Promise<void> {
  const scope = window as Window & { __colorPickerStop?: () => void };
  scope.__colorPickerStop?.();
  if (innerWidth !== viewport.width || innerHeight !== viewport.height || (window.visualViewport?.scale ?? 1) !== viewport.scale) {
    throw new Error('The viewport changed during capture. Start selection again.');
  }
  if (viewport.scale !== 1) throw new Error('Reset pinch zoom before starting continuous selection.');
  if (!dataUrl.startsWith('data:image/png;base64,')) throw new Error('Invalid capture image.');

  const host = document.createElement('dialog');
  host.setAttribute('aria-label', continuous ? 'Continuous color selection' : 'Single color selection');
  host.setAttribute('data-color-picker-overlay', '');
  host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;margin:0!important;padding:0!important;border:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;overflow:hidden!important;display:block!important;background:transparent!important;';
  // Keep the captured pixels out of the host page's ordinary DOM access.
  const surface = document.createElement('div');
  surface.style.cssText = 'display:block!important;width:100%!important;height:100%!important;';
  host.append(surface);
  const root = surface.attachShadow({ mode: 'closed' });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(`
    :host { color-scheme: light; }
    * { box-sizing: border-box; }
    canvas.image { display:block; width:100%; height:100%; cursor:crosshair; touch-action:none; }
    .panel { position:absolute; left:12px; top:12px; max-width:calc(100% - 24px); padding:10px 12px; border-radius:8px; border:1px solid #b8c1cc; background:#fff; color:#172033; font:13px/1.5 system-ui,sans-serif; box-shadow:0 3px 16px #0004; }
    .panel p { margin:0 0 6px; }
    button { font:inherit; padding:4px 12px; cursor:pointer; }
    button:focus-visible { outline:3px solid #1673d1; outline-offset:2px; }
    .loupe { position:absolute; pointer-events:none; width:144px; padding:6px; background:#fff; color:#172033; border:1px solid #777; border-radius:6px; box-shadow:0 3px 14px #0005; font:13px/1.4 monospace; text-align:center; }
    .loupe canvas { display:block; width:130px; height:130px; image-rendering:pixelated; }
    [role=alert] { color:#a31818; }
  `);
  root.adoptedStyleSheets = [sheet];
  const imageCanvas = document.createElement('canvas');
  imageCanvas.className = 'image';
  imageCanvas.setAttribute('aria-label', 'Frozen tab image');
  const panel = document.createElement('div');
  panel.className = 'panel';
  const help = document.createElement('p');
  help.textContent = continuous
    ? 'Frozen view · Click to save colors · Esc or Stop to return to the page'
    : 'Frozen view · Click one pixel to save and finish · Esc or Stop cancels';
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.textContent = 'Ready. Copy saved colors from the extension popup after finishing.';
  const error = document.createElement('p');
  error.setAttribute('role', 'alert');
  const stopButton = document.createElement('button');
  stopButton.type = 'button';
  stopButton.textContent = 'Stop';
  const moveButton = document.createElement('button');
  moveButton.type = 'button';
  moveButton.textContent = 'Move controls';
  let corner = 0;
  moveButton.addEventListener('click', () => {
    corner = (corner + 1) % 4;
    Object.assign(panel.style, {
      left: corner === 0 || corner === 3 ? '12px' : 'auto',
      right: corner === 1 || corner === 2 ? '12px' : 'auto',
      top: corner < 2 ? '12px' : 'auto',
      bottom: corner >= 2 ? '12px' : 'auto',
    });
  });
  panel.append(help, status, error, stopButton, moveButton);
  const loupe = document.createElement('div');
  loupe.className = 'loupe';
  loupe.hidden = true;
  loupe.setAttribute('aria-hidden', 'true');
  const zoom = document.createElement('canvas');
  zoom.width = 130;
  zoom.height = 130;
  const hexLabel = document.createElement('span');
  loupe.append(zoom, hexLabel);
  root.append(imageCanvas, panel, loupe);
  const previousFocus = document.activeElement;
  let active = true;
  let frame: number | null = null;
  let loadTimeout: number | undefined;
  let rejectLoad: ((reason: Error) => void) | undefined;
  let saveQueue = Promise.resolve();
  let savingSingle = false;

  const stop = () => {
    if (!active) return;
    active = false;
    if (frame !== null) cancelAnimationFrame(frame);
    clearTimeout(loadTimeout);
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('resize', stop);
    window.removeEventListener('pagehide', stop);
    window.removeEventListener('scroll', stop, true);
    window.visualViewport?.removeEventListener('resize', stop);
    host.removeEventListener('cancel', onCancel);
    host.remove();
    imageCanvas.width = imageCanvas.height = 0;
    zoom.width = zoom.height = 0;
    if (scope.__colorPickerStop === stop) delete scope.__colorPickerStop;
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    rejectLoad?.(new Error('Selection cancelled before the image was ready.'));
    rejectLoad = undefined;
  };
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); stop(); }
  }
  function onCancel(event: Event) { event.preventDefault(); stop(); }
  const blockScroll = (event: Event) => event.preventDefault();
  root.addEventListener('wheel', blockScroll, { passive: false });
  root.addEventListener('touchmove', blockScroll, { passive: false });
  root.addEventListener('contextmenu', blockScroll);
  root.addEventListener('click', event => event.stopPropagation());
  stopButton.addEventListener('click', stop);
  host.addEventListener('cancel', onCancel);
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('resize', stop);
  window.addEventListener('pagehide', stop);
  window.addEventListener('scroll', stop, true);
  window.visualViewport?.addEventListener('resize', stop);
  scope.__colorPickerStop = stop;

  try {
    await new Promise<void>((resolve, reject) => {
      rejectLoad = reject;
      loadTimeout = window.setTimeout(() => { stop(); }, 15000);
      // Decode without a DOM image URL so page img-src policies cannot block it.
      const bytes = Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), value => value.charCodeAt(0));
      void createImageBitmap(new Blob([bytes], { type: 'image/png' })).then(image => {
        if (!active) { image.close(); return; }
        try {
          if (!image.width || !image.height) throw new Error('The captured image is empty.');
          const context = imageCanvas.getContext('2d', { willReadFrequently: true });
          const magnifier = zoom.getContext('2d');
          if (!context || !magnifier) throw new Error('Could not prepare the pixel picker.');
          imageCanvas.width = image.width;
          imageCanvas.height = image.height;
          context.drawImage(image, 0, 0);
          image.close();
          function pixel(clientX: number, clientY: number) {
            const bounds = imageCanvas.getBoundingClientRect();
            if (!bounds.width || !bounds.height) throw new Error('The capture viewport is unavailable.');
            const x = Math.max(0, Math.min(imageCanvas.width - 1, Math.floor((clientX - bounds.left) * imageCanvas.width / bounds.width)));
            const y = Math.max(0, Math.min(imageCanvas.height - 1, Math.floor((clientY - bounds.top) * imageCanvas.height / bounds.height)));
            const [r, g, b] = context!.getImageData(x, y, 1, 1).data;
            return { x, y, hex: '#' + [r, g, b].map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase() };
          }
          function preview(clientX: number, clientY: number) {
            if (!active || (!continuous && savingSingle)) return;
            try {
              const { x, y, hex } = pixel(clientX, clientY);
              const radius = 4;
              const cell = 14;
              const sx = Math.max(0, x - radius), sy = Math.max(0, y - radius);
              const sw = Math.min(imageCanvas.width, x + radius + 1) - sx;
              const sh = Math.min(imageCanvas.height, y + radius + 1) - sy;
              magnifier!.imageSmoothingEnabled = false;
              magnifier!.fillStyle = '#ddd';
              magnifier!.fillRect(0, 0, zoom.width, zoom.height);
              magnifier!.drawImage(imageCanvas, sx, sy, sw, sh, (sx - x + radius) * cell + 2, (sy - y + radius) * cell + 2, sw * cell, sh * cell);
              magnifier!.strokeStyle = '#fff';
              magnifier!.lineWidth = 3;
              magnifier!.strokeRect(radius * cell + 2, radius * cell + 2, cell, cell);
              magnifier!.strokeStyle = '#000';
              magnifier!.lineWidth = 1;
              magnifier!.strokeRect(radius * cell + 2, radius * cell + 2, cell, cell);
              hexLabel.textContent = hex;
              loupe.hidden = false;
              loupe.style.left = Math.max(0, Math.min(innerWidth - 148, clientX + 20 > innerWidth - 148 ? clientX - 168 : clientX + 20)) + 'px';
              loupe.style.top = Math.max(0, Math.min(innerHeight - 180, clientY + 20 > innerHeight - 180 ? clientY - 200 : clientY + 20)) + 'px';
            } catch { error.textContent = 'Could not preview this pixel. Stop and capture the page again.'; }
          }
          let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
          imageCanvas.addEventListener('pointermove', event => {
            pointer = { x: event.clientX, y: event.clientY };
            if (frame === null) frame = requestAnimationFrame(() => { frame = null; preview(pointer.x, pointer.y); });
          });
          imageCanvas.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            if (!active || (!continuous && savingSingle)) return;
            let hex: string;
            try { hex = pixel(event.clientX, event.clientY).hex; }
            catch { error.textContent = 'Could not read this pixel. Stop and capture the page again.'; return; }
            if (!continuous) {
              savingSingle = true;
              status.textContent = 'Saving ' + hex + '…';
            }
            // Serialize accepted clicks so rapid selections do not overwrite each other.
            saveQueue = saveQueue.then(async () => {
              const result = await chrome.storage.local.get({ colors: [] });
              const colors: unknown[] = Array.isArray(result.colors) ? result.colors : [];
              const valid = colors.filter((value): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)).map(value => value.toUpperCase());
              const next = [...new Set([hex, ...valid])].slice(0, 10);
              await chrome.storage.local.set({ colors: next });
              if (active) {
                if (!continuous) { stop(); return; }
                status.textContent = 'Saved ' + hex + ' · ' + next.length + '/10 recent colors. Keep clicking or press Esc.';
                error.textContent = '';
              }
            }).catch(() => {
              savingSingle = false;
              if (active) {
                error.textContent = 'Could not save the color. Click again to retry.';
                if (!continuous) status.textContent = 'Not saved. Click a pixel to retry or press Esc.';
              }
            });
          });
          document.documentElement.append(host);
          host.showModal();
          stopButton.focus({ preventScroll: true });
          preview(pointer.x, pointer.y);
          clearTimeout(loadTimeout);
          rejectLoad = undefined;
          resolve();
        } catch (reason) { image.close(); reject(reason); }
      }).catch(() => reject(new Error('Could not decode the captured image.')));
    });
  } catch (reason) {
    stop();
    throw reason;
  }
}
