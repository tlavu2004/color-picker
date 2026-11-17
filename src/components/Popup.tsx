import React, { useEffect, useState } from 'react';
import '../styles/popup.css';
import { pickColor } from '../services/pickColor';
import { ColorResult } from './ColorResult';
import { startContinuousSelection } from '../services/continuousSelection';

const Popup: React.FC = () => {
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [continuous, setContinuous] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    let active = true;
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

  const handlePickColor = async () => {
    setCopied(false);
    setError('');
    setPicking(true);
    try {
      if (continuous) {
        await startContinuousSelection();
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
        <input className="switch-input" type="checkbox" role="switch" checked={continuous} disabled={picking || copying} onChange={event => setContinuous(event.target.checked)} />
        <span className="switch-track" aria-hidden="true" />
        <span>Continuous selection</span>
      </label>
      {continuous && <p className="continuous-note">Freezes the visible tab with a magnifier. Click to save colors; Esc or Stop returns to the page.</p>}
      <button onClick={handlePickColor} disabled={picking}>
        {picking ? 'Picking…' : continuous ? 'Start continuous selection' : 'Pick Color'}
      </button>
      {error && <p role="alert">{error}</p>}

      {color && (
        <ColorResult color={color} copying={copying} copied={copied} onCopy={handleCopy} />
      )}
    </div>
  );
};

export default Popup;
