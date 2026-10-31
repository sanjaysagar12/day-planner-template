import { useEffect, useRef, useState } from 'react';
import { platformOf, type Platform } from '../platforms';
import type { Drag } from '../layout/spec';
import type { Settings } from '../layout/settings';
import { downloadTemplate } from '../pdf/export'; // imported up front so it also works offline after load

type Update = (f: (s: Settings) => Settings) => void;

// Top of the page: Template 1 (check boxes) or Template 2 (1 to 5 rating).
export function TemplateSwitch({ s, update }: { s: Settings; update: Update }) {
  // choosing a template also puts back anything removed with the bin icons, so it works as a fresh start
  const pick = (how: Settings['how']) => update((p) => ({ ...p, how, off: [] }));
  return (
    <div className="tpl" role="group" aria-label="Template">
      <button type="button" aria-pressed={s.how === 'box'} onClick={() => pick('box')}
        title="Template 1: HOW TODAY WENT with check boxes. Also restores removed items.">
        <b>Template 1</b><small>Check boxes</small>
      </button>
      <button type="button" aria-pressed={s.how === 'rating'} onClick={() => pick('rating')}
        title="Template 2: HOW TODAY WENT with a 1 to 5 rating. Also restores removed items.">
        <b>Template 2</b><small>Rating 1 to 5</small>
      </button>
    </div>
  );
}

// Floating bottom bar: preview the finished sheet, download the PDF.
const ID_KEY = 'planner.gotSocialId'; // flag only (never the ID), set once a social ID was saved; skipping does not set it, so we ask again next time
const platformNow = () => platformOf(new URLSearchParams(location.search).get('platform'));
const asked = () => { try { return localStorage.getItem(ID_KEY) !== null; } catch { return true; } };

// First download only: optional username for the platform the visitor came from, then the PDF downloads either way.
function AskId({ pf, onDone }: { pf: Platform; onDone: (name: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [v, setV] = useState('');
  const name = v.trim().replace(/^@/, '');
  const bad = name !== '' && !pf.ok.test(name);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} className="ask" onCancel={(e) => { e.preventDefault(); onDone(''); }} aria-labelledby="ask-h">
      <form onSubmit={(e) => { e.preventDefault(); if (!bad) onDone(name); }}>
        <h2 id="ask-h">Get notified when the app launches</h2>
        <p>We're turning this planner into an app. Want a personal heads-up when it's ready? Enter your {pf.name} ID and we'll reach out. It's optional, and we only ask once.</p>
        <label>{pf.idLabel}
          <input value={v} onChange={(e) => setV(e.target.value)} placeholder={pf.placeholder} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={101} aria-invalid={bad} autoFocus />
        </label>
        {bad && <p className="ask-err" role="alert">{pf.hint}</p>}
        <div className="tour-b">
          <button type="button" onClick={() => onDone('')}>Skip and download</button>
          <button type="submit" className="go" disabled={bad}>Notify me and download</button>
        </div>
      </form>
    </dialog>
  );
}

export function Bar({ s, previewing, setPreviewing }: { s: Settings; previewing: boolean; setPreviewing: (v: boolean) => void }) {
  const [asking, setAsking] = useState<Platform | null>(null);
  const remember = () => { try { localStorage.setItem(ID_KEY, '1'); } catch { /* blocked storage: we may ask again next time */ } };
  const finish = (name: string) => {
    const pf = asking!;
    setAsking(null);
    downloadTemplate(s);
    if (!name) return; // skipped: nothing saved, no flag
    // flag only once the server confirms it saved, so a failed save is asked again next time
    fetch('/api/collect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ platform: pf.id, username: name }) })
      .then((res) => { if (res.ok) remember(); }).catch(() => {});
  };
  return (
    <>
    {asking && <AskId pf={asking} onDone={finish} />}
    <nav className="bar" aria-label="Template actions">
      <button type="button" className="act" aria-pressed={previewing} onClick={() => setPreviewing(!previewing)}
        title={previewing ? 'Back to editing' : 'See the sheet exactly as it will print'}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={previewing ? 'M4 20h4l10-10-4-4L4 16v4zM13 7l4 4' : 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z'} /></svg>
        <span>{previewing ? 'Edit' : 'Preview'}</span>
      </button>
      <button type="button" className="act download" onClick={() => (asked() ? downloadTemplate(s) : setAsking(platformNow()))} aria-label="Download template">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 20h16" /></svg>
        <span>Download<span className="long"> template</span></span>
      </button>
    </nav>
    </>
  );
}

// Appears above the bottom bar once a column line is selected: nudge it left or right without dragging.
export function ResizeBar({ d, width, update, onClose }: { d: Drag; width: number; update: Update; onClose: () => void }) {
  const move = (dir: number, big: boolean) => update((q) => ({ ...q, [d.key]: q[d.key] + dir * d.sign * (big ? 5 : 1) }));
  const btn = (dir: number, label: string, path: string) => (
    <button type="button" onClick={(e) => move(dir, e.shiftKey)} title={`${label} (Shift: bigger steps)`}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg><span>{label}</span>
    </button>
  );
  return (
    <div className="resizebar" role="group" aria-label={`Resize ${d.label} column`}>
      <span className="rb-t">{d.label} column <b>{width} pt</b></span>
      {btn(-1, 'Move left', 'M15 5l-7 7 7 7')}
      {btn(1, 'Move right', 'M9 5l7 7-7 7')}
      <button type="button" className="rb-x" onClick={onClose} aria-label="Close column resizer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
    </div>
  );
}
