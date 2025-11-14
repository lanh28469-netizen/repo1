# 🚀 Hướng dẫn Deploy NGAY - Step by Step

## ✅ Bước 1: Setup MongoDB Atlas (5 phút)

1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Đăng ký/Đăng nhập
3. Tạo cluster FREE:
   - Chọn **FREE (M0)** tier
   - Chọn region gần nhất (Singapore hoặc AWS)
   - Đặt tên cluster: `daklak-cluster`
4. Tạo Database User:
   - **Database Access** → **Add New Database User**
   - Authentication: **Password**
   - Username: `daklak_user` (hoặc tên bạn muốn)
   - Password: Tạo password mạnh (LƯU LẠI!)
   - Database User Privileges: **Atlas admin**
5. Whitelist IP:
   - **Network Access** → **Add IP Address**
   - Chọn **"Allow Access from Anywhere"** (0.0.0.0/0)
6. Lấy Connection String:
   - **Clusters** → Click **Connect** → **Connect your application**
   - Copy connection string
   - Thay `<password>` bằng password vừa tạo
   - Ví dụ: `mongodb+srv://daklak_user:YourPassword123@cluster0.xxxxx.mongodb.net/blogdb?retryWrites=true&w=majority`
   - **LƯU LẠI CONNECTION STRING NÀY!**

---

## 🔧 Bước 2: Deploy Backend lên Railway (10 phút)

### 2.1. Đăng ký Railway
1. Truy cập: https://railway.app
2. Đăng nhập bằng **GitLab** (hoặc GitHub)
3. Authorize Railway truy cập GitLab

### 2.2. Tạo Project mới
1. Click **New Project**
2. Chọn **Deploy from Git repo**
3. Chọn repo: `https://gitlab.com/hixapp/daklak.git`
4. Railway sẽ tự detect Java project

### 2.3. Cấu hình Service
1. Railway sẽ tự tạo service từ `backend/` folder
2. Nếu không tự detect, vào **Settings** → **Root Directory**: chọn `backend`

### 2.4. Thêm Environment Variables
Vào **Variables** tab, thêm các biến sau:

```env
# MongoDB
SPRING_DATA_MONGODB_URI=mongodb+srv://daklak_user:YourPassword@cluster0.xxxxx.mongodb.net/blogdb?retryWrites=true&w=majority

# Server
SERVER_PORT=10000
SPRING_PROFILES_ACTIVE=production

# JWT (tạo random string 64+ ký tự)
JWT_SECRET=your_very_long_random_secret_at_least_64_chars_use_random_string_generator_here_12345678901234567890

# CORS (sẽ cập nhật sau khi có Frontend URL)
CORS_ALLOWED_ORIGINS=https://your-frontend-url.vercel.app

# Google Drive (giữ nguyên từ application.properties)
GDRIVE_APP_NAME=Daklak
GDRIVE_FOLDER_ID=16kO2D5zAU_Kx86lcNAHifKN8iAGYiGnl
GDRIVE_FOLDER_3D=1i4WhNlL22N04t0M0BXibcR1ryL6X_DfN
GDRIVE_FOLDER_360=1uHH4Djx8v-A0Yps22LwP2sdHf25OKCwu
GDRIVE_FOLDER_EDE=1TItC23hTD5Ksjke8kToFMaFNYdOdTqcG
GDRIVE_FOLDER_JRAI=16VoA0peL4916-Uv3-I2T-e-m4EwWfiNO
GDRIVE_FOLDER_MNONG=1O6MjBITUrt2jPYyYfMKeXKv87x6Tj3M4
GDRIVE_FOLDER_VIDEO=1tT1rIQWDbP-gZnlXSijC-JCNzyNR8aT-
U2BE_PLAYLIST_URL=https://www.youtube.com/watch?v=eOxoh-0ToBQ&list=PLBIDxpxvAwF6CbDr5dU_d5Jl6XUl7KMsM
U2BE_API_KEY=AIzaSyDmm39D9eptN69XNtsNq4fVkXtdNM_hvko
```

**Lưu ý:**
- Thay `mongodb+srv://...` bằng connection string thật của bạn
- Tạo JWT_SECRET random: https://randomkeygen.com/ (chọn CodeIgniter Encryption Keys)
- `CORS_ALLOWED_ORIGINS` để trống tạm thời, sẽ cập nhật sau

### 2.5. Deploy và lấy Backend URL
1. Railway sẽ tự động build và deploy
2. Đợi build xong (5-10 phút)
3. Vào **Settings** → **Generate Domain**
4. Copy Backend URL, ví dụ: `https://daklak-backend-production.up.railway.app`
5. **LƯU LẠI BACKEND URL NÀY!**

### 2.6. Test Backend
Mở browser, truy cập: `https://your-backend-url.railway.app/api/posts`
- Nếu thấy JSON response → Backend đã chạy OK ✅
- Nếu lỗi → Kiểm tra logs trong Railway dashboard

---

## 🎨 Bước 3: Deploy Frontend lên Vercel (10 phút)

### 3.1. Đăng ký Vercel
1. Truy cập: https://vercel.com
2. Đăng nhập bằng **GitLab** (hoặc GitHub)
3. Authorize Vercel truy cập GitLab

### 3.2. Tạo Project mới
1. Click **Add New...** → **Project**
2. Import Git Repository: chọn `https://gitlab.com/hixapp/daklak.git`
3. Cấu hình:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend` (quan trọng!)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 3.3. Thêm Environment Variable
Trước khi deploy, vào **Environment Variables**, thêm:

```env
VITE_API_BASE_URL=https://your-backend-url.railway.app
```

**Lưu ý:** Thay `https://your-backend-url.railway.app` bằng Backend URL thật từ Railway!

### 3.4. Deploy
1. Click **Deploy**
2. Đợi build xong (3-5 phút)
3. Vercel sẽ tự động tạo domain
4. Copy Frontend URL, ví dụ: `https://daklak-frontend.vercel.app`
5. **LƯU LẠI FRONTEND URL NÀY!**

---

## 🔄 Bước 4: Cập nhật CORS trên Backend

1. Quay lại **Railway** → Backend service
2. Vào **Variables** tab
3. Cập nhật `CORS_ALLOWED_ORIGINS`:
   ```
   CORS_ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
   ```
   (Thay bằng Frontend URL thật của bạn)
4. Railway sẽ tự động redeploy
5. Đợi redeploy xong (2-3 phút)

---

## ✅ Bước 5: Test trên Chrome

1. Mở Chrome
2. Truy cập Frontend URL: `https://your-frontend-url.vercel.app`
3. Mở **DevTools** (F12) → **Console** tab
4. Kiểm tra:
   - ✅ Không có lỗi CORS (red errors)
   - ✅ Không có lỗi 404 API calls
5. Test đăng nhập:
   - Thử đăng nhập với user có sẵn
   - Kiểm tra Network tab xem API calls có thành công không

---

## 🎉 Hoàn thành!

Web của bạn đã chạy online! Bạn có thể:
- Chia sẻ Frontend URL cho mọi người
- Truy cập từ bất kỳ đâu trên Chrome
- Backend và Frontend đều chạy online 24/7

---

## 🔧 Troubleshooting

### Lỗi CORS:
- Kiểm tra `CORS_ALLOWED_ORIGINS` có đúng Frontend URL không
- Đảm bảo có `https://` và không có dấu cách
- Redeploy backend sau khi sửa

### Frontend không kết nối được Backend:
- Kiểm tra `VITE_API_BASE_URL` có đúng Backend URL không
- Kiểm tra Backend có đang chạy không (truy cập Backend URL trên browser)
- Redeploy frontend sau khi sửa env var

### MongoDB Connection Error:
- Kiểm tra connection string có đúng không
- Kiểm tra IP whitelist trên MongoDB Atlas (phải có 0.0.0.0/0)
- Kiểm tra username/password có đúng không

### Build Error trên Railway:
- Kiểm tra logs trong Railway dashboard
- Đảm bảo `pom.xml` có đầy đủ dependencies
- Kiểm tra Java version (cần Java 17+)

---

## 📝 Checklist nhanh

- [ ] MongoDB Atlas: Tạo cluster, user, whitelist IP, lấy connection string
- [ ] Railway: Deploy backend, thêm env vars, lấy Backend URL
- [ ] Vercel: Deploy frontend, thêm `VITE_API_BASE_URL`, lấy Frontend URL
- [ ] Cập nhật `CORS_ALLOWED_ORIGINS` trên Railway
- [ ] Test trên Chrome: Mở Frontend URL, kiểm tra Console, test đăng nhập

---

**Thời gian ước tính:** 30-45 phút
**Chi phí:** HOÀN TOÀN MIỄN PHÍ (Free tier của tất cả services)

