export type TrackingEvento = {
  fecha: string;
  descripcion: string;
  ubicacion?: string;
};

export type TrackingResult = {
  status: string;
  lat?: number;
  lng?: number;
  temperatura?: number;
  eventos: TrackingEvento[];
  ultimaActualizacion: string;
  carrier: string;
};

export type CarrierAdapter = (guia: string) => Promise<TrackingResult>;
