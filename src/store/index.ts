import { defaultSettings, TEXTS, type Settings } from '../layout/settings';
import { normalize } from '../layout/engine';
import { measure } from '../layout/measure';

const KEY = 'planner.template.v4';

// only customization settings are stored, never daily data
export function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      if (raw.timeW === 60) delete raw.timeW; // old default width -> new default
      if (raw.takenW === 60) delete raw.takenW;
      const text: Record<string, string> = {};
      for (const t of TEXTS) if (typeof raw.text?.[t.key] === 'string') text[t.key] = raw.text[t.key].slice(0, t.max);
      return normalize({ ...defaultSettings(), ...raw, text }, measure);
    }
  } catch { /* corrupt or blocked storage: fall through to defaults */ }
  return defaultSettings();
}

export function saveSettings(s: Settings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full or blocked */ }
}
