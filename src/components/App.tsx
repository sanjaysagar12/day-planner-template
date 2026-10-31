import { useEffect, useMemo, useRef, useState } from 'react';
import { layout, normalize } from '../layout/engine';
import { measure } from '../layout/measure';
import type { Settings } from '../layout/settings';
import { defaultSettings } from '../layout/settings';
import { loadSettings, saveSettings } from '../store';
import type { Drag } from '../layout/spec';
import { Bar, ResizeBar, TemplateSwitch } from './Bar';
import { Preview } from './Preview';
import { seenTour, Tour } from './Tour';

export default function App() {
  const [s, setS] = useState<Settings>(loadSettings);
  const [previewing, setPreviewing] = useState(false);
  const [touring, setTouring] = useState(() => !seenTour());
  const [sel, setSel] = useState<Drag | null>(null);
  const cur = useRef(s), hist = useRef<Settings[]>([]), last = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  cur.current = s;
  // one undo step per burst of edits (typing, dragging), not per keystroke or pixel
  const commit = (next: Settings) => {
    const now = Date.now();
    if (now - last.current > 600) { hist.current.push(cur.current); if (hist.current.length > 100) hist.current.shift(); setCanUndo(true); }
    last.current = now; cur.current = next; setS(next);
  };
  const update = (f: (s: Settings) => Settings) => commit(normalize(f(cur.current), measure));
  const reset = () => { last.current = 0; commit(defaultSettings()); last.current = 0; };
  const undo = () => {
    const p = hist.current.pop();
    if (!p) return;
    cur.current = p; last.current = 0; setS(p); setCanUndo(hist.current.length > 0);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); undo(); }
    };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, []);
  const lay = useMemo(() => layout(s, measure), [s]);
  useEffect(() => saveSettings(s), [s]);
  return (
    <div className="app">
      <header className="top">
        <h1>Daily planner template</h1>
        <div className="tplwrap">
          <TemplateSwitch s={s} update={update} />
          <button type="button" className="help" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" /></svg>
          </button>
          <button type="button" className="help" onClick={reset} aria-label="Reset template" title="Reset the template to its defaults. Undo brings it back.">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.7 3L3 8M3 3v5h5" /></svg>
          </button>
          <button type="button" className="help" onClick={() => setTouring(true)} aria-label="How to resize a column" title="How to resize a column">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17v.01M9.1 9a3 3 0 115.2 2c-.8.9-2.3 1.3-2.3 3M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg>
          </button>
        </div>
      </header>
      <Preview layout={lay} s={s} update={update} previewing={previewing} sel={sel?.key} onSelect={setSel} />
      {touring && !previewing && <Tour onClose={() => setTouring(false)} />}
      {sel && !touring && !previewing && <ResizeBar d={sel} width={s[sel.key]} update={update} onClose={() => setSel(null)} />}
      <Bar s={s} previewing={previewing} setPreviewing={setPreviewing} />
    </div>
  );
}
