// things that can be removed from the template (the bin icons on the sheet; picking a template in the bar restores them)
export type Item = 'date' | 'days' | 'bec' | 'sat' | 'imp' | 'time' | 'taken';
export const ITEMS: [Item, string][] = [
  ['date', 'Date line'], ['days', 'Day circles (M T W T F S S)'], ['bec', 'Because section'], ['sat', 'Satisfied section'],
  ['imp', 'Improve section'], ['time', 'Plan: time column'], ['taken', 'Plan: time taken column'],
];
export const hidden = (s: Settings, i: Item) => s.off.includes(i);

export interface Settings {
  off: Item[]; // removed items
  how: 'box' | 'rating'; // HOW TODAY WENT: check boxes or 1-5 rating
  timeW: number; takenW: number; logTimeW: number; // column widths in pt
  becLines: number; satLines: number; impLines: number; // ruled lines in BECAUSE / SATISFIED / IMPROVE (they share the page)
  text: Record<string, string>; // overrides only; missing key = default
}

export const WIDTH_MIN = 30, WIDTH_MAX = 120;

export interface TextDef { key: string; label: string; group: string; max: number; req?: boolean; only?: 'box' | 'rating' }

// req: blank falls back to the default. Headings, titles and column headers render in capitals.
export const TEXTS: TextDef[] = [
  { key: 'titleReview', label: 'Page title', group: 'Day review page', max: 24, req: true },
  { key: 'dateLabel', label: 'Date label (all pages)', group: 'Day review page', max: 10 },
  { key: 'howHead', label: 'How today went: heading', group: 'Day review page', max: 24, req: true },
  { key: 'howDesc', label: 'How today went: description', group: 'Day review page', max: 60 },
  { key: 'box1', label: 'Check box 1', group: 'Day review page', max: 24, req: true, only: 'box' },
  { key: 'box2', label: 'Check box 2', group: 'Day review page', max: 24, req: true, only: 'box' },
  { key: 'box3', label: 'Check box 3', group: 'Day review page', max: 24, req: true, only: 'box' },
  { key: 'ratingCaption', label: 'Rating caption', group: 'Day review page', max: 60, only: 'rating' },
  { key: 'becHead', label: 'Because: heading', group: 'Day review page', max: 24, req: true },
  { key: 'becDesc', label: 'Because: description', group: 'Day review page', max: 60 },
  { key: 'satHead', label: 'Satisfied: heading', group: 'Day review page', max: 24, req: true },
  { key: 'satDesc', label: 'Satisfied: description', group: 'Day review page', max: 60 },
  { key: 'impHead', label: 'Improve: heading', group: 'Day review page', max: 24, req: true },
  { key: 'impDesc', label: 'Improve: description', group: 'Day review page', max: 60 },
  { key: 'titlePlan', label: 'Page title', group: 'Next day plan page', max: 24, req: true },
  { key: 'colTask', label: 'Column 1 header', group: 'Next day plan page', max: 14, req: true },
  { key: 'colTime', label: 'Column 2 header', group: 'Next day plan page', max: 14, req: true },
  { key: 'colTaken', label: 'Column 3 header', group: 'Next day plan page', max: 14, req: true },
  { key: 'titleLog', label: 'Page title', group: 'Activity log pages', max: 24, req: true },
  { key: 'logSubtitle', label: 'Subtitle', group: 'Activity log pages', max: 100 },
  { key: 'logTime', label: 'Time column header', group: 'Activity log pages', max: 14, req: true },
  { key: 'logWhat', label: 'Second column header', group: 'Activity log pages', max: 24, req: true },
];

const DEFAULTS: Record<string, string | ((s: Settings) => string)> = {
  titleReview: 'DAY REVIEW', titlePlan: 'NEXT DAY PLAN', titleLog: 'ACTIVITY LOG', dateLabel: 'DATE',
  logSubtitle: 'Log at any interval: 15, 30 or 60 minutes. Write the time and what you did.',
  howHead: 'HOW TODAY WENT',
  howDesc: (s) => (s.how === 'rating' ? 'Circle one, 1 to 5.' : 'Check one.'),
  box1: 'PEAK PRODUCTIVITY', box2: 'GOOD PROGRESS', box3: 'SHOULD IMPROVE',
  ratingCaption: '1 = should improve, 5 = peak productivity',
  becHead: 'BECAUSE', becDesc: 'What made today this way?',
  satHead: 'SATISFIED', satDesc: 'Things you feel good about today.',
  impHead: 'IMPROVE', impDesc: 'Things that should be better tomorrow.',
  colTask: 'TASK', colTime: 'SET TIME', colTaken: 'TIME TAKEN', logTime: 'TIME', logWhat: 'WHAT I DID',
};

export const defaultText = (key: string, s: Settings) => {
  const d = DEFAULTS[key];
  return typeof d === 'function' ? d(s) : d;
};

// effective text: the override or the default; required texts fall back when blank
export function text(s: Settings, key: string) {
  const def = TEXTS.find((t) => t.key === key);
  const v = s.text[key] ?? defaultText(key, s);
  return def?.req && !v.trim() ? defaultText(key, s) : v.trim();
}

// defaults follow the borderless reference PDFs
export const DEFAULTS_NUM = { timeW: 50, takenW: 50, logTimeW: 66, becLines: 3, satLines: 8, impLines: 8 };

export const defaultSettings = (): Settings => ({ off: [], how: 'box', ...DEFAULTS_NUM, text: {} });
