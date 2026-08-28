const SLUG = 'health-data-bridge';
const KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${KEY}:verdict`;
const API = 'https://api.sociobot.in/api/v1';

interface Verdict { valid: boolean; checkedAt: number }

export function captureLicense(): void {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(KEY, token);
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', url.pathname + url.search + url.hash);
}

export function cachedUnlock(): boolean {
  const saved = localStorage.getItem(VERDICT_KEY);
  if (!saved) return false;
  try { return (JSON.parse(saved) as Verdict).valid; } catch { return false; }
}

export async function verifyLicense(token = localStorage.getItem(KEY) || ''): Promise<boolean> {
  if (!token) return false;
  const cached = localStorage.getItem(VERDICT_KEY);
  if (cached) {
    const verdict = JSON.parse(cached) as Verdict;
    if (Date.now() - verdict.checkedAt < 86_400_000) return verdict.valid;
  }
  try {
    const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    const body = await response.json() as { valid: boolean };
    localStorage.setItem(KEY, token);
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: body.valid, checkedAt: Date.now() }));
    return body.valid;
  } catch {
    return cachedUnlock();
  }
}

export function buyUrl(): string {
  return `${API}/products/${SLUG}/checkout`;
}
