import { useState, useEffect } from 'react';
import { getGames, getFavorites, toggleFavorite, getRatings } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import GameModal from '../components/GameModal';
import { Play, Users, Clock, Heart, Star, Search } from 'lucide-react';

const CATEGORIES = ['Tümü', 'Aksiyon', 'Bulmaca', 'Strateji', 'Yarış', 'Spor', 'RPG'];
const COLORS = ['#8b5cf6', '#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

export default function GamesPage() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Tümü');
  const [favIds, setFavIds] = useState(new Set());
  const [ratingMap, setRatingMap] = useState({});
  const [sortBy, setSortBy] = useState('plays');

  const load = async () => {
    const [gms, favs, ratings] = await Promise.all([
      getGames(),
      getFavorites(user?.id),
      getRatings(),
    ]);
    setGames(gms);
    setFavIds(new Set(favs.map(f => f.gameId)));
    // Build avg rating map
    const map = {};
    ratings.forEach(r => {
      if (!map[r.gameId]) map[r.gameId] = { sum: 0, count: 0 };
      map[r.gameId].sum += r.rating;
      map[r.gameId].count += 1;
    });
    setRatingMap(map);
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleFav = async (e, gameId) => {
    e.stopPropagation();
    await toggleFavorite(user?.id, gameId);
    setFavIds(prev => {
      const next = new Set(prev);
      next.has(gameId) ? next.delete(gameId) : next.add(gameId);
      return next;
    });
  };

  const getAvgRating = (gameId) => {
    const r = ratingMap[gameId];
    return r ? (r.sum / r.count) : 0;
  };

  const handleClose = () => { setSelected(null); load(); };

  const filtered = games
    .filter(g => {
      const q = search.toLowerCase();
      return (!q || g.name.toLowerCase().includes(q) || (g.category || '').toLowerCase().includes(q))
        && (cat === 'Tümü' || g.category === cat);
    })
    .sort((a, b) => sortBy === 'plays' ? (b.plays || 0) - (a.plays || 0) : getAvgRating(b.id) - getAvgRating(a.id));

  const StarRating = ({ gameId }) => {
    const avg = getAvgRating(gameId);
    const r = ratingMap[gameId];
    return (
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(s => (
          <Star key={s} size={11} fill={s <= Math.round(avg) ? '#f59e0b' : 'none'} color="#f59e0b" />
        ))}
        {r && <span className="text-xs" style={{ color: '#64748b' }}>({r.count})</span>}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="section-title mb-6">
        <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎮 Oyun Kütüphanesi
        </span>
        <span className="text-sm font-normal ml-3" style={{ color: '#64748b' }}>{filtered.length} oyun</span>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b', pointerEvents: 'none' }} />
          <input className="input-field" style={{ paddingLeft: '2.25rem' }} placeholder="Oyun ara..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: 140 }}>
          <option value="plays">Popülerliğe Göre</option>
          <option value="rating">Puana Göre</option>
        </select>
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} className={cat === c ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3" style={{ color: '#4b5563' }}>
          <span className="text-4xl">🎮</span>
          <p>Oyun bulunamadı.</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {filtered.map((game, i) => {
            const color = game.color || COLORS[i % COLORS.length];
            const isFav = favIds.has(game.id);
            return (
              <div key={game.id} className="card p-5 flex flex-col gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.05}s`, transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${color}33`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>

                {/* Game icon + fav btn */}
                <div className="relative w-full h-28 rounded-xl flex items-center justify-center text-4xl" style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)`, border: `1px solid ${color}44` }}>
                  🎮
                  <button onClick={e => handleFav(e, game.id)} className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: isFav ? '#ec4899' : 'rgba(0,0,0,0.4)' }}>
                    <Heart size={13} fill={isFav ? 'white' : 'none'} color="white" />
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base leading-tight">{game.name}</h3>
                  <span className="badge badge-purple mt-1">{game.category || 'Genel'}</span>
                </div>

                <StarRating gameId={game.id} />

                <div className="flex gap-4 text-xs" style={{ color: '#64748b' }}>
                  <span className="flex items-center gap-1"><Play size={11} /> {game.plays || 0}</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {(game.uniquePlayers || []).length}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {Math.round((game.totalTime || 0) / 60)}dk</span>
                </div>

                <button onClick={() => setSelected(game)} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Play size={14} /> Oyna
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selected && <GameModal game={selected} onClose={handleClose} />}
    </div>
  );
}
