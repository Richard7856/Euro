'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon, ArrowPathIcon, CubeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useEmpresaOptional } from '@/lib/empresaContext';

type ProductoPrecio = {
  sku: string;
  nombre: string;
  precio_venta: number | null;
  moneda_venta: string;
  unidad: string;
  ultimos_precios_proveedor: { id_proveedor: string; nombre_proveedor: string | null; precio: number; moneda: string; fecha: string; fuente: string }[];
};

type GastoExtra = { concepto: string; monto_usd: number; nota: string };
type CotizacionGuardada = {
  id: string;
  producto_concepto: string;
  cantidad: number;
  unidad: string;
  costo_compra_total_usd: number;
  gastos_extra: GastoExtra[];
  tipo_cambio_mxn: number;
  moneda_venta: string;
  inversion_final_usd: number;
  costo_unitario_final_usd: number;
  modo_margen: string;
  margen_porcentaje_deseado: number | null;
  precio_venta_unitario: number | null;
  margen_real_porcentaje: number | null;
  created_at: string;
};

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);
const formatMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const UNIDADES = ['kg', 'ton', 'lb', 'caja', 'unidad', 'L', 'm³'];

export default function CotizadorPage() {
  const empresaContext = useEmpresaOptional();
  const isEuromex = empresaContext?.empresa === 'euromex';

  const [producto, setProducto] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('kg');
  const [costoCompraUsd, setCostoCompraUsd] = useState('');
  const [gastos, setGastos] = useState<GastoExtra[]>([
    { concepto: 'Transporte Terrestre', monto_usd: 0, nota: '' },
    { concepto: 'Flete Internacional', monto_usd: 0, nota: '' },
    { concepto: 'Gastos Aduanales', monto_usd: 0, nota: '' },
  ]);
  const [tipoCambio, setTipoCambio] = useState('18');
  const [moneda, setMoneda] = useState<'USD' | 'MXN'>('USD');
  const [modoMargen, setModoMargen] = useState<'porcentaje' | 'precio_fijo'>('porcentaje');
  const [margenPorcentaje, setMargenPorcentaje] = useState('');
  const [precioFijo, setPrecioFijo] = useState('');
  const [guardadas, setGuardadas] = useState<CotizacionGuardada[]>([]);
  const [loadingGuardadas, setLoadingGuardadas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const [tab, setTab] = useState<'cotizador' | 'productos-precios'>('cotizador');
  const [productosPrecios, setProductosPrecios] = useState<ProductoPrecio[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [editingPrecio, setEditingPrecio] = useState<{ sku: string; value: string } | null>(null);
  const [savingPrecio, setSavingPrecio] = useState(false);

  const [modalProducto, setModalProducto] = useState<'cerrado' | 'nuevo' | 'editar'>('cerrado');
  const [productoEditando, setProductoEditando] = useState<ProductoPrecio | null>(null);
  const [formProducto, setFormProducto] = useState({ id_producto: '', nombre_producto: '' });
  const [editPrecioVenta, setEditPrecioVenta] = useState('');
  const [savingProducto, setSavingProducto] = useState(false);

  const [modalPrecioProveedor, setModalPrecioProveedor] = useState(false);
  const [formPrecioProveedor, setFormPrecioProveedor] = useState({
    id_producto: '',
    id_proveedor: '',
    nombre_proveedor: '',
    precio: '',
    moneda: 'MXN',
    unidad: 'kg',
  });
  const [savingPrecioProveedor, setSavingPrecioProveedor] = useState(false);
  const [proveedores, setProveedores] = useState<{ id_proveedor: string; nombre_proveedor: string }[]>([]);

  const cantidadNum = Math.max(0, parseFloat(String(cantidad).replace(/[^0-9.-]/g, '')) || 0);
  const costoCompraNum = Math.max(0, parseFloat(String(costoCompraUsd).replace(/[^0-9.-]/g, '')) || 0);
  const tipoCambioNum = Math.max(0.01, parseFloat(String(tipoCambio).replace(/[^0-9.-]/g, '')) || 18);
  const totalGastosUsd = gastos.reduce((s, g) => s + (Number(g.monto_usd) || 0), 0);
  const inversionFinalUsd = costoCompraNum + totalGastosUsd;
  const costoUnitarioOrigen = cantidadNum > 0 ? costoCompraNum / cantidadNum : 0;
  const costoUnitarioFinalUsd = cantidadNum > 0 ? inversionFinalUsd / cantidadNum : 0;

  const margenPctNum = parseFloat(String(margenPorcentaje).replace(/[^0-9.-]/g, '')) || 0;
  const precioFijoNum = parseFloat(String(precioFijo).replace(/[^0-9.-]/g, '')) || 0;

  const precioVentaSugeridoUsd = modoMargen === 'porcentaje' && margenPctNum >= 0
    ? costoUnitarioFinalUsd * (1 + margenPctNum / 100)
    : 0;
  const precioFijoEnUsd = moneda === 'MXN' ? precioFijoNum / tipoCambioNum : precioFijoNum;
  const margenRealPct = modoMargen === 'precio_fijo' && precioFijoNum > 0 && costoUnitarioFinalUsd > 0
    ? ((precioFijoEnUsd - costoUnitarioFinalUsd) / costoUnitarioFinalUsd) * 100
    : null;

  const fetchGuardadas = useCallback(() => {
    if (!isEuromex) return;
    setLoadingGuardadas(true);
    fetch('/api/cotizaciones')
      .then((r) => r.json())
      .then((d) => setGuardadas(d.cotizaciones ?? []))
      .catch(() => setGuardadas([]))
      .finally(() => setLoadingGuardadas(false));
  }, [isEuromex]);

  useEffect(() => {
    fetchGuardadas();
  }, [fetchGuardadas]);

  const fetchProductosPrecios = useCallback(() => {
    if (!isEuromex) return;
    setLoadingProductos(true);
    Promise.all([
      fetch('/api/datos', { credentials: 'include' }).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch('/api/precios-venta?vigente_en=' + new Date().toISOString().slice(0, 10), { credentials: 'include' }).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch('/api/precios-proveedor?ultimos=true&limit=300', { credentials: 'include' }).then((r) => (r.ok ? r.json() : Promise.reject())),
    ])
      .then(([datos, pv, pp]) => {
        const inv = (datos?.inventario ?? []) as { id_producto: string; nombre_producto: string }[];
        const preciosVenta = (pv?.precios ?? []) as { id_producto: string; precio_venta: number; moneda: string; unidad: string; vigente_desde?: string }[];
        const preciosProv = (pp?.precios ?? []) as { id_producto: string; id_proveedor: string; nombre_proveedor: string | null; precio: number; moneda: string; fecha: string; fuente: string }[];
        const pvBySku = new Map<string, { precio_venta: number; moneda: string; unidad: string }>();
        preciosVenta.sort((a, b) => (b.vigente_desde ?? '').localeCompare(a.vigente_desde ?? ''));
        preciosVenta.forEach((p) => {
          if (!pvBySku.has(p.id_producto)) pvBySku.set(p.id_producto, { precio_venta: p.precio_venta, moneda: p.moneda || 'MXN', unidad: p.unidad || 'kg' });
        });
        const seen = new Set<string>();
        const ultimosBySku = new Map<string, typeof preciosProv>();
        preciosProv.forEach((r) => {
          const key = `${r.id_producto}|${r.id_proveedor}`;
          if (seen.has(key)) return;
          seen.add(key);
          const list = ultimosBySku.get(r.id_producto) ?? [];
          list.push(r);
          ultimosBySku.set(r.id_producto, list);
        });
        const merged: ProductoPrecio[] = inv.map((p) => {
          const pvRow = pvBySku.get(p.id_producto);
          const ultimos = ultimosBySku.get(p.id_producto) ?? [];
          return {
            sku: p.id_producto,
            nombre: p.nombre_producto ?? p.id_producto,
            precio_venta: pvRow?.precio_venta ?? null,
            moneda_venta: pvRow?.moneda ?? 'MXN',
            unidad: pvRow?.unidad ?? 'kg',
            ultimos_precios_proveedor: ultimos.map((u) => ({
              id_proveedor: u.id_proveedor,
              nombre_proveedor: u.nombre_proveedor,
              precio: u.precio,
              moneda: u.moneda,
              fecha: (u.fecha ?? '').slice(0, 10),
              fuente: u.fuente ?? 'api',
            })),
          };
        });
        setProductosPrecios(merged);
      })
      .catch(() => setProductosPrecios([]))
      .finally(() => setLoadingProductos(false));
  }, [isEuromex]);

  useEffect(() => {
    if (tab === 'productos-precios' && isEuromex) fetchProductosPrecios();
  }, [tab, isEuromex, fetchProductosPrecios]);

  useEffect(() => {
    if (tab === 'productos-precios' && isEuromex) {
      fetch('/api/proveedores', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => setProveedores(d.proveedores ?? []))
        .catch(() => setProveedores([]));
    }
  }, [tab, isEuromex]);

  const abrirNuevoProducto = () => {
    setFormProducto({ id_producto: '', nombre_producto: '' });
    setProductoEditando(null);
    setModalProducto('nuevo');
  };
  const abrirEditarProducto = (row: ProductoPrecio) => {
    setProductoEditando(row);
    setFormProducto({ id_producto: row.sku, nombre_producto: row.nombre });
    setEditPrecioVenta(String(row.precio_venta ?? ''));
    setModalProducto('editar');
  };
  const guardarProducto = async () => {
    if (modalProducto === 'nuevo') {
      if (!formProducto.id_producto.trim()) {
        setMessage({ type: 'error', text: 'El SKU (id_producto) es obligatorio.' });
        return;
      }
      setSavingProducto(true);
      try {
        const res = await fetch('/api/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id_producto: formProducto.id_producto.trim(), nombre_producto: formProducto.nombre_producto.trim() || null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Error');
        setModalProducto('cerrado');
        fetchProductosPrecios();
        setMessage({ type: 'ok', text: 'Producto creado.' });
      } catch (e) {
        setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Error al crear' });
      } finally {
        setSavingProducto(false);
      }
    } else if (modalProducto === 'editar' && productoEditando) {
      setSavingProducto(true);
      try {
        const res = await fetch(`/api/productos?id_producto=${encodeURIComponent(productoEditando.sku)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ nombre_producto: formProducto.nombre_producto.trim() || null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Error');
        const precioNum = parseFloat(editPrecioVenta.replace(/[^0-9.-]/g, ''));
        if (!isNaN(precioNum) && precioNum >= 0) {
          await fetch('/api/precios-venta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id_producto: productoEditando.sku, precio_venta: precioNum, moneda: 'MXN', unidad: 'kg' }),
          });
        }
        setModalProducto('cerrado');
        setProductoEditando(null);
        fetchProductosPrecios();
        setMessage({ type: 'ok', text: 'Producto y precio actualizados.' });
      } catch (e) {
        setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Error al actualizar' });
      } finally {
        setSavingProducto(false);
      }
    }
  };

  const abrirPrecioProveedor = () => {
    setFormPrecioProveedor({ id_producto: productosPrecios[0]?.sku ?? '', id_proveedor: '', nombre_proveedor: '', precio: '', moneda: 'MXN', unidad: 'kg' });
    setModalPrecioProveedor(true);
  };
  const guardarPrecioProveedor = async () => {
    const precioNum = parseFloat(formPrecioProveedor.precio.replace(/[^0-9.-]/g, ''));
    if (!formPrecioProveedor.id_producto.trim() || !formPrecioProveedor.id_proveedor.trim() || isNaN(precioNum) || precioNum < 0) {
      setMessage({ type: 'error', text: 'Producto (SKU), proveedor y precio son obligatorios.' });
      return;
    }
    setSavingPrecioProveedor(true);
    try {
      const res = await fetch('/api/precios-proveedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id_producto: formPrecioProveedor.id_producto.trim(),
          id_proveedor: formPrecioProveedor.id_proveedor.trim(),
          nombre_proveedor: formPrecioProveedor.nombre_proveedor.trim() || null,
          precio: precioNum,
          moneda: formPrecioProveedor.moneda,
          unidad: formPrecioProveedor.unidad,
          fuente: 'manual',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error');
      setModalPrecioProveedor(false);
      fetchProductosPrecios();
      setMessage({ type: 'ok', text: 'Precio de cotización registrado.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Error al guardar' });
    } finally {
      setSavingPrecioProveedor(false);
    }
  };

  const guardarPrecioVenta = async (sku: string, precioNum: number) => {
    if (!isEuromex || isNaN(precioNum) || precioNum < 0) return;
    setSavingPrecio(true);
    try {
      const res = await fetch('/api/precios-venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id_producto: sku, precio_venta: precioNum, moneda: 'MXN', unidad: 'kg' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error');
      setEditingPrecio(null);
      fetchProductosPrecios();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Error al guardar precio' });
    } finally {
      setSavingPrecio(false);
    }
  };

  const addGasto = () => {
    setGastos((prev) => [...prev, { concepto: '', monto_usd: 0, nota: '' }]);
  };

  const updateGasto = (i: number, field: keyof GastoExtra, value: string | number) => {
    setGastos((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const removeGasto = (i: number) => {
    setGastos((prev) => prev.filter((_, idx) => idx !== i));
  };

  const guardar = async () => {
    if (!isEuromex) {
      setMessage({ type: 'error', text: 'El cotizador solo está disponible para Euromex.' });
      return;
    }
    if (!producto.trim() || cantidadNum <= 0) {
      setMessage({ type: 'error', text: 'Completa producto y cantidad.' });
      return;
    }
    const precioUnit = modoMargen === 'porcentaje'
      ? (moneda === 'MXN' ? precioVentaSugeridoUsd * tipoCambioNum : precioVentaSugeridoUsd)
      : precioFijoNum;
    const margenDeseado = modoMargen === 'porcentaje' ? margenPctNum : null;
    const margenReal = modoMargen === 'precio_fijo' ? margenRealPct : margenPctNum;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_concepto: producto.trim(),
          cantidad: cantidadNum,
          unidad,
          costo_compra_total_usd: costoCompraNum,
          gastos_extra: gastos.map((g) => ({
            concepto: g.concepto || 'Gasto',
            monto_usd: Number(g.monto_usd) || 0,
            nota: g.nota || '',
          })),
          tipo_cambio_mxn: tipoCambioNum,
          moneda_venta: moneda,
          inversion_final_usd: inversionFinalUsd,
          costo_unitario_final_usd: costoUnitarioFinalUsd,
          modo_margen: modoMargen,
          margen_porcentaje_deseado: margenDeseado,
          precio_venta_unitario: precioUnit || null,
          margen_real_porcentaje: margenReal != null ? margenReal : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' });
        return;
      }
      setMessage({ type: 'ok', text: 'Cotización guardada. Queda registrado el precio de venta.' });
      fetchGuardadas();
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  if (!isEuromex) {
    return (
      <main className="min-h-screen text-zinc-50 p-4 md:p-8" style={{ backgroundColor: 'var(--shell-bg)' }}>
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 mb-6">
            <ArrowLeftIcon className="h-5 w-5" />
            Volver al inicio
          </Link>
          <div className="glass-card p-8 text-center">
            <h1 className="text-xl font-bold text-zinc-200 mb-2">Cotizador</h1>
            <p className="text-zinc-400 mb-3">
              El cotizador está disponible solo para <strong className="text-zinc-200">Euromex</strong>.
            </p>
            <p className="text-sm text-zinc-500">
              Selecciona <strong className="text-emerald-400">Euromex</strong> en el selector del menú lateral para ver las pestañas <em>Cotizador</em> y <em>Productos y precios</em>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-zinc-50 p-4 md:p-8" style={{ backgroundColor: 'var(--shell-bg)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200">
              <ArrowLeftIcon className="h-5 w-5" />
              Inicio
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">Cotizador</h1>
          </div>
          <div className="flex items-center gap-2">
            {tab === 'cotizador' && (
              <>
                <button
                  type="button"
                  onClick={() => setMoneda('USD')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${moneda === 'USD' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => setMoneda('MXN')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${moneda === 'MXN' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                >
                  MXN
                </button>
                <button type="button" onClick={fetchGuardadas} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200" title="Actualizar lista">
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </>
            )}
            {tab === 'productos-precios' && (
              <button type="button" onClick={fetchProductosPrecios} disabled={loadingProductos} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-50" title="Actualizar">
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </header>

        {/* Pestañas: Cotizador | Productos y precios (solo Euromex) */}
        <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/50 p-2 flex gap-2">
          <span className="sr-only">Sección</span>
          <button
            type="button"
            onClick={() => setTab('cotizador')}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg text-base font-medium transition-colors ${tab === 'cotizador' ? 'bg-emerald-600/25 text-emerald-200 border border-emerald-500/50 shadow-sm' : 'bg-transparent text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 border border-transparent'}`}
          >
            <DocumentTextIcon className="h-5 w-5 shrink-0" />
            Cotizador
          </button>
          <button
            type="button"
            onClick={() => setTab('productos-precios')}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg text-base font-medium transition-colors ${tab === 'productos-precios' ? 'bg-emerald-600/25 text-emerald-200 border border-emerald-500/50 shadow-sm' : 'bg-transparent text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 border border-transparent'}`}
          >
            <CubeIcon className="h-5 w-5 shrink-0" />
            Productos y precios
          </button>
        </div>

        {tab === 'productos-precios' && (
          <section className="space-y-4">
            <div className="glass-card p-4 rounded-xl border border-zinc-700/50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-400 mb-2">
                  Productos por <strong className="text-zinc-300">SKU</strong> (id_producto), últimos precios de proveedores y precio final de venta. El bot puede consultar y enviar precios vía API.
                </p>
                <p className="text-xs text-zinc-500">
                  Documentación API bot: <code className="text-emerald-400/90">docs/API_COTIZACIONES_BOT.md</code> — GET /api/bot/productos, POST /api/bot/precios-proveedor, PATCH /api/bot/precios-venta (header <code className="text-zinc-400">X-API-Key</code>).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={abrirNuevoProducto} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 text-sm font-medium">
                  <PlusIcon className="h-5 w-5" />
                  Nuevo producto
                </button>
                <button type="button" onClick={abrirPrecioProveedor} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-700/60 text-zinc-200 border border-zinc-600 hover:bg-zinc-600/60 text-sm font-medium">
                  <PlusIcon className="h-5 w-5" />
                  Añadir precio de cotización
                </button>
              </div>
            </div>
            {loadingProductos ? (
              <p className="text-zinc-500 py-8">Cargando productos…</p>
            ) : (
              <div className="glass-card overflow-hidden rounded-xl border border-zinc-700/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-800/60 text-zinc-400">
                      <tr>
                        <th className="py-3 px-4 font-medium">SKU</th>
                        <th className="py-3 px-4 font-medium">Producto</th>
                        <th className="py-3 px-4 font-medium">Últimos precios proveedor</th>
                        <th className="py-3 px-4 font-medium text-right">Precio final (venta)</th>
                        <th className="py-3 px-4 w-44">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-700/50">
                      {productosPrecios.map((row) => (
                        <tr key={row.sku} className="hover:bg-zinc-800/30">
                          <td className="py-3 px-4 font-mono text-emerald-400">{row.sku}</td>
                          <td className="py-3 px-4 text-zinc-200">{row.nombre}</td>
                          <td className="py-3 px-4 text-zinc-400">
                            {row.ultimos_precios_proveedor.length === 0 ? (
                              <span className="text-zinc-500">—</span>
                            ) : (
                              <ul className="space-y-0.5">
                                {row.ultimos_precios_proveedor.slice(0, 3).map((u, i) => (
                                  <li key={i} className="text-xs">
                                    {u.id_proveedor} {u.nombre_proveedor && `(${u.nombre_proveedor})`}: {row.moneda_venta === 'MXN' ? formatMXN(u.precio) : u.precio} · {u.fecha} {u.fuente && `· ${u.fuente}`}
                                  </li>
                                ))}
                                {row.ultimos_precios_proveedor.length > 3 && <li className="text-zinc-500 text-xs">+{row.ultimos_precios_proveedor.length - 3} más</li>}
                              </ul>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {editingPrecio?.sku === row.sku ? (
                              <div className="flex items-center justify-end gap-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={editingPrecio.value}
                                  onChange={(e) => setEditingPrecio((p) => (p ? { ...p, value: e.target.value } : null))}
                                  className="w-24 rounded bg-zinc-800 border border-zinc-600 px-2 py-1 text-zinc-100 text-right"
                                />
                                <button type="button" onClick={() => guardarPrecioVenta(row.sku, parseFloat(editingPrecio.value.replace(/[^0-9.-]/g, '')) || 0)} disabled={savingPrecio} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium disabled:opacity-50">
                                  Guardar
                                </button>
                                <button type="button" onClick={() => setEditingPrecio(null)} className="text-zinc-500 hover:text-zinc-400 text-sm">Cancelar</button>
                              </div>
                            ) : (
                              <span className="font-mono text-zinc-200">{row.precio_venta != null ? formatMXN(row.precio_venta) : '—'}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 flex flex-wrap gap-2">
                            <button type="button" onClick={() => abrirEditarProducto(row)} className="text-sm text-zinc-300 hover:text-white">
                              Editar
                            </button>
                            {editingPrecio?.sku !== row.sku && (
                              <button type="button" onClick={() => setEditingPrecio({ sku: row.sku, value: String(row.precio_venta ?? '') })} className="text-sm text-emerald-400 hover:text-emerald-300">
                                Editar precio
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {productosPrecios.length === 0 && !loadingProductos && (
                  <div className="p-8 text-center text-zinc-500">No hay productos. Usa &quot;Nuevo producto&quot; para crear uno.</div>
                )}
              </div>
            )}

            {/* Modal Nuevo / Editar producto */}
            {modalProducto !== 'cerrado' && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !savingProducto && setModalProducto('cerrado')}>
                <div className="bg-zinc-800 rounded-xl border border-zinc-600 max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-lg font-semibold text-zinc-100 mb-4">{modalProducto === 'nuevo' ? 'Nuevo producto' : 'Editar producto'}</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">SKU (id_producto) *</label>
                      <input
                        type="text"
                        value={formProducto.id_producto}
                        onChange={(e) => setFormProducto((f) => ({ ...f, id_producto: e.target.value }))}
                        disabled={modalProducto === 'editar'}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100 disabled:opacity-60"
                        placeholder="Ej. ALM-002"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Nombre producto</label>
                      <input
                        type="text"
                        value={formProducto.nombre_producto}
                        onChange={(e) => setFormProducto((f) => ({ ...f, nombre_producto: e.target.value }))}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100"
                        placeholder="Ej. Almendra de segunda"
                      />
                    </div>
                    {modalProducto === 'editar' && productoEditando && (
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Precio final de venta (MXN)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editPrecioVenta}
                          onChange={(e) => setEditPrecioVenta(e.target.value)}
                          className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={guardarProducto} disabled={savingProducto} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50">
                      {savingProducto ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button type="button" onClick={() => !savingProducto && setModalProducto('cerrado')} className="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-200 hover:bg-zinc-600">
                      Cancelar
                    </button>
                  </div>
                  {modalProducto === 'editar' && productoEditando && (
                    <p className="text-xs text-zinc-500 mt-3">
                      Al guardar también se actualiza el precio de venta si lo cambiaste arriba.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Modal Añadir precio de cotización (proveedor) */}
            {modalPrecioProveedor && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !savingPrecioProveedor && setModalPrecioProveedor(false)}>
                <div className="bg-zinc-800 rounded-xl border border-zinc-600 max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-lg font-semibold text-zinc-100 mb-4">Añadir precio de cotización</h2>
                  <p className="text-sm text-zinc-400 mb-4">Registra un precio recibido de un proveedor para un producto.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Producto (SKU) *</label>
                      <select
                        value={formPrecioProveedor.id_producto}
                        onChange={(e) => setFormPrecioProveedor((f) => ({ ...f, id_producto: e.target.value }))}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100"
                      >
                        {productosPrecios.map((p) => (
                          <option key={p.sku} value={p.sku}>{p.sku} — {p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Proveedor (ID) *</label>
                      <input
                        type="text"
                        value={formPrecioProveedor.id_proveedor}
                        onChange={(e) => setFormPrecioProveedor((f) => ({ ...f, id_proveedor: e.target.value }))}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100"
                        placeholder="Ej. PROV-01"
                        list="proveedores-list"
                      />
                      <datalist id="proveedores-list">
                        {proveedores.map((pr) => (
                          <option key={pr.id_proveedor} value={pr.id_proveedor} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Nombre proveedor (opcional)</label>
                      <input
                        type="text"
                        value={formPrecioProveedor.nombre_proveedor}
                        onChange={(e) => setFormPrecioProveedor((f) => ({ ...f, nombre_proveedor: e.target.value }))}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100"
                        placeholder="Nombre del proveedor"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Precio *</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formPrecioProveedor.precio}
                          onChange={(e) => setFormPrecioProveedor((f) => ({ ...f, precio: e.target.value }))}
                          className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Moneda</label>
                        <select
                          value={formPrecioProveedor.moneda}
                          onChange={(e) => setFormPrecioProveedor((f) => ({ ...f, moneda: e.target.value }))}
                          className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100"
                        >
                          <option value="MXN">MXN</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Unidad</label>
                      <select
                        value={formPrecioProveedor.unidad}
                        onChange={(e) => setFormPrecioProveedor((f) => ({ ...f, unidad: e.target.value }))}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100"
                      >
                        {UNIDADES.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={guardarPrecioProveedor} disabled={savingPrecioProveedor} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50">
                      {savingPrecioProveedor ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button type="button" onClick={() => !savingPrecioProveedor && setModalPrecioProveedor(false)} className="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-200 hover:bg-zinc-600">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'cotizador' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Columna izquierda: Origen + Gastos */}
          <div className="space-y-6">
            <section className="glass-card p-6">
              <h2 className="text-lg font-semibold text-zinc-200 mb-4">Origen de mercancía</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Producto / Concepto</label>
                  <input
                    type="text"
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    placeholder="Ej. Mango Tommy Atkins"
                    className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-2 text-zinc-100 placeholder-zinc-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Cantidad</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      placeholder="10000"
                      className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-2 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Unidad</label>
                    <select
                      value={unidad}
                      onChange={(e) => setUnidad(e.target.value)}
                      className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-2 text-zinc-100"
                    >
                      {UNIDADES.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Costo total de compra (USD)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={costoCompraUsd}
                    onChange={(e) => setCostoCompraUsd(e.target.value)}
                    placeholder="50000"
                    className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-2 text-zinc-100"
                  />
                </div>
                {cantidadNum > 0 && costoCompraNum >= 0 && (
                  <p className="text-sm text-zinc-400 pt-1">
                    Costo unitario origen: <span className="text-emerald-400 font-medium">{formatUSD(costoUnitarioOrigen)} USD / {unidad}</span>
                  </p>
                )}
              </div>
            </section>

            <section className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-200">Gastos logísticos e indirectos</h2>
                <button
                  type="button"
                  onClick={addGasto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-sm font-medium"
                >
                  <PlusIcon className="h-4 w-4" /> Añadir gasto
                </button>
              </div>
              <div className="space-y-3">
                {gastos.map((g, i) => (
                  <div key={i} className="grid grid-cols-[1fr,120px,1fr,auto] gap-2 items-start">
                    <input
                      type="text"
                      value={g.concepto}
                      onChange={(e) => updateGasto(i, 'concepto', e.target.value)}
                      placeholder="Concepto"
                      className="rounded-lg bg-zinc-800/80 border border-zinc-700 px-2 py-1.5 text-sm text-zinc-100"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={g.monto_usd === 0 ? '' : g.monto_usd}
                      onChange={(e) => updateGasto(i, 'monto_usd', parseFloat(e.target.value.replace(/[^0-9.-]/g, '')) || 0)}
                      placeholder="0"
                      className="rounded-lg bg-zinc-800/80 border border-zinc-700 px-2 py-1.5 text-sm text-zinc-100"
                    />
                    <input
                      type="text"
                      value={g.nota}
                      onChange={(e) => updateGasto(i, 'nota', e.target.value)}
                      placeholder="Nota"
                      className="rounded-lg bg-zinc-800/80 border border-zinc-700 px-2 py-1.5 text-sm text-zinc-100"
                    />
                    <button type="button" onClick={() => removeGasto(i)} className="p-1.5 text-zinc-500 hover:text-red-400">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-zinc-400 mt-3">
                Total otros gastos: <span className="text-zinc-200 font-medium">{formatUSD(totalGastosUsd)} USD</span>
              </p>
            </section>
          </div>

          {/* Columna derecha: Análisis + Margen + Guardar */}
          <div className="space-y-6">
            <section className="rounded-xl p-6 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Análisis Euromex</h2>
              <p className="text-sm text-zinc-400 mb-4">Tipo de cambio: <span className="text-zinc-200 font-medium">{formatMXN(tipoCambioNum)} MXN</span></p>
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Inversión final proyectada</p>
                  <p className="text-2xl font-bold text-zinc-50">{formatUSD(inversionFinalUsd)} USD</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Costo unitario final</p>
                  <p className="text-xl font-bold text-emerald-400">{formatUSD(costoUnitarioFinalUsd)} / {unidad}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModoMargen('porcentaje')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${modoMargen === 'porcentaje' ? 'bg-emerald-600 text-white' : 'bg-zinc-700/50 text-zinc-400 hover:text-zinc-200'}`}
                  >
                    % ganancia
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoMargen('precio_fijo')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${modoMargen === 'precio_fijo' ? 'bg-emerald-600 text-white' : 'bg-zinc-700/50 text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Precio fijo
                  </button>
                </div>

                {modoMargen === 'porcentaje' ? (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Margen de ganancia deseado (%)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={margenPorcentaje}
                      onChange={(e) => setMargenPorcentaje(e.target.value)}
                      placeholder="25"
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100"
                    />
                    {margenPctNum >= 0 && costoUnitarioFinalUsd > 0 && (
                      <p className="mt-2 text-sm text-zinc-300">
                        Precio de venta sugerido: <span className="text-emerald-400 font-bold">
                          {moneda === 'USD' ? formatUSD(precioVentaSugeridoUsd) : formatMXN(precioVentaSugeridoUsd * tipoCambioNum)} / {unidad}
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Precio de venta por unidad ({moneda})</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={precioFijo}
                      onChange={(e) => setPrecioFijo(e.target.value)}
                      placeholder={moneda === 'USD' ? '6.25' : '125'}
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100"
                    />
                    {margenRealPct != null && (
                      <p className="mt-2 text-sm text-zinc-300">
                        Margen: <span className={`font-bold ${margenRealPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{margenRealPct.toFixed(1)}%</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tipoCambio}
                  onChange={(e) => setTipoCambio(e.target.value)}
                  placeholder="20"
                  className="w-24 rounded-lg bg-zinc-800 border border-zinc-600 px-2 py-1.5 text-sm text-zinc-100"
                  title="Tipo de cambio MXN"
                />
                <span className="text-zinc-500 text-sm self-center">MXN por USD</span>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={saving || !producto.trim() || cantidadNum <= 0}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {saving ? 'Guardando…' : 'Guardar en BD'}
                </button>
              </div>
            </section>

            {message && (
              <div className={`rounded-lg p-3 text-sm ${message.type === 'ok' ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-700' : 'bg-red-900/40 text-red-200 border border-red-700'}`}>
                {message.text}
              </div>
            )}

            {/* Lista de cotizaciones guardadas */}
            <section className="glass-card p-6">
              <h2 className="text-lg font-semibold text-zinc-200 mb-3">Precios de venta guardados</h2>
              {loadingGuardadas ? (
                <p className="text-zinc-500 text-sm">Cargando…</p>
              ) : guardadas.length === 0 ? (
                <p className="text-zinc-500 text-sm">Aún no hay cotizaciones guardadas.</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {guardadas.slice(0, 20).map((c) => (
                    <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 border-b border-zinc-700/50 last:border-0 text-sm">
                      <span className="text-zinc-300 font-medium">{c.producto_concepto}</span>
                      <span className="text-zinc-500">
                        {c.cantidad} {c.unidad} · {c.precio_venta_unitario != null ? (c.moneda_venta === 'MXN' ? formatMXN(c.precio_venta_unitario) : formatUSD(c.precio_venta_unitario)) : '-'} / {c.unidad}
                        {c.margen_real_porcentaje != null && <span className="text-emerald-500 ml-1">({c.margen_real_porcentaje.toFixed(0)}%)</span>}
                        {c.margen_porcentaje_deseado != null && c.margen_real_porcentaje == null && <span className="text-zinc-400 ml-1">({c.margen_porcentaje_deseado}% margen)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
        )}
      </div>
    </main>
  );
}
