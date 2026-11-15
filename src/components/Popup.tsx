import React, { useEffect, useState } from 'react';
import '../styles/popup.css';
import { clearHistory, normalizeColors, pickColor, readHistory } from '../services/pickColor';
import { ColorResult } from './ColorResult';
import { ColorHistory } from './ColorHistory';

const Popup: React.FC = () => {
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [clearing, setClearing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    let active = true;
    let storageChanged = false;
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes.colors) {
        storageChanged = true;
        const nextColors = normalizeColors(changes.colors.newValue);
        setCopied(false);
        setColors(nextColors);
        setColor(nextColors[0] ?? null);
      }
    };
    chrome.storage.onChanged.addListener(onChanged);
    void readHistory().then((history) => {
      if (active && !storageChanged) {
        setColors(history);
        setColor(history[0] ?? null);
      }
    }).catch(() => {
      if (active) setError('Could not load saved colors. Please try again.');
    }).finally(() => {
      if (active) setLoading(false);
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

  const handleClearHistory = async () => {
    setClearing(true);
    setError('');
    try {
      await clearHistory();
      setColors([]);
      setColor(null);
      setCopied(false);
    } catch {
      setError('Could not clear history. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const handleSelectColor = (selected: string) => {
    setCopied(false);
    setError('');
    setColor(selected);
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
      <button onClick={handlePickColor} disabled={loading || picking || copying || clearing}>
        {picking ? 'Picking…' : 'Pick Color'}
      </button>
      {error && <p role="alert">{error}</p>}

      {color && (
        <ColorResult color={color} copying={copying} copied={copied} onCopy={handleCopy} />
      )}
      <ColorHistory colors={colors} selected={color} disabled={loading || picking || copying || clearing} onSelect={handleSelectColor} onClear={handleClearHistory} />
    </div>
  );
};

export default Popup;
