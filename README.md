# NQSHVN Direct V7 — kết nối đăng nhập qua TCP proxy

V7 **giữ nguyên phần đồ họa đã mượt của V6** (Canvas 240×320, FPS mục tiêu 30, tắt âm thanh). Chỉ nâng cấp cầu nối mạng, chẩn đoán và triển khai.

## VÌ SAO V6 VÀO GAME NHƯNG KHÔNG ĐĂNG NHẬP

Website chạy từ Netlify Drop chỉ cung cấp file tĩnh; không chạy `server.py` và không có WebSocket `/ws`. Game Java ME cần TCP để đăng nhập. Không thể sửa điều này chỉ bằng thay HTML hoặc thay URL Netlify.

## CÁCH ĐĂNG V7 (quan trọng: deploy toàn bộ ứng dụng, không phải Netlify Drop)

**Render**, cần tài khoản GitHub + Render:
1. Giải nén thư mục V7, đưa **toàn bộ nội dung** lên một repository GitHub riêng (bao gồm `server.py`, `render.yaml`, `freej2me-web.jar`, `NQSHVN-FULL.jar`). Kiểm tra quyền được phép chia sẻ các JAR và mã nguồn trước khi chuyển repository thành công khai.
2. Trên Render: New → Blueprint → kết nối repository này → Apply. File `render.yaml` cấu hình Python web service, `PORT` do Render cung cấp.
3. Dùng URL HTTPS do Render cấp để mở game trên iPhone, **không dùng link Netlify cũ**. Render proxy chuyển tiếp WebSocket cùng tên miền. Dịch vụ free có thể ngủ khi không hoạt động và khởi động chậm lần đầu.
4. Bấm **Kiểm tra mạng** trong trang game. Mong đợi `Proxy: online`, `DNS: ok`, `TCP: ok`. Kết quả TCP ok mới chỉ xác nhận kết nối socket, không bảo đảm máy chủ chấp nhận đăng nhập.

**VPS hoặc máy cá nhân:** `pip install -r requirements.txt && python server.py`; đưa qua reverse proxy HTTPS + WebSocket như Cloudflare Tunnel. Đừng cấu hình server này thành proxy TCP mở cho mọi host.

## Khi hiện lỗi
- `Không tìm thấy API /api/network`: đang dùng host tĩnh/Netlify Drop; game sẽ không có `/ws`.
- `DNS: failed`: host game trong JAR không phân giải được hoặc mạng của hosting chặn.
- `TCP: failed`: game server hoặc cổng có thể ngừng hoạt động, hoặc hosting chặn cổng outbound.
- `TCP: ok` nhưng đăng nhập không được: cần kiểm tra handshake của game và endpoint HTTP lấy danh sách IP; chưa thể khẳng định sửa được chỉ bằng proxy.

## Giới hạn
- Chưa thử đăng nhập thật trên iPhone và chưa chứng minh server `ip.nqshvn.com:19129` còn hoạt động.
- `http://ip.nqshvn.com/ip/NQSHVN.txt` cũng được nhúng trong game; truy cập HTTP từ trang HTTPS có thể bị trình duyệt chặn hoặc gặp CORS. Cần xác định có được truy cập từ runtime hay không.
- Runtime CheerpJ cần Internet, tải từ CDN. Không hứa kết nối/login thành công khi game server ngoài không hoạt động.
- Kèm JAR do người dùng cung cấp và thành phần FreeJ2ME-Web; kiểm tra giấy phép GPL và quyền phân phối trước khi chia sẻ công khai.
