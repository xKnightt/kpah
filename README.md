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


## V11.1 hotfix – two control keys
The game HUD is explicitly switched to `display:grid` after the Java ME canvas reports its ready size. This fixes the V11 issue where the `*` and `#` controls existed in HTML but remained hidden because their initial inline style was `display:none`. The keys retain MIDP key codes STAR=42 and POUND=35.


## V12 – Performance and controls
- Adds launcher settings for Java ME canvas resolution (default 360x480; optional 240x320 and 480x640).
- Adds two control layouts: minimal `*`/`#`, and a 3x3 full keypad with Up/Down/Left/Right/OK plus `*` and `#`.
- Preferences are stored locally in the browser via localStorage; additional JAR files remain in IndexedDB on that device.
- TCP proxy enables TCP_NODELAY for small real-time packets and disables WebSocket per-message compression to avoid unnecessary CPU work.
- Network diagnostics include TCP connection-establishment time. This is not the same as in-game ping or end-to-end latency.
- No proxy-side packet batching, buffering delay, packet rewriting, or protocol changes are introduced. Server-side monster/map spawn pacing and Java game logic cannot be accelerated by the proxy if the game server sends data slowly.


## V12.1 – Custom W/H and complete keypad
- Replaces preset resolution choices with user-entered W and H fields. Default remains 360x480; width range 120–1200 and height range 120–1600.
- Full keypad now has nine visible controls: L soft key (F1), Up, R soft key (F2), Left, OK, Right, Star, Down, Pound.
- Directional keys are larger with wider spacing and rounded styling for easier movement/combat.
- Minimal layout remains only `*` and `#`.
- Settings are stored locally on the device.


## V13 – iPhone direct-WebSocket experiment
- Based on V12.1. Existing PWA, CheerpJ, JAR library, W/H settings and key layouts are retained.
- Default transport remains the existing same-origin `/ws` TCP bridge so the current game path is preserved.
- Adds an on-device test for `wss://ip.nqshvn.com:19129` and an optional experimental direct transport mode.
- Direct mode only works if the game server port actually implements a compatible WebSocket-over-TLS endpoint. The known JAR target is TCP `ip.nqshvn.com:19129`; a normal TCP service will fail the WebSocket handshake.
- A successful WebSocket handshake alone does not prove compatibility with the game's TCP byte stream or authentication protocol.
- If direct test fails, switch Network Mode back to `Ổn định – TCP Bridge hiện tại`; no game JAR changes are required.
