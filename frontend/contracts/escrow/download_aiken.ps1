# Script pour télécharger et installer Aiken directement

Write-Host "🚀 Installation Directe d'Aiken" -ForegroundColor Cyan
Write-Host ""

# Créer un dossier pour Aiken
$toolsDir = "$env:USERPROFILE\Tools\Aiken"
if (-not (Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
    Write-Host "✅ Dossier créé: $toolsDir" -ForegroundColor Green
}

Write-Host "📥 Téléchargement d'Aiken depuis GitHub..." -ForegroundColor Yellow

# URL de la dernière version (à mettre à jour si nécessaire)
$latestVersion = "v1.1.0"  # Mettez à jour avec la dernière version
$downloadUrl = "https://github.com/aiken-lang/aiken/releases/download/$latestVersion/aiken-$latestVersion-x86_64-pc-windows-msvc.zip"
$zipPath = "$env:TEMP\aiken.zip"
$extractPath = "$env:TEMP\aiken-extract"

try {
    # Télécharger
    Write-Host "Téléchargement en cours..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    
    # Extraire
    Write-Host "Extraction en cours..." -ForegroundColor Yellow
    if (Test-Path $extractPath) {
        Remove-Item -Recurse -Force $extractPath
    }
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
    
    # Copier aiken.exe
    $aikenExe = Get-ChildItem -Path $extractPath -Filter "aiken.exe" -Recurse | Select-Object -First 1
    if ($aikenExe) {
        Copy-Item $aikenExe.FullName -Destination "$toolsDir\aiken.exe" -Force
        Write-Host "✅ Aiken installé dans: $toolsDir" -ForegroundColor Green
    } else {
        Write-Host "❌ aiken.exe non trouvé dans l'archive" -ForegroundColor Red
        exit 1
    }
    
    # Ajouter au PATH utilisateur
    $currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ($currentPath -notlike "*$toolsDir*") {
        [Environment]::SetEnvironmentVariable('Path', "$currentPath;$toolsDir", 'User')
        Write-Host "Chemin ajoute au PATH utilisateur" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "✨ Installation terminée!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️ IMPORTANT: Fermez et rouvrez votre terminal PowerShell pour utiliser Aiken" -ForegroundColor Yellow
    Write-Host "   Ensuite, testez avec: aiken --version" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'installation: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Téléchargez manuellement depuis:" -ForegroundColor Yellow
    Write-Host "   https://github.com/aiken-lang/aiken/releases" -ForegroundColor Cyan
    Write-Host "   Extrayez aiken.exe et ajoutez-le au PATH" -ForegroundColor Yellow
}

