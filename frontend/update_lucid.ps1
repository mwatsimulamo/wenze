# Script de mise à jour de lucid-cardano
# Ce script met à jour lucid-cardano vers la dernière version disponible

Write-Host "🔄 Mise à jour de lucid-cardano..." -ForegroundColor Cyan

# Aller dans le dossier frontend
$frontendPath = Join-Path $PSScriptRoot "frontend"
if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Erreur: Le dossier frontend n'existe pas dans $PSScriptRoot" -ForegroundColor Red
    exit 1
}

Set-Location $frontendPath

Write-Host "📦 Vérification de la version actuelle de lucid-cardano..." -ForegroundColor Yellow
$currentVersion = npm list lucid-cardano --depth=0 2>$null | Select-String "lucid-cardano"
Write-Host "Version actuelle: $currentVersion" -ForegroundColor Gray

Write-Host "🔍 Recherche de la dernière version disponible..." -ForegroundColor Yellow
$latestVersion = npm view lucid-cardano version
Write-Host "Dernière version disponible: lucid-cardano@$latestVersion" -ForegroundColor Green

# Vérifier si une mise à jour est nécessaire
$packageJsonPath = Join-Path $frontendPath "package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    $currentVersionInPackage = $packageJson.dependencies.'lucid-cardano'
    
    if ($currentVersionInPackage -match '\^0\.10\.11' -or $currentVersionInPackage -match '0\.10\.11') {
        Write-Host "📝 Version dans package.json: $currentVersionInPackage" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🚀 Installation de la dernière version de lucid-cardano..." -ForegroundColor Cyan
Write-Host ""

try {
    # Installer la dernière version
    npm install lucid-cardano@latest
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ lucid-cardano a été mis à jour avec succès!" -ForegroundColor Green
        
        # Afficher la nouvelle version
        $newVersion = npm list lucid-cardano --depth=0 2>$null | Select-String "lucid-cardano"
        Write-Host "Nouvelle version installée: $newVersion" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "📋 Prochaines étapes:" -ForegroundColor Yellow
        Write-Host "1. Redémarrez votre serveur de développement (npm run dev)" -ForegroundColor White
        Write-Host "2. Testez à nouveau la transaction escrow" -ForegroundColor White
        Write-Host "3. Si le problème persiste, consultez la documentation de lucid-cardano pour PlutusV3" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Erreur lors de la mise à jour de lucid-cardano" -ForegroundColor Red
        Write-Host "Code de sortie: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de la mise à jour:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ Mise à jour terminée!" -ForegroundColor Green

