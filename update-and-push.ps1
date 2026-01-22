# Script to quickly update and push code to GitHub
# Railway will automatically deploy after push

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Updating and Pushing Code" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check current status
Write-Host "Checking Git status..." -ForegroundColor Yellow
git status
Write-Host ""

# Ask for commit message
$commitMessage = Read-Host "Enter commit message (or press Enter for 'Update web app')"
if (-not $commitMessage) {
    $commitMessage = "Update web app"
}

# Add, commit, and push
Write-Host ""
Write-Host "Adding files..." -ForegroundColor Yellow
git add .

Write-Host "Committing..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Success! Code pushed to GitHub." -ForegroundColor Green
        Write-Host "Railway will automatically deploy the changes." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Check deployment status at: https://railway.app" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "Error pushing to GitHub." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
