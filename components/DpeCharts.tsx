import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { DpeResult } from '../types';

interface DpeChartsProps {
  data: DpeResult[];
}

const COLORS = {
  'A': '#22c55e',
  'B': '#84cc16',
  'C': '#eab308',
  'D': '#f97316',
  'E': '#ef4444',
  'F': '#b91c1c',
  'G': '#7f1d1d',
};

export const DpeCharts: React.FC<DpeChartsProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
    
    data.forEach(item => {
      const label = item.etiquette_dpe;
      if (label && counts.hasOwnProperty(label)) {
        counts[label]++;
      }
    });

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key],
      color: COLORS[key as keyof typeof COLORS] || '#ccc'
    }));
  }, [data]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Répartition des Étiquettes DPE</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              cursor={{ fill: '#f1f5f9' }}
            />
            <Bar dataKey="value" name="Nombre de logements" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};