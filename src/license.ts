const SLUG = 'health-data-bridge';
const KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${KEY}:verdict`;
const API = 'https://api.sociobot.in/api/v1';

interface Verdict { token: string; valid: boolean; checkedAt: number }

export function captureLicense(): string | null {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return null;
  localStorage.setItem(KEY, token);
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', url.pathname + url.search + url.hash);
  return token;
}

export function cachedUnlock(): boolean {
  const saved = localStorage.getItem(VERDICT_KEY);
  if (!saved) return false;
  try {
    const verdict = JSON.parse(saved) as Verdict;
    return verdict.token === localStorage.getItem(KEY) && verdict.valid;
  } catch { return false; }
}

export async function verifyLicense(token = localStorage.getItem(KEY) || ''): Promise<boolean> {
  if (!token) return false;
  const cached = localStorage.getItem(VERDICT_KEY);
  if (cached) {
    const verdict = JSON.parse(cached) as Verdict;
    if (verdict.token === token && Date.now() - verdict.checkedAt < 86_400_000) return verdict.valid;
  }
  localStorage.setItem(KEY, token);
  try {
    const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error(`License check failed with ${response.status}`);
    const body = await response.json() as { valid: boolean };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ token, valid: body.valid, checkedAt: Date.now() }));
    return body.valid;
  } catch {
    if (!cached) return false;
    try {
      const verdict = JSON.parse(cached) as Verdict;
      return verdict.token === token && verdict.valid;
    } catch { return false; }
  }
}
