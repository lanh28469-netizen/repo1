# Hướng dẫn Deploy Web lên Online

Hướng dẫn này sẽ giúp bạn deploy cả Backend (Spring Boot) và Frontend (React) lên các dịch vụ miễn phí để chạy online.

## 📋 Yêu cầu

1. Tài khoản GitHub (miễn phí)
2. Tài khoản Railway hoặc Render (miễn phí) - cho Backend
3. Tài khoản Vercel hoặc Netlify (miễn phí) - cho Frontend
4. MongoDB Atlas (miễn phí) - cho database

---

## 🗄️ Bước 1: Setup MongoDB Atlas (Database)

1. Truy cập [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Đăng ký/Đăng nhập tài khoản miễn phí
3. Tạo cluster mới (chọn FREE tier)
4. Tạo database user:
   - Database Access → Add New Database User
   - Username/Password → lưu lại
5. Whitelist IP:
   - Network Access → Add IP Address → chọn "Allow Access from Anywhere" (0.0.0.0/0)
6. Lấy Connection String:
   - Clusters → Connect → Connect your application
   - Copy connection string, thay `<password>` bằng password vừa tạo
   - Ví dụ: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/blogdb?retryWrites=true&w=majority`

---

## 🔧 Bước 2: Deploy Backend (Spring Boot)

### Option A: Deploy lên Railway (Khuyến nghị)

1. **Push code lên GitHub:**
   ```bash
   cd daklak/backend
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/daklak-backend.git
   git push -u origin main
   ```

2. **Deploy trên Railway:**
   - Truy cập [Railway](https://railway.app)
   - Đăng nhập bằng GitHub
   - New Project → Deploy from GitHub repo
   - Chọn repo `daklak-backend`
   - Railway sẽ tự động detect Java và build

3. **Cấu hình Environment Variables:**
   - Vào Settings → Variables
   - Thêm các biến sau:
     ```
     SPRING_DATA_MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/blogdb?retryWrites=true&w=majority
     SERVER_PORT=10000
     JWT_SECRET=your_very_long_random_secret_at_least_64_chars_here_use_random_string_generator
     CORS_ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,https://your-frontend-url.netlify.app
     
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
     
     # Mail (nếu cần)
     SPRING_MAIL_HOST=smtp.gmail.com
     SPRING_MAIL_PORT=587
     SPRING_MAIL_USERNAME=your_email@gmail.com
     SPRING_MAIL_PASSWORD=your_app_password
     APP_MAIL_FROM=your_email@gmail.com
     ```

4. **Lấy Backend URL:**
   - Sau khi deploy xong, Railway sẽ cung cấp URL
   - Ví dụ: `https://daklak-backend-production.up.railway.app`
   - Copy URL này để dùng cho Frontend

### Option B: Deploy lên Render

1. **Push code lên GitHub** (tương tự Railway)

2. **Deploy trên Render:**
   - Truy cập [Render](https://render.com)
   - Đăng nhập bằng GitHub
   - New → Web Service
   - Connect repo `daklak-backend`
   - Cấu hình:
     - **Build Command:** `mvn clean package -DskipTests`
     - **Start Command:** `java -jar target/*.jar`
     - **Environment:** Java

3. **Cấu hình Environment Variables** (tương tự Railway)

---

## 🎨 Bước 3: Deploy Frontend (React)

### Option A: Deploy lên Vercel (Khuyến nghị)

1. **Push code lên GitHub:**
   ```bash
   cd daklak/frontend
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/daklak-frontend.git
   git push -u origin main
   ```

2. **Deploy trên Vercel:**
   - Truy cập [Vercel](https://vercel.com)
   - Đăng nhập bằng GitHub
   - New Project → Import Git Repository
   - Chọn repo `daklak-frontend`
   - Cấu hình:
     - **Framework Preset:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
     - **Install Command:** `npm install`

3. **Cấu hình Environment Variables:**
   - Vào Settings → Environment Variables
   - Thêm:
     ```
     VITE_API_BASE_URL=https://your-backend-url.railway.app
     ```
   - **Lưu ý:** Sau khi thêm env var, cần **Redeploy** project

4. **Lấy Frontend URL:**
   - Vercel sẽ cung cấp URL
   - Ví dụ: `https://daklak-frontend.vercel.app`

5. **Cập nhật CORS trên Backend:**
   - Quay lại Railway/Render
   - Cập nhật `CORS_ALLOWED_ORIGINS` với Frontend URL:
     ```
     CORS_ALLOWED_ORIGINS=https://daklak-frontend.vercel.app
     ```
   - Redeploy backend

### Option B: Deploy lên Netlify

1. **Push code lên GitHub** (tương tự Vercel)

2. **Deploy trên Netlify:**
   - Truy cập [Netlify](https://netlify.com)
   - Đăng nhập bằng GitHub
   - New site from Git → GitHub
   - Chọn repo `daklak-frontend`
   - Cấu hình:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`

3. **Cấu hình Environment Variables:**
   - Site settings → Environment variables
   - Thêm:
     ```
     VITE_API_BASE_URL=https://your-backend-url.railway.app
     ```
   - Trigger new deploy

4. **Cập nhật CORS trên Backend** (tương tự Vercel)

---

## ✅ Bước 4: Kiểm tra và Test

1. **Truy cập Frontend URL** trên Chrome
2. **Kiểm tra Console** (F12) xem có lỗi CORS không
3. **Test đăng nhập:**
   - Mở DevTools → Network
   - Thử đăng nhập với user mẫu
   - Kiểm tra API calls có thành công không

---

## 🔐 Lưu ý quan trọng

1. **Google Drive Service Account:**
   - Cần upload file `service-account.json` lên backend
   - Trên Railway: Settings → Volumes → Mount
   - Trên Render: Environment → Secret Files

2. **JWT Secret:**
   - Phải là chuỗi dài ít nhất 64 ký tự
   - Dùng random string generator

3. **MongoDB Connection:**
   - Đảm bảo IP whitelist đã cho phép tất cả (0.0.0.0/0)

4. **CORS:**
   - Phải cập nhật `CORS_ALLOWED_ORIGINS` với đúng Frontend URL
   - Không có dấu cách, phân cách bằng dấu phẩy

---

## 🚀 Quick Deploy Commands

### Backend (Railway):
```bash
cd daklak/backend
git add .
git commit -m "Deploy to Railway"
git push origin main
```

### Frontend (Vercel):
```bash
cd daklak/frontend
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

---

## 📞 Troubleshooting

### Lỗi CORS:
- Kiểm tra `CORS_ALLOWED_ORIGINS` có đúng Frontend URL không
- Đảm bảo không có dấu cách, có `https://`

### Lỗi MongoDB Connection:
- Kiểm tra connection string có đúng không
- Kiểm tra IP whitelist trên MongoDB Atlas

### Frontend không kết nối được Backend:
- Kiểm tra `VITE_API_BASE_URL` có đúng Backend URL không
- Kiểm tra Backend có đang chạy không (truy cập Backend URL trên browser)

---

## 🎉 Hoàn thành!

Sau khi deploy xong, bạn có thể truy cập web trên Chrome bằng Frontend URL. Cả Backend và Frontend đều chạy online!

