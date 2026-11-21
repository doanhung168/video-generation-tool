# 📱 Hướng Dẫn Chi Tiết Lấy TikTok Content Posting API Key

TikTok Content Posting API là API chính thức của TikTok cho phép ứng dụng bên thứ 3 tải lên và đăng video trực tiếp lên tài khoản TikTok của người dùng hoặc kênh của bạn.

---

## 📌 Bước 1: Đăng Ký Tài Khoản TikTok Developer

1. Truy cập vào Cổng Nhà Phát Triển TikTok:
   👉 **[https://developers.tiktok.com/](https://developers.tiktok.com/)**
2. Bấm **Log in** ở góc trên bên phải và đăng nhập bằng tài khoản TikTok của bạn (nên dùng tài khoản có kênh bạn muốn tự động đăng video).
3. Sau khi đăng nhập, nếu là lần đầu tiên, hệ thống sẽ yêu cầu bạn xác nhận thông tin cơ bản của Developer.

---

## 📌 Bước 2: Tạo Ứng Dụng Mới (Create App)

1. Truy cập trang quản lý ứng dụng:
   👉 **[https://developers.tiktok.com/apps](https://developers.tiktok.com/apps)**
2. Bấm nút **"Create an App"**.
3. Điền các thông tin:
   - **App Name**: Tên ứng dụng của bạn (ví dụ: `AutoVideo Studio`).
   - **Description**: Mô tả ngắn gọn (ví dụ: `AI video generation and automatic publishing tool`).
   - **Category**: Chọn `Content / Media` hoặc `Creator Tools`.
4. Bấm **Create**.

---

## 📌 Bước 3: Kích Hoạt Sản Phẩm "Content Posting API"

1. Trong trang quản lý App vừa tạo, tìm mục **Products / Add Products**.
2. Tìm sản phẩm **Content Posting API** (hoặc **Share to TikTok / Direct Post**) và bấm **Add**.
3. Chọn các quyền (Permissions / Scopes) bắt buộc sau:
   - `video.upload`: Cho phép ứng dụng tải tệp video lên máy chủ TikTok.
   - `video.publish`: Cho phép xuất bản video lên trang cá nhân TikTok.
   - `user.info.basic`: Đọc thông tin cơ bản của kênh (Avatar, Display Name).

---

## 📌 Bước 4: Lấy Client Key & Client Secret

1. Vào mục **App Details / Basic Settings** trong trang quản lý App.
2. Bạn sẽ thấy 2 thông số:
   - **Client Key** (tương đương Client ID)
   - **Client Secret**

---

## 📌 Bước 5: Cấu Hình Redirect URI & Thêm Tài Khoản Test (Sandbox)

Trong khi App đang ở trạng thái **Development Mode** (chưa cần gửi duyệt kiểm duyệt công khai):
1. Vào tab **Redirect URI**:
   - Thêm: `http://localhost:3000/api/auth/callback/tiktok` hoặc `http://localhost:8000/api/v1/auth/tiktok` (hoặc `https://localhost`).
2. Vào tab **Developer / Tester Accounts**:
   - Bấm **Add Tester** và nhập TikTok handle của bạn (ví dụ: `@your_username`).
   - Mở ứng dụng TikTok trên điện thoại, vào mục **Hộp thư (Inbox) -> Thông báo hệ thống** để chấp nhận lời mời làm Tester.
   - *Lưu ý: Chỉ tài khoản Tester mới có thể cấp quyền và sinh Access Token khi App chưa được TikTok duyệt chính thức.*

---

## 📌 Bước 6: Lấy Access Token (OAuth 2.0)

### Cách đơn giản nhất qua Trình Duyệt:
1. Mở đường link sau trên trình duyệt (thay `YOUR_CLIENT_KEY` bằng Client Key của bạn):
   ```text
   https://www.tiktok.com/v2/auth/authorize/?client_key=YOUR_CLIENT_KEY&scope=user.info.basic,video.upload,video.publish&response_type=code&redirect_uri=http://localhost:3000/api/auth/callback/tiktok&state=12345
   ```
2. Đăng nhập TikTok và bấm **Authorize (Ủy quyền)**.
3. Sau khi đồng ý, trình duyệt sẽ chuyển hướng về đường dẫn dạng:
   ```text
   http://localhost:3000/api/auth/callback/tiktok?code=YOUR_AUTH_CODE&state=12345
   ```
   Sao chép chuỗi mã `YOUR_AUTH_CODE`.

4. Dùng lệnh cURL (hoặc Postman / PowerShell) để đổi `code` lấy `access_token`:
   ```bash
   curl -X POST https://open.tiktokapis.com/v2/oauth/token/ \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_key=YOUR_CLIENT_KEY" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=YOUR_AUTH_CODE" \
     -d "grant_type=authorization_code" \
     -d "redirect_uri=http://localhost:3000/api/auth/callback/tiktok"
   ```
5. Kết quả trả về JSON có chứa:
   ```json
   {
     "data": {
       "access_token": "act.example1234567890abcdef...",
       "expires_in": 86400,
       "refresh_token": "rft.example1234567890abcdef...",
       "open_id": "..."
     }
   }
   ```
6. Sao chép chuỗi `act.example...` và dán vào ô **TikTok Access Token** trong trang:
   👉 **[http://localhost:3000/settings](http://localhost:3000/settings)**

---

## 💡 Chế Độ Mô Phỏng (Simulation Mode)

> [!NOTE]
> Nếu bạn chưa có thời gian đăng ký TikTok Developer App, **Tool này đã tích hợp sẵn chế độ Auto Simulation Fallback**. Bạn vẫn có thể bấm đăng TikTok bình thường, video sẽ được xử lý render 100% bằng FFmpeg/Veo3 và tạo bản ghi bài đăng hoàn chỉnh để bạn kiểm tra luồng hoạt động!
