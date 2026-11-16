type EyeDropperConstructor = new () => {
  open(): Promise<{ sRGBHex: string }>;
};

export const HISTORY_LIMIT = 10;

export function normalizeColors(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((color): color is string => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color))
    .map(color => color.toUpperCase()))].slice(0, HISTORY_LIMIT);
}

export async function readHistory(): Promise<string[]> {
  const { colors } = await chrome.storage.local.get({ colors: [] });
  const normalized = normalizeColors(colors);
  // Upgrade history from versions that retained 50 colors.
  if (JSON.stringify(colors) !== JSON.stringify(normalized)) {
    await chrome.storage.local.set({ colors: normalized });
  }
  return normalized;
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.set({ colors: [] });
}

export async function pickColor(): Promise<string | null> {
  const EyeDropper = (window as Window & { EyeDropper?: EyeDropperConstructor }).EyeDropper;
  if (!EyeDropper) {
    throw new Error('Color picking requires a browser with EyeDropper support, such as Chrome or Edge.');
  }

  let hex: string;
  try {
    // Open before any await so the button's user activation is preserved.
    hex = (await new EyeDropper().open()).sRGBHex.toUpperCase();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null;
    throw error;
  }

  const colors = await readHistory();
  await chrome.storage.local.set({
    colors: [hex, ...colors.filter(color => color !== hex)].slice(0, HISTORY_LIMIT),
  });
  return hex;
}
