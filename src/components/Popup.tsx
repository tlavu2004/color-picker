import React, { useEffect, useRef, useState } from 'react';
import '../styles/popup.css';
import { clearHistory, normalizeColors, pickColor, readHistory } from '../services/pickColor';
import { ColorResult } from './ColorResult';
import { startTabSelection } from '../services/tabSelection';
import { ColorHistory } from './ColorHistory';
import { useLanguage } from '../i18n/useLanguage';

const Popup: React.FC = () => {
  const { language, text, preference, changeLanguage, saving, problem } = useLanguage();
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const modeTouched = useRef(false);
  const [colors, setColors] = useState<string[]>([]);
  const [clearing, setClearing] = useState(false);
  const [loading, setLoading] = useState(true);
  const busy = loading || picking || copying || clearing || saving;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 2000);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    let active = true;

    if (typeof chrome.storage.session?.get === 'function') {
      void chrome.storage.session.get({ pickerPopupMode: false }).then(result => {
        if (active && !modeTouched.current) setContinuous(result.pickerPopupMode === true);
      }).catch(() => { });
    }
    if (typeof chrome.runtime?.sendMessage === 'function') {
      void chrome.runtime.sendMessage({ type: 'PICKER_POPUP_OPENED' }).catch(() => { });
    }

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
      if (active) setError(text.loadError);
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, [text.loadError]);

  const handlePickColor = async (native = false) => {
    if (busy) return;
    setCopied(false);
    setError('');
    setPicking(true);

    try {
      if (!native) {
        await startTabSelection(continuous, language);
        window.close();
        return;
      }

      const selected = await pickColor();

      if (selected) {
        setColor(selected);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message.includes('scripting permission') ? text.scriptingError : error.message.includes('HTTP/HTTPS') ? text.restrictedError : error.message.includes('active tab changed') ? text.tabChangedError : error.message.includes('EyeDropper support') ? text.unsupported : text.pickError
          : text.pickError
      );
    } finally {
      setPicking(false);
    }
  };

  const handleClearHistory = async () => {
    if (busy) return;
    setClearing(true);
    setError('');

    try {
      await clearHistory();
      setColors([]);
      setColor(null);
      setCopied(false);
    } catch {
      setError(text.clearError);
    } finally {
      setClearing(false);
    }
  };

  const handleSelectColor = (selected: string) => {
    if (busy) return;
    setCopied(false);
    setError('');
    setColor(selected);
  };

  const handleCopy = async () => {
    if (!color || copying || copied || picking || clearing || loading) return;
    setCopying(true);
    setError('');
    try {
      await navigator.clipboard.writeText(color);
      setCopied(true);
    } catch {
      setError(text.copyError);
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="popup-container">
      <h2>{text.title}</h2>
      <label className="language-setting">
        <span>{text.language}</span>
        <select value={preference} disabled={busy} onChange={event => void changeLanguage(event.target.value)}>
          <option value="auto">{text.auto}</option>
          <option value="en">English</option>
          <option value="vi">Tiếng Việt</option>
        </select>
      </label>
      <label className="continuous-setting">
        <input
          className="switch-input"
          type="checkbox"
          role="switch"
          checked={continuous}
          disabled={busy}
          onChange={event => {
            modeTouched.current = true;
            setContinuous(event.target.checked);
          }}
        />
        <span className="switch-track" aria-hidden="true" />
        <span>{text.continuous}</span>
      </label>
      <p className="continuous-note">{continuous
        ? text.continuousNote
        : text.singleNote}</p>
      <button onClick={() => void handlePickColor()} disabled={busy}>
        {picking ? text.picking : continuous ? text.startContinuous : text.pick}
      </button>
      <details className="advanced-options">
        <summary>{text.advanced}</summary>
        <p className="continuous-note">{text.nativeNote}</p>
        <button className="native-picker-button" onClick={() => void handlePickColor(true)} disabled={busy}>
          {text.nativePicker}
        </button>
      </details>
      {(error || problem) && <p role="alert">{error || (problem && text[problem])}</p>}

      {color && (
        <ColorResult color={color} copying={copying} copied={copied} disabled={picking || clearing || loading} onCopy={handleCopy} copyLabel={text.copy} copiedLabel={text.copied} />
      )}
      <ColorHistory text={text} colors={colors} selected={color} disabled={busy} onSelect={handleSelectColor} onClear={handleClearHistory} />
    </div>
  );
};

export default Popup;
