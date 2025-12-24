// Script postinstall pour créer le fichier stub stream-browserify/web.js
// Ce fichier est nécessaire car fetch-blob/streams.cjs importe stream-browserify/web
// qui n'existe pas dans le package stream-browserify

const fs = require('fs');
const path = require('path');

const stubFile = path.join(__dirname, '../node_modules/stream-browserify/web.js');
const stubDir = path.dirname(stubFile);

// Créer le répertoire s'il n'existe pas
if (!fs.existsSync(stubDir)) {
  console.log('stream-browserify not found, skipping stub creation');
  process.exit(0);
}

// Créer le fichier stub
const stubContent = `// Stub file for stream-browserify/web
// This file is needed because fetch-blob/streams.cjs imports stream-browserify/web
// which doesn't exist. We export the same content as stream-browserify.

module.exports = require('./index.js');
`;

try {
  fs.writeFileSync(stubFile, stubContent, 'utf8');
  console.log('✅ Created stream-browserify/web.js stub file');
} catch (error) {
  console.warn('⚠️ Could not create stream-browserify/web.js stub:', error.message);
  // Ne pas faire échouer l'installation si le fichier ne peut pas être créé
  process.exit(0);
}

