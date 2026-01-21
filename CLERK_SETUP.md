# Hướng dẫn tích hợp Clerk Authentication

## Bước 1: Cài đặt dependencies

```bash
npm install
```

## Bước 2: Lấy Clerk Keys

1. Đăng nhập vào [Clerk Dashboard](https://dashboard.clerk.com)
2. Chọn ứng dụng của bạn (hoặc tạo mới)
3. Vào **API Keys** → Copy:
   - **Publishable Key** (bắt đầu với `pk_`)
   - **Secret Key** (bắt đầu với `sk_`)

## Bước 3: Cấu hình Environment Variables

**Cách 1: Copy từ file mẫu (khuyến nghị)**
```bash
cd web_ui
copy env.example .env
```

**Cách 2: Tạo thủ công**

Tạo file `.env` trong thư mục `web_ui` với nội dung:

```env
# OpenAI
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o-mini

# Clerk (thay thế bằng keys thật của bạn)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable-key-here
CLERK_SECRET_KEY=sk_test_your-clerk-secret-key-here

# Server
PORT=3001
```

**Lưu ý:** 
- Với Vite, phải dùng prefix `VITE_` để expose biến môi trường ra frontend
- Backend dùng `CLERK_SECRET_KEY` (không có prefix)
- File `env.example` có template, bạn cần thay thế bằng keys thật của mình

## Bước 4: Cấu hình Clerk trong Frontend

File `src/config.js` đã được cập nhật để đọc Clerk keys từ env.

## Bước 5: Bảo vệ API Routes

Backend server (`server.cjs`) đã được cập nhật để verify Clerk tokens.

## Bước 6: Test

1. Chạy frontend: `npm run dev`
2. Chạy backend: `node server.cjs`
3. Mở browser → Bạn sẽ thấy Clerk Sign In/Sign Up UI
4. Đăng ký/Đăng nhập → Sử dụng app

## Lưu ý

- Clerk sẽ tự động redirect đến `/sign-in` nếu chưa đăng nhập
- Sau khi đăng nhập, user có thể sử dụng app bình thường
- API routes được bảo vệ, chỉ user đã đăng nhập mới có thể gọi
