# Kiến trúc Color Picker

Tài liệu này thay thế `color-picker-extension.txt`, phản ánh cấu trúc sau đợt sửa lỗi và dọn mã nguồn.

## Công nghệ

- **Chrome Manifest V3**: khai báo extension, icon, popup và quyền.
- **React 19 + TypeScript**: giao diện popup và logic ứng dụng.
- **Vite 7**: dev server, biên dịch và đóng gói; không phải runtime nền của extension.
- **EyeDropper API**: trình duyệt mở công cụ chọn pixel và trả màu sRGB HEX.
- **Chrome Storage API**: lưu lịch sử màu trên máy người dùng.
- **Clipboard API**: chỉ ghi vào clipboard khi người dùng bấm Copy.

Không có background service worker hay content script ở phiên bản hiện tại. Những thành phần này trong bản phác thảo `.txt` cũ đã bị loại bỏ khi chuyển sang EyeDropper native.

## Cấu trúc mã nguồn

```text
color-picker-extension/
├── public/
│   ├── manifest.json
│   └── icons/                    # Icon dùng bởi manifest
├── src/
│   ├── index.html                # HTML entry của popup
│   ├── main.tsx                  # Mount React, bật StrictMode
│   ├── components/
│   │   ├── Popup.tsx             # Điều phối trạng thái và tương tác
│   │   └── ColorResult.tsx       # Ô màu, HEX và nút Copy/Copied!
│   ├── styles/
│   │   └── popup.css             # Style của popup
│   └── services/
│       └── pickColor.ts          # Mở EyeDropper và lưu lịch sử
├── tests/
│   └── pickColor.test.mjs         # Kiểm thử logic chọn/lưu bằng mock
├── docs/
│   ├── ARCHITECTURE.md
│   ├── FEATURES.md
│   └── BACKLOG.md                # Điều tra và đề xuất phát triển
├── README.md                     # Cài đặt, build và kiểm tra thủ công
├── vite.config.ts
├── tsconfig*.json
└── package.json
```

Ứng dụng hiện chỉ có một entry popup, nên `index.html` và `main.tsx` nằm trực tiếp trong `src/`, không thêm tầng `popup/`. Mã được chia theo vai trò: component trong `components/`, style trong `styles/`, logic chọn/lưu trong `services/`. Chưa tạo thư mục cho tính năng chưa tồn tại. `Popup.tsx` hiện vẫn quản lý storage subscription, clipboard và trạng thái UI vì phạm vi còn nhỏ.

## Luồng hoạt động

1. Manifest mở `src/index.html` từ gói extension.
2. `main.tsx` mount `Popup`. Popup đăng ký thay đổi storage và đọc màu gần nhất.
3. Bấm Pick Color gọi `pickColor()`; EyeDropper được mở trước bất kỳ `await` nào để giữ user activation.
4. Chọn một pixel: nhận HEX, chuyển chữ hoa, đọc lịch sử và lưu màu mới lên đầu. Màu trùng được loại bỏ; giữ tối đa 50 màu.
5. Popup hiển thị màu vừa lưu. Mở lại popup đọc phần tử đầu tiên của lịch sử.
6. Bấm Copy ghi HEX vào clipboard. Trong lúc ghi, nút bị khóa. Thành công thì nút hiện Copied! và khóa 2 giây; sau đó trở lại Copy. Không có thông báo Copied! riêng.
7. Bắt đầu lượt chọn mới hoặc storage thay đổi sẽ xóa trạng thái xác nhận copy. Hủy bằng Esc không ghi màu và không thay đổi clipboard.

Lỗi EyeDropper, storage và clipboard được hiển thị trong popup. Storage listener và timer xác nhận copy được dọn khi component unmount. Lịch sử hiện chỉ có UI cho màu mới nhất, chưa có lưới lịch sử.

## Dữ liệu và quyền

`chrome.storage.local` lưu khóa `colors: string[]`, ví dụ `['#AABBCC', '#123456']`. Thứ tự mới nhất trước, tối đa 50 màu khác nhau; dữ liệu không được đồng bộ qua tài khoản hoặc gửi tới server.

Manifest chỉ yêu cầu quyền `storage`. Không cần quyền website, `activeTab`, `scripting` hoặc chụp tab cho kiến trúc hiện tại. Chế độ chụp ảnh để chọn chính xác, nếu được triển khai sau, cần đánh giá lại quyền và phạm vi dữ liệu.

## Build và kiểm thử

`npm run build` chạy TypeScript rồi Vite. Vite lấy `src/index.html` làm entry, xuất vào `dist/` và sao chép `public/`. Manifest trong `dist/` trỏ tới HTML entry tương ứng. Cài bằng Load unpacked thư mục `dist`, không phải `src`.

`npm run dev` phục vụ giao diện tại `/src/index.html`; trang dev không thay thế môi trường extension có Chrome Storage API.

`npm test` dùng Node test runner, biên dịch module TypeScript trong bộ kiểm thử rồi thực thi trong VM có mock EyeDropper/storage. Hiện có 6 test logic. `npm run lint` kiểm tra mã TS/TSX. Chưa có CI, coverage hoặc test tích hợp popup; các phần đó thuộc PR sau.

## Giới hạn

- Cần trình duyệt desktop hỗ trợ EyeDropper; UI báo lỗi nếu thiếu API.
- Một lượt mở chọn một màu; chưa có chế độ liên tục.
- Browser quản lý con trỏ/kính lúp; extension không nhận tọa độ hay sự kiện di chuột trong phiên native.
- Kết quả là sRGB HEX của pixel hiển thị, không phải giá trị CSS hay pixel gốc trước zoom/compositing.
- Test mock không chứng minh hành vi native; phải kiểm tra trực tiếp trong Chrome/Edge.

Chi tiết điều tra DPI/scaling: [backlog](BACKLOG.md). Trạng thái sản phẩm: [chức năng](FEATURES.md).

Tham khảo: [đặc tả EyeDropper](https://wicg.github.io/eyedropper-api/).
