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
export function Bar({ s, previewing, setPreviewing }: { s: Settings; previewing: boolean; setPreviewing: (v: boolean) => void }) {
  return (
    <nav className="bar" aria-label="Template actions">
      <button type="button" className="act" aria-pressed={previewing} onClick={() => setPreviewing(!previewing)}
        title={previewing ? 'Back to editing' : 'See the sheet exactly as it will print'}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={previewing ? 'M4 20h4l10-10-4-4L4 16v4zM13 7l4 4' : 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z'} /></svg>
        <span>{previewing ? 'Edit' : 'Preview'}</span>
      </button>
      <button type="button" className="act download" onClick={() => downloadTemplate(s)} aria-label="Download template">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 20h16" /></svg>
        <span>Download<span className="long"> template</span></span>
      </button>
    </nav>
  );
}
