# Mini Blog — Spring Boot + MongoDB + React + CKEditor 5 (Drive Upload, JWT, Admin)

Full source cho project:
- CRUD bài viết + CKEditor 5 (upload ảnh lên Google Drive)
- Phân trang + tìm kiếm
- JWT auth (ROLE: ADMIN/MANAGER/USER)
- ADMIN tạo MANAGER (gửi mật khẩu qua email)
- User tự đổi password / cập nhật thông tin

## Chạy nhanh

### 1) MongoDB
```bash
docker run -d --name mongo -p 27017:27017 mongo:7
```

### 2) Backend
- Copy file **service-account.json** (Google Cloud Service Account key có quyền Drive) vào `backend/src/main/resources/service-account.json`.
- Tạo thư mục trên Google Drive, lấy **Folder ID**, gán vào `application.properties`.
- Chỉnh SMTP (Gmail App Password hoặc dùng SendGrid/Mailgun) trong `application.properties`.

```bash
cd backend
mvn spring-boot:run
```

Endpoints quan trọng:
- `POST /api/auth/login` → `{ username, password }` trả `{ token, roles }`
- `GET /api/posts` (public, page/size/q)
- `POST|PUT|DELETE /api/posts/**` (ADMIN/MANAGER)
- `POST /api/uploads` (ADMIN/MANAGER) — CKEditor upload ảnh → trả `{ url }`
- `POST /api/admin/users` (ADMIN) — tạo MANAGER & gửi email mật khẩu
- `GET|PUT /api/users/me`, `PUT /api/users/me/password` (đã đăng nhập)

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```

Đăng nhập bằng user mẫu (khởi tạo khi chạy backend lần đầu):
- admin/admin123 → ADMIN
- manager1/manager123 → MANAGER
- manager2/user123 → MANAGER

> Dev note: CKEditor `simpleUpload.headers.Authorization` đọc token từ `localStorage`.
