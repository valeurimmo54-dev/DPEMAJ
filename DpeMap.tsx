
import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DpeResult } from './types';

interface DpeMapProps {
  data: DpeResult[];
  centerCommune: string;
}

export interface DpeMapRef {
  focusOn: (lat: number, lon: number, id: string) => void;
}

const COLORS: Record<string, string> = {
  'A': '#00a374', 
  'B': '#54b45f',
  'C': '#a7c14a',
  'D': '#f2c619',
  'E': '#eb8113',
  'F': '#d13813',
  'G': '#b11313',
};

const COMMUNE_COORDS: Record<string, [number, number]> = {
  "Longwy": [49.5222, 5.7617],
  "Longlaville": [49.5333, 5.8000],
  "Mont-Saint-Martin": [49.5408, 5.7772],
  "Herserange": [49.5186, 5.7844],
  "Réhon": [49.5011, 5.7553],
  "Lexy": [49.5008, 5.7317],
  "Mexy": [49.5008, 5.7725],
  "Cosnes-et-Romain": [49.5189, 5.7136],
  "Villerupt": [49.4692, 5.9283],
  "Audun-le-Tiche": [49.4731, 5.9567],
  "Saulnes": [49.5317, 5.8236],
  "Haucourt-Moulaine": [49.4897, 5.8058],
  "Hussigny-Godbrange": [49.4931, 5.9861],
  "Gorcy": [49.5342, 5.6839],
  "Ottange": [49.4444, 6.0189],
  "Aumetz": [49.4189, 5.9450],
  "Russange": [49.4792, 5.9556],
  "Rédange": [49.4967, 5.9239],
  "Villers-la-Montagne": [49.4725, 5.8228],
};

const MapController = forwardRef(({ center }: { center: [number, number] }, ref) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 14);
    // Force la carte à se recalculer après un changement de commune
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [center, map]);

  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lon: number) => {
      map.flyTo([lat, lon], 17, { animate: true, duration: 1.5 });
    }
  }));
  return null;
});

export const DpeMap = forwardRef<DpeMapRef, DpeMapProps>(({ data, centerCommune }, ref) => {
  const initialCenter = COMMUNE_COORDS[centerCommune] || [49.5222, 5.7617];
  const controllerRef = useRef<any>(null);
  const markerRefs = useRef<Record<string, any>>({});
  
  // Filtrage strict des points valides pour éviter les plantages Leaflet
  const points = data.filter(d => 
    d.latitude !== undefined && 
    d.longitude !== undefined && 
    !isNaN(Number(d.latitude)) && 
    !isNaN(Number(d.longitude)) &&
    Number(d.latitude) !== 0
  ).slice(0, 1200);

  useImperativeHandle(ref, () => ({
    focusOn: (lat: number, lon: number, id: string) => {
      if (controllerRef.current) {
        controllerRef.current.flyTo(lat, lon);
        setTimeout(() => {
          const marker = markerRefs.current[id];
          if (marker) {
            marker.openPopup();
          }
        }, 1600);
      }
    }
  }));

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Inconnue";
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch(e) {
      return "Inconnue";
    }
  };

  return (
    <div className="h-[550px] w-full relative bg-slate-100">
      <MapContainer 
        center={initialCenter} 
        zoom={14} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
        />
        <MapController ref={controllerRef} center={initialCenter} />
        {points.map((point) => (
          <CircleMarker
            key={point._id}
            ref={(el) => { if (el) markerRefs.current[point._id] = el; }}
            center={[Number(point.latitude), Number(point.longitude)]}
            radius={8}
            pathOptions={{ 
              fillColor: COLORS[point.etiquette_dpe] || '#94a3b8', 
              fillOpacity: 0.9, 
              color: 'white', 
              weight: 2 
            }}
          >
            <Popup minWidth={240}>
              <div className="p-1 font-sans">
                <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#2563eb] uppercase">EVALUO</span>
                    <span className="text-[10px] font-bold text-slate-500 mt-0.5">{formatDate(point.date_etablissement_dpe)}</span>
                  </div>
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md"
                    style={{ backgroundColor: COLORS[point.etiquette_dpe] || '#cbd5e1' }}
                  >
                    {point.etiquette_dpe}
                  </div>
                </div>
                
                <p className="font-bold text-slate-900 text-[10px] uppercase leading-tight mb-2">{point.adresse_brut}</p>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="block text-slate-400 uppercase text-[7px] font-black">Surface</span>
                    <span className="font-bold">{point.surface_habitable} m²</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="block text-slate-400 uppercase text-[7px] font-black">Chauffage</span>
                    <span className="font-bold truncate block">{point.type_chauffage || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      <div className="absolute bottom-4 left-4 z-[500] flex flex-wrap gap-1.5 pointer-events-none">
        {Object.entries(COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-2 py-1 rounded-md border border-slate-200 shadow-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="text-[9px] font-black text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
