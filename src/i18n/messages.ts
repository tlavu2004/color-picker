export type Language = 'en' | 'vi';
export type LanguagePreference = 'auto' | Language;

export const messages = {
  en: {
    continuous: 'Continuous selection', startContinuous: 'Start continuous selection',
    continuousNote: 'Frozen tab view. Keep selecting colors until Esc or Stop.',
    singleNote: 'Frozen tab view. Select one color to save and finish.',
    advanced: 'Advanced', nativePicker: 'Native screen picker',
    nativeNote: 'Native picking keeps this popup open and may cover part of the screen. Use Pick Color above for an unobstructed tab view.',
    recent: 'Recent colors', clear: 'Clear history', emptyHistory: 'Pick a color to start your history.', selectColor: 'Select',
    clearError: 'Could not clear history. Please try again.',
    scriptingError: 'Tab selection needs the scripting permission. Open chrome://extensions (or edge://extensions), reload Color Picker, then close and reopen this popup.',
    restrictedError: 'Tab selection works on ordinary HTTP/HTTPS pages. Use the native picker on restricted browser pages.',
    tabChangedError: 'The active tab changed during capture. Start selection again.',
    title: 'Color Picker', pick: 'Pick Color', picking: 'Picking…', copy: 'Copy', copied: 'Copied!',
    language: 'Language', auto: 'Auto', loadError: 'Could not load saved colors. Please try again.',
    pickError: 'Could not pick or save the color. Please try again.',
    copyError: 'Could not copy the color. Please try again.',
    unsupported: 'Color picking requires a browser with EyeDropper support, such as Chrome or Edge.',
    languageError: 'Could not save the language setting. Please try again.',
    languageLoadError: 'Could not load the language setting. Using browser language.',
  },
  vi: {
    continuous: 'Chọn liên tục', startContinuous: 'Bắt đầu chọn liên tục',
    continuousNote: 'Ảnh chụp tab cố định. Chọn nhiều màu đến khi nhấn Esc hoặc Dừng.',
    singleNote: 'Ảnh chụp tab cố định. Chọn một màu để lưu và kết thúc.',
    advanced: 'Nâng cao', nativePicker: 'Chọn màu màn hình',
    nativeNote: 'Bộ chọn của trình duyệt giữ popup mở và có thể che một phần màn hình. Dùng Chọn màu phía trên để xem tab không bị che.',
    recent: 'Màu gần đây', clear: 'Xóa lịch sử', emptyHistory: 'Chọn một màu để bắt đầu lịch sử.', selectColor: 'Chọn',
    clearError: 'Không thể xóa lịch sử. Vui lòng thử lại.',
    scriptingError: 'Chọn màu trên tab cần quyền scripting. Mở chrome://extensions (hoặc edge://extensions), tải lại Color Picker, rồi đóng và mở lại popup.',
    restrictedError: 'Chọn màu trên tab chỉ hỗ trợ trang HTTP/HTTPS thông thường. Dùng bộ chọn màn hình trên trang bị trình duyệt hạn chế.',
    tabChangedError: 'Tab đang hoạt động đã thay đổi khi chụp. Hãy bắt đầu chọn lại.',
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
