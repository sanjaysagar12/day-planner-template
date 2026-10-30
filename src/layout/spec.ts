// Measurements taken from the 4 reference PDFs (tools/dump*.py, tools/streams.py).
// PDF points, A4 landscape, y measured from the top.

export const PW = 841.8898;
export const PH = 595.2756;
export const MID = PW / 2; // centre between the two pages
export const PAGE_W = MID;

export const INK = '#222222';
export const MUTED = '#777777';
export const RULE = '#b0b0b0';
export const SHADE = '#efefef';
export const CENTRE = '#7a7a7a';
export const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// column width = sign * (dividerX - anchor), written to settings[key]
export interface Drag { key: 'timeW' | 'takenW' | 'logTimeW'; anchor: number; sign: 1 | -1; label: string }

export type Prim =
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; c: string; w: number; drag?: Drag } // drag: a column divider the user can move
  | { t: 'rect'; x: number; y: number; w: number; h: number; fill?: string; stroke?: string; sw?: number; r?: number }
  | { t: 'circle'; cx: number; cy: number; r: number; stroke: string; sw: number }
  | { t: 'text'; x: number; y: number; s: string; size: number; bold?: boolean; c: string; tc?: number; align?: 'center'; key?: string }; // key: settings text key, makes it editable in the preview

export interface StyleSpec {
  x0: [number, number]; x1: [number, number]; // content left / right edge of [left, right] page
  titleBase: number; logTitleBase: number;
  howBase: number; // baseline of the first heading on DAY REVIEW
  boxTopOff: number; boxLabelOff: number; afterBox: number; boxOff: number[];
  ratingTopOff: number; afterRating: number;
  gapBecause: number; gapOther: number; // last line -> next heading baseline
  reviewBottom: number; // lowest allowed ruled line on DAY REVIEW
  planFirst: number; planLast: number;
  logFirst: number; logLast: number; logTopLimit: number;
  planRows: number; logRows: number; // plan rows, log rows (left page)
}

const BOTTOM_N = PH - 16; // 579.2756: 16pt outer margin
export const STYLE: StyleSpec = {
  x0: [16, 434.9449], x1: [406.9449, 825.8898], titleBase: 40, logTitleBase: 40,
  howBase: 100, boxTopOff: 7, boxLabelOff: 16, afterBox: 38, boxOff: [0, 135, 260],
  ratingTopOff: 11, afterRating: 23, gapBecause: 24, gapOther: 24, reviewBottom: BOTTOM_N,
  planFirst: 96, planLast: BOTTOM_N, logFirst: 88, logLast: BOTTOM_N, logTopLimit: 24,
  planRows: 22, logRows: 25,
};
