# Hướng dẫn Debug Clerk

## Cách xem Browser Console Logs

### Bước 1: Mở Developer Tools
- **Windows/Linux**: Nhấn `F12` hoặc `Ctrl + Shift + I`
- **Mac**: Nhấn `Cmd + Option + I`

### Bước 2: Chuyển sang tab Console
- Click vào tab **Console** ở trên cùng
- Đây là nơi hiển thị tất cả logs và errors

### Bước 3: Xem logs
Bạn sẽ thấy các logs như:
- `✅ Clerk key found: pk_test_...` → Key đã được đọc đúng
- `⚠️ Clerk Publishable Key chưa được cấu hình` → Key chưa được đọc
- `✅ ClerkWrapper: Initializing with key: ...` → Clerk đang được init
- Các lỗi màu đỏ → Cần fix

## Kiểm tra Clerk Key

### 1. Kiểm tra trong Console
Gõ lệnh này trong Console:
```javascript
console.log('Clerk Key:', import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
```

Nếu thấy `undefined` → Key chưa được đọc từ .env

### 2. Kiểm tra file .env
Đảm bảo file `.env` có (thay thế bằng key thật của bạn):
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable-key-here
```

**Lưu ý quan trọng:**
- Phải có prefix `VITE_` (không phải `NEXT_PUBLIC_`)
- Không có khoảng trắng trước/sau dấu `=`
- Sau khi sửa `.env`, phải **restart dev server** (`npm run dev`)

## Kiểm tra Network Requests

### Bước 1: Mở tab Network
- Trong Developer Tools, click tab **Network**

### Bước 2: Refresh trang
- Nhấn `F5` hoặc `Ctrl + R`

### Bước 3: Tìm requests đến Clerk
- Tìm các requests có domain `clerk.com` hoặc `clerk.accounts.dev`
- Nếu không thấy → Clerk chưa được init

## Nếu vẫn không thấy màn hình đăng nhập

1. **Kiểm tra Console có lỗi không**
2. **Kiểm tra Clerk key có được đọc không** (dùng lệnh console ở trên)
3. **Đảm bảo đã restart dev server** sau khi thêm keys
4. **Kiểm tra packages đã được cài chưa**: `npm install`
