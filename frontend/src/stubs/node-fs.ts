// Stub pour node:fs pour fetch-blob
// Ce fichier fournit les exports nécessaires pour fetch-blob dans un environnement browser

export function statSync(path: string): any {
  throw new Error('fs.statSync is not available in browser environment');
}

export function createReadStream(path: string): any {
  throw new Error('fs.createReadStream is not available in browser environment');
}

export const promises = {
  stat: () => Promise.reject(new Error('fs.promises.stat is not available in browser environment')),
  readFile: () => Promise.reject(new Error('fs.promises.readFile is not available in browser environment')),
};

