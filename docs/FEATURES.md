# Chức năng và kế hoạch

Tài liệu phân biệt chức năng đã có với các đề xuất chưa triển khai. Không coi mục dự kiến là cam kết phát hành.

## Đã có

| Chức năng | Hành vi hiện tại |
| --- | --- |
| Chọn màu pixel | Bấm Pick Color để mở EyeDropper native; chọn được màu hiển thị từ ảnh, gradient và vùng có compositing |
| Một màu mỗi lượt | Chọn xong thì kết thúc; bấm lại để chọn tiếp |
| Hủy chọn | Esc thoát phiên, giữ màu đã lưu và clipboard |
| Hiển thị kết quả | Ô màu và mã sRGB HEX chữ hoa |
| Lưu trên máy | Tối đa 50 màu khác nhau, mới nhất trước; chọn lại màu cũ đưa lên đầu |
| Khôi phục popup | Đóng/mở lại hiển thị màu gần nhất; cập nhật theo storage |
| Copy chủ động | Chỉ ghi clipboard khi bấm Copy |
| Xác nhận copy | Nút chuyển sang Copied!, khóa 2 giây; khóa cả khi đang ghi clipboard; chiều rộng cố định |
| Báo lỗi | Báo lỗi chọn/lưu/copy hoặc thiếu EyeDropper, cho phép thử lại |
| Không can thiệp trang | Không tự bật picker, không inject script/style, không yêu cầu quyền truy cập website |

Chưa có giao diện xem 50 màu đã lưu. Con số 50 là giới hạn storage hiện tại, không phải số ô đang hiển thị.

## Dự kiến ở PR tính năng tiếp theo

### Giao diện lịch sử màu

- Lưới màu gần nhất, đề xuất 10 màu hiển thị. Đề xuất 12 trước đó chỉ nhằm xếp lưới 4 × 3, không có yêu cầu nghiệp vụ bắt buộc.
- Màu mới nhất đứng đầu, không tạo bản trùng khi chọn lại.
- Bấm một ô để xem HEX; Copy vẫn là thao tác riêng, không tự ghi clipboard.
- Có thao tác xóa lịch sử.
- Khi triển khai cần chốt giữ 50 màu trong storage và chỉ hiển thị 10, hay giảm cả giới hạn lưu. Chưa thay đổi dữ liệu hiện tại.

### Toggle chọn liên tục — cần kiểm chứng khả thi

- Đề xuất toggle mặc định tắt.
- Mong muốn: khi bật, chọn nhiều màu trong cùng phiên; Esc kết thúc.
- Cần thử yêu cầu user activation của EyeDropper trước khi hứa tự mở lại sau mỗi lần chọn.
- Nếu native không hỗ trợ luồng mong muốn, đánh giá phương án khác và trao đổi trước khi triển khai. Có thể tách thành PR riêng.

Không có tính năng mới nào trong hai mục trên đã được triển khai ở nhánh sửa lỗi hiện tại.

## Dự kiến ở PR kiểm thử và CI riêng

- Thêm test popup: khôi phục màu, cập nhật storage và tương tác chọn/hủy.
- Thêm test clipboard: thành công, thất bại, khóa nút, xác nhận 2 giây và reset khi đổi màu.
- Điều chỉnh cách chạy test để coverage ánh xạ đúng về source TypeScript, thay vì chỉ dựa vào module chạy trong VM.
- Báo cáo coverage trước; chưa áp ngưỡng bắt buộc hoặc dùng phần trăm thay cho kiểm tra hành vi.
- GitHub Actions chạy build, lint và test; thống nhất cấu hình coverage trong PR đó.
- Duy trì kiểm tra EyeDropper thật trong trình duyệt vì mock không thay thế được.

Nền tảng hiện có: 6 test chọn/lưu màu, build và lint chạy local. Chưa có workflow CI hoặc báo cáo coverage.

## Tương lai, chưa triển khai ngay

### Chọn pixel chính xác

Người dùng quan sát con trỏ có vẻ bỏ qua một số pixel. Chưa xác định nguyên nhân; trước tiên so sánh DPI chuột, tốc độ/gia tốc con trỏ, display scaling, browser zoom và nhiều màn hình.

Phương án cần nghiên cứu: chế độ riêng chụp tab, phóng đại với lưới pixel, phím mũi tên di chuyển từng pixel ảnh. Cần cân nhắc quyền, ánh xạ tọa độ và hạn chế ảnh đóng băng. Giữ native làm mặc định nếu thêm chế độ này.

Xem [backlog điều tra và tiêu chí nghiệm thu](planning/BACKLOG.md).

## Phạm vi nhánh hiện tại

Nhánh `fix/color-picker-bugs` xử lý lỗi picker, storage, popup, clipboard và phản hồi copy; đồng thời dọn cấu trúc/tài liệu theo yêu cầu. Các tính năng lịch sử, chọn liên tục, chọn chính xác và CI/coverage chỉ được ghi nhận, không triển khai trong đợt này.

Sau khi merge nhánh hiện tại, tạo nhánh từ `main` mới cho từng PR; dự kiến `feat/color-history` và `ci/tests-and-coverage`. Chốt phạm vi toggle sau bước thử khả thi.
