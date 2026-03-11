'use client';

/**
 * EnviosMap — mapa interactivo con react-leaflet.
 * Muestra la posición GPS de cada envío con guía rastreada.
 * Must be loaded via dynamic import with ssr:false to avoid SSR issues with Leaflet.
 */

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon paths broken by Webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const statusColor: Record<string, string> = {
  Pendiente: '#eab308',
  'En tránsito': '#3b82f6',
  Entregado: '#22c55e',
  Cancelado: '#ef4444',
};

function makeIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export type EnvioMapPoint = {
  id_envio: string;
  producto?: string | null;
  guia_rastreo?: string | null;
  estado_envio?: string | null;
  lat_actual?: number | null;
  lng_actual?: number | null;
  temperatura_actual?: number | null;
  ultima_actualizacion?: string | null;
};

type Props = {
  envios: EnvioMapPoint[];
  height?: number;
};

export default function EnviosMap({ envios, height = 480 }: Props) {
  useEffect(() => {
    // Ensure Leaflet CSS is loaded
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  const conCoordenadas = envios.filter(
    (e) => e.lat_actual != null && e.lng_actual != null
  );

  const center: [number, number] = conCoordenadas.length > 0
    ? [conCoordenadas[0].lat_actual!, conCoordenadas[0].lng_actual!]
    : [23.6345, -102.5528]; // Centro de México

  if (conCoordenadas.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-500 text-sm"
        style={{ height }}
      >
        Sin envíos con coordenadas GPS. Usa el botón &quot;Rastrear&quot; en cada envío para obtener su posición.
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={5}
      style={{ height, borderRadius: '0.75rem', border: '1px solid rgba(100,116,139,0.3)' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {conCoordenadas.map((envio) => {
        const color = statusColor[envio.estado_envio ?? ''] ?? '#94a3b8';
        return (
          <Marker
            key={envio.id_envio}
            position={[envio.lat_actual!, envio.lng_actual!]}
            icon={makeIcon(color)}
          >
            <Popup>
              <div className="text-slate-800 text-sm space-y-1 min-w-[180px]">
                <div className="font-bold">{envio.id_envio}</div>
                {envio.producto && <div>{envio.producto}</div>}
                {envio.guia_rastreo && <div className="text-xs text-gray-500">Guía: {envio.guia_rastreo}</div>}
                <div>
                  <span
                    style={{ color }}
                    className="font-semibold"
                  >
                    {envio.estado_envio ?? 'Sin estado'}
                  </span>
                </div>
                {envio.temperatura_actual != null && (
                  <div>Temperatura: {envio.temperatura_actual}°C</div>
                )}
                {envio.ultima_actualizacion && (
                  <div className="text-xs text-gray-400">
                    Actualizado: {new Date(envio.ultima_actualizacion).toLocaleString('es-MX')}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
