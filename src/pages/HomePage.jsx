import { getGames, getSessions, getUsers } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, Users, Clock, TrendingUp, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({ games: 0, users: 0, sessions: 0, topGame: null });

  useEffect(() => {
    const games = getGames();
    const users_ = getUsers();
    const sessions = getSessions();
    setStats({
      games: games.length,
      users: users_.length,
      sessions: sessions.length,
      topGame: games[0] || null,
    });
  }, []);

  const cards = [
    { icon: <Gamepad2 size={22} color="#8b5cf6" />, label: 'Toplam Oyun', value: stats.games, color: '#8b5cf6' },
    { icon: <Users size={22} color="#06b6d4" />, label: 'Kayıtlı Oyuncu', value: stats.users, color: '#06b6d4' },
    { icon: <Clock size={22} color="#f59e0b" />, label: 'Oyun Seansı', value: stats.sessions, color: '#f59e0b' },
    { icon: <TrendingUp size={22} color="#10b981" />, label: 'En Popüler', value: stats.topGame?.name || '-', color: '#10b981', small: true },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      {/* Welcome */}
      <div className="card p-8 mb-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', filter: 'blur(60px)' }} />
        <div className="flex items-center gap-4 relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Hoş geldin, {user?.username}! 👋</h1>
            <p style={{ color: '#94a3b8' }} className="mt-1">
              {isAdmin ? '👑 Yönetici panelinize erişebilirsiniz.' : 'Bugün hangi oyunu oynayacaksın?'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
        {cards.map((c, i) => (
          <div key={i} className="card p-5 flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${c.color}22` }}>
              {c.icon}
            </div>
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: '#64748b' }}>{c.label}</p>
              <p className={`font-black text-white ${c.small ? 'text-base' : 'text-2xl'}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature showcase */}
      <div className="section-title mb-4">🚀 Platform Özellikleri</div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
        {[
          { icon: '🎮', title: 'Oyun Kütüphanesi', desc: 'Popülerliğe göre sıralı oyunları keşfet ve oyna.' },
          { icon: '🌌', title: 'The Void Grid', desc: 'Kendi hikayeleriyle derin bir fantastik evren.' },
          { icon: '💬', title: 'Topluluk', desc: 'Gönderi paylaş, beğen, yorum yap.' },
          { icon: '📰', title: 'Haberler', desc: 'Platform duyuruları ve etkinlikleri takip et.' },
        ].map((f, i) => (
          <div key={i} className="card p-5 animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-white mb-1">{f.title}</h3>
            <p className="text-sm" style={{ color: '#64748b' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
