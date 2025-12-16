#!/bin/bash
# Script de mise à jour de lucid-cardano (Linux/Mac)
# Ce script met à jour lucid-cardano vers la dernière version disponible

echo "🔄 Mise à jour de lucid-cardano..."

# Aller dans le dossier frontend
cd "$(dirname "$0")/frontend" || exit 1

echo "📦 Vérification de la version actuelle de lucid-cardano..."
npm list lucid-cardano --depth=0 2>/dev/null | grep "lucid-cardano" || true

echo "🔍 Recherche de la dernière version disponible..."
LATEST_VERSION=$(npm view lucid-cardano version)
echo "Dernière version disponible: lucid-cardano@$LATEST_VERSION"

echo ""
echo "🚀 Installation de la dernière version de lucid-cardano..."
echo ""

# Installer la dernière version
if npm install lucid-cardano@latest; then
    echo ""
    echo "✅ lucid-cardano a été mis à jour avec succès!"
    
    # Afficher la nouvelle version
    echo "Nouvelle version installée:"
    npm list lucid-cardano --depth=0 2>/dev/null | grep "lucid-cardano"
    
    echo ""
    echo "📋 Prochaines étapes:"
    echo "1. Redémarrez votre serveur de développement (npm run dev)"
    echo "2. Testez à nouveau la transaction escrow"
    echo "3. Si le problème persiste, consultez la documentation de lucid-cardano pour PlutusV3"
else
    echo ""
    echo "❌ Erreur lors de la mise à jour de lucid-cardano"
    exit 1
fi

echo ""
echo "✨ Mise à jour terminée!"

