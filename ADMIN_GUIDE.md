# 👑 Admin Guide - Hướng dẫn Quản trị

## Tạo tài khoản Admin đầu tiên

⚠️ **LƯU Ý BẢO MẬT:** Các scripts set admin đã bị khóa để tránh lạm dụng. Chỉ có thể set admin thủ công qua Clerk Dashboard hoặc Management API.

### Bước 1: Đăng ký tài khoản

1. Mở app và đăng ký tài khoản mới qua Clerk Sign Up
2. Ghi nhớ email hoặc user ID

### Bước 2: Set làm Admin (Chỉ qua Clerk Dashboard)

**Cách duy nhất - Clerk Dashboard:**

1. Vào [Clerk Dashboard](https://dashboard.clerk.com)
2. Chọn ứng dụng → Users
3. Click vào user cần set làm admin
4. Vào tab "Metadata"
5. Thêm/Update Public Metadata:
   ```json
   {
     "authorized": true,
     "admin": true
   }
   ```

### Bước 3: Xác nhận

Refresh app và đăng nhập lại. Bạn sẽ thấy full app với quyền admin.

## Quản lý Users

### List tất cả users

```bash
npm run admin:list
```

Output sẽ hiển thị:
- Tất cả users với email và ID
- Trạng thái `authorized` (✅/❌)
- Trạng thái `readonly` (Viewer) (✅/❌)
- Trạng thái `trusted` (✅/❌)
- Trạng thái `admin` (✅/❌)
- Summary statistics

## Viewer (Read-only) - Chế độ xem

### Khái niệm

**Viewer** là người dùng chỉ có thể **xem** app, **không thể tương tác** (không gửi tin nhắn, không approve user, không có quyền admin).

### Set Viewer (Read-only)

**Cách 1: Clerk Dashboard (Khuyến nghị)**
1. Vào [Clerk Dashboard](https://dashboard.clerk.com)
2. Users → Chọn user
3. Metadata → Update:
   ```json
   {
     "authorized": true,
     "readonly": true
   }
   ```

**Cách 2: Script (Chỉ admin chạy)**
```bash
npm run viewer:set user@example.com
```

### Đặc điểm Viewer

- ✅ Có thể xem toàn bộ app
- ✅ Có thể xem lịch sử chat
- ❌ **Không thể** gửi tin nhắn
- ❌ **Không thể** approve user
- ❌ **Không có** quyền admin

## Trusted Users - Người dùng tin cậy

### Khái niệm

**Trusted User** là người dùng được admin ủy quyền để approve (set `authorized: true`) cho user khác, nhưng **không có quyền admin**.

### Set Trusted User

**Cách 1: Clerk Dashboard (Khuyến nghị)**
1. Vào [Clerk Dashboard](https://dashboard.clerk.com)
2. Users → Chọn user
3. Metadata → Update:
   ```json
   {
     "authorized": true,
     "trusted": true
   }
   ```

**Cách 2: Script (Chỉ admin chạy)**
```bash
npm run trusted:set user@example.com
```

### Approve User (Trusted User hoặc Admin)

**Cách 1: Clerk Dashboard**
1. Vào [Clerk Dashboard](https://dashboard.clerk.com)
2. Users → Chọn user cần approve
3. Metadata → Update:
   ```json
   {
     "authorized": true
   }
   ```

**Cách 2: Script (Trusted User hoặc Admin)**
```bash
# Approve user
npm run user:approve user@example.com

# Nếu cần verify quyền trusted user
npm run user:approve user@example.com --trusted-user-id user_trusted123
```

**Cách 3: Clerk Management API**
```javascript
const { createClerkClient } = require("@clerk/backend");
const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

await client.users.updateUser(userId, {
  publicMetadata: {
    authorized: true
  }
});
```

## Metadata Schema

### User Metadata Structure

```json
{
  "publicMetadata": {
    "authorized": true,    // true = có quyền sử dụng app
    "readonly": true,      // true = chỉ xem, không tương tác (Viewer)
    "trusted": true,       // true = có thể approve user khác (không phải admin)
    "admin": true          // true = có quyền admin (quyền cao nhất)
  }
}
```

### Default State

Mọi user mới đăng ký sẽ có:
```json
{
  "publicMetadata": {
    "authorized": false,
    "readonly": false,
    "trusted": false,
    "admin": false
  }
}
```

### Phân cấp quyền

| Quyền | authorized | readonly | trusted | admin | Mô tả |
|-------|------------|----------|---------|-------|-------|
| **Viewer** | ✅ | ✅ | ❌ | ❌ | Chỉ xem, không tương tác |
| **User thường** | ✅ | ❌ | ❌ | ❌ | Sử dụng app bình thường |
| **Trusted User** | ✅ | ❌ | ✅ | ❌ | Có thể approve user khác |
| **Admin** | ✅ | ❌ | ✅ | ✅ | Quyền cao nhất, có thể set trusted/admin/viewer |

## Workflow thông thường

### 1. User mới đăng ký
- Tự động có `authorized: false`
- Hiển thị màn hình "Pending Approval"

### 2. Admin/Trusted User approve
- Admin hoặc Trusted User chạy: `npm run user:approve user@example.com`
- User được set `authorized: true`
- User refresh app → Thấy full app

### 3. Set Viewer (Read-only) (Chỉ Admin)
- Admin chạy: `npm run viewer:set user@example.com`
- User được set `authorized: true` và `readonly: true`
- Viewer chỉ có thể xem, không thể gửi tin nhắn hoặc tương tác

### 4. Set Trusted User (Chỉ Admin)
- Admin chạy: `npm run trusted:set user@example.com`
- User được set `authorized: true` và `trusted: true`
- Trusted User có thể approve user khác nhưng không có quyền admin

### 5. Set Admin (Chỉ qua Clerk Dashboard)
- Admin vào Clerk Dashboard → Set `admin: true` cho user
- User có quyền cao nhất, có thể set trusted/admin/viewer cho user khác

## Troubleshooting

### Script báo "CLERK_SECRET_KEY is not set"
- Kiểm tra file `.env` có `CLERK_SECRET_KEY` chưa
- Đảm bảo đang chạy script từ thư mục `web_ui`

### Script báo "User not found"
- Kiểm tra email/ID có đúng không
- Chạy `npm run admin:list` để xem danh sách users

### User vẫn thấy "Pending Approval" sau khi approve
- User cần refresh page hoặc sign out/sign in lại
- Clerk metadata có thể cache, cần thời gian sync

## Security Notes

⚠️ **Quan trọng:**
- Chỉ admin mới có thể set `admin: true` và `trusted: true` cho user khác
- Trusted User chỉ có thể set `authorized: true` cho user khác, không thể set `trusted` hoặc `admin`
- `CLERK_SECRET_KEY` phải được bảo mật, không commit vào git
- Scripts chỉ nên chạy trên server hoặc máy local của admin/trusted user
- Không share `CLERK_SECRET_KEY` với bất kỳ ai

## Advanced: Tự động hóa

Nếu muốn tự động approve user dựa trên email domain:

```javascript
// scripts/auto-approve-domain.js
const { clerkClient } = require("@clerk/backend");
const client = clerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const ALLOWED_DOMAINS = ["@company.com", "@trusted.org"];

async function autoApproveDomain(email) {
  const domain = "@" + email.split("@")[1];
  if (ALLOWED_DOMAINS.includes(domain)) {
    // Auto approve logic
  }
}
```
