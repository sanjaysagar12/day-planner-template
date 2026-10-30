import { useState } from 'react';

const KEY = 'planner.tour.seen';
const STEPS = [
  { h: 'Find a column divider', p: 'Hover the line between two columns on the sheet. A violet guide appears and the cursor changes.' },
  { h: 'Drag to resize', p: 'Drag the line left or right. The width shows in points while you drag, and it stops at the minimum and maximum.' },
  { h: 'Or use the keyboard', p: 'Tab to a divider, then press the left or right arrow. Hold Shift to move in bigger steps.' },
];

export const seenTour = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return true; } };

// Three-step popover above the bottom bar; opens once on first visit, then from the Tour button.
export function Tour({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const last = i === STEPS.length - 1;
  const close = () => { try { localStorage.setItem(KEY, '1'); } catch { /* blocked storage */ } onClose(); };
  return (
    <aside className="tour" role="dialog" aria-label="How to resize a column">
      <div className="tour-n">Step {i + 1} of {STEPS.length}</div>
      <h2>{STEPS[i].h}</h2>
      <p>{STEPS[i].p}</p>
      <div className="tour-b">
        <button type="button" onClick={close}>Skip</button>
        {i > 0 && <button type="button" onClick={() => setI(i - 1)}>Back</button>}
        <button type="button" className="go" onClick={() => (last ? close() : setI(i + 1))}>{last ? 'Done' : 'Next'}</button>
      </div>
    </aside>
  );
}
