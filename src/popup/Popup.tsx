import React, { useEffect, useState } from 'react';
import './popup.css';
import { pickColor } from './pickColor';

const Popup: React.FC = () => {
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    let active = true;
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes.colors) {
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
    setError('');
    setPicking(true);
    try {
      const selected = await pickColor();
      if (selected) {
        setColor(selected);
        try {
          await navigator.clipboard.writeText(selected);
        } catch {
          setError('Color saved. Use Copy to copy it to the clipboard.');
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not pick or save the color.');
    } finally {
      setPicking(false);
    }
  };

  const handleCopy = async () => {
    if (!color) return;
    setError('');
    try {
      await navigator.clipboard.writeText(color);
    } catch {
      setError('Could not copy the color. Please try again.');
    }
  };

  return (
    <div className="popup-container">
      <h2>Color Picker</h2>
      <button onClick={handlePickColor} disabled={picking}>
        {picking ? 'Picking…' : 'Pick Color'}
      </button>
      {error && <p role="alert">{error}</p>}

      {color && (
        <div className="color-result">
          <div className="color-box" style={{ backgroundColor: color }} />
          <span>{color}</span>
          <button onClick={handleCopy}>Copy</button>
        </div>
      )}
    </div>
  );
};

export default Popup;
