// Stub pour node:stream pour node-fetch
// Ce fichier fournit les exports nécessaires pour node-fetch dans un environnement browser

export class Stream {
  // Stub minimal pour Stream
  constructor() {}
}

export class PassThrough extends Stream {
  // Stub minimal pour PassThrough
  constructor() {
    super();
  }
}

export function pipeline(...streams: any[]): Promise<void> {
  // Stub minimal pour pipeline
  return Promise.resolve();
}

export default Stream;

