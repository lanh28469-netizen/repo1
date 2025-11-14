# ✅ Kiểm tra Deploy - Có chạy được không?

## 📋 Checklist Kiểm tra

### ✅ Đã hoàn thành:

1. **Backend Configuration:**
   - ✅ CORS đã được cập nhật để đọc từ environment variable
   - ✅ `application.properties` hỗ trợ environment variables
   - ✅ `railway.json` - cấu hình cho Railway
   - ✅ `render.yaml` - cấu hình cho Render
   - ✅ `Dockerfile` đã có sẵn

2. **Frontend Configuration:**
   - ✅ `vite.config.js` - cấu hình Vite đúng
   - ✅ `vercel.json` - cấu hình Vercel (đã cập nhật)
   - ✅ `netlify.toml` - cấu hình Netlify
   - ✅ `package.json` có script `build: "npx vite build"`
   - ✅ `@vitejs/plugin-react` đã được thêm vào devDependencies
   - ✅ `index.html` có ở root folder (Vite yêu cầu)

3. **Documentation:**
   - ✅ `DEPLOY.md` - hướng dẫn chi tiết
   - ✅ `DEPLOY_CHECKLIST.md` - checklist nhanh

## ⚠️ Cần lưu ý:

### 1. **Frontend - Cần chạy `npm install` trước khi deploy:**
```bash
cd daklak/frontend
npm install
```
- Cần cài `@vitejs/plugin-react` mới thêm vào
- Các dependencies khác cũng cần được cài đặt

### 2. **Backend - Cần có file `service-account.json`:**
- File này cần được upload lên hosting service
- Trên Railway: Settings → Volumes → Mount
- Trên Render: Environment → Secret Files

### 3. **Environment Variables cần thiết:**

**Backend:**
- `SPRING_DATA_MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Random string 64+ ký tự
- `CORS_ALLOWED_ORIGINS` - Frontend URL (sẽ cập nhật sau)
- Các biến Google Drive (có thể giữ nguyên từ application.properties)

**Frontend:**
- `VITE_API_BASE_URL` - Backend URL

## 🧪 Test Local trước khi Deploy:

### Test Frontend Build:
```bash
cd daklak/frontend
npm install
npm run build
```
- Nếu build thành công → OK
- Nếu có lỗi → cần sửa trước

### Test Backend Build:
```bash
cd daklak/backend
mvn clean package -DskipTests
```
- Nếu build thành công → OK
- Nếu có lỗi → cần sửa trước

## ✅ Kết luận:

**CÓ THỂ CHẠY ĐƯỢC** nếu:
1. ✅ Chạy `npm install` ở frontend trước
2. ✅ Setup MongoDB Atlas đúng
3. ✅ Cấu hình Environment Variables đúng
4. ✅ Upload `service-account.json` lên backend hosting
5. ✅ Cập nhật CORS với Frontend URL sau khi deploy

**Các file cấu hình đã đúng và sẵn sàng deploy!**

## 🚀 Bước tiếp theo:

1. Đọc `DEPLOY.md` để xem hướng dẫn chi tiết
2. Setup MongoDB Atlas
3. Deploy Backend trước
4. Deploy Frontend sau
5. Cập nhật CORS
6. Test trên Chrome

