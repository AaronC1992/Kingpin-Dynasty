Write-Host "🎮 From Dusk to Don - Image Fix Server Starter" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Get current directory
$currentDir = Get-Location
Write-Host "📁 Current directory: $currentDir" -ForegroundColor Yellow

# Check for required files
$requiredFiles = @("server.js", "index.html", "From DusktoDonLogo.png", "White male.png")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Some required files are missing. Make sure you're in the correct directory." -ForegroundColor Yellow
    Write-Host "Navigate to: c:\Users\jenna\OneDrive\Desktop\Portfolio projects\FromDuskToDon" -ForegroundColor Yellow
    Read-Host "Press Enter to continue anyway"
}

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# List PNG files
Write-Host ""
Write-Host "🖼️  Available image files:" -ForegroundColor Cyan
$pngFiles = Get-ChildItem -Filter "*.png" | Select-Object -First 10
if ($pngFiles.Count -gt 0) {
    foreach ($png in $pngFiles) {
        $sizeKB = [math]::Round($png.Length / 1024, 1)
        Write-Host "   • $($png.Name) (${sizeKB}KB)" -ForegroundColor White
    }
    if ((Get-ChildItem -Filter "*.png").Count -gt 10) {
        Write-Host "   ... and $((Get-ChildItem -Filter "*.png").Count - 10) more" -ForegroundColor Gray
    }
} else {
    Write-Host "   No PNG files found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting server..." -ForegroundColor Green
Write-Host "⚠️  Keep this window open while testing multiplayer!" -ForegroundColor Yellow
Write-Host ""

# Start the server
try {
    node server.js
} catch {
    Write-Host "❌ Error starting main server. Trying simple test server..." -ForegroundColor Red
    try {
        node simple-server.js
    } catch {
        Write-Host "❌ Could not start any server. Check Node.js installation." -ForegroundColor Red
        Read-Host "Press Enter to exit"
    }
}
