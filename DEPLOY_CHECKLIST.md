# ✅ Checklist Deploy Nhanh

## 🗄️ MongoDB Atlas
- [ ] Tạo tài khoản MongoDB Atlas
- [ ] Tạo cluster FREE
- [ ] Tạo database user (username/password)
- [ ] Whitelist IP: 0.0.0.0/0 (Allow from anywhere)
- [ ] Copy connection string: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/blogdb?retryWrites=true&w=majority`

## 🔧 Backend (Railway hoặc Render)
- [ ] Push code lên GitHub
- [ ] Tạo project trên Railway/Render
- [ ] Connect GitHub repo
- [ ] Thêm Environment Variables:
  - [ ] `SPRING_DATA_MONGODB_URI` = connection string từ MongoDB Atlas
  - [ ] `SERVER_PORT` = 10000
  - [ ] `JWT_SECRET` = random string 64+ ký tự
  - [ ] `CORS_ALLOWED_ORIGINS` = (sẽ cập nhật sau khi có Frontend URL)
  - [ ] Các biến Google Drive (giữ nguyên từ application.properties)
- [ ] Deploy và lấy Backend URL
- [ ] Test Backend URL trên browser (phải thấy response)

## 🎨 Frontend (Vercel hoặc Netlify)
- [ ] Push code lên GitHub
- [ ] Tạo project trên Vercel/Netlify
- [ ] Connect GitHub repo
- [ ] Thêm Environment Variable:
  - [ ] `VITE_API_BASE_URL` = Backend URL từ Railway/Render
- [ ] Deploy và lấy Frontend URL
- [ ] Cập nhật `CORS_ALLOWED_ORIGINS` trên Backend với Frontend URL
- [ ] Redeploy Backend

## ✅ Test
- [ ] Mở Frontend URL trên Chrome
- [ ] Mở DevTools (F12) → Console
- [ ] Kiểm tra không có lỗi CORS
- [ ] Test đăng nhập
- [ ] Test các chức năng chính

## 🎉 Hoàn thành!
Web đã chạy online trên Chrome!

