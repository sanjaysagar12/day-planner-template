import { useEffect, useRef, useState } from 'react';
import { MID, PAGE_W, PH, PW, type Drag, type Prim } from '../layout/spec';
import type { Layout } from '../layout/engine';
import { measure } from '../layout/measure';
import { defaultText, TEXTS, WIDTH_MAX, WIDTH_MIN, type Settings } from '../layout/settings';

const FONT = 'Helvetica, Arial, sans-serif';
const UPPER = /Head$|^title|^col|^log(Time|What)$|^box\d|^dateLabel$/; // rendered in capitals
type Edit = { id: string; key: string } | null;
export interface EditProps { s: Settings; update: (f: (s: Settings) => Settings) => void }

const style = (p: Extract<Prim, { t: 'text' }>) => ({ letterSpacing: p.tc ? `${p.tc}px` : undefined, fontKerning: 'none' as const });

function Static({ p }: { p: Prim }) {
  switch (p.t) {
    case 'line':
      return <line className={p.x1 === MID && p.x2 === MID ? 'cl' : undefined} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={p.c} strokeWidth={p.w} />;
    case 'rect':
      return <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} fill={p.fill ?? 'none'} stroke={p.stroke} strokeWidth={p.sw} />;
    case 'circle':
      return <circle cx={p.cx} cy={p.cy} r={p.r} fill="none" stroke={p.stroke} strokeWidth={p.sw} />;
    case 'text':
      return (
        <text x={p.x} y={p.y} fontSize={p.size} fontWeight={p.bold ? 700 : 400} fill={p.c} fontFamily={FONT}
          textAnchor={p.align === 'center' ? 'middle' : 'start'} style={style(p)}>{p.s}</text>
      );
  }
}

// Text with a settings key: click (or Enter) turns it into an input; every keystroke updates the sheet.
function Editable({ p, id, edit, setEdit, s, update, limit }: { p: Extract<Prim, { t: 'text' }>; id: string; edit: Edit; setEdit: (e: Edit) => void; limit: number } & EditProps) {
  const key = p.key!, def = TEXTS.find((t) => t.key === key)!;
  const raw = s.text[key] ?? defaultText(key, s);
  const w = measure(p.s, p.size, p.bold) + (p.tc ?? 0) * p.s.length;
  const hit = { x: p.x - 2, y: p.y - p.size * 1.05, w: Math.max(w + 4, 26), h: p.size * 1.4 };
  const ref = useRef<HTMLInputElement>(null);
  const editing = edit?.id === id;
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  const done = () => {
    setEdit(null);
    if (def.req && !raw.trim()) update((q) => { const t = { ...q.text }; delete t[key]; return { ...q, text: t }; }); // blank required text -> back to default
  };
  if (editing) {
    const size = Math.max(p.size, 8), width = Math.min(Math.max(w + 40, 150), limit - p.x);
    return (
      <foreignObject x={p.x - 3} y={p.y - size * 1.15} width={width} height={size * 1.7}>
        <input ref={ref} className="inline-edit" value={raw} maxLength={def.max} aria-label={def.label}
          style={{ fontSize: size, fontWeight: p.bold ? 700 : 400, letterSpacing: p.tc ? `${p.tc}px` : undefined, textTransform: UPPER.test(key) ? 'uppercase' : undefined, color: p.c === '#777777' ? '#444' : p.c }}
          onChange={(e) => update((q) => ({ ...q, text: { ...q.text, [key]: e.target.value } }))}
          onBlur={done}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); done(); } }} />
      </foreignObject>
    );
  }
  return (
    <g className="edit" role="button" tabIndex={0} aria-label={`Edit ${def.label}: ${raw || 'empty'}`}
      onClick={() => setEdit({ id, key })} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEdit({ id, key }); } }}>
      <rect className="hit" x={hit.x} y={hit.y} width={hit.w} height={hit.h} rx={2} />
      <Static p={p} />
    </g>
  );
}

// A column divider: drag it (or use the arrow keys) to resize the column next to it.
function Divider({ p, s, update }: { p: Extract<Prim, { t: 'line' }> } & EditProps) {
  const d = p.drag as Drag, width = s[d.key];
  const [drag, setDrag] = useState(false);
  const set = (w: number) => update((q) => ({ ...q, [d.key]: Math.round(w) }));
  const toX = (e: React.PointerEvent<SVGRectElement>) => {
    const svg = e.currentTarget.ownerSVGElement!, pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse()).x;
  };
  return (
    <g className={`divider${drag ? ' dragging' : ''}`}>
      <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={p.c} strokeWidth={p.w} />
      <line className="grip" x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />
      <rect x={p.x1 - 6} y={p.y1} width={12} height={p.y2 - p.y1} fill="transparent" tabIndex={0} role="separator" aria-orientation="vertical"
        aria-label={`Resize ${d.label} column`} aria-valuemin={WIDTH_MIN} aria-valuemax={WIDTH_MAX} aria-valuenow={width} aria-valuetext={`${width} points`}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag(true); }}
        onPointerMove={(e) => { if (drag) set(d.sign * (toX(e) - d.anchor)); }}
        onPointerUp={() => setDrag(false)} onPointerCancel={() => setDrag(false)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 5 : 1, dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (dir) { e.preventDefault(); set(width + dir * d.sign * step); }
        }} />
      {drag && <text className="gripnote" x={p.x1} y={p.y1 - 4} textAnchor="middle" fontSize={7} fontFamily={FONT}>{width} pt</text>}
    </g>
  );
}

// +/- for the ruled lines of one review section. The three sections share the page, so + is disabled
// until another section gives a line up.
function LineCtl({ c, update }: { c: Layout['lineCtl'][number]; update: EditProps['update'] }) {
  const step = (d: number) => update((q) => ({ ...q, [c.key]: q[c.key] + d }));
  const btn = (x: number, sign: '−' | '+', off: boolean, label: string, onClick: () => void) => (
    <g className={`lbtn${off ? ' off' : ''}`} role="button" tabIndex={off ? -1 : 0} aria-disabled={off} aria-label={label}
      onClick={() => !off && onClick()} onKeyDown={(e) => { if (!off && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}>
      <rect x={x} y={c.y - 9} width={11} height={11} rx={2} />
      <text x={x + 5.5} y={c.y - 0.6} textAnchor="middle" fontSize={9} fontFamily={FONT}>{sign}</text>
    </g>
  );
  return (
    <g className="linectl">
      <title>Lines are shared by Because, Satisfied and Improve</title>
      {btn(c.x, '−', c.n <= 1, `Remove a line from ${c.label} (now ${c.n})`, () => step(-1))}
      <text className="n" x={c.x + 26} y={c.y - 0.6} textAnchor="middle" fontSize={7} fontFamily={FONT}>{c.n} lines</text>
      {btn(c.x + 41, '+', !c.canAdd, c.canAdd ? `Add a line to ${c.label} (now ${c.n})` : `No room for another line in ${c.label}: remove one from another section first`, () => step(1))}
    </g>
  );
}

// Delete icon: removes an item from the template. Choosing Template 1 or 2 in the bottom bar puts removed items back.
function DelBtn({ d, update }: { d: Layout['dels'][number]; update: EditProps['update'] }) {
  const remove = () => update((q) => ({ ...q, off: [...q.off, d.item] }));
  return (
    <g className="delbtn" role="button" tabIndex={0} aria-label={`Remove ${d.label} from the template`}
      onClick={remove} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); remove(); } }}>
      <title>{`Remove ${d.label} (choose a template below to restore removed items)`}</title>
      <rect x={d.x} y={d.y} width={11} height={11} rx={2} />
      <path d={`M${d.x + 2.5} ${d.y + 3.4}h6M${d.x + 4.4} ${d.y + 3.4}v-1.1h2.2v1.1M${d.x + 3.4} ${d.y + 3.4}l.4 5h3.4l.4-5`} />
    </g>
  );
}

// One page of the sheet. Left pages show x 0..MID, right pages MID..PW, so two of them
// side by side are exactly the A4 landscape sheet.
function PageSvg({ prims, right, label, pid, edit, setEdit, ctl, dels, ...ep }: { prims: Prim[]; right: boolean; label: string; pid: number; edit: Edit; setEdit: (e: Edit) => void; ctl: Layout['lineCtl']; dels: Layout['dels'] } & EditProps) {
  const limit = right ? PW - 8 : MID - 8;
  return (
    <svg className="page" viewBox={`${right ? MID : 0} 0 ${PAGE_W} ${PH}`} role="group" aria-label={label}>
      {prims.map((p, i) => (p.t === 'text' && p.key
        ? <Editable key={i} p={p} id={`${pid}:${i}`} edit={edit} setEdit={setEdit} limit={limit} {...ep} />
        : p.t === 'line' && p.drag ? <Divider key={i} p={p} {...ep} />
        : <Static key={i} p={p} />))}
      {dels.filter((d) => d.pid === pid).map((d) => <DelBtn key={d.item} d={d} update={ep.update} />)}
      {pid === 0 && ctl.map((c) => <LineCtl key={c.key} c={c} update={ep.update} />)}
    </svg>
  );
}

export function Spreads({ layout, ...ep }: { layout: Layout } & EditProps) {
  const [edit, setEdit] = useState<Edit>(null);
  const names = ['Day review', 'Next day plan', 'Activity log', 'Activity log, continued'];
  return (
    <>
      {[0, 1].map((sp) => (
        <div className="spread" key={sp}>
          {[0, 1].map((i) => <PageSvg key={i} pid={sp * 2 + i} prims={layout.pages[sp * 2 + i]} right={i === 1} label={`Preview: ${names[sp * 2 + i]}`} edit={edit} setEdit={setEdit} ctl={layout.lineCtl} dels={layout.dels} {...ep} />)}
        </div>
      ))}
    </>
  );
}
