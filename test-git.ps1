# Script test đơn giản để kiểm tra PowerShell
Write-Host "Test 1: Hello World" -ForegroundColor Green
Write-Host "Test 2: Checking Git..." -ForegroundColor Yellow

try {
    $result = git --version 2>&1
    Write-Host "Git result: $result" -ForegroundColor Cyan
    Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "Test 3: Current directory" -ForegroundColor Yellow
Write-Host $PWD -ForegroundColor Cyan

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
