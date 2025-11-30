const fs = require('fs');
const path = require('path');

console.log('🔧 WENZE: Exécution du correctif de dépendances...');

// Chemin vers le dossier stream-browserify dans node_modules
const streamPath = path.resolve(__dirname, '../node_modules/stream-browserify');
const targetFile = path.join(streamPath, 'web.js');

// Vérifie si stream-browserify est installé
if (fs.existsSync(streamPath)) {
  // Crée le fichier web.js s'il n'existe pas
  if (!fs.existsSync(targetFile)) {
    console.log('   → Création du fichier manquant: stream-browserify/web.js');
    // On crée un fichier qui exporte un objet vide, suffisant pour calmer le build
    fs.writeFileSync(targetFile, 'module.exports = {};');
  } else {
    console.log('   → Le fichier stream-browserify/web.js existe déjà.');
  }
} else {
  console.log('   ⚠️ Attention: stream-browserify non trouvé dans node_modules.');
}

console.log('✅ Correctif terminé.');

