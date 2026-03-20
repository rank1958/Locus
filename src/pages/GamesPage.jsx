import { useState, useEffect } from 'react';
import { getGames } from '../lib/db';
import GameModal from '../components/GameModal';
import { Play, Trophy, Users, Clock, Search, Filter } from 'lucide-react';

const CATEGORIES = ['Tümü', 'Aksiyon', 'Bulmaca', 'Strateji', 'Yarış', 'Spor', 'RPG'];

const COLORS = ['#8b5cf6', '#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Tümü');

  const load = async () => setGames(await getGames());
  useEffect(() => { load(); }, []);

  const filtered = games.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.name.toLowerCase().includes(q) || (g.category || '').toLowerCase().includes(q);
    const matchCat = cat === 'Tümü' || g.category === cat;
    return matchSearch && matchCat;
  });

  const handleClose = () => { setSelected(null); load(); };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="section-title">
        <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎮 Oyun Kütüphanesi
        </span>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input className="input-field" style={{ paddingLeft: '2.25rem' }} placeholder="Oyun ara..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} className={cat === c ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3" style={{ color: '#4b5563' }}>
          <span className="text-4xl">🎮</span>
          <p>Buraya henüz oyun eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {filtered.map((game, i) => (
            <div key={game.id} className="card p-5 flex flex-col gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              {/* Game icon */}
              <div className="w-full h-28 rounded-xl flex items-center justify-center text-4xl" style={{ background: `linear-gradient(135deg, ${game.color || COLORS[i % COLORS.length]}22, ${game.color || COLORS[i % COLORS.length]}44)`, border: `1px solid ${game.color || COLORS[i % COLORS.length]}44` }}>
                🎮
              </div>

              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{game.name}</h3>
                <span className="badge badge-purple mt-1">{game.category || 'Genel'}</span>
              </div>

              <div className="flex gap-4 text-xs" style={{ color: '#64748b' }}>
                <span className="flex items-center gap-1"><Play size={11} /> {game.plays || 0} oynanma</span>
                <span className="flex items-center gap-1"><Users size={11} /> {(game.uniquePlayers || []).length} oyuncu</span>
                <span className="flex items-center gap-1"><Clock size={11} /> {Math.round((game.totalTime || 0) / 60)}dk</span>
              </div>

              <button onClick={() => setSelected(game)} className="btn-primary w-full flex items-center justify-center gap-2">
                <Play size={14} /> Oyna
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && <GameModal game={selected} onClose={handleClose} />}
    </div>
  );
}
