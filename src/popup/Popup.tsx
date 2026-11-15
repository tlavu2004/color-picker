import React, { useEffect, useState } from 'react';
import './popup.css';

const Popup: React.FC = () => {
  const [color, setColor] = useState<string | null>(null);

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
    });
    return () => {
      active = false;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  const handlePickColor = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js'],
        }).catch((error) => {
          console.error('Error injecting script:', error);
        });
      }
    });
  };

  const handleCopy = () => {
    if (color) navigator.clipboard.writeText(color);
  };

  return (
    <div className="popup-container">
      <h2>Color Picker</h2>
      <button onClick={handlePickColor}>Pick Color</button>

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
