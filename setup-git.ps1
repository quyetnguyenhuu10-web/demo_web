# Script to setup Git and push code to GitHub
# Run this script after installing Git

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Git repository..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Git
Write-Host "Step 1: Checking Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Git is installed: $gitVersion" -ForegroundColor Green
    } else {
        throw "Git not found"
    }
} catch {
    Write-Host "Git is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "   1. Download Git from: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "   2. Install Git" -ForegroundColor White
    Write-Host "   3. Restart PowerShell and run this script again" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Check if .git exists
Write-Host "Step 2: Checking Git repository..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "Git repository already exists" -ForegroundColor Green
    Write-Host ""
    git status
    Write-Host ""
} else {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Git repository initialized" -ForegroundColor Green
    } else {
        Write-Host "Error initializing repository" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Check remote
Write-Host "Step 3: Checking GitHub remote..." -ForegroundColor Yellow
$remoteUrl = ""
try {
    $remoteUrl = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0 -and $remoteUrl) {
        Write-Host "Remote is configured: $remoteUrl" -ForegroundColor Green
    } else {
        throw "No remote"
    }
} catch {
    Write-Host "No GitHub remote found" -ForegroundColor Yellow
    Write-Host ""
    $repoUrl = Read-Host "Enter GitHub repository URL (e.g., https://github.com/username/repo.git)"
    if ($repoUrl) {
        git remote add origin $repoUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Remote added: $repoUrl" -ForegroundColor Green
        } else {
            Write-Host "Error adding remote" -ForegroundColor Red
        }
    } else {
        Write-Host "Skipped adding remote" -ForegroundColor Yellow
    }
}
Write-Host ""

# Add and commit
Write-Host "Step 4: Adding files to Git..." -ForegroundColor Yellow
git add .
$addedFiles = git status --short
if ($addedFiles) {
    Write-Host "Files added:" -ForegroundColor Green
    Write-Host $addedFiles
} else {
    Write-Host "No files to add (may already be committed)" -ForegroundColor Cyan
}
Write-Host ""

Write-Host "Step 5: Committing changes..." -ForegroundColor Yellow
$commitMessage = Read-Host "Enter commit message (or press Enter for 'Update web app')"
if (-not $commitMessage) {
    $commitMessage = "Update web app"
}

git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "Committed: $commitMessage" -ForegroundColor Green
} else {
    Write-Host "No changes to commit" -ForegroundColor Yellow
}
Write-Host ""

# Push
Write-Host "Step 6: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "Note: First time push may require GitHub login" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Do you want to push to GitHub? (y/n)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    git branch -M main
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Success! Code has been pushed to GitHub." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Error pushing. Check:" -ForegroundColor Red
        Write-Host "   - Are you logged in to GitHub?" -ForegroundColor Yellow
        Write-Host "   - Is the repository URL correct?" -ForegroundColor Yellow
        Write-Host "   - Do you have push permissions?" -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipped push" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
