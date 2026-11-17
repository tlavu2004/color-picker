import type { Language } from './messages';

// Plain strings are passed into the serialized picker; injected code cannot import dictionaries.
const vi: Record<string, string> = {
  'Continuous color selection': 'Chọn màu liên tục',
  'Single color selection': 'Chọn một màu',
  'Frozen tab image': 'Ảnh chụp tab cố định',
  'Frozen view · Click to save colors · Esc or Stop to return to the page': 'Ảnh cố định · Nhấp để lưu màu · Esc hoặc Dừng để trở về trang',
  'Frozen view · Click one pixel to save and finish · Esc or Stop cancels': 'Ảnh cố định · Chọn một pixel để lưu và kết thúc · Esc hoặc Dừng để hủy',
  'Ready. Copy saved colors from the extension popup after finishing.': 'Sẵn sàng. Sao chép màu từ popup sau khi kết thúc.',
  'Stop': 'Dừng', 'Move to next corner': 'Chuyển sang góc tiếp theo',
  'Saving {hex}…': 'Đang lưu {hex}…',
  'Saved {hex} · {count}/10 recent colors. Keep clicking or press Esc.': 'Đã lưu {hex} · {count}/10 màu gần đây. Chọn tiếp hoặc nhấn Esc.',
  'Could not save the color. Click again to retry.': 'Không thể lưu màu. Nhấp lại để thử lại.',
  'Not saved. Click a pixel to retry or press Esc.': 'Chưa lưu. Chọn pixel để thử lại hoặc nhấn Esc.',
  'Could not preview this pixel. Stop and capture the page again.': 'Không thể xem trước pixel. Dừng và chụp lại trang.',
  'Could not read this pixel. Stop and capture the page again.': 'Không thể đọc pixel. Dừng và chụp lại trang.',
  'The viewport changed during capture. Start selection again.': 'Khung nhìn đã thay đổi khi chụp. Hãy bắt đầu chọn lại.',
  'Reset pinch zoom before starting continuous selection.': 'Đặt lại mức thu phóng bằng cử chỉ trước khi chọn màu.',
  'Invalid capture image.': 'Ảnh chụp không hợp lệ.',
  'Selection cancelled before the image was ready.': 'Đã hủy chọn trước khi ảnh sẵn sàng.',
  'The captured image is empty.': 'Ảnh chụp trống.',
  'Could not prepare the pixel picker.': 'Không thể chuẩn bị bộ chọn pixel.',
  'The capture viewport is unavailable.': 'Khung nhìn ảnh chụp không khả dụng.',
  'Could not decode the captured image.': 'Không thể giải mã ảnh chụp.',
};

export const overlayTranslations: Record<Language, Record<string, string>> = { en: {}, vi };
