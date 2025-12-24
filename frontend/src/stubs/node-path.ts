// Stub pour node:path pour fetch-blob
// Ce fichier fournit les exports nécessaires pour fetch-blob dans un environnement browser

export function basename(path: string, ext?: string): string {
  // Utiliser l'API URL native du navigateur
  try {
    const url = new URL(path);
    const filename = url.pathname.split('/').pop() || '';
    return ext && filename.endsWith(ext) ? filename.slice(0, -ext.length) : filename;
  } catch {
    // Si ce n'est pas une URL, traiter comme un chemin
    const parts = path.split('/');
    const filename = parts[parts.length - 1] || '';
    return ext && filename.endsWith(ext) ? filename.slice(0, -ext.length) : filename;
  }
}

