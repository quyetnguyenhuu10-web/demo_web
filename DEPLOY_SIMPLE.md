# 🚀 Hướng dẫn Deploy Web App (Đơn giản nhất)

## Tổng quan

App của bạn đã được cấu hình để deploy như **một service duy nhất** (backend + frontend cùng chạy). Chỉ cần deploy một lần!

## ⚡ Option 1: Railway (Khuyến nghị - Dễ nhất)

### Bước 1: Chuẩn bị

1. Đảm bảo code đã được push lên GitHub
2. Có các API keys:
   - `OPENAI_API_KEY` (từ https://platform.openai.com/api-keys)
   - `CLERK_SECRET_KEY` và `VITE_CLERK_PUBLISHABLE_KEY` (từ https://dashboard.clerk.com)

### Bước 2: Deploy trên Railway

1. **Tạo tài khoản Railway**
   - Truy cập: https://railway.app
   - Đăng ký bằng GitHub (miễn phí)

2. **Tạo Project mới**
   - Click **"New Project"**
   - Chọn **"Deploy from GitHub repo"**
   - Chọn repository của bạn
   - Chọn thư mục `web_ui` (nếu repo có nhiều thư mục)

3. **Cấu hình Build & Deploy**
   - Railway sẽ tự detect Node.js
   - **Build Command**: `npm install && npm run build` (tự động build frontend)
   - **Start Command**: `node server.cjs` (chạy server)

4. **Thêm Environment Variables**
   - Vào **Variables** tab
   - Thêm các biến sau:
     ```
     NODE_ENV=production
     PORT=3001
     OPENAI_API_KEY=sk-your-key-here
     OPENAI_MODEL=gpt-4o-mini
     CLERK_SECRET_KEY=sk_test_your-key-here
     VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
     ```
   - **Lưu ý**: `VITE_CLERK_PUBLISHABLE_KEY` cần có prefix `VITE_` để Vite build có thể đọc được

5. **Deploy**
   - Railway sẽ tự động deploy
   - Đợi build xong (khoảng 2-3 phút)
   - Railway sẽ cung cấp URL (ví dụ: `https://your-app.up.railway.app`)

### Bước 3: Cấu hình Clerk

1. Vào **Clerk Dashboard**: https://dashboard.clerk.com
2. **Settings** → **Domains**
3. Thêm domain Railway của bạn (ví dụ: `your-app.up.railway.app`)
4. Cập nhật:
   - **Allowed Redirect URLs**: `https://your-app.up.railway.app/**`
   - **Allowed Sign-in URLs**: `https://your-app.up.railway.app/**`

### Bước 4: Test

1. Truy cập URL Railway
2. Đăng ký tài khoản mới
3. Kiểm tra xem app có hoạt động không

---

## 🌐 Option 2: Render (Free tier tốt)

### Bước 1: Tạo tài khoản

1. Truy cập: https://render.com
2. Đăng ký bằng GitHub

### Bước 2: Deploy

1. **Dashboard** → **New** → **Web Service**
2. Connect GitHub repository
3. Cấu hình:
   - **Name**: `your-app-name`
   - **Environment**: `Node`
   - **Root Directory**: `web_ui` (nếu repo có nhiều thư mục)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.cjs`
   - **Plan**: Free (hoặc Starter)

4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   OPENAI_API_KEY=sk-your-key-here
   OPENAI_MODEL=gpt-4o-mini
   CLERK_SECRET_KEY=sk_test_your-key-here
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
   ```

5. Click **Create Web Service**

6. **Cấu hình Clerk** tương tự như Railway

---

## 📋 Checklist trước khi deploy

- [ ] Code đã push lên GitHub
- [ ] Đã có tất cả API keys (OpenAI, Clerk)
- [ ] Đã test app trên local (`npm run build && npm start`)
- [ ] Đã cập nhật Clerk Dashboard với production domain
- [ ] Đã set tất cả environment variables trên hosting platform

---

## 🔧 Troubleshooting

### Lỗi: "Cannot find module"
- Kiểm tra `package.json` có đầy đủ dependencies không
- Thử chạy `npm install` lại

### Lỗi: "Clerk authentication failed"
- Kiểm tra Clerk keys đã đúng chưa
- Kiểm tra Clerk Dashboard đã thêm domain chưa
- Kiểm tra `VITE_CLERK_PUBLISHABLE_KEY` có prefix `VITE_` chưa

### Lỗi: "OpenAI API error"
- Kiểm tra `OPENAI_API_KEY` đã set chưa
- Kiểm tra API key còn valid không
- Kiểm tra billing trên OpenAI account

### App không load frontend
- Kiểm tra build command có chạy `npm run build` không
- Kiểm tra `dist` folder có được tạo không
- Kiểm tra `NODE_ENV=production` đã set chưa

---

## 💡 Tips

1. **Railway** có free tier tốt, dễ sử dụng nhất
2. **Render** có free tier nhưng có thể sleep sau 15 phút không dùng
3. Cả hai đều tự động deploy khi push code mới lên GitHub
4. Có thể dùng custom domain (mua domain và cấu hình DNS)

---

## 🎉 Xong!

Sau khi deploy xong, bạn sẽ có URL công khai để truy cập từ bất kỳ đâu, không cần chạy trên máy tính của bạn nữa!
