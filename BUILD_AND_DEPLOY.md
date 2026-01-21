# 🚀 Hướng dẫn Build và Deploy Web App

## Bước 1: Build Web App (Test trên local)

### Cài đặt dependencies (nếu chưa có)
```bash
cd web_ui
npm install
```

### Build frontend
```bash
npm run build
```

Lệnh này sẽ:
- Build React app thành static files
- Tạo thư mục `dist/` chứa các file đã build
- Server sẽ tự động serve từ `dist/` khi `NODE_ENV=production`

### Test production build trên local
```bash
# Set environment variable
$env:NODE_ENV="production"

# Chạy server
npm start
```

Hoặc trên Windows PowerShell:
```powershell
$env:NODE_ENV="production"; node server.cjs
```

Sau đó mở browser: http://localhost:3001

---

## Bước 2: Push Code lên GitHub

### Nếu chưa có Git repository:

1. **Cài Git** (nếu chưa có):
   - Download: https://git-scm.com/download/win
   - Cài đặt và restart terminal

2. **Khởi tạo Git repository**:
   ```bash
   cd web_ui
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Push lên GitHub**:
   ```bash
   git remote add origin https://github.com/quyetnguyenhuu10-web/demo_web.git
   git branch -M main
   git push -u origin main
   ```

### Nếu đã có repository:
```bash
cd web_ui
git add .
git commit -m "Update web app"
git push
```

---

## Bước 3: Deploy lên Railway (Khuyến nghị)

### 3.1. Tạo tài khoản Railway
1. Truy cập: https://railway.app
2. Đăng ký bằng GitHub (miễn phí)
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Chọn repository: `quyetnguyenhuu10-web/demo_web`
5. Chọn **Root Directory**: `web_ui` (nếu repo có nhiều thư mục)

### 3.2. Cấu hình Build
Railway sẽ tự động detect, nhưng bạn có thể kiểm tra:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node server.cjs`

### 3.3. Thêm Environment Variables
Vào tab **Variables** và thêm:

```
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4o-mini
CLERK_SECRET_KEY=sk_test_your-clerk-secret-key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable-key
```

**Lưu ý quan trọng**:
- `VITE_CLERK_PUBLISHABLE_KEY` phải có prefix `VITE_` để Vite build có thể đọc được
- Không commit các keys này vào Git (đã có trong `.gitignore`)

### 3.4. Deploy
- Railway sẽ tự động deploy
- Đợi build xong (2-3 phút)
- Railway sẽ cung cấp URL: `https://your-app.up.railway.app`

### 3.5. Cấu hình Clerk
1. Vào **Clerk Dashboard**: https://dashboard.clerk.com
2. **Settings** → **Domains**
3. Thêm domain Railway: `your-app.up.railway.app`
4. Cập nhật:
   - **Allowed Redirect URLs**: `https://your-app.up.railway.app/**`
   - **Allowed Sign-in URLs**: `https://your-app.up.railway.app/**`

---

## Bước 4: Test Production

1. Truy cập URL Railway
2. Đăng ký tài khoản mới
3. Kiểm tra:
   - ✅ App load được
   - ✅ Đăng nhập/đăng ký hoạt động
   - ✅ Chat với AI hoạt động
   - ✅ Model selector hoạt động

---

## 🔧 Troubleshooting

### Lỗi: "Cannot find module"
- Kiểm tra `package.json` có đầy đủ dependencies
- Chạy `npm install` lại

### Lỗi: "Build failed"
- Kiểm tra console log trên Railway
- Kiểm tra environment variables đã set chưa
- Kiểm tra `VITE_CLERK_PUBLISHABLE_KEY` có prefix `VITE_` chưa

### Lỗi: "Clerk authentication failed"
- Kiểm tra Clerk keys đã đúng chưa
- Kiểm tra Clerk Dashboard đã thêm domain chưa
- Kiểm tra redirect URLs trong Clerk

### App không load frontend
- Kiểm tra build command có chạy `npm run build` không
- Kiểm tra `NODE_ENV=production` đã set chưa
- Kiểm tra `dist/` folder có được tạo không

---

## 📝 Checklist

Trước khi deploy:
- [ ] Code đã push lên GitHub
- [ ] Đã test build local (`npm run build`)
- [ ] Đã có tất cả API keys (OpenAI, Clerk)
- [ ] Đã cập nhật Clerk Dashboard với production domain
- [ ] Đã set tất cả environment variables trên Railway

---

## 💡 Tips

1. **Railway tự động deploy** khi bạn push code mới lên GitHub
2. **Có thể dùng custom domain** (mua domain và cấu hình DNS)
3. **Free tier Railway** có 500 giờ/tháng - đủ cho development
4. **Monitor logs** trên Railway dashboard để debug

---

## 🎉 Xong!

Sau khi deploy xong, bạn sẽ có URL công khai để truy cập từ bất kỳ đâu!
