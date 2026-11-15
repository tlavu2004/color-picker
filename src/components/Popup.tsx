import React, { useEffect, useState } from 'react';
import '../styles/popup.css';
import { pickColor } from '../services/pickColor';
import { ColorResult } from './ColorResult';
import { useLanguage } from '../i18n/useLanguage';
import type { MessageKey } from '../i18n/messages';

const Popup: React.FC = () => {
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  const { text, preference, changeLanguage, saving, problem } = useLanguage();
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

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
      if (active) setError('loadError');
    });
    return () => {
      active = false;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  const handlePickColor = async () => {
    setCopied(false);
    setError(null);
    setPicking(true);
    try {
      const selected = await pickColor();
      if (selected) {
        setColor(selected);
      }
    } catch (error) {
      setError(error instanceof Error && error.message.includes('EyeDropper support') ? 'unsupported' : 'pickError');
    } finally {
      setPicking(false);
    }
  };

  const handleCopy = async () => {
    if (!color || copying || copied) return;
    setCopying(true);
    setError(null);
    try {
      await navigator.clipboard.writeText(color);
      setCopied(true);
    } catch {
      setError('copyError');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="popup-container">
      <h2>{text.title}</h2>
      <label className="language-setting">
        <span>{text.language}</span>
        <select value={preference} disabled={saving || picking || copying} onChange={event => void changeLanguage(event.target.value)}>
          <option value="auto">{text.auto}</option>
          <option value="en">English</option>
          <option value="vi">Tiếng Việt</option>
        </select>
      </label>
      <button onClick={handlePickColor} disabled={picking}>
        {picking ? text.picking : text.pick}
      </button>
      {(error || problem) && <p role="alert">{text[(error || problem)!]}</p>}

      {color && (
        <ColorResult color={color} copying={copying} copied={copied} onCopy={handleCopy} copyLabel={text.copy} copiedLabel={text.copied} />
      )}
    </div>
  );
};

export default Popup;
