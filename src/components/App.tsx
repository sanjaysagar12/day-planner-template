import { useEffect, useMemo, useState } from 'react';
import { layout, normalize } from '../layout/engine';
import { measure } from '../layout/measure';
import type { Settings } from '../layout/settings';
import { loadSettings, saveSettings } from '../store';
import { Bar, TemplateSwitch } from './Bar';
import { Preview } from './Preview';
import { seenTour, Tour } from './Tour';

export default function App() {
  const [s, setS] = useState<Settings>(loadSettings);
  const [previewing, setPreviewing] = useState(false);
  const [touring, setTouring] = useState(() => !seenTour());
  const update = (f: (s: Settings) => Settings) => setS((p) => normalize(f(p), measure));
  const lay = useMemo(() => layout(s, measure), [s]);
  useEffect(() => saveSettings(s), [s]);
  return (
    <div className="app">
      <header className="top">
        <h1>Daily planner template</h1>
        <div className="tplwrap">
          <TemplateSwitch s={s} update={update} />
          <button type="button" className="help" onClick={() => setTouring(true)} aria-label="How to resize a column" title="How to resize a column">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17v.01M9.1 9a3 3 0 115.2 2c-.8.9-2.3 1.3-2.3 3M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg>
          </button>
        </div>
      </header>
      <Preview layout={lay} s={s} update={update} previewing={previewing} />
      {touring && !previewing && <Tour onClose={() => setTouring(false)} />}
      <Bar s={s} previewing={previewing} setPreviewing={setPreviewing} />
    </div>
  );
}
