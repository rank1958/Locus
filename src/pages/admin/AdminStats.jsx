import { useState, useEffect } from 'react';
import { getGames } from '../../lib/db';
import { BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#8b5cf6', '#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

export default function AdminStats() {
  const [games, setGames] = useState([]);
  useEffect(() => { setGames(getGames()); }, []);

  const chartData = games.map(g => ({
    name: g.name.length > 12 ? g.name.slice(0, 12) + '…' : g.name,
    Oynanma: g.plays || 0,
    Oyuncu: (g.uniquePlayers || []).length,
    OrtSüre: g.plays > 0 ? Math.round((g.totalTime || 0) / g.plays / 60) : 0,
  }));

  const pieData = games.filter(g => (g.plays || 0) > 0).map(g => ({ name: g.name, value: g.plays }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass rounded-xl p-3 text-sm">
        <p className="font-bold text-white mb-1">{label}</p>
        {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="section-title"><BarChart2 size={18} color="#8b5cf6" /> İstatistikler</div>

      {/* Summary cards */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))' }}>
        {games.slice(0, 4).map((g, i) => (
          <div key={g.id} className="card p-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <p className="text-xs font-semibold mb-1 truncate" style={{ color: '#64748b' }}>{g.name}</p>
            <p className="text-2xl font-black text-white">{g.plays || 0}</p>
            <p className="text-xs" style={{ color: '#64748b' }}>oynanma</p>
            <hr className="divider my-2" />
            <p className="text-sm font-bold" style={{ color: '#a78bfa' }}>{(g.uniquePlayers || []).length} oyuncu</p>
            <p className="text-xs" style={{ color: '#4b5563' }}>~{g.plays > 0 ? Math.round((g.totalTime || 0) / g.plays / 60) : 0}dk ort.</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Bar chart */}
        <div className="card p-5">
          <h3 className="font-bold mb-4 text-sm" style={{ color: '#c4b5fd' }}>Oynanma Sayıları</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Oynanma" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card p-5">
          <h3 className="font-bold mb-4 text-sm" style={{ color: '#c4b5fd' }}>Oyun Dağılımı</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48" style={{ color: '#4b5563' }}>Veri yok</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
