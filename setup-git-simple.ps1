# Script đơn giản để setup Git - Chạy từng bước
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Setup Git Repository" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Bước 1: Kiểm tra Git
Write-Host "Bước 1: Kiểm tra Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git đã được cài đặt: $gitVersion" -ForegroundColor Green
    } else {
        throw "Git not found"
    }
} catch {
    Write-Host "❌ Git chưa được cài đặt!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Vui lòng:" -ForegroundColor Yellow
    Write-Host "   1. Download Git từ: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "   2. Cài đặt Git" -ForegroundColor White
    Write-Host "   3. Restart PowerShell và chạy lại script này" -ForegroundColor White
    Write-Host ""
    Read-Host "Nhấn Enter để thoát"
    exit 1
}

Write-Host ""

# Bước 2: Kiểm tra repository
Write-Host "Bước 2: Kiểm tra Git repository..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "✅ Git repository đã tồn tại" -ForegroundColor Green
    Write-Host ""
    git status
    Write-Host ""
} else {
    Write-Host "📦 Khởi tạo Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository đã được khởi tạo" -ForegroundColor Green
    Write-Host ""
}

# Bước 3: Kiểm tra remote
Write-Host "Bước 3: Kiểm tra remote GitHub..." -ForegroundColor Yellow
$remoteUrl = ""
try {
    $remoteUrl = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Remote đã được cấu hình: $remoteUrl" -ForegroundColor Green
    } else {
        throw "No remote"
    }
} catch {
    Write-Host "📝 Chưa có remote GitHub" -ForegroundColor Yellow
    Write-Host ""
    $repoUrl = Read-Host "Nhập GitHub repository URL (ví dụ: https://github.com/quyetnguyenhuu10-web/demo_web.git)"
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "✅ Remote đã được thêm: $repoUrl" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Bỏ qua bước thêm remote" -ForegroundColor Yellow
    }
}

Write-Host ""

# Bước 4: Add files
Write-Host "Bước 4: Thêm files vào Git..." -ForegroundColor Yellow
git add .
$addedFiles = git status --short
if ($addedFiles) {
    Write-Host "✅ Đã thêm các files:" -ForegroundColor Green
    Write-Host $addedFiles
} else {
    Write-Host "ℹ️  Không có file nào cần thêm (có thể đã commit hết)" -ForegroundColor Cyan
}

Write-Host ""

# Bước 5: Commit
Write-Host "Bước 5: Commit changes..." -ForegroundColor Yellow
$commitMessage = Read-Host "Nhập commit message (hoặc Enter để dùng 'Update web app')"
if (-not $commitMessage) {
    $commitMessage = "Update web app"
}

git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Đã commit: $commitMessage" -ForegroundColor Green
} else {
    Write-Host "⚠️  Không có thay đổi để commit" -ForegroundColor Yellow
}

Write-Host ""

# Bước 6: Push
Write-Host "Bước 6: Push lên GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  Lưu ý: Nếu lần đầu push, bạn có thể cần đăng nhập GitHub" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Bạn có muốn push lên GitHub không? (y/n)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    git branch -M main
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Hoàn thành! Code đã được push lên GitHub." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Lỗi khi push. Kiểm tra:" -ForegroundColor Red
        Write-Host "   - Đã đăng nhập GitHub chưa?" -ForegroundColor Yellow
        Write-Host "   - Repository URL đúng chưa?" -ForegroundColor Yellow
        Write-Host "   - Có quyền push không?" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Đã bỏ qua bước push" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Hoàn thành!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
