# 📦 Hướng dẫn Setup Git và Push Code

## Bước 1: Cài đặt Git (Nếu chưa có)

1. **Download Git for Windows**:
   - Truy cập: https://git-scm.com/download/win
   - Download và cài đặt
   - **Quan trọng**: Chọn "Git from the command line and also from 3rd-party software" khi cài

2. **Restart Terminal/PowerShell** sau khi cài xong

3. **Kiểm tra Git đã cài**:
   ```powershell
   git --version
   ```
   Nếu hiển thị version (ví dụ: `git version 2.43.0`) là đã cài thành công.

---

## Bước 2: Setup Git Repository

### Cách 1: Dùng Script tự động (Khuyến nghị)

1. Mở PowerShell trong thư mục `web_ui`
2. Chạy script:
   ```powershell
   .\setup-git.ps1
   ```
3. Làm theo hướng dẫn trên màn hình

### Cách 2: Chạy thủ công

1. **Mở PowerShell** trong thư mục `web_ui`

2. **Khởi tạo Git repository** (nếu chưa có):
   ```powershell
   git init
   ```

3. **Thêm tất cả files**:
   ```powershell
   git add .
   ```

4. **Commit**:
   ```powershell
   git commit -m "Initial commit - AI Agent Web App"
   ```

5. **Thêm remote GitHub**:
   ```powershell
   git remote add origin https://github.com/quyetnguyenhuu10-web/demo_web.git
   ```

6. **Đổi branch sang main**:
   ```powershell
   git branch -M main
   ```

7. **Push lên GitHub**:
   ```powershell
   git push -u origin main
   ```

---

## Bước 3: Cập nhật Code (Khi có thay đổi)

Sau khi sửa code, chạy các lệnh sau để cập nhật:

```powershell
cd web_ui
git add .
git commit -m "Mô tả thay đổi"
git push
```

---

## ⚠️ Lưu ý

1. **Không commit file `.env`** - Đã có trong `.gitignore`
2. **Không commit `node_modules/`** - Đã có trong `.gitignore`
3. **Không commit `dist/`** - Đã có trong `.gitignore` (Railway sẽ build tự động)

---

## 🔧 Troubleshooting

### Lỗi: "git is not recognized"
- Git chưa được cài đặt hoặc chưa restart terminal
- Cài Git và restart terminal

### Lỗi: "Permission denied" khi push
- Cần đăng nhập GitHub
- Dùng Personal Access Token thay vì password
- Hoặc dùng GitHub Desktop

### Lỗi: "remote origin already exists"
- Xóa remote cũ:
  ```powershell
  git remote remove origin
  ```
- Thêm lại:
  ```powershell
  git remote add origin https://github.com/quyetnguyenhuu10-web/demo_web.git
  ```

---

## ✅ Checklist

- [ ] Git đã được cài đặt
- [ ] Đã khởi tạo Git repository (`git init`)
- [ ] Đã thêm remote GitHub
- [ ] Đã commit và push code lên GitHub
- [ ] Code đã xuất hiện trên GitHub repository

---

Sau khi push xong, bạn có thể deploy lên Railway theo hướng dẫn trong `BUILD_AND_DEPLOY.md`!
