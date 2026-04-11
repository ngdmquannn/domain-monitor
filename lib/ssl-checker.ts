import tls from "tls";

export interface SslInfo {
  valid: boolean;
  issuer: string | null;
  expiryDate: string | null;
  daysRemaining: number | null;
  error?: string;
}

const cache = new Map<string, { data: SslInfo; cachedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function probeSsl(host: string, servername: string): Promise<SslInfo> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ valid: false, issuer: null, expiryDate: null, daysRemaining: null, error: "Timeout" });
    }, 5000);

    try {
      const socket = tls.connect(
        { host, port: 443, servername, rejectUnauthorized: false },
        () => {
          clearTimeout(timeout);
          try {
            const cert = socket.getPeerCertificate();
            socket.destroy();

            if (!cert || !cert.valid_to) {
              resolve({ valid: false, issuer: null, expiryDate: null, daysRemaining: null, error: "No certificate" });
              return;
            }

            const expiryDate = new Date(cert.valid_to).toISOString();
            const daysRemaining = Math.ceil((new Date(cert.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const rawO = cert.issuer?.O;
            const rawCN = cert.issuer?.CN;
            const issuer = (Array.isArray(rawO) ? rawO[0] : rawO) ?? (Array.isArray(rawCN) ? rawCN[0] : rawCN) ?? null;
            const valid = socket.authorized || daysRemaining > 0;

            resolve({ valid, issuer, expiryDate, daysRemaining });
          } catch {
            socket.destroy();
            resolve({ valid: false, issuer: null, expiryDate: null, daysRemaining: null, error: "Parse error" });
          }
        }
      );

      socket.on("error", (err) => {
        clearTimeout(timeout);
        resolve({ valid: false, issuer: null, expiryDate: null, daysRemaining: null, error: err.message });
      });
    } catch (err) {
      clearTimeout(timeout);
      resolve({ valid: false, issuer: null, expiryDate: null, daysRemaining: null, error: err instanceof Error ? err.message : "Unknown" });
    }
  });
}

export async function checkSsl(domain: string): Promise<SslInfo> {
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const result = await probeSsl(domain, domain);
  cache.set(domain, { data: result, cachedAt: Date.now() });
  return result;
}
