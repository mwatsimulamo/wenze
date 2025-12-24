// Stub pour node:util pour node-fetch
// Ce fichier fournit les exports nécessaires pour node-fetch dans un environnement browser

export const promisify = (fn: Function) => {
  return function(...args: any[]) {
    return Promise.resolve(fn(...args));
  };
};

export const types = {};

export const deprecate = (fn: Function, message: string) => {
  return fn;
};

