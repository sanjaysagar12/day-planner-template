import type { Layout } from '../layout/engine';
import type { Settings } from '../layout/settings';
import { Spreads } from '../render/preview';

type Props = { layout: Layout; s: Settings; update: (f: (s: Settings) => Settings) => void; previewing: boolean };

// While previewing the sheet is inert (nothing focusable or clickable) and shows no edit icons.
export function Preview({ layout, s, update, previewing }: Props) {
  return (
    <section className={`preview${previewing ? ' previewing' : ''}`} aria-label="Template preview">
      <p className="note" role="status">
        {previewing
          ? 'Preview: this is how the PDF will look. Press Edit to keep customizing.'
          : <><b>Click any text to rename it. Drag a column line to resize it. Use the bin icons to remove things.</b> The PDF is these 2 spreads (2 pages).</>}
      </p>
      <div className="sheets" {...(previewing ? { inert: true } : {})}>
        <Spreads layout={layout} s={s} update={update} />
      </div>
    </section>
  );
}
