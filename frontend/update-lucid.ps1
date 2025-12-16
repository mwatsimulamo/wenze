# Script de mise à jour de lucid-cardano
# Ce script met à jour lucid-cardano vers la dernière version disponible

Write-Host "🔄 Mise à jour de lucid-cardano..." -ForegroundColor Cyan

# Vérifier la version actuelle
Write-Host "📦 Version actuelle de lucid-cardano:" -ForegroundColor Yellow
cd frontend
npm list lucid-cardano

# Vérifier la dernière version disponible
Write-Host "`n🔍 Vérification de la dernière version disponible..." -ForegroundColor Yellow
$latestVersion = npm view lucid-cardano version
Write-Host "✅ Dernière version disponible: $latestVersion" -ForegroundColor Green

# Mettre à jour vers la dernière version
Write-Host "`n⬆️  Mise à jour vers la dernière version..." -ForegroundColor Cyan
npm install lucid-cardano@latest

Write-Host "`n✅ Mise à jour terminée!" -ForegroundColor Green
Write-Host "📦 Nouvelle version installée:" -ForegroundColor Yellow
npm list lucid-cardano

Write-Host "`n💡 N'oubliez pas de redémarrer votre serveur de développement!" -ForegroundColor Cyan

