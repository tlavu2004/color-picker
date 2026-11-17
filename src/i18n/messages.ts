export type Language = 'en' | 'vi';
export type LanguagePreference = 'auto' | Language;

export const messages = {
  en: {
    title: 'Color Picker', pick: 'Pick Color', picking: 'Picking…', copy: 'Copy', copied: 'Copied!',
    language: 'Language', auto: 'Auto', loadError: 'Could not load saved colors. Please try again.',
    pickError: 'Could not pick or save the color. Please try again.',
    copyError: 'Could not copy the color. Please try again.',
    unsupported: 'Color picking requires a browser with EyeDropper support, such as Chrome or Edge.',
    languageError: 'Could not save the language setting. Please try again.',
    languageLoadError: 'Could not load the language setting. Using browser language.',
  },
  vi: {
    title: 'Color Picker', pick: 'Chọn màu', picking: 'Đang chọn…', copy: 'Sao chép', copied: 'Đã chép!',
    language: 'Ngôn ngữ', auto: 'Tự động', loadError: 'Không thể tải màu đã lưu. Vui lòng thử lại.',
    pickError: 'Không thể chọn hoặc lưu màu. Vui lòng thử lại.',
    copyError: 'Không thể sao chép màu. Vui lòng thử lại.',
    unsupported: 'Cần trình duyệt hỗ trợ EyeDropper, chẳng hạn Chrome hoặc Edge, để chọn màu.',
    languageError: 'Không thể lưu ngôn ngữ. Vui lòng thử lại.',
    languageLoadError: 'Không thể tải ngôn ngữ đã lưu. Đang dùng ngôn ngữ trình duyệt.',
  },
} satisfies Record<Language, Record<string, string>>;

export type MessageKey = keyof typeof messages.en;

export function parsePreference(value: unknown): LanguagePreference {
  return value === 'en' || value === 'vi' ? value : 'auto';
}

export function resolveLanguage(preference: LanguagePreference, browserLanguage: string): Language {
  return preference === 'auto' ? (browserLanguage.toLowerCase().split('-')[0] === 'vi' ? 'vi' : 'en') : preference;
}
