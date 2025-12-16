#!/bin/bash
# Script de mise à jour de lucid-cardano
# Ce script met à jour lucid-cardano vers la dernière version disponible

echo "🔄 Mise à jour de lucid-cardano..."

# Vérifier la version actuelle
echo "📦 Version actuelle de lucid-cardano:"
cd frontend
npm list lucid-cardano

# Vérifier la dernière version disponible
echo ""
echo "🔍 Vérification de la dernière version disponible..."
LATEST_VERSION=$(npm view lucid-cardano version)
echo "✅ Dernière version disponible: $LATEST_VERSION"

# Mettre à jour vers la dernière version
echo ""
echo "⬆️  Mise à jour vers la dernière version..."
npm install lucid-cardano@latest

echo ""
echo "✅ Mise à jour terminée!"
echo "📦 Nouvelle version installée:"
npm list lucid-cardano

echo ""
echo "💡 N'oubliez pas de redémarrer votre serveur de développement!"

