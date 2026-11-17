import { useEffect, useState } from 'react';
import { messages, parsePreference, resolveLanguage } from './messages';
import type { LanguagePreference } from './messages';

export function useLanguage() {
  const [preference, setPreference] = useState<LanguagePreference>('auto');
  const [browserLanguage, setBrowserLanguage] = useState(navigator.language);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<'languageError' | 'languageLoadError' | null>(null);
  const language = resolveLanguage(preference, browserLanguage);

  useEffect(() => {
    let active = true;
    let changed = false;
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes.language) {
        changed = true;
        setPreference(parsePreference(changes.language.newValue));
      }
    };
    const onLanguageChange = () => setBrowserLanguage(navigator.language);
    chrome.storage.onChanged.addListener(onChanged);
    window.addEventListener('languagechange', onLanguageChange);
    void chrome.storage.local.get({ language: 'auto' }).then(({ language }) => {
      if (active && !changed) setPreference(parsePreference(language));
    }).catch(() => { if (active) setProblem('languageLoadError'); });
    return () => {
      active = false;
      chrome.storage.onChanged.removeListener(onChanged);
      window.removeEventListener('languagechange', onLanguageChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = messages[language].title;
  }, [language]);

  const changeLanguage = async (value: string) => {
    setSaving(true);
    setProblem(null);
    const next = parsePreference(value);
    try {
      await chrome.storage.local.set({ language: next });
      setPreference(next);
    } catch {
      setProblem('languageError');
    } finally {
      setSaving(false);
    }
  };
  return { language, text: messages[language], preference, changeLanguage, saving, problem };
}
