# 🔐 ABAC Implementation Guide - Hướng dẫn Triển khai ABAC

## Tổng quan

Hệ thống đã được triển khai **Attribute-Based Access Control (ABAC)** với 3 trạng thái xác thực và phân quyền:

### State Machine

```
State 0: Unauthenticated
  ↓ (Sign In/Sign Up)
State 1: Authenticated / Pending Approval
  ↓ (Admin/Trusted sets authorized: true)
State 2: Authorized
  ↓ (Admin sets trusted: true)
State 3: Trusted (có thể approve user khác)
  ↓ (Admin sets admin: true)
State 4: Admin (quyền cao nhất)
```

### Phân cấp quyền

- **User thường**: `authorized: true` - Chỉ sử dụng app
- **Trusted User**: `authorized: true` + `trusted: true` - Có thể approve user khác
- **Admin**: `authorized: true` + `admin: true` - Quyền cao nhất, có thể set trusted/admin

## Kiến trúc

### 1. Client-Side Gatekeeping

**File:** `src/ClerkWrapper.jsx`
- Sử dụng `<SignedIn>` và `<SignedOut>` để kiểm soát vòng đời UI
- Component `AuthorizationGate` kiểm tra `publicMetadata.authorized`
- Hiển thị `PendingApproval` component khi `authorized: false`

**File:** `src/App.jsx`
- Import `useUser` và `getToken` từ `@clerk/clerk-react`
- Gọi `requireAuthorization(user)` trước khi gửi API request
- Gửi Clerk token trong Authorization header

**File:** `src/auth-utils.js`
- `checkAuthorization(user)` - Kiểm tra trạng thái authorization
- `requireAuthorization(user)` - Throw error nếu không authorized

### 2. Server-Side API Shielding

**File:** `server.cjs`
- Middleware `requireAuthorization` kiểm tra `publicMetadata.authorized`
- Sử dụng Clerk Client API để lấy user metadata
- Trả về `403 PENDING_APPROVAL` nếu chưa được approve

## Cấu hình Clerk Metadata

### Bước 1: Set Public Metadata cho User

Sử dụng Clerk Management API hoặc Dashboard:

```javascript
// Clerk Management API
await clerkClient.users.updateUser(userId, {
  publicMetadata: {
    authorized: true  // Set thành true để authorize user
  }
});
```

### Bước 2: Default State

Mặc định, mọi user mới đăng ký sẽ có:
```json
{
  "publicMetadata": {
    "authorized": false
  }
}
```

## Quy trình Vận hành

### State 0: Unauthenticated
- **UI:** Hiển thị Clerk Sign In/Sign Up
- **API:** Tất cả requests bị chặn
- **Component:** `<SignedOut>`

### State 1: Authenticated / Pending
- **UI:** Hiển thị `PendingApproval` component
- **API:** Requests bị chặn với error `PENDING_APPROVAL`
- **Component:** `<SignedIn>` + `AuthorizationGate` (pending)
- **Metadata:** `publicMetadata.authorized === false`

### State 2: Authorized
- **UI:** Hiển thị full app
- **API:** Requests được phép, gửi kèm Clerk token
- **Component:** `<SignedIn>` + `AuthorizationGate` (authorized)
- **Metadata:** `publicMetadata.authorized === true`

### State 3: Trusted
- **UI:** Hiển thị full app
- **API:** Requests được phép
- **Quyền đặc biệt:** Có thể approve user khác (set `authorized: true`)
- **Metadata:** `publicMetadata.authorized === true` + `publicMetadata.trusted === true`

### State 4: Admin
- **UI:** Hiển thị full app
- **API:** Requests được phép
- **Quyền đặc biệt:** Có thể set `trusted: true` và `admin: true` cho user khác
- **Metadata:** `publicMetadata.authorized === true` + `publicMetadata.admin === true`

## API Endpoints

### POST `/api/chat/create`
- **Middleware:** `clerkMiddleware` → `requireAuthorization`
- **Headers:** `Authorization: Bearer <clerk-token>`
- **Response 403:** `{ error: "PENDING_APPROVAL", message: "..." }`

### GET `/api/chat/stream`
- **Middleware:** `clerkMiddleware` → `requireAuthorization`
- **Headers:** `Authorization: Bearer <clerk-token>`
- **Response 403:** `{ error: "PENDING_APPROVAL", message: "..." }`

## Admin Workflow

⚠️ **LƯU Ý BẢO MẬT:** Các scripts set admin đã bị khóa để tránh lạm dụng. Chỉ có thể set admin thủ công qua Clerk Dashboard hoặc Management API.

### Bước 1: Tạo tài khoản Admin đầu tiên

**Cách duy nhất - Clerk Dashboard:**

1. Đăng ký tài khoản đầu tiên qua Clerk Sign Up
2. Vào [Clerk Dashboard](https://dashboard.clerk.com)
3. Chọn ứng dụng → Users
4. Click vào user cần set làm admin
5. Vào tab "Metadata"
6. Thêm/Update Public Metadata:
   ```json
   {
     "authorized": true,
     "admin": true
   }
   ```

**Hoặc dùng Clerk Management API (nếu có quyền):**

```javascript
const { createClerkClient } = require("@clerk/backend");
const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

await client.users.updateUser(userId, {
  publicMetadata: {
    authorized: true,
    admin: true
  }
});
```

### Bước 2: Set Trusted User (Tùy chọn)

Nếu muốn ủy quyền cho user khác approve user, set trusted:

**Cách 1: Clerk Dashboard**
1. Vào Clerk Dashboard → Users
2. Chọn user muốn set làm trusted
3. Metadata → Update:
   ```json
   {
     "authorized": true,
     "trusted": true
   }
   ```

**Cách 2: Script (Chỉ admin)**
```bash
npm run trusted:set user@example.com
```

### Bước 3: Approve các user khác

**Admin hoặc Trusted User** có thể approve user khác:

**Cách 1: Clerk Dashboard**
1. Vào Clerk Dashboard → Users
2. Chọn user cần approve
3. Metadata → Update:
   ```json
   {
     "authorized": true
   }
   ```

**Cách 2: Script (Trusted User hoặc Admin)**
```bash
npm run user:approve user@example.com
```

### Bước 3: Quản lý Users

**List tất cả users (chỉ xem, không thể chỉnh sửa):**
```bash
npm run admin:list
```

Script này sẽ hiển thị:
- Tất cả users và email
- Trạng thái authorized
- Trạng thái admin
- Summary statistics

## Testing

### Test State 0 (Unauthenticated)
1. Sign out
2. Thử gọi API → Phải bị chặn bởi Clerk middleware

### Test State 1 (Pending)
1. Sign in với user mới
2. Kiểm tra `publicMetadata.authorized === false`
3. Thử gửi message → Phải thấy `PendingApproval` UI
4. Thử gọi API → Phải nhận `403 PENDING_APPROVAL`

### Test State 2 (Authorized)
1. Set `authorized: true` cho user
2. Refresh page
3. Phải thấy full app
4. Gửi message → Phải hoạt động bình thường

## Security Notes

1. **Client-side checks** chỉ để UX tốt hơn - không đủ để bảo mật
2. **Server-side checks** là bắt buộc và là nguồn sự thật duy nhất
3. **Public Metadata** có thể đọc được từ client, nhưng chỉ admin mới có thể update
4. **Clerk Token** được verify ở server để đảm bảo tính xác thực

## Troubleshooting

### User không thấy PendingApproval
- Kiểm tra `publicMetadata.authorized` trong Clerk Dashboard
- Kiểm tra console logs để xem state

### API trả về 403 nhưng user đã authorized
- Kiểm tra Clerk token có được gửi đúng không
- Kiểm tra `CLERK_SECRET_KEY` trong `.env`
- Kiểm tra server logs để xem error chi tiết

### Metadata không update
- Đảm bảo đang update đúng user ID
- Kiểm tra quyền admin trong Clerk Dashboard
- Refresh page sau khi update metadata
