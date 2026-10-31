import type { APIRoute } from 'astro';
import { createSign } from 'node:crypto';
import { platformOf } from '../../platforms';
import { GOOGLE_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SHEET_ID } from 'astro:env/server';

export const prerender = false;

const BS = String.fromCharCode(92); // .env stores the key's line breaks as backslash + n
const b64 = (o: object | Buffer) => Buffer.from(o instanceof Buffer ? o : JSON.stringify(o)).toString('base64url');

// Service-account JWT -> access token -> append one row. No SDK needed for this.
async function appendRow(row: string[]) {
  const now = Math.floor(Date.now() / 1000);
  const head = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL, scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  })}`;
  const sig = createSign('RSA-SHA256').update(head).sign(GOOGLE_PRIVATE_KEY!.split(BS + 'n').join(String.fromCharCode(10)));
  const tok = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${b64(sig)}` }),
  }).then((r) => r.json());
  if (!tok.access_token) throw new Error('google auth failed');
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/A:C:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST', headers: { authorization: `Bearer ${tok.access_token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ values: [row] }),
  });
  if (!r.ok) throw new Error(`sheets ${r.status}`);
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  const pf = platformOf(body.platform); // unknown platforms are stored as "other"
  const name = typeof body.username === 'string' ? body.username.trim().replace(/^@/, '') : '';
  if (!pf.ok.test(name)) return new Response('invalid username', { status: 400 });
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) return new Response('not configured', { status: 503 });
  try { await appendRow([new Date().toISOString(), pf.id, name]); } catch { return new Response('save failed', { status: 502 }); }
  return new Response(null, { status: 204 });
};
