# Hướng dẫn Setup Git - Chạy từng bước thủ công

Nếu script PowerShell không chạy được, bạn có thể chạy từng lệnh thủ công:

## Bước 1: Kiểm tra Git đã cài chưa

```powershell
git --version
```

Nếu hiện lỗi "git is not recognized", bạn cần:
1. Download Git từ: https://git-scm.com/download/win
2. Cài đặt Git
3. **Restart PowerShell** (quan trọng!)
4. Chạy lại `git --version`

## Bước 2: Khởi tạo Git repository

```powershell
cd "C:\Users\HP\OneDrive\Máy tính\AI_Agent\web_ui"
git init
```

## Bước 3: Thêm remote GitHub

```powershell
git remote add origin https://github.com/TEN_USERNAME/TEN_REPO.git
```

**Thay `TEN_USERNAME/TEN_REPO` bằng URL repository thật của bạn!**

Ví dụ:
```powershell
git remote add origin https://github.com/quyetnguyenhuu10-web/demo_web.git
```

Nếu đã có remote rồi, kiểm tra:
```powershell
git remote -v
```

## Bước 4: Thêm files vào Git

```powershell
git add .
```

Kiểm tra files đã được thêm:
```powershell
git status
```

## Bước 5: Commit

```powershell
git commit -m "Update web app"
```

## Bước 6: Push lên GitHub

```powershell
git branch -M main
git push -u origin main
```

**Lưu ý:** Lần đầu push, bạn sẽ được yêu cầu đăng nhập GitHub.

---

## Nếu gặp lỗi "Execution Policy"

Chạy lệnh này để cho phép chạy script:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Sau đó chạy lại script:
```powershell
.\setup-git.ps1
```

---

## Nếu vẫn không được

Chạy từng lệnh trên một, copy output và gửi cho tôi để debug!
