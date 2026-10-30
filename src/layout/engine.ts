import { CENTRE, DAYS, INK, MID, MUTED, PH, RULE, SHADE, STYLE, type Prim, type StyleSpec } from './spec';
import { DEFAULTS_NUM, hidden, ITEMS, text, WIDTH_MAX, WIDTH_MIN, type Item, type Settings } from './settings';

export type Measure = (s: string, size: number, bold?: boolean) => number;
export interface Layout {
  pages: [Prim[], Prim[], Prim[], Prim[]]; // review, plan, log left, log right (sheet coordinates)
  // screen-only +/- controls for the ruled-line count of each review section
  lineCtl: { key: 'becLines' | 'satLines' | 'impLines'; label: string; x: number; y: number; n: number; canAdd: boolean }[];
  // screen-only delete icons: pid is the page (0 review, 1 plan, 2 activity log)
  dels: { pid: number; item: Item; label: string; x: number; y: number }[];
}

const up = (s: string) => s.toUpperCase();
const spaced = (m: Measure, s: string, size: number, bold: boolean, tc: number) => m(s, size, bold) + tc * s.length;

// shrink size (and letter-spacing) until the text fits; last resort drop characters
function fit(m: Measure, s: string, maxW: number, size: number, tc: number, bold: boolean, min = 4.5) {
  let z = size, c = tc;
  while (z > min && spaced(m, s, z, bold, c) > maxW) { z = Math.max(min, z - 0.2); if (c > 0) c = Math.max(0.2, c - 0.15); }
  while (s.length > 1 && spaced(m, s, z, bold, c) > maxW) s = s.slice(0, -1);
  return { s, size: z, tc: c };
}

class Page {
  prims: Prim[] = [];
  dels: { item: Item; label: string; x: number; y: number }[] = [];
  constructor(readonly m: Measure) {}
  line(x1: number, y1: number, x2: number, y2: number, c = RULE, w = 0.6) { this.prims.push({ t: 'line', x1, y1, x2, y2, c, w }); }
  // draws text at (x, y) shrunk to maxW; returns the spaced width used
  text(x: number, y: number, s: string, maxW: number, size: number, o: { bold?: boolean; c?: string; tc?: number; key?: string } = {}) {
    if (!s) { if (o.key) this.prims.push({ t: 'text', x, y, s: '', size, bold: o.bold, c: o.c ?? INK, key: o.key }); return 0; }
    const f = fit(this.m, s, maxW, size, o.tc ?? 0, !!o.bold);
    this.prims.push({ t: 'text', x, y, s: f.s, size: f.size, bold: o.bold, c: o.c ?? INK, tc: f.tc || undefined, key: o.key });
    return spaced(this.m, f.s, f.size, !!o.bold, f.tc);
  }
  // column headers of one table. The narrow columns' headers share one size and letter-spacing (the
  // smallest any of them needs); the `fixed` wide column's header keeps its own size, so narrowing
  // a column never shrinks it.
  heads(y: number, items: { x: number; s: string; w: number; key: string; size?: number; tc?: number; fixed?: boolean }[]) {
    const fits = items.map((i) => fit(this.m, i.s, i.w, i.size ?? 8, i.tc ?? 1.8, true));
    const shared = fits.filter((_, k) => !items[k].fixed);
    const pick = !shared.length ? fits[0] : shared.reduce((a, b) => (b.size < a.size || (b.size === a.size && b.tc < a.tc) ? b : a));
    items.forEach((i, k) => {
      const z = i.fixed ? fits[k] : pick;
      let t = i.s;
      while (t.length > 1 && spaced(this.m, t, z.size, true, z.tc) > i.w) t = t.slice(0, -1);
      this.prims.push({ t: 'text', x: i.x, y, s: t, size: z.size, bold: true, c: INK, tc: z.tc, key: i.key });
    });
  }
  heading(x: number, y: number, s: string, maxW: number, key: string) { return this.text(x, y, up(s), maxW, 8.5, { bold: true, tc: 1.8, key }); }
  desc(x: number, y: number, s: string, maxW: number, key: string, size = 8) { return this.text(x, y, s, maxW, size, { c: MUTED, key }); }
}

function titleBlock(p: Page, s: Settings, st: StyleSpec, side: 0 | 1, base: number, titleKey: string, small: boolean) {
  const x0 = st.x0[side], x1 = st.x1[side];
  let titleMax = x1 - x0;
  if (!hidden(s, 'date')) {
    const label = up(text(s, 'dateLabel'));
    const w = label ? spaced(p.m, label, 7, false, 1.6) : 0;
    p.text(x1 - 106 - w, base, label, 90, 7, { c: MUTED, tc: 1.6, key: 'dateLabel' });
    p.line(x1 - 100, base + 2, x1, base + 2, INK, 0.8);
    p.dels.push({ item: 'date', label: 'date line', x: x1 - 120 - w, y: base - 9 });
    titleMax = x1 - 120 - w - 12 - x0;
  }
  p.text(x0, base, up(text(s, titleKey)), titleMax, 14, { bold: true, tc: 3.4, key: titleKey });
  if (hidden(s, 'days')) return;
  const r = small ? 6.6 : 7.2, step = small ? 18 : 19, cy = base + 22;
  DAYS.forEach((d, i) => {
    const cx = x1 - r - step * (6 - i);
    p.prims.push({ t: 'circle', cx, cy, r, stroke: INK, sw: 0.7 });
    p.prims.push({ t: 'text', x: cx, y: cy + 2.4, s: d, size: 7, c: INK, align: 'center' });
  });
  p.dels.push({ item: 'days', label: 'day circles', x: x1 - 2 * r - 6 * step - 14, y: cy - 5.5 });
}

// HOW TODAY WENT as 3 check boxes. Returns the baseline of whatever comes next.
function boxes(p: Page, s: Settings, st: StyleSpec, x0: number, x1: number): number {
  st.boxOff.forEach((o, i) => {
    p.prims.push({ t: 'rect', x: x0 + o, y: st.howBase + st.boxTopOff, w: 10, h: 10, stroke: INK, sw: 0.8 });
    const maxW = (i < 2 ? st.boxOff[i + 1] - 8 : x1 - x0) - o - 15;
    p.text(x0 + o + 15, st.howBase + st.boxLabelOff, up(text(s, `box${i + 1}`)), maxW, 7.6, { tc: 1.1, key: `box${i + 1}` });
  });
  return st.howBase + st.boxLabelOff + st.afterBox;
}

const capX0 = (x0: number) => x0 + 4 * 31 + 20 + 26;

// HOW TODAY WENT as circles 1..5. The caption sits beside them, or under them when it would get too small.
function rating(p: Page, s: Settings, st: StyleSpec, x0: number, x1: number): number {
  const top = st.howBase + st.ratingTopOff, cy = top + 10, capX = capX0(x0);
  for (let i = 0; i < 5; i++) {
    const cx = x0 + 10 + 31 * i;
    p.prims.push({ t: 'circle', cx, cy, r: 10, stroke: INK, sw: 0.9 });
    p.prims.push({ t: 'text', x: cx, y: cy + 3.2, s: String(i + 1), size: 9, c: INK, align: 'center' });
  }
  const cap = text(s, 'ratingCaption');
  if (!cap) { p.desc(capX0(x0), cy + 3, '', 0, 'ratingCaption', 7.4); return top + 20 + st.afterRating; }
  if (fit(p.m, cap, x1 - capX, 7.4, 0, false).size >= 6) { p.desc(capX, cy + 3, cap, x1 - capX, 'ratingCaption', 7.4); return top + 20 + st.afterRating; }
  p.desc(x0, top + 20 + 11, cap, x1 - x0, 'ratingCaption', 7.4);
  return top + 20 + 11 + 16;
}

const SECTIONS = [
  { n: 'bec', gap: 'gapBecause' },
  { n: 'sat', gap: 'gapOther' },
  { n: 'imp', gap: 'gapOther' },
] as const;

const CTL_W = 82; // room kept at the right of a review heading for the delete icon and the line +/- control

function review(s: Settings, m: Measure) {
  const st = STYLE, p = new Page(m), x0 = st.x0[0], x1 = st.x1[0];
  titleBlock(p, s, st, 0, st.titleBase, 'titleReview', false);
  const hw = p.heading(x0, st.howBase, text(s, 'howHead'), x1 - x0, 'howHead');
  p.desc(x0 + hw + 7, st.howBase, text(s, 'howDesc'), x1 - x0 - hw - 7, 'howDesc');
  let y = s.how === 'box' ? boxes(p, s, st, x0, x1) : rating(p, s, st, x0, x1);
  let bottom = 0;
  const ctl: Layout['lineCtl'] = [];
  for (const sec of SECTIONS) {
    if (hidden(s, sec.n)) continue;
    const label = text(s, sec.n + 'Head');
    const w = p.heading(x0, y, label, x1 - x0, sec.n + 'Head');
    p.desc(x0 + w + 7, y, text(s, sec.n + 'Desc'), x1 - x0 - w - 7 - CTL_W, sec.n + 'Desc');
    const key = (sec.n + 'Lines') as 'becLines', lines = s[key];
    for (let i = 0; i < lines; i++) p.line(x0, y + 8 + i * 22, x1, y + 8 + i * 22);
    ctl.push({ key, label, x: x1 - 52, y, n: lines, canAdd: false });
    p.dels.push({ item: sec.n, label: label.toLowerCase() + ' section', x: x1 - 68, y: y - 9 });
    bottom = y + 8 + (lines - 1) * 22;
    y = bottom + st[sec.gap];
  }
  return { p, bottom, limit: st.reviewBottom, ctl };
}

function plan(s: Settings, m: Measure) {
  const st = STYLE, p = new Page(m), x0 = st.x0[1], x1 = st.x1[1];
  titleBlock(p, s, st, 1, st.titleBase, 'titlePlan', false);
  const showTime = !hidden(s, 'time'), showTaken = !hidden(s, 'taken');
  const c2 = showTaken ? x1 - s.takenW : x1, c1 = showTime ? c2 - s.timeW : c2;
  const f = st.planFirst, step = (st.planLast - f) / st.planRows;
  const dflt = up(text(s, 'colTaken')) === 'TIME TAKEN'; // reference size for the default label
  const small = { size: dflt ? 6.8 : 8, tc: dflt ? 0.6 : 1.8 };
  p.heads(f - 5, [
    { x: x0 + 6, s: up(text(s, 'colTask')), w: c1 - x0 - 12, key: 'colTask', fixed: true, ...small },
    ...(showTime ? [{ x: c1 + 6, s: up(text(s, 'colTime')), w: s.timeW - 8, key: 'colTime' }] : []),
    ...(showTaken ? [{ x: c2 + 6, s: up(text(s, 'colTaken')), w: s.takenW - 8, key: 'colTaken', ...small }] : []),
  ]);
  for (let i = 0; i <= st.planRows; i++) p.line(x0, f + i * step, x1, f + i * step);
  if (showTime) {
    p.prims.push({ t: 'line', x1: c1, y1: f, x2: c1, y2: st.planLast, c: RULE, w: 0.6, drag: { key: 'timeW', anchor: c2, sign: -1, label: text(s, 'colTime') } });
    p.dels.push({ item: 'time', label: text(s, 'colTime').toLowerCase() + ' column', x: c1 + s.timeW / 2 - 5.5, y: f - 24 });
  }
  if (showTaken) {
    p.prims.push({ t: 'line', x1: c2, y1: f, x2: c2, y2: st.planLast, c: RULE, w: 0.6, drag: { key: 'takenW', anchor: x1, sign: -1, label: text(s, 'colTaken') } });
    p.dels.push({ item: 'taken', label: text(s, 'colTaken').toLowerCase() + ' column', x: c2 + s.takenW / 2 - 5.5, y: f - 24 });
  }
  return p;
}

function log(s: Settings, m: Measure, side: 0 | 1) {
  const st = STYLE, p = new Page(m), x0 = st.x0[side], x1 = st.x1[side];
  const step = (st.logLast - st.logFirst) / st.logRows;
  const rows = side === 0 ? st.logRows : Math.floor((st.logLast - st.logTopLimit) / step + 1e-6);
  const f = st.logLast - rows * step;
  if (side === 0) {
    titleBlock(p, s, st, 0, st.logTitleBase, 'titleLog', true);
    // stop short of the day circles so the subtitle never runs into them
    p.desc(x0, st.logTitleBase + 14, text(s, 'logSubtitle'), (hidden(s, 'days') ? x1 : x1 - 121.2 - 8) - x0, 'logSubtitle', 7.6);
  }
  const tx = x0 + s.logTimeW;
  p.prims.push({ t: 'rect', x: x0, y: f, w: s.logTimeW, h: st.logLast - f, fill: SHADE });
  p.heads(f - 5, [
    { x: x0 + 6, s: up(text(s, 'logTime')), w: s.logTimeW - 12, key: 'logTime' },
    { x: tx + 6, s: up(text(s, 'logWhat')), w: x1 - tx - 12, key: 'logWhat', fixed: true },
  ]);
  for (let i = 0; i <= rows; i++) p.line(x0, f + i * step, x1, f + i * step);
  p.prims.push({ t: 'line', x1: tx, y1: f, x2: tx, y2: st.logLast, c: RULE, w: 0.6, drag: { key: 'logTimeW', anchor: x0, sign: 1, label: text(s, 'logTime') } });
  return p;
}

const LINE_KEYS = ['becLines', 'satLines', 'impLines'] as const;
const overflows = (s: Settings, m: Measure) => { const r = review(s, m); return r.bottom > r.limit + 1e-6; };

export function layout(s: Settings, m: Measure): Layout {
  const rv = review(s, m), pl = plan(s, m), l0 = log(s, m, 0), l1 = log(s, m, 1);
  const pages = [rv.p.prims, pl.prims, l0.prims, l1.prims] as Layout['pages'];
  pages.forEach((prims) => prims.push({ t: 'line', x1: MID, y1: 16, x2: MID, y2: PH - 16, c: CENTRE, w: 0.8 }));
  const lineCtl = rv.ctl.map((c) => ({ ...c, canAdd: !overflows({ ...s, [c.key]: c.n + 1 }, m) }));
  const dels = [rv.p, pl, l0].flatMap((p, pid) => p.dels.map((d) => ({ pid, ...d })));
  return { pages, lineCtl, dels };
}

const clamp = (v: unknown, lo: number, hi: number, d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

// Clamp every value into its valid range so nothing can run off the page.
export function normalize(s: Settings, m: Measure): Settings {
  const d = DEFAULTS_NUM;
  const n: Settings = {
    ...s, text: { ...s.text },
    how: s.how === 'rating' ? 'rating' : 'box',
    off: ITEMS.map(([i]) => i).filter((i) => Array.isArray(s.off) && s.off.includes(i)),
    timeW: clamp(s.timeW, WIDTH_MIN, WIDTH_MAX, d.timeW),
    takenW: clamp(s.takenW, WIDTH_MIN, WIDTH_MAX, d.takenW),
    logTimeW: clamp(s.logTimeW, WIDTH_MIN, WIDTH_MAX, d.logTimeW),
    becLines: clamp(s.becLines, 1, 40, d.becLines), satLines: clamp(s.satLines, 1, 40, d.satLines), impLines: clamp(s.impLines, 1, 40, d.impLines),
  };
  // too many lines for the page (e.g. after a long rating caption wrapped): drop from the last section up
  while (overflows(n, m)) {
    const k = [...LINE_KEYS].reverse().find((key) => n[key] > 1);
    if (!k) break;
    n[k]--;
  }
  return n;
}
