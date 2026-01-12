
import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { DpeResult } from './types';

interface DpeChartsProps {
  data: DpeResult[];
}

const COLORS = {
  'A': '#00a374', 
  'B': '#54b45f',
  'C': '#a7c14a',
  'D': '#f2c619',
  'E': '#eb8113',
  'F': '#d13813',
  'G': '#b11313',
};

export const DpeCharts: React.FC<DpeChartsProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
    data.forEach(item => {
      const label = item.etiquette_dpe;
      if (label && counts.hasOwnProperty(label)) counts[label]++;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key],
      color: COLORS[key as keyof typeof COLORS] || '#ccc'
    }));
  }, [data]);

  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center h-48 opacity-20">
      <div className="text-[10px] font-black uppercase text-slate-400">En attente de données</div>
    </div>
  );

  return (
    <div className="w-full">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Répartition des Étiquettes DPE</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
              itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 800 }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar dataKey="value" name="Nombre" radius={[6, 6, 0, 0]} barSize={26}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList dataKey="value" position="top" style={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
