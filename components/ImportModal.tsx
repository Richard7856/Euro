'use client';

import { useState, useRef, useCallback } from 'react';
import type { DragEvent } from 'react';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

export type ImportField = {
  key: string;     // DB column name
  label: string;   // Display label shown in preview / chips
  required?: boolean;
};

type ImportModalProps = {
  title: string;
  /** Fields expected in the DB. Used for preview columns and chip display. */
  fields: ImportField[];
  /**
   * Map from normalised CSV header (lowercase, no accents/spaces) to DB field key.
   * e.g. { 'nombre_cliente': 'nombre_cliente', 'nombrecliente': 'nombre_cliente' }
   */
  columnMap: Record<string, string>;
  /** API endpoint to POST { rows: ParsedRow[] } */
  apiEndpoint: string;
  onClose: () => void;
  onSuccess: (count: number) => void;
};

type ParsedRow = Record<string, string>;

/** Normalise a string for column matching: lowercase, remove accents + spaces/underscores */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')   // remove diacritics (é→e, á→a …)
    .replace(/[\s_\-/]/g, '');         // remove separators
}

export default function ImportModal({
  title,
  fields,
  columnMap,
  apiEndpoint,
  onClose,
  onSuccess,
}: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);
  const [resultErrors, setResultErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Build a lookup that also tries the normalised key
  const buildLookup = useCallback(() => {
    const lookup: Record<string, string> = {};
    for (const [raw, dbField] of Object.entries(columnMap)) {
      lookup[normalise(raw)] = dbField;
      lookup[raw.toLowerCase().trim()] = dbField;
    }
    return lookup;
  }, [columnMap]);

  const parseFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);
      try {
        // Dynamic import so xlsx is never bundled in the server chunk
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          raw: false,
          defval: '',
        });

        const lookup = buildLookup();

        const mapped: ParsedRow[] = rawRows
          .map((row) => {
            const out: ParsedRow = {};
            for (const [csvKey, val] of Object.entries(row)) {
              const dbField =
                lookup[normalise(csvKey)] ??
                lookup[csvKey.toLowerCase().trim()];
              if (dbField) out[dbField] = String(val ?? '').trim();
            }
            return out;
          })
          .filter((r) => Object.values(r).some((v) => v !== ''));

        if (mapped.length === 0) {
          setError(
            'No se encontraron filas válidas. Verifica que el archivo tenga los encabezados correctos.'
          );
          return;
        }

        setRows(mapped);
        setStep('preview');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al leer el archivo');
      }
    },
    [buildLookup]
  );

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) {
        setError('Solo se aceptan archivos .csv, .xlsx y .xls');
        return;
      }
      parseFile(file);
    },
    [parseFile]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = async () => {
    setImporting(true);
    setResultErrors([]);
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al importar');
      setResultCount(data.imported ?? rows.length);
      setResultErrors(data.errors ?? []);
      setStep('done');
      if ((data.errors ?? []).length === 0) onSuccess(data.imported ?? rows.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  // Only show columns that actually appear in parsed data
  const visibleFields = fields.filter((f) =>
    rows.some((r) => r[f.key] !== undefined && r[f.key] !== '')
  );
  const previewRows = rows.slice(0, 8);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-800 rounded-xl border border-slate-600 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <DocumentArrowDownIcon className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              Importar {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* ─ STEP: Upload ─ */}
          {step === 'upload' && (
            <div className="space-y-5">
              <p className="text-slate-400 text-sm">
                Sube un archivo{' '}
                <strong className="text-slate-200">.csv</strong> o{' '}
                <strong className="text-slate-200">.xlsx</strong> exportado
                desde Google Sheets o Excel. Las columnas se mapean
                automáticamente por nombre de encabezado.
              </p>

              {/* Drag & drop zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors select-none ${
                  dragging
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/20'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <ArrowUpTrayIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-200 font-semibold text-lg">
                  Arrastra tu archivo aquí
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  o haz clic para seleccionar
                </p>
                <p className="text-slate-600 text-xs mt-3 font-mono">
                  CSV · XLSX · XLS
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
              />

              {/* Expected columns chips */}
              <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-4">
                <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Columnas esperadas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {fields.map((f) => (
                    <span
                      key={f.key}
                      className={`px-2 py-0.5 rounded text-xs font-mono ${
                        f.required
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {f.label}
                      {f.required && ' *'}
                    </span>
                  ))}
                </div>
                <p className="text-slate-600 text-xs mt-2">* Obligatorio</p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm flex gap-2 items-start">
                  <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ─ STEP: Preview ─ */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-slate-300 text-sm">
                    <span className="font-bold text-slate-100">
                      {rows.length}
                    </span>{' '}
                    {rows.length === 1 ? 'fila detectada' : 'filas detectadas'} en{' '}
                    <span className="font-mono text-slate-400 text-xs">
                      {fileName}
                    </span>
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Mostrando las primeras {Math.min(previewRows.length, 8)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRows([]);
                    setFileName('');
                    setStep('upload');
                  }}
                  className="text-slate-400 hover:text-violet-400 text-sm underline transition-colors"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-700/60 text-slate-400 sticky top-0">
                    <tr>
                      <th className="py-2 px-3 font-medium text-slate-500">#</th>
                      {visibleFields.map((f) => (
                        <th
                          key={f.key}
                          className="py-2 px-3 font-medium whitespace-nowrap"
                        >
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-700/20">
                        <td className="py-2 px-3 text-slate-600">{i + 1}</td>
                        {visibleFields.map((f) => (
                          <td
                            key={f.key}
                            className="py-2 px-3 text-slate-300 max-w-[180px] truncate"
                          >
                            {row[f.key] || (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length > 8 && (
                <p className="text-slate-500 text-xs text-center">
                  … y {rows.length - 8} fila
                  {rows.length - 8 === 1 ? '' : 's'} más
                </p>
              )}

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm flex gap-2 items-start">
                  <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ─ STEP: Done ─ */}
          {step === 'done' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center py-8">
                <CheckCircleIcon className="w-16 h-16 text-emerald-400 mb-4" />
                <h3 className="text-2xl font-bold text-slate-100">
                  {resultCount}{' '}
                  {resultCount === 1
                    ? 'registro importado'
                    : 'registros importados'}
                </h3>
                {resultErrors.length > 0 && (
                  <p className="text-amber-400 text-sm mt-1">
                    {resultErrors.length} con errores
                  </p>
                )}
              </div>

              {resultErrors.length > 0 && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 space-y-1">
                  <p className="text-amber-300 text-xs font-semibold mb-2">
                    Errores:
                  </p>
                  {resultErrors.map((e, i) => (
                    <p key={i} className="text-amber-300 text-xs">
                      • {e}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-700 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 text-sm transition-colors"
          >
            {step === 'done' ? 'Cerrar' : 'Cancelar'}
          </button>

          {step === 'preview' && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-6 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {importing && (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              )}
              {importing
                ? 'Importando…'
                : `Importar ${rows.length} registro${rows.length === 1 ? '' : 's'}`}
            </button>
          )}

          {step === 'done' && (
            <button
              onClick={() => {
                setStep('upload');
                setRows([]);
                setFileName('');
                setResultErrors([]);
                setError(null);
              }}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 text-sm transition-colors"
            >
              Importar más
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
