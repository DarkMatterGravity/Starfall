# Deploy script for Journey -> Journey-app (public with Staticrypt)
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"

$PUBLIC_REPO = "https://github.com/DarkMatterGravity/Journey-app.git"
$PASSWORD = "DrToppGear"
$DEPLOY_DIR = ".deploy-temp"

Write-Host "=== Deploying Journey to GitHub Pages ===" -ForegroundColor Cyan

# Clean up any previous deploy directory
if (Test-Path $DEPLOY_DIR) {
    Remove-Item -Recurse -Force $DEPLOY_DIR
}

# Create deploy directory
New-Item -ItemType Directory -Path $DEPLOY_DIR | Out-Null

# Copy all necessary files
Write-Host "Copying files..." -ForegroundColor Yellow
Copy-Item "index.html" -Destination $DEPLOY_DIR
Copy-Item "three-background.js" -Destination $DEPLOY_DIR
Copy-Item -Recurse "Mesh" -Destination $DEPLOY_DIR

# Run staticrypt on index.html
Write-Host "Encrypting with Staticrypt..." -ForegroundColor Yellow
Push-Location $DEPLOY_DIR
# Encrypt to 'encrypted' folder, then replace original
staticrypt index.html -p $PASSWORD --remember 30 --short
Move-Item -Force "encrypted\index.html" "index.html"
Remove-Item -Recurse -Force "encrypted"
Remove-Item -Force ".staticrypt.json" -ErrorAction SilentlyContinue
Pop-Location

# Initialize git and push to public repo
Write-Host "Pushing to public repo..." -ForegroundColor Yellow
Push-Location $DEPLOY_DIR
git init
git add -A
git commit -m "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git branch -M main
git remote add origin $PUBLIC_REPO
git push -f origin main
Pop-Location

# Clean up
Remove-Item -Recurse -Force $DEPLOY_DIR

Write-Host "=== Deployed! ===" -ForegroundColor Green
Write-Host "Site: https://darkmattergravity.github.io/Journey-app/" -ForegroundColor Cyan
