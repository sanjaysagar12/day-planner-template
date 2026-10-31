// Where a visitor came from (?platform=instagram | x | linkedin), shared by the prompt and the /api/collect route.
export interface Platform { id: string; name: string; idLabel: string; placeholder: string; ok: RegExp; hint: string }

export const PLATFORMS: Record<string, Platform> = {
  instagram: { id: 'instagram', name: 'Instagram', idLabel: 'Instagram username', placeholder: '@yourname', ok: /^[A-Za-z0-9._]{1,30}$/, hint: 'Use only letters, numbers, dots and underscores (up to 30).' },
  x: { id: 'x', name: 'X', idLabel: 'X username', placeholder: '@yourname', ok: /^[A-Za-z0-9_]{1,15}$/, hint: 'Use only letters, numbers and underscores (up to 15).' },
  linkedin: { id: 'linkedin', name: 'LinkedIn', idLabel: 'LinkedIn profile ID', placeholder: 'your-name', ok: /^[A-Za-z0-9%-]{3,100}$/, hint: 'Use the part after linkedin.com/in/ (letters, numbers and dashes).' },
  other: { id: 'other', name: 'social media', idLabel: 'Username or ID', placeholder: '@yourname', ok: /^[A-Za-z0-9._%-]{1,50}$/, hint: 'Use only letters, numbers, dots, dashes and underscores.' },
};
const ALIAS: Record<string, string> = { twitter: 'x', ig: 'instagram', insta: 'instagram', li: 'linkedin' };

export function platformOf(raw: unknown): Platform {
  const k = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return PLATFORMS[ALIAS[k] ?? k] ?? PLATFORMS.other;
}
