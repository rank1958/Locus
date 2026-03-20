import { useState, useEffect } from 'react';
import { getVoidGames } from '../../lib/db';
import GameModal from '../../components/GameModal';
import { Play, Star, Globe } from 'lucide-react';

export default function VoidGames() {
  const [games, setGames] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = async () => setGames(await getVoidGames());
  useEffect(() => { load(); }, []);
  const handleClose = () => { setSelected(null); load(); };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="section-title">
        <Globe size={18} color="#8b5cf6" />
        <span style={{ background: 'linear-gradient(135deg,#c4b5fd,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Void Grid Oyunları
        </span>
      </div>

      <p className="text-sm mb-6" style={{ color: '#64748b' }}>
        The Void Grid evrenine ait özel tematik oyunlar. Karanlık görevler seni bekliyor.
      </p>

      {games.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3" style={{ color: '#4b5563' }}>
          <span className="text-4xl">🌌</span>
          <p>Henüz Void oyunu eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))' }}>
          {games.map((game, i) => (
            <div key={game.id} className="card p-5 flex flex-col gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.05}s`, borderColor: 'rgba(99,38,246,0.3)', background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(99,102,241,0.05))' }}>
              <div className="w-full h-28 rounded-xl flex items-center justify-center text-4xl" style={{ background: `linear-gradient(135deg, ${game.color || '#7c3aed'}22, ${game.color || '#7c3aed'}44)`, border: `1px solid ${game.color || '#7c3aed'}55` }}>
                🌌
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{game.name}</h3>
                <span className="badge badge-purple mt-1">{game.category}</span>
              </div>
              <div className="flex gap-3 text-xs" style={{ color: '#64748b' }}>
                <span className="flex items-center gap-1"><Play size={11} /> {game.plays || 0}</span>
                <span className="flex items-center gap-1"><Star size={11} /> {(game.uniquePlayers || []).length} oyuncu</span>
              </div>
              <button onClick={() => setSelected(game)} className="btn-primary w-full flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                <Play size={14} /> Oyna
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && <GameModal game={selected} onClose={handleClose} isVoid />}
    </div>
  );
}
