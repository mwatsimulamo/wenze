# Simple script to install Aiken on Windows
Write-Host "Installing Aiken..." -ForegroundColor Cyan

# Create tools directory
$toolsDir = "$env:USERPROFILE\Tools\Aiken"
if (-not (Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
    Write-Host "Created directory: $toolsDir" -ForegroundColor Green
}

Write-Host "Downloading Aiken from GitHub..." -ForegroundColor Yellow

# Latest version URL
$latestVersion = "v1.1.0"
$downloadUrl = "https://github.com/aiken-lang/aiken/releases/download/$latestVersion/aiken-$latestVersion-x86_64-pc-windows-msvc.zip"
$zipPath = "$env:TEMP\aiken.zip"
$extractPath = "$env:TEMP\aiken-extract"

try {
    # Download
    Write-Host "Downloading..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    
    # Extract
    Write-Host "Extracting..." -ForegroundColor Yellow
    if (Test-Path $extractPath) {
        Remove-Item -Recurse -Force $extractPath
    }
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
    
    # Copy aiken.exe
    $aikenExe = Get-ChildItem -Path $extractPath -Filter "aiken.exe" -Recurse | Select-Object -First 1
    if ($aikenExe) {
        Copy-Item $aikenExe.FullName -Destination "$toolsDir\aiken.exe" -Force
        Write-Host "Aiken installed in: $toolsDir" -ForegroundColor Green
    } else {
        Write-Host "ERROR: aiken.exe not found in archive" -ForegroundColor Red
        exit 1
    }
    
    # Add to PATH
    $currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ($currentPath -notlike "*$toolsDir*") {
        [Environment]::SetEnvironmentVariable('Path', "$currentPath;$toolsDir", 'User')
        Write-Host "Added to PATH" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Close and reopen your terminal to use Aiken" -ForegroundColor Yellow
    Write-Host "   Then test with: aiken --version" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "Error during installation: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Download manually from:" -ForegroundColor Yellow
    Write-Host "   https://github.com/aiken-lang/aiken/releases" -ForegroundColor Cyan
    Write-Host "   Extract aiken.exe and add it to PATH" -ForegroundColor Yellow
}


