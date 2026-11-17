import React, { useEffect, useRef, useState } from 'react';
import '../styles/popup.css';
import { pickColor } from '../services/pickColor';
import { ColorResult } from './ColorResult';
import { startTabSelection } from '../services/tabSelection';

const Popup: React.FC = () => {
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const modeTouched = useRef(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    let active = true;
    if (typeof chrome.storage.session?.get === 'function') {
      void chrome.storage.session.get({ pickerPopupMode: false }).then(result => {
        if (active && !modeTouched.current) setContinuous(result.pickerPopupMode === true);
      }).catch(() => {});
    }
    if (typeof chrome.runtime?.sendMessage === 'function') {
      void chrome.runtime.sendMessage({ type: 'PICKER_POPUP_OPENED' }).catch(() => {});
    }
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes.colors) {
        setCopied(false);
        setColor(changes.colors.newValue?.[0] ?? null);
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    void chrome.storage.local.get({ colors: [] }).then(({ colors }) => {
      if (active) setColor(colors[0] ?? null);
    }).catch(() => {
      if (active) setError('Could not load saved colors. Please try again.');
    });
    return () => {
      active = false;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  const handlePickColor = async (native = false) => {
    setCopied(false);
    setError('');
    setPicking(true);
    try {
      if (!native) {
        await startTabSelection(continuous);
        window.close();
        return;
      }
      const selected = await pickColor();
      if (selected) {
        setColor(selected);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not pick or save the color.');
    } finally {
      setPicking(false);
    }
  };

  const handleCopy = async () => {
    if (!color || copying || copied) return;
    setCopying(true);
    setError('');
    try {
      await navigator.clipboard.writeText(color);
      setCopied(true);
    } catch {
      setError('Could not copy the color. Please try again.');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="popup-container">
      <h2>Color Picker</h2>
      <label className="continuous-setting">
        <input className="switch-input" type="checkbox" role="switch" checked={continuous} disabled={picking || copying} onChange={event => { modeTouched.current = true; setContinuous(event.target.checked); }} />
        <span className="switch-track" aria-hidden="true" />
        <span>Continuous selection</span>
      </label>
      <p className="continuous-note">{continuous
        ? 'Frozen tab view. Keep selecting colors until Esc or Stop.'
        : 'Frozen tab view. Select one color to save and finish.'}</p>
      <button onClick={() => void handlePickColor()} disabled={picking || copying}>
        {picking ? 'Picking…' : continuous ? 'Start continuous selection' : 'Pick Color'}
      </button>
      <details className="advanced-options">
        <summary>Advanced</summary>
        <p className="continuous-note">Native picking keeps this popup open and may cover part of the screen. Use Pick Color above for an unobstructed tab view.</p>
        <button className="native-picker-button" onClick={() => void handlePickColor(true)} disabled={picking || copying}>
          Native screen picker
        </button>
      </details>
      {error && <p role="alert">{error}</p>}

      {color && (
        <ColorResult color={color} copying={copying} copied={copied} onCopy={handleCopy} />
      )}
    </div>
  );
};

export default Popup;
