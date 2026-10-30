import { jsPDF } from 'jspdf';
import { layout } from '../layout/engine';
import { measure } from '../layout/measure';
import { PH, PW, type Prim } from '../layout/spec';
import type { Settings } from '../layout/settings';

function drawPrim(doc: jsPDF, p: Prim) {
  switch (p.t) {
    case 'line':
      doc.setDrawColor(p.c).setLineWidth(p.w).line(p.x1, p.y1, p.x2, p.y2);
      break;
    case 'rect':
      if (p.fill) doc.setFillColor(p.fill).rect(p.x, p.y, p.w, p.h, 'F');
      if (p.stroke) {
        doc.setDrawColor(p.stroke).setLineWidth(p.sw ?? 0.8);
        if (p.r) doc.roundedRect(p.x, p.y, p.w, p.h, p.r, p.r, 'S');
        else doc.rect(p.x, p.y, p.w, p.h, 'S');
      }
      break;
    case 'circle':
      doc.setDrawColor(p.stroke).setLineWidth(p.sw).circle(p.cx, p.cy, p.r, 'S');
      break;
    case 'text':
      doc.setFont('helvetica', p.bold ? 'bold' : 'normal').setFontSize(p.size).setTextColor(p.c);
      doc.text(p.s, p.x, p.y, { charSpace: p.tc ?? 0, align: p.align });
  }
}

// One day = 2 PDF pages: spread 1, then spread 2.
export function buildPdf(s: Settings): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [PW, PH], compress: true });
  doc.setProperties({ title: 'My daily planner template' });
  const { pages } = layout(s, measure);
  for (let sp = 0; sp < 2; sp++) {
    if (sp) doc.addPage([PW, PH], 'landscape');
    pages.slice(sp * 2, sp * 2 + 2).forEach((prims) => prims.forEach((q) => drawPrim(doc, q)));
  }
  return doc;
}

export const downloadTemplate = (s: Settings) => buildPdf(s).save('my-daily-planner-template.pdf');
