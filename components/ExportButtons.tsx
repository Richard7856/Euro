'use client';

import { ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { downloadXML, exportToPDF } from '@/lib/exportUtils';

export type ExportColumn = { key: string; label: string };

type ExportButtonsProps = {
  title: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  filenameBase: string;
  getRowCells?: (row: Record<string, unknown>) => string[];
};

export default function ExportButtons({
  title,
  columns,
  rows,
  filenameBase,
  getRowCells,
}: ExportButtonsProps) {
  const labels = columns.map((c) => c.label);

  const handleXML = () => {
    const data = rows.map((r) => {
      const out: Record<string, unknown> = {};
      columns.forEach((col) => {
        out[col.key] = r[col.key] ?? '';
      });
      return out;
    });
    downloadXML(data, filenameBase);
  };

  const handlePDF = () => {
    const rowCells = getRowCells
      ? rows.map((r) => getRowCells(r))
      : rows.map((r) => columns.map((c) => String(r[c.key] ?? '')));
    exportToPDF(title, labels, rowCells);
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handlePDF}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-sm border border-slate-600"
      >
        <DocumentArrowDownIcon className="w-4 h-4" /> PDF
      </button>
      <button
        type="button"
        onClick={handleXML}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-sm border border-slate-600"
      >
        <ArrowDownTrayIcon className="w-4 h-4" /> XML
      </button>
    </div>
  );
}
