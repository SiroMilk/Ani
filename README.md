# Ani
Anime?
# TizenBrew - AnimeVsub

Module cho [TizenBrew](https://github.com/reisxd/TizenBrew) giúp mở **AnimeVietsub** trên Samsung Tizen TV thông qua trang web chính chủ `play.max.com`, có hỗ trợ điều khiển bằng remote TV (play/pause, tua, nút Back...).

> ⚠️ Đây **không phải** app anime, cũng không bẻ khoá/crack DRM hay bypass bất cứ thứ gì. Bạn vẫn cần **tài khoản hợp lệ** để đăng nhập và xem như bình thường trên trình duyệt.

## Yêu cầu

- Samsung Smart TV chạy Tizen 3.0 trở lên (TV đời 2017+)
- Đã cài [TizenBrew](https://github.com/reisxd/TizenBrew) trên TV (xem hướng dẫn cài TizenBrew tại repo gốc)
- Trình duyệt web trên TV hỗ trợ Widevine/EME (hầu hết Tizen 4.0+ đều có) — nếu TV quá cũ, video có thể không phát được do giới hạn phần cứng, không liên quan tới module này.

## Cài đặt module này

### Cách 1: Qua TizenBrew Installer (khuyên dùng)
1. Mở **TizenBrew Installer Desktop** trên máy tính (xem tại [TizenBrewInstaller](https://github.com/reisxd/TizenBrewInstaller)).
2. Kết nối với TV đã cài TizenBrew.
3. Khi được hỏi module/app, nhập repo dạng `user/repo`, ví dụ: `<tên-github-của-bạn>/tizenbrew-hbomax` (sau khi bạn đã đẩy repo này lên GitHub của mình).

### Cách 2: Copy thủ công vào thư mục modules
1. Trên máy chạy server TizenBrew, tìm thư mục `modules/` (nơi TizenBrew quét các module NPM).
2. Copy toàn bộ thư mục `tizenbrew-hbomax` (chứa `package.json` + `index.js`) vào đó.
3. Khởi động lại server TizenBrew.
4. Trên TV, mở TizenBrew → module "Max (HBO Max)" sẽ xuất hiện trong danh sách.

## Cấu trúc

```
tizenbrew-hbomax/
├── package.json   # Khai báo module (packageType: "mods", websiteURL, keys...)
├── index.js       # Script inject vào animevsub để map phím remote
└── README.md
```

## Tuỳ chỉnh

- Muốn dùng domain khác (ví dụ `https://www.max.com` thay vì `https://play.max.com`) → sửa `websiteURL` trong `package.json`.
- Muốn thêm phím remote khác → thêm keycode Tizen vào mảng `keys` trong `package.json` và xử lý trong `index.js` (danh sách keycode: [Samsung TVInputDevice API docs](https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references/tvinputdevice-api.html)).

## Ghi chú

- Nếu trang web Max thay đổi giao diện/cấu trúc, có thể cần cập nhật `index.js` (ví dụ selector `video`).
- Nút Back (RETURN) trên remote: nếu đang ở trang chủ Max sẽ thoát app; nếu đang ở trang con sẽ quay lại trang trước, giống hành vi app TV bình thường.
- 
