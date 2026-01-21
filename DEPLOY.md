# Hướng dẫn Deploy Web App

Hướng dẫn này sẽ giúp bạn deploy web app lên server thật để có thể truy cập từ bất kỳ đâu.

## 📋 Tổng quan

App của bạn gồm 2 phần:
1. **Frontend** (React + Vite) - Giao diện người dùng
2. **Backend** (Express.js) - API server xử lý requests

## 🚀 Option 1: Deploy với Railway (Khuyến nghị - Dễ nhất)

Railway là platform tốt nhất cho full-stack apps, có free tier và rất dễ setup.

### Bước 1: Tạo tài khoản Railway

1. Truy cập: https://railway.app
2. Đăng ký bằng GitHub (miễn phí)
3. Tạo project mới

### Bước 2: Deploy Backend

1. Trong Railway dashboard, click **"New Project"** → **"Deploy from GitHub repo"**
2. Chọn repository của bạn
3. Railway sẽ tự detect Node.js app
4. Thêm **Environment Variables**:
   ```
   OPENAI_API_KEY=sk-your-key-here
   OPENAI_MODEL=gpt-4o-mini
   CLERK_SECRET_KEY=sk_test_your-key-here
   PORT=3001
   ```
5. Railway sẽ tự động deploy và cung cấp URL (ví dụ: `https://your-app.up.railway.app`)

### Bước 3: Deploy Frontend

1. Tạo **service mới** trong cùng project
2. Chọn **"Deploy from GitHub repo"** (cùng repo)
3. Trong **Settings** → **Build Command**: `npm run build`
4. Trong **Settings** → **Start Command**: `npm run preview` (hoặc dùng static hosting)
5. Thêm **Environment Variables**:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
   ```
6. **Quan trọng**: Cập nhật `vite.config.js` để proxy đến backend URL:
   ```javascript
   // Thay localhost:3001 bằng Railway backend URL
   target: process.env.UI_API_PROXY_TARGET || "https://your-backend.up.railway.app"
   ```

### Bước 4: Cấu hình Clerk

1. Vào Clerk Dashboard: https://dashboard.clerk.com
2. **Settings** → **Domains**
3. Thêm domain của Railway (ví dụ: `your-app.up.railway.app`)
4. Cập nhật **Allowed Redirect URLs** và **Allowed Sign-in URLs**

---

## 🌐 Option 2: Deploy với Render

Render cũng rất dễ sử dụng và có free tier.

### Bước 1: Tạo tài khoản Render

1. Truy cập: https://render.com
2. Đăng ký bằng GitHub (miễn phí)

### Bước 2: Deploy Backend

1. Dashboard → **New** → **Web Service**
2. Connect GitHub repository
3. Cấu hình:
   - **Name**: `your-app-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.cjs`
   - **Plan**: Free (hoặc Starter nếu cần)
4. Thêm **Environment Variables**:
   ```
   OPENAI_API_KEY=sk-your-key-here
   OPENAI_MODEL=gpt-4o-mini
   CLERK_SECRET_KEY=sk_test_your-key-here
   PORT=3001
   ```
5. Click **Create Web Service**

### Bước 3: Deploy Frontend

1. Dashboard → **New** → **Static Site**
2. Connect GitHub repository
3. Cấu hình:
   - **Name**: `your-app-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Thêm **Environment Variables**:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
   ```
5. **Quan trọng**: Tạo file `render.yaml` trong root project:
   ```yaml
   services:
     - type: web
       name: backend
       env: node
       buildCommand: npm install
       startCommand: node server.cjs
       envVars:
         - key: OPENAI_API_KEY
           sync: false
         - key: CLERK_SECRET_KEY
           sync: false
         - key: PORT
           value: 3001
   
     - type: web
       name: frontend
       env: static
       buildCommand: npm install && npm run build
       staticPublishPath: dist
       envVars:
         - key: VITE_CLERK_PUBLISHABLE_KEY
           sync: false
   ```

### Bước 4: Cấu hình Clerk

Tương tự như Railway, thêm domain Render vào Clerk Dashboard.

---

## ⚡ Option 3: Deploy với Vercel (Tốt cho Frontend)

Vercel tốt nhất cho frontend, backend có thể dùng serverless functions.

### Bước 1: Tạo tài khoản Vercel

1. Truy cập: https://vercel.com
2. Đăng ký bằng GitHub

### Bước 2: Deploy Frontend

1. Dashboard → **Add New Project**
2. Import GitHub repository
3. Cấu hình:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Thêm **Environment Variables**:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
   ```
5. Click **Deploy**

### Bước 3: Deploy Backend (Serverless Functions)

Tạo file `api/index.js` trong `web_ui`:
```javascript
// Vercel serverless function wrapper
module.exports = require('../server.cjs');
```

Tạo `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "OPENAI_API_KEY": "@openai_api_key",
    "CLERK_SECRET_KEY": "@clerk_secret_key"
  }
}
```

**Lưu ý**: Vercel serverless functions có timeout 10s (free) hoặc 60s (pro), có thể không phù hợp với streaming responses.

---

## 🔧 Option 4: Deploy với Fly.io (Tốt cho Node.js)

Fly.io tốt cho Node.js apps, có free tier.

### Bước 1: Cài đặt Fly CLI

```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

### Bước 2: Đăng nhập

```bash
fly auth login
```

### Bước 3: Tạo file `fly.toml`

Tạo file `fly.toml` trong `web_ui`:
```toml
app = "your-app-name"
primary_region = "sin"  # Singapore (gần Việt Nam)

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "3001"
  NODE_ENV = "production"

[[services]]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "GET"
    path = "/api/health"
```

### Bước 4: Deploy

```bash
cd web_ui
fly launch
# Chọn region (sin = Singapore)
# Thêm secrets:
fly secrets set OPENAI_API_KEY=sk-your-key-here
fly secrets set CLERK_SECRET_KEY=sk_test_your-key-here
fly deploy
```

---

## 📝 Checklist trước khi deploy

- [ ] Đã có tất cả API keys (OpenAI, Clerk)
- [ ] Đã test app trên local
- [ ] Đã cập nhật Clerk Dashboard với production domains
- [ ] Đã cập nhật `vite.config.js` với backend URL (nếu cần)
- [ ] Đã set tất cả environment variables trên hosting platform
- [ ] Đã kiểm tra CORS settings (nếu frontend và backend ở khác domain)

---

## 🔒 Security Notes

1. **Không commit `.env` file** - Đã có trong `.gitignore`
2. **Dùng environment variables** trên hosting platform
3. **Cập nhật Clerk domains** để chỉ cho phép production URLs
4. **Kiểm tra CORS** - Backend chỉ accept requests từ frontend domain

---

## 🆘 Troubleshooting

### Lỗi: "Cannot connect to backend"
- Kiểm tra backend URL trong `vite.config.js`
- Kiểm tra CORS settings trong `server.cjs`
- Kiểm tra environment variables

### Lỗi: "Clerk authentication failed"
- Kiểm tra Clerk keys đã đúng chưa
- Kiểm tra Clerk Dashboard đã thêm domain chưa
- Kiểm tra redirect URLs trong Clerk

### Lỗi: "OpenAI API error"
- Kiểm tra `OPENAI_API_KEY` đã set chưa
- Kiểm tra API key còn valid không
- Kiểm tra billing trên OpenAI account

---

## 💡 Khuyến nghị

**Cho người mới bắt đầu**: Dùng **Railway** - dễ nhất, free tier tốt, tự động detect và deploy.

**Cho production**: Dùng **Render** hoặc **Fly.io** - ổn định hơn, có monitoring tốt hơn.

**Cho frontend-only**: Dùng **Vercel** - tốt nhất cho static sites và React apps.

---

## 📚 Tài liệu tham khảo

- Railway: https://docs.railway.app
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Fly.io: https://fly.io/docs
