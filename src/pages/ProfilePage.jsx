import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSessions, getGames, getFavorites, updateUser } from '../lib/db';
import { Gamepad2, Clock, Star, Trophy, Edit2, Check, X, Heart, Zap } from 'lucide-react';

const LEVEL_THRESHOLDS = [0, 60, 300, 900, 2700, 7200, 18000, 43200, 86400, 172800, Infinity];
const LEVEL_NAMES = ['Yeni Oyuncu', 'Acemi', 'Hevesli', 'Deneyimli', 'Uzman', 'Usta', 'Efsane', 'Titan', 'Olimpos', 'Tanrı'];
const LEVEL_COLORS = ['#64748b','#10b981','#06b6d4','#8b5cf6','#f59e0b','#ef4444','#ec4899','#f97316','#a855f7','#eab308'];

function getLevel(totalSecs) {
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (totalSecs < LEVEL_THRESHOLDS[i + 1]) return { level: i + 1, name: LEVEL_NAMES[i], color: LEVEL_COLORS[i], progress: (totalSecs - LEVEL_THRESHOLDS[i]) / (LEVEL_THRESHOLDS[i + 1] - LEVEL_THRESHOLDS[i]) * 100, next: LEVEL_THRESHOLDS[i + 1] };
  }
  return { level: 10, name: LEVEL_NAMES[9], color: LEVEL_COLORS[9], progress: 100, next: null };
}

function fmtTime(s) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
  return `${Math.floor(s / 3600)}sa ${Math.floor((s % 3600) / 60)}dk`;
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#8b5cf6,#6366f1)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#ef4444,#f97316)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [games, setGames] = useState([]);
  const [favs, setFavs] = useState([]);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [bioInput, setBioInput] = useState(user?.bio || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || AVATAR_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const [sess, gms, favsList] = await Promise.all([getSessions(), getGames(), getFavorites(user?.id)]);
      setSessions(sess.filter(s => s.userId === user?.id));
      setGames(gms);
      setFavs(favsList);
    })();
  }, [user?.id]);

  const totalSecs = sessions.reduce((s, sess) => s + (sess.duration || 0), 0);
  const uniqueGames = [...new Set(sessions.map(s => s.gameId))].length;
  const lvl = getLevel(totalSecs);
  const favGames = games.filter(g => favs.some(f => f.gameId === g.id));
  const recentSessions = sessions.slice(0, 8);

  const saveBio = async () => {
    await updateUser(user.id, { bio: bioInput, avatarColor });
    setBio(bioInput);
    setEditingBio(false);
    refreshUser();
  };

  const saveAvatarColor = async (color) => {
    setAvatarColor(color);
    setShowColorPicker(false);
    await updateUser(user.id, { avatarColor: color });
    refreshUser();
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>

      {/* ── Profile Header ── */}
      <div className="card p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(ellipse at top left, ${lvl.color}, transparent 60%)` }} />
        <div className="flex items-start gap-6 relative">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black text-white cursor-pointer"
              style={{ background: avatarColor, boxShadow: `0 0 30px ${lvl.color}55` }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background: lvl.color }}>
              {lvl.level}
            </div>
            {showColorPicker && (
              <div className="absolute top-24 left-0 z-10 card p-3 flex flex-col gap-2" style={{ minWidth: 160 }}>
                <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Avatar rengi</p>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map(c => (
                    <div key={c} onClick={() => saveAvatarColor(c)} className="w-8 h-8 rounded-lg cursor-pointer" style={{ background: c, border: c === avatarColor ? '2px solid white' : '2px solid transparent' }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-white">{user?.username}</h1>
              <span className="badge" style={{ background: `${lvl.color}22`, color: lvl.color, border: `1px solid ${lvl.color}44` }}>
                <Zap size={10} /> {lvl.name}
              </span>
            </div>
            <p className="text-sm mb-3" style={{ color: '#64748b' }}>
              {user?.email} · Üye: {new Date(user?.createdAt || Date.now()).toLocaleDateString('tr-TR')}
            </p>

            {/* Bio */}
            {editingBio ? (
              <div className="flex items-center gap-2">
                <input value={bioInput} onChange={e => setBioInput(e.target.value)} placeholder="Kendiniz hakkında bir şeyler yazın..." maxLength={120}
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-white" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.3)', outline: 'none' }} />
                <button onClick={saveBio} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#10b981' }}><Check size={14} color="white" /></button>
                <button onClick={() => setEditingBio(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}><X size={14} color="#94a3b8" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditingBio(true)}>
                <p className="text-sm" style={{ color: bio ? '#94a3b8' : '#475569' }}>{bio || 'Bio eklemek için tıklayın...'}</p>
                <Edit2 size={12} color="#475569" />
              </div>
            )}

            {/* XP Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1" style={{ color: '#64748b' }}>
                <span>Seviye {lvl.level} — {fmtTime(totalSecs)} oynandı</span>
                {lvl.next && <span>Sonraki: {fmtTime(lvl.next)}</span>}
              </div>
              <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${lvl.progress}%`, background: `linear-gradient(90deg, ${lvl.color}, ${lvl.color}99)` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { icon: <Clock size={20} color="#8b5cf6" />, label: 'Toplam Süre', value: fmtTime(totalSecs), color: '#8b5cf6' },
          { icon: <Gamepad2 size={20} color="#06b6d4" />, label: 'Oynanan Oyun', value: uniqueGames, color: '#06b6d4' },
          { icon: <Trophy size={20} color="#f59e0b" />, label: 'Seans', value: sessions.length, color: '#f59e0b' },
          { icon: <Heart size={20} color="#ec4899" />, label: 'Favori', value: favGames.length, color: '#ec4899' },
        ].map((s, i) => (
          <div key={i} className="card p-4 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${s.color}22` }}>{s.icon}</div>
            <p className="text-xl font-black text-white">{s.value}</p>
            <p className="text-xs" style={{ color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* ── Favorite Games ── */}
        <div>
          <h2 className="font-bold text-white mb-3 flex items-center gap-2"><Heart size={16} color="#ec4899" /> Favori Oyunlar</h2>
          {favGames.length === 0
            ? <div className="card p-6 text-center text-sm" style={{ color: '#475569' }}>Henüz favori oyun yok</div>
            : <div className="flex flex-col gap-2">
                {favGames.map(g => (
                  <div key={g.id} className="card p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: g.color + '33' }}>
                      <Gamepad2 size={16} color={g.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{g.name}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>{g.category}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${g.color}22`, color: g.color }}>{g.plays} oynandı</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* ── Recent Sessions ── */}
        <div>
          <h2 className="font-bold text-white mb-3 flex items-center gap-2"><Star size={16} color="#f59e0b" /> Son Seanslar</h2>
          {recentSessions.length === 0
            ? <div className="card p-6 text-center text-sm" style={{ color: '#475569' }}>Henüz oyun oynamadınız</div>
            : <div className="flex flex-col gap-2">
                {recentSessions.map(s => (
                  <div key={s.id} className="card p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-white">{s.gameName}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>{s.date} {s.time}</p>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: '#8b5cf6' }}>{s.durationStr}</span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  );
}
