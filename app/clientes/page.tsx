'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, UserGroupIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

type Cliente = {
  id: string;
  id_cliente: string;
  nombre_cliente: string;
  rfc_taxid: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  estado: string | null;
  pais: string | null;
  canal_principal: string | null;
  created_at: string;
};

const inputClass = 'w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'cerrado' | 'nuevo' | 'editar'>('cerrado');
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState({
    id_cliente: '',
    nombre_cliente: '',
    rfc_taxid: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    estado: '',
    pais: '',
    canal_principal: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchClientes = useCallback(() => {
    setLoading(true);
    fetch('/api/clientes')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setClientes(d.clientes ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const openNew = () => {
    setEditing(null);
    setForm({ id_cliente: '', nombre_cliente: '', rfc_taxid: '', contacto: '', telefono: '', email: '', direccion: '', ciudad: '', estado: '', pais: '', canal_principal: '' });
    setModal('nuevo');
  };

  const openEdit = (c: Cliente) => {
    setEditing(c);
    setForm({
      id_cliente: c.id_cliente,
      nombre_cliente: c.nombre_cliente,
      rfc_taxid: c.rfc_taxid ?? '',
      contacto: c.contacto ?? '',
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      direccion: c.direccion ?? '',
      ciudad: c.ciudad ?? '',
      estado: c.estado ?? '',
      pais: c.pais ?? '',
      canal_principal: c.canal_principal ?? '',
    });
    setModal('editar');
  };

  const save = async () => {
    if (!form.id_cliente || !form.nombre_cliente) {
      alert('Completa ID y nombre');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setModal('cerrado');
      fetchClientes();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      const res = await fetch(`/api/clientes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchClientes();
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
            <div className="inline-flex p-3 rounded-xl bg-blue-500/10">
              <UserGroupIcon className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Clientes</h1>
              <p className="text-slate-400">Catálogo de clientes. Alta, edición y eliminación.</p>
            </div>
          </div>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" /> Nuevo cliente
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
                  {clientes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-blue-400">{c.id_cliente}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{c.nombre_cliente}</td>
                      <td className="py-3 px-4 text-slate-400">{c.contacto || '—'}</td>
                      <td className="py-3 px-4 text-slate-400">{c.telefono || '—'}</td>
                      <td className="py-3 px-4 text-slate-400 hidden md:table-cell truncate max-w-[180px]" title={c.email || ''}>{c.email || '—'}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {clientes.length === 0 && (
              <div className="p-12 text-center text-slate-500">No hay clientes. Haz clic en &quot;Nuevo cliente&quot; para registrar.</div>
            )}
          </div>
        )}
      </div>

      {modal !== 'cerrado' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setModal('cerrado')}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-4">{modal === 'nuevo' ? 'Nuevo cliente' : 'Editar cliente'}</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-400">ID Cliente *</label>
              <input type="text" value={form.id_cliente} onChange={(e) => setForm((f) => ({ ...f, id_cliente: e.target.value }))} className={inputClass} disabled={modal === 'editar'} />
              <label className="block text-sm text-slate-400">Nombre *</label>
              <input type="text" value={form.nombre_cliente} onChange={(e) => setForm((f) => ({ ...f, nombre_cliente: e.target.value }))} className={inputClass} />
              <label className="block text-sm text-slate-400">RFC / Tax ID</label>
              <input type="text" value={form.rfc_taxid} onChange={(e) => setForm((f) => ({ ...f, rfc_taxid: e.target.value }))} className={inputClass} />
              <label className="block text-sm text-slate-400">Contacto</label>
              <input type="text" value={form.contacto} onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))} className={inputClass} />
              <label className="block text-sm text-slate-400">Teléfono</label>
              <input type="text" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} className={inputClass} />
              <label className="block text-sm text-slate-400">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
              <label className="block text-sm text-slate-400">Ciudad / Estado / País</label>
              <div className="grid grid-cols-3 gap-2">
                <input type="text" value={form.ciudad} onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))} className={inputClass} placeholder="Ciudad" />
                <input type="text" value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))} className={inputClass} placeholder="Estado" />
                <input type="text" value={form.pais} onChange={(e) => setForm((f) => ({ ...f, pais: e.target.value }))} className={inputClass} placeholder="País" />
              </div>
              <label className="block text-sm text-slate-400">Canal principal</label>
              <input type="text" value={form.canal_principal} onChange={(e) => setForm((f) => ({ ...f, canal_principal: e.target.value }))} className={inputClass} />
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
