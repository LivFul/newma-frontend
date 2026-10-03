// SHA-256 of a string's UTF-8 bytes via Web Crypto (browser and Node), lowercase hex.
export class Sha256UnavailableError extends Error {
  constructor() {
    super("crypto.subtle is unavailable (it needs a secure context: https or localhost).");
    this.name = "Sha256UnavailableError";
  }
}

export async function sha256Hex(text: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Sha256UnavailableError();
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
