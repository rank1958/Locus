import { useState, useEffect, useRef, useCallback } from 'react';
import { getGames, getFavorites, toggleFavorite, getRatings } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import GameModal from '../components/GameModal';
import { Play, Users, Clock, Heart, Star, Search, Download, Trash2, HardDrive } from 'lucide-react';

const CATEGORIES = ['Tümü', 'Aksiyon', 'Bulmaca', 'Strateji', 'Yarış', 'Spor', 'RPG'];
const COLORS = ['#8b5cf6', '#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

export default function GamesPage() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [selected, setSelected] = useState(null);
  const [storeView, setStoreView] = useState(false);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Tümü');
  const [favIds, setFavIds] = useState(new Set());
  const [ratingMap, setRatingMap] = useState({});
  const [sortBy, setSortBy] = useState('plays');

  // { gameId: { percent, status } }  status: 'downloading' | 'extracting' | 'done' | 'error'
  const [dlState, setDlState] = useState({});
  // { gameId: { installed, exePath } }
  const [installState, setInstallState] = useState({});
  const unlistenRef = useRef(null);

  const isElectron = !!window.electronAPI;

  const load = async () => {
    const [gms, favs, ratings] = await Promise.all([
      getGames(),
      getFavorites(user?.id),
      getRatings(),
    ]);
    setGames(gms);
    setFavIds(new Set(favs.map(f => f.gameId)));
    const map = {};
    ratings.forEach(r => {
      if (!map[r.gameId]) map[r.gameId] = { sum: 0, count: 0 };
      map[r.gameId].sum += r.rating;
      map[r.gameId].count += 1;
    });
    setRatingMap(map);

    // Desktop oyunların kurulum durumunu kontrol et
    if (isElectron) {
      const desktopGames = gms.filter(g => g.gameType === 'desktop');
      const checks = await Promise.all(
        desktopGames.map(g =>
          window.electronAPI.getGamePath(g.id, g.exeName)
            .then(res => ({ id: g.id, ...res }))
        )
      );
      const iState = {};
      checks.forEach(c => { iState[c.id] = { installed: c.installed, exePath: c.exePath }; });
      setInstallState(iState);
    }
  };

  useEffect(() => {
    load();

    // Download progress dinleyici
    if (isElectron && window.electronAPI.onDownloadProgress) {
      const unlisten = window.electronAPI.onDownloadProgress((data) => {
        setDlState(prev => ({ ...prev, [data.gameId]: { percent: data.percent, status: data.status, message: data.message } }));
        if (data.status === 'done') {
          // Kurulum durumunu güncelle
          const game = games.find(g => g.id === data.gameId);
          if (game) {
            window.electronAPI.getGamePath(data.gameId, game.exeName).then(res => {
              setInstallState(prev => ({ ...prev, [data.gameId]: { installed: res.installed, exePath: res.exePath } }));
            });
          }
        }
      });
      unlistenRef.current = unlisten;
    }

    return () => {
      if (unlistenRef.current) unlistenRef.current();
    };
  }, [user?.id]);

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

  const handleClose = () => { setSelected(null); setStoreView(false); load(); };

  const openStore = (e, game) => {
    e.stopPropagation();
    setStoreView(true);
    setSelected(game);
  };

  const handleDownload = async (e, game) => {
    e.stopPropagation();
    if (!isElectron) return alert('Bu özellik sadece masaüstü uygulamasında kullanılabilir.');
    if (!game.downloadUrl) return alert('Bu oyun için indirme bağlantısı tanımlanmamış.');

    const fileName = game.downloadUrl.split('/').pop() || 'game.zip';
    setDlState(prev => ({ ...prev, [game.id]: { percent: 0, status: 'downloading' } }));
    window.electronAPI.downloadGame(game.id, game.downloadUrl, fileName);
  };

  const handleDelete = async (e, game) => {
    e.stopPropagation();
    if (!isElectron) return;
    if (!confirm(`"${game.name}" yerel dosyaları silinsin mi?`)) return;
    await window.electronAPI.deleteGame(game.id);
    setInstallState(prev => ({ ...prev, [game.id]: { installed: false } }));
    setDlState(prev => { const n = { ...prev }; delete n[game.id]; return n; });
  };

  const handlePlay = async (e, game) => {
    e.stopPropagation();
    const inst = installState[game.id];
    if (!inst?.installed || !inst?.exePath) return;
    await window.electronAPI.launchGameExe(inst.exePath);
  };

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

  // Desktop oyun buton alanı
  const DesktopGameActions = ({ game }) => {
    const dl = dlState[game.id];
    const inst = installState[game.id];
    const isDownloading = dl && (dl.status === 'downloading' || dl.status === 'extracting');
    const isInstalled = inst?.installed;

    if (isDownloading) {
      const label = dl.status === 'extracting' ? 'Açılıyor...' : `${dl.percent}%`;
      return (
        <div className="flex flex-col gap-1">
          <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(139,92,246,0.2)' }}>
            <div style={{ width: `${dl.percent}%`, height: '100%', background: 'linear-gradient(90deg,#8b5cf6,#06b6d4)', transition: 'width 0.3s' }} />
          </div>
          <span className="text-xs text-center" style={{ color: '#a78bfa' }}>{label}</span>
        </div>
      );
    }

    if (dl?.status === 'error') {
      return (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-center" style={{ color: '#fca5a5' }}>❌ Hata: {dl.message}</span>
          <button onClick={e => handleDownload(e, game)} className="btn-secondary w-full flex items-center justify-center gap-2" style={{ fontSize: '0.8rem' }}>
            <Download size={13} /> Tekrar Dene
          </button>
        </div>
      );
    }

    if (isInstalled) {
      return (
        <div className="flex gap-2">
          <button onClick={e => handlePlay(e, game)} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Play size={14} /> Oyna
          </button>
          <button onClick={e => handleDelete(e, game)} className="flex items-center justify-center rounded-lg px-3"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      );
    }

    return (
      <button onClick={e => handleDownload(e, game)} className="btn-secondary w-full flex items-center justify-center gap-2">
        <Download size={14} />
        İndir {game.downloadSize ? `(${game.downloadSize})` : ''}
      </button>
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
            const isDesktop = game.gameType === 'desktop';

            return (
              <div key={game.id} className="card p-5 flex flex-col gap-3 animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s`, transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                onClick={(e) => isDesktop ? openStore(e, game) : setSelected(game)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${color}33`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>

                {/* Game icon + fav btn */}
                <div className="relative w-full h-28 rounded-xl flex items-center justify-center text-4xl" style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)`, border: `1px solid ${color}44` }}>
                  {isDesktop ? <HardDrive size={40} color={color} /> : '🎮'}
                  {isDesktop && <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${color}33`, color }}>Masaüstü</span>}
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

                {isDesktop ? (
                  <DesktopGameActions game={game} />
                ) : (
                  <button onClick={() => setSelected(game)} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Play size={14} /> Oyna
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected && <GameModal game={selected} onClose={handleClose} storeView={storeView} dlState={dlState[selected?.id]} />}
    </div>
  );
}
