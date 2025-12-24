// Stub pour node:buffer pour node-fetch
// Buffer est déjà disponible globalement via nodePolyfills

export const Buffer = globalThis.Buffer || (global as any).Buffer;

