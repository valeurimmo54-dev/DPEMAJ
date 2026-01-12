import React, { useState, useEffect, useMemo, useRef } from 'react';
import { COMMUNES_40 } from './constants';
import { fetchDpeByCommune, downloadAsCsv } from './services/ademeService';
import { DpeResult, FetchStatus } from './types';
import { DpeCharts } from './components/DpeCharts';
import { DpeMap, DpeMapRef } from './DpeMap';
import { 
  Download, Loader2, MapPin, Search, Database, LayoutDashboard, AlertTriangle, Calendar, Map as MapIcon, List
} from 'lucide-react';

const COLORS: Record<string, string> = {
  'A': 'bg-emerald-500', 'B': 'bg-lime-500', 'C': 'bg-yellow-400', 'D': 'bg-orange-400', 
  'E': 'bg-orange-600', 'F': 'bg-red-600', 'G': 'bg-red-900',
};

export default function App() {
  const [commune, setCommune] = useState(COMMUNES_40[0]);
  const [data, setData] = useState<DpeResult[]>([]);
  const [status, setStatus] = useState<FetchStatus>(FetchStatus.IDLE);
  const [view, setView] = useState<'table' | 'map'>('table');
  
  const mapRef = useRef<DpeMapRef>(null);

  // États pour le filtre d'année
  const [yearMin, setYearMin] = useState<string>('');
  const [yearMax, setYearMax] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [commune]);

  const loadData = async () => {
    setStatus(FetchStatus.LOADING);
    try {
      const res = await fetchDpeByCommune(commune);
      setData(res.results);
      setStatus(FetchStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setStatus(FetchStatus.ERROR);
    }
  };

  const parseYear = (val: string | number): number | null => {
    if (typeof val === 'number') return val;
    if (!val) return null;
    const match = String(val).match(/\d{4}/);
    return match ? parseInt(match[0], 10) : null;
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const itemYear = parseYear(item.annee_construction);
      const min = yearMin ? parseInt(yearMin, 10) : -Infinity;
      const max = yearMax ? parseInt(yearMax, 10) : Infinity;
      
      if (!itemYear && (yearMin || yearMax)) return false;
      if (itemYear) {
        return itemYear >= min && itemYear <= max;
      }
      return true;
    });
  }, [data, yearMin, yearMax]);

  const passoireCount = useMemo(() => 
    filteredData.filter(d => d.etiquette_dpe === 'F' || d.etiquette_dpe === 'G').length, 
  [filteredData]);

  const handleFocusPoint = (lat: number, lon: number, id: string) => {
    setView('map');
    setTimeout(() => {
      mapRef.current?.focusOn(lat, lon, id);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database className="text-emerald-400" />
            <span className="font-bold text-xl tracking-tight">DPE Hub <span className="text-slate-500 font-normal">Prospection</span></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-1 rounded-lg flex mr-4">
              <button 
                onClick={() => setView('table')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${view === 'table' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <List size={14} /> Liste
              </button>
              <button 
                onClick={() => setView('map')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${view === 'map' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <MapIcon size={14} /> Carte
              </button>
            </div>
            <button 
              onClick={() => downloadAsCsv(filteredData, `Export_${commune}.csv`)}
              disabled={filteredData.length === 0}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
            >
              <Download size={16} /> Exporter CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 col-span-1 md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Zone de Prospection</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={commune} 
                onChange={(e) => setCommune(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-lg font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {COMMUNES_40.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 col-span-1">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Année de construction</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={yearMin}
                  onChange={(e) => setYearMin(e.target.value)}
                  className="w-full pl-7 pr-2 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-slate-300">-</span>
              <div className="relative flex-1">
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={yearMax}
                  onChange={(e) => setYearMax(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center text-center">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Total Affiché</p>
            <p className="text-3xl font-black text-slate-800">{status === FetchStatus.LOADING ? '...' : filteredData.length}</p>
          </div>
        </div>

        {status === FetchStatus.LOADING ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-emerald-600" size={48} />
            <p className="text-slate-500 font-medium animate-pulse">Chargement des données...</p>
          </div>
        ) : status === FetchStatus.ERROR ? (
          <div className="bg-red-50 p-8 rounded-xl border border-red-200 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-lg font-bold text-red-800">Erreur API ADEME</h3>
            <p className="text-red-600 mb-4">Impossible de récupérer les données pour {commune}.</p>
            <button onClick={loadData} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold">Réessayer</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <DpeCharts data={filteredData} />
              </div>
              <div className="bg-rose-50 p-6 rounded-xl border border-rose-100 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-rose-900 font-black text-[10px] uppercase mb-1 tracking-tighter">Passoires Thermiques (F/G)</p>
                  <p className="text-3xl font-black text-rose-600">{passoireCount}</p>
                </div>
                <div className="p-3 bg-white rounded-full text-rose-500 shadow-sm border border-rose-100">
                  <Search size={24} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
              {view === 'map' ? (
                <DpeMap ref={mapRef} data={filteredData} centerCommune={commune} />
              ) : (
                <>
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard size={16} className="text-slate-400" />
                      <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Registre de Prospection</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-white shadow-sm z-10">
                        <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                          <th className="p-4">Adresse</th>
                          <th className="p-4">Infos</th>
                          <th className="p-4 text-center">Note</th>
                          <th className="p-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[13px]">
                        {filteredData.length === 0 ? (
                          <tr><td colSpan={4} className="p-10 text-center text-slate-400 italic">Aucune donnée trouvée</td></tr>
                        ) : (
                          filteredData.slice(0, 500).map(item => (
                            <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <p className="font-bold text-slate-700 leading-tight">{String(item.adresse_brut || '')}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{String(item.code_postal || '')} {String(item.commune_brut || '')}</p>
                              </td>
                              <td className="p-4 text-slate-500">
                                <span className="font-bold text-slate-700">{Number(item.surface_habitable || 0)} m²</span>
                                <div className="text-[10px]">{String(item.annee_construction || 'N/A')}</div>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-block w-8 h-8 leading-8 rounded-lg text-white font-black text-sm shadow-sm ${COLORS[String(item.etiquette_dpe || 'N/A')] || 'bg-slate-300'}`}>
                                  {String(item.etiquette_dpe || 'N/A')}
                                </span>
                              </td>
                              <td className="p-4">
                                {item.latitude && item.longitude && (
                                  <button 
                                    onClick={() => handleFocusPoint(Number(item.latitude), Number(item.longitude), item._id)}
                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                    title="Voir sur la carte"
                                  >
                                    <MapIcon size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}