# Daily planner template maker

Customize the printable daily planner template and download it as a vector PDF (2 pages: spread 1 and spread 2).
Borderless layout (one centre line). Click any text on the sheet to rename it, drag a column line to resize it, use the
+/- on BECAUSE / SATISFIED / IMPROVE to share the page's ruled lines between them, and pick the "How today went" style
in the sidebar. Not a tracker: nothing is typed on the sheet.
Astro (static) + React island + TypeScript. No backend, no network calls at runtime. Only your customization
settings are saved (localStorage key `planner.template.v4`).

## Run / build / deploy
    npm install
    npm run dev       # http://localhost:4321
    npm run build     # static site in dist/
    npm run preview

Deploy `dist/` to any static host: Netlify (build `npm run build`, publish `dist`), Vercel (Astro preset),
or GitHub Pages (upload `dist`; set `site`/`base` in astro.config.mjs if served from a sub-path).

## How it fits together
- `src/layout/spec.ts` measurements taken from the borderless reference PDFs (pt, A4 landscape).
- `src/layout/settings.ts` the settings model and text defaults. `src/layout/engine.ts` `layout(settings)` returns drawing
  primitives for the 4 pages, and `normalize` clamps every setting. `src/layout/measure.ts` Helvetica widths.
- `src/render/preview.tsx` draws the primitives as SVG (click-to-edit text, draggable column lines).
  `src/pdf/export.ts` draws the same primitives with jsPDF, so preview and PDF match.
- `src/components` controls, preview, download button. `src/store` settings persistence.
