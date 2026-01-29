const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE_URL ?? 'https://api-m.sandbox.paypal.com';

/** Buffer before expiry (ms) so we refresh before the token actually expires */
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;

/**
 * Get PayPal OAuth2 access token for server-side API calls.
 * Tokens are cached in memory and reused until shortly before expiry.
 */
export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal auth failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  const expiresInMs = (data.expires_in ?? 32400) * 1000; // default ~9h if missing
  cached = {
    token: data.access_token,
    expiresAt: now + expiresInMs - EXPIRY_BUFFER_MS,
  };

  return cached.token;
}

export { PAYPAL_API_BASE };
