# NQSHVN Direct V11 — Local JAR Library

## Tính năng V11
- Giữ runtime FreeJ2ME-Web/CheerpJ, cấu hình 360×480, mục tiêu 30 FPS, proxy WebSocket/TCP, PWA fullscreen và hai nút * # từ V10.
- Màn hình launcher cho phép chọn nhiều file `.jar` từ iPhone/máy tính.
- Các JAR được lưu riêng trong IndexedDB trên từng trình duyệt/thiết bị; không upload JAR lên Render.
- Chọn phiên bản đã lưu để chạy; xóa từng JAR khỏi thư viện.
- JAR mặc định cũ được giữ trong gói như một tệp dự phòng nhưng V11 không tự chạy nó; lần đầu cần thêm JAR ở bước launcher.

## Deploy lên Render đang dùng
1. Giải nén ZIP.
2. Cập nhật toàn bộ repository bằng nội dung thư mục `NQSHVN_Direct_iPhone_V11_LocalJAR` (giữ nguyên cấu trúc thư mục gốc).
3. Commit changes lên nhánh đang kết nối Render.
4. Render → Web Service → Deploys → Manual Deploy → Deploy latest commit.
5. Mở lại URL HTTPS. Nếu đã cài PWA, đóng hẳn ứng dụng rồi mở lại; nếu vẫn giao diện cũ, xóa dữ liệu website/cache hoặc xóa shortcut cũ và thêm lại.

## Cách dùng
- Chọn “Thêm file .JAR từ thiết bị”, chọn một hoặc nhiều JAR.
- Chọn phiên bản trong danh sách rồi nhấn CHƠI.
- Thư viện là riêng trên từng thiết bị/trình duyệt. Safari và Chrome không chia sẻ IndexedDB.
- Không xóa dữ liệu website nếu muốn giữ thư viện JAR. Trình duyệt có thể xóa dữ liệu lưu trữ khi thiếu dung lượng; không xem đây là bản sao lưu duy nhất.

## Lưu ý tương thích
- V11 đưa JAR vào CheerpJ VFS bằng `cheerpOSAddStringFile('/str/...', Uint8Array)` sau `cheerpjInit()`, theo tài liệu CheerpJ Filesystem.
- Chỉ JAR có cấu trúc MIDlet/FreeJ2ME tương thích mới chạy được. Các phiên bản có server/config khác nhau có thể cần cấu hình mạng tương ứng.
- Giữ nguyên `server.py`, `render.yaml`, runtime và proxy từ V10. Không deploy gói tĩnh lên Netlify nếu cần WebSocket/TCP proxy.
- Chưa kiểm thử trực tiếp trên iPhone 16 Pro; cần xác minh từng JAR, nhất là MIDlet manifest và tài nguyên phụ.
