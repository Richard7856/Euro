'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, BuildingStorefrontIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

type Proveedor = {
  id: string;
  id_proveedor: string;
  nombre_proveedor: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  condiciones_pago: string | null;
  tipo_producto: string | null;
  canal: string | null;
  created_at: string;
};

const inputClass = 'w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200';

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'cerrado' | 'nuevo' | 'editar'>('cerrado');
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [form, setForm] = useState({
    id_proveedor: '',
    nombre_proveedor: '',
    contacto: '',
    telefono: '',
    email: '',
    condiciones_pago: '',
    tipo_producto: '',
    canal: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchProveedores = useCallback(() => {
    setLoading(true);
    fetch('/api/proveedores')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setProveedores(d.proveedores ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProveedores(); }, [fetchProveedores]);

  const openNew = () => {
    setEditing(null);
    setForm({ id_proveedor: '', nombre_proveedor: '', contacto: '', telefono: '', email: '', condiciones_pago: '', tipo_producto: '', canal: '' });
    setModal('nuevo');
  };

  const openEdit = (p: Proveedor) => {
    setEditing(p);
    setForm({
      id_proveedor: p.id_proveedor,
      nombre_proveedor: p.nombre_proveedor,
      contacto: p.contacto ?? '',
      telefono: p.telefono ?? '',
      email: p.email ?? '',
      condiciones_pago: p.condiciones_pago ?? '',
      tipo_producto: p.tipo_producto ?? '',
      canal: p.canal ?? '',
    });
    setModal('editar');
  };

  const save = async () => {
    if (!form.id_proveedor || !form.nombre_proveedor) {
      alert('Completa ID y nombre');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setModal('cerrado');
      fetchProveedores();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    try {
      const res = await fetch(`/api/proveedores?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchProveedores();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
            </Link>
            <div className="inline-flex p-3 rounded-xl theme-accent-muted-bg">
              <BuildingStorefrontIcon className="h-8 w-8 theme-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Proveedores</h1>
              <p className="text-slate-400">Catálogo de proveedores. Alta, edición y eliminación.</p>
            </div>
          </div>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" /> Nuevo proveedor
          </button>
        </div>

        {loading && <div className="text-center text-slate-500 py-12">Cargando...</div>}
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 p-4">{error}</div>}

        {!loading && !error && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400 bg-slate-800/60">
                  <tr>
                    <th className="py-3 px-4 font-medium">ID</th>
                    <th className="py-3 px-4 font-medium">Nombre</th>
                    <th className="py-3 px-4 font-medium">Contacto</th>
                    <th className="py-3 px-4 font-medium">Teléfono</th>
                    <th className="py-3 px-4 font-medium hidden md:table-cell">Email</th>
                    <th className="py-3 px-4 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {proveedores.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono theme-accent">{p.id_proveedor}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{p.nombre_proveedor}</td>
                      <td className="py-3 px-4 text-slate-400">{p.contacto || '—'}</td>
                      <td className="py-3 px-4 text-slate-400">{p.telefono || '—'}</td>
                      <td className="py-3 px-4 text-slate-400 hidden md:table-cell truncate max-w-[180px]" title={p.email || ''}>{p.email || '—'}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => remove(p.id)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {proveedores.length === 0 && (
              <div className="p-12 text-center text-slate-500">No hay proveedores. Haz clic en &quot;Nuevo proveedor&quot; para registrar.</div>
            )}
          </div>
        )}
      </div>

      {modal !== 'cerrado' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setModal('cerrado')}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-4">{modal === 'nuevo' ? 'Nuevo proveedor' : 'Editar proveedor'}</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-400">ID Proveedor *</label>
              <input type="text" value={form.id_proveedor} onChange={(e) => setForm((f) => ({ ...f, id_proveedor: e.target.value }))} className={inputClass} disabled={modal === 'editar'} />
              <label className="block text-sm text-slate-400">Nombre *</label>
              <input type="text" value={form.nombre_proveedor} onChange={(e) => setForm((f) => ({ ...f, nombre_proveedor: e.target.value }))} className={inputClass} />
              <label className="block text-sm text-slate-400">Contacto</label>
              <input type="text" value={form.contacto} onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))} className={inputClass} />
              <label className="block text-sm text-slate-400">Teléfono</label>
              <input type="text" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} className={inputClass} />
              <label className="block text-sm text-slate-400">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
              <label className="block text-sm text-slate-400">Condiciones de pago</label>
              <input type="text" value={form.condiciones_pago} onChange={(e) => setForm((f) => ({ ...f, condiciones_pago: e.target.value }))} className={inputClass} />
              <label className="block text-sm text-slate-400">Tipo producto</label>
              <input type="text" value={form.tipo_producto} onChange={(e) => setForm((f) => ({ ...f, tipo_producto: e.target.value }))} className={inputClass} />
              <label className="block text-sm text-slate-400">Canal</label>
              <input type="text" value={form.canal} onChange={(e) => setForm((f) => ({ ...f, canal: e.target.value }))} className={inputClass} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Guardar'}</button>
              <button onClick={() => !saving && setModal('cerrado')} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
