# Script to fix Git configuration and complete setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Git Configuration" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check current Git config
Write-Host "Current Git configuration:" -ForegroundColor Yellow
git config --global user.name
git config --global user.email
Write-Host ""

# Configure Git if needed
$currentName = git config --global user.name
$currentEmail = git config --global user.email

if (-not $currentName -or -not $currentEmail) {
    Write-Host "Git needs to be configured with your name and email." -ForegroundColor Yellow
    Write-Host ""
    
    if (-not $currentName) {
        $name = Read-Host "Enter your name (e.g., Your Name)"
        if ($name) {
            git config --global user.name $name
            Write-Host "Name configured: $name" -ForegroundColor Green
        }
    }
    
    if (-not $currentEmail) {
        $email = Read-Host "Enter your email (e.g., your.email@example.com)"
        if ($email) {
            git config --global user.email $email
            Write-Host "Email configured: $email" -ForegroundColor Green
        }
    }
    Write-Host ""
}

# Now commit
Write-Host "Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "Initial commit - AI Agent Web App"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit successful!" -ForegroundColor Green
    Write-Host ""
    
    # Push
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git branch -M main
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Success! Code has been pushed to GitHub." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Error pushing. You may need to:" -ForegroundColor Red
        Write-Host "   1. Login to GitHub (browser will open)" -ForegroundColor Yellow
        Write-Host "   2. Or use GitHub Personal Access Token" -ForegroundColor Yellow
    }
} else {
    Write-Host "Error committing. Check Git configuration." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
