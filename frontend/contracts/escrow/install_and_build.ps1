# Script PowerShell pour installer Aiken et compiler le contrat Escrow

Write-Host "🚀 Installation et Compilation du Contrat Escrow" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Aiken est installé
Write-Host "📋 Vérification de l'installation d'Aiken..." -ForegroundColor Yellow
try {
    $aikenVersion = aiken --version 2>&1
    Write-Host "✅ Aiken est déjà installé: $aikenVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Aiken n'est pas installé" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Installation d'Aiken..." -ForegroundColor Yellow
    
    # Vérifier si Rust/Cargo est installé
    try {
        $cargoVersion = cargo --version 2>&1
        Write-Host "✅ Cargo est installé: $cargoVersion" -ForegroundColor Green
        Write-Host "📥 Installation d'Aiken via Cargo..." -ForegroundColor Yellow
        cargo install aiken
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Aiken installé avec succès!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erreur lors de l'installation d'Aiken" -ForegroundColor Red
            Write-Host "💡 Essayez d'installer Rust d'abord: https://rustup.rs/" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "❌ Cargo n'est pas installé" -ForegroundColor Red
        Write-Host ""
        Write-Host "📥 Installation de Rust (nécessaire pour Aiken)..." -ForegroundColor Yellow
        Write-Host "💡 Veuillez installer Rust depuis https://rustup.rs/" -ForegroundColor Yellow
        Write-Host "   Ou téléchargez Aiken directement depuis:" -ForegroundColor Yellow
        Write-Host "   https://github.com/aiken-lang/aiken/releases" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host ""
Write-Host "🔨 Compilation du contrat Escrow..." -ForegroundColor Yellow

# Aller dans le dossier du contrat
$contractDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $contractDir

# Compiler le contrat
aiken build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Contrat compilé avec succès!" -ForegroundColor Green
    Write-Host "📁 Le contrat compilé se trouve dans: build/escrow.plutus" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de la compilation" -ForegroundColor Red
    Write-Host "💡 Vérifiez les erreurs ci-dessus et corrigez le contrat" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🧪 Vérification du contrat..." -ForegroundColor Yellow
aiken check

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Contrat vérifié avec succès!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️ Des erreurs ont été détectées lors de la vérification" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Terminé!" -ForegroundColor Green

