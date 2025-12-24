// Stub pour node:url pour node-fetch
// Ce fichier fournit les exports nécessaires pour node-fetch dans un environnement browser

export function format(urlObject: any): string {
  // Stub minimal - utiliser l'URL native du navigateur
  try {
    const url = new URL(urlObject.href || urlObject.pathname || '/');
    if (urlObject.search) {
      url.search = urlObject.search;
    }
    return url.toString();
  } catch {
    return urlObject.href || urlObject.pathname || '/';
  }
}

