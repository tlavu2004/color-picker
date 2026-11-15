type EyeDropperConstructor = new () => {
  open(): Promise<{ sRGBHex: string }>;
};

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

  const { colors } = await chrome.storage.local.get({ colors: [] });
  await chrome.storage.local.set({
    colors: [hex, ...(colors as string[]).filter(color => color !== hex)].slice(0, 50),
  });
  return hex;
}
