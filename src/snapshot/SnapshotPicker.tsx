import { useCallback, useEffect, useRef, useState } from 'react';
import { readHistory, saveColor } from '../services/pickColor';
import { refreshSnapshot, takeSnapshot } from '../services/snapshot';
import type { Snapshot } from '../services/snapshot';
import { pixelHex, pixelPosition } from './pixels';

export function SnapshotPicker() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const busyRef = useRef(false);
  const stoppedRef = useRef(false);
  const mounted = useRef(true);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    setStopped(true);
    setReady(false);
    setSnapshot(null);
    const image = canvas.current;
    if (image) { image.width = 0; image.height = 0; }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const id = new URLSearchParams(window.location.search).get('session') || '';
    void takeSnapshot(id).then(image => {
      if (mounted.current && !stoppedRef.current) setSnapshot(image);
    }).catch(reason => { if (mounted.current) setError(reason instanceof Error ? reason.message : 'Could not load snapshot.'); });
    void readHistory().then(history => { if (mounted.current) setColors(history); })
      .catch(() => { if (mounted.current) setError('Could not load color history.'); });
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') stop(); };
    window.addEventListener('keydown', onKeyDown);
    return () => { mounted.current = false; window.removeEventListener('keydown', onKeyDown); };
  }, [stop]);

  useEffect(() => {
    if (!snapshot) return;
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active || !canvas.current) return;
      const target = canvas.current;
      const context = target.getContext('2d', { willReadFrequently: true });
      if (!context) { setError('Your browser could not prepare the snapshot.'); return; }
      try {
        if (!image.naturalWidth || !image.naturalHeight) throw new Error('The snapshot image is empty.');
        target.width = image.naturalWidth;
        target.height = image.naturalHeight;
        context.drawImage(image, 0, 0);
        setReady(true);
      } catch {
        setError('Could not draw the snapshot. Refresh it or start a new session.');
      }
    };
    image.onerror = () => { if (active) setError('Could not decode the snapshot.'); };
    image.src = snapshot.image;
    return () => { active = false; image.onload = null; image.onerror = null; };
  }, [snapshot]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const pick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ready || stoppedRef.current || busyRef.current || !canvas.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const image = canvas.current;
      const { x, y } = pixelPosition(event.clientX, event.clientY, image.getBoundingClientRect(), image.width, image.height);
      const context = image.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Could not read the selected pixel.');
      const [red, green, blue] = context.getImageData(x, y, 1, 1).data;
      const hex = pixelHex(red, green, blue);
      const next = await saveColor(hex);
      if (mounted.current) { setColors(next); setSelected(hex); }
    } catch (reason) {
      if (mounted.current) setError(reason instanceof Error ? reason.message : 'Could not save this color.');
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const refresh = async () => {
    if (!snapshot || busyRef.current || stoppedRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setReady(false);
    try {
      const next = await refreshSnapshot(snapshot);
      if (mounted.current && !stoppedRef.current) setSnapshot(next);
    } catch (reason) {
      if (mounted.current && !stoppedRef.current) {
        setError(reason instanceof Error ? reason.message : 'Could not refresh snapshot.');
        setReady(true);
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const copy = async () => {
    if (!selected || busyRef.current || copied) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await navigator.clipboard.writeText(selected);
      if (mounted.current) setCopied(true);
    } catch {
      if (mounted.current) setError('Could not copy the color. Please try again.');
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <main>
      <header>
        <h1>Continuous selection from tab snapshot</h1>
        <p>This is a frozen image of the visible tab. Click several pixels to save colors. Press Esc or Stop to end selection.</p>
        {snapshot && <p>Source: {snapshot.title} · Captured {new Date(snapshot.capturedAt).toLocaleTimeString()}</p>}
        <button onClick={() => void refresh()} disabled={!snapshot || busy || stopped}>Refresh snapshot</button>
        <button onClick={stop} disabled={stopped}>Stop</button>
        <button onClick={() => window.close()}>Close window</button>
        {selected && <div className="snapshot-result">
          <span className="selected-swatch" style={{ backgroundColor: selected }} />
          <strong>{selected}</strong>
          <button onClick={() => void copy()} disabled={busy || copied}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>}
        <p role="status">{stopped ? 'Selection stopped. Saved colors remain available. Close this window and start a new session from the popup.' : busy ? 'Working…' : ready ? 'Ready. Click any pixel in the image.' : 'Loading snapshot…'}</p>
        {error && <p role="alert">{error}</p>}
        <div className="snapshot-history" aria-label="Recent colors">
          {colors.map(color => <button key={color} style={{ backgroundColor: color }} aria-label={`View ${color}`} title={color} disabled={busy} onClick={() => { setSelected(color); setCopied(false); }}>{color}</button>)}
        </div>
      </header>
      {!stopped && <canvas ref={canvas} aria-label="Captured tab image" onClick={event => void pick(event)} aria-busy={busy || !ready} />}
    </main>
  );
}
