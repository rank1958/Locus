import { useState, useEffect } from 'react';
import { getNews, getPosts } from '../lib/db';
import { Gamepad2, LogIn, UserPlus, Newspaper, Clock, Users, Zap } from 'lucide-react';

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'az önce';
  if (s < 3600) return `${Math.floor(s / 60)}dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)}s önce`;
  return `${Math.floor(s / 86400)}g önce`;
}

export default function LandingPage({ onLogin, onRegister }) {
  const [news, setNews] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    (async () => {
      setNews((await getNews()).slice(0, 6));
      setPosts((await getPosts()).slice(0, 5));
    })();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* ── Top Nav ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,11,20,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(139,92,246,0.15)',
      }}>
        <div className="flex items-center justify-between px-6 py-3" style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
              <Gamepad2 size={18} color="white" />
            </div>
            <span className="text-lg font-black tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif', color: '#c4b5fd' }}>GAMEHUB</span>
          </div>

          {/* Auth Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 mt-2 sm:mt-0">
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)', cursor: 'pointer' }}
            >
              <LogIn size={15} /> Oturum Aç
            </button>
            <button
              onClick={onRegister}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              <UserPlus size={15} /> Kayıt Ol
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden py-16 px-6 text-center" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse at center, #8b5cf6 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 text-center" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
            <Zap size={11} className="flex-shrink-0" /> Oyun platformuna hoş geldin
          </div>
          <h1 className="text-4xl font-black mb-3" style={{ fontFamily: 'Orbitron, sans-serif', color: '#c4b5fd' }}>GAMEHUB</h1>
          <p className="text-base mb-8" style={{ color: '#64748b' }}>Oyunları keşfet, topluluğa katıl, maceraya atıl</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={onRegister} className="btn-primary px-8 py-3">
              Ücretsiz Kayıt Ol
            </button>
            <button onClick={onLogin} className="px-6 py-3 rounded-lg font-semibold text-sm" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              Giriş Yap
            </button>
            <a href="/GameHub-Setup.exe" download className="px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 hover:scale-105 transition-transform" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)', textDecoration: 'none' }}>
              <Zap size={16} /> Masaüstü için İndir
            </a>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 pb-16" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Platform Haberleri */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper size={18} color="#8b5cf6" />
              <h2 className="font-bold text-white text-lg">Platform Haberleri</h2>
            </div>
            {news.length === 0 ? (
              <div className="card p-8 text-center" style={{ color: '#64748b' }}>Henüz haber yok</div>
            ) : (
              <div className="flex flex-col gap-4">
                {news.map((item, i) => (
                  <div key={item.id} className="card p-5 animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-white text-base break-words flex-1 min-w-0">{item.title}</h3>
                      <span className="text-xs flex-shrink-0 flex items-center gap-1" style={{ color: '#64748b' }}>
                        <Clock size={11} /> {timeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed break-words" style={{ color: '#94a3b8' }}>{item.content}</p>
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {item.tags.map(t => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sağ Panel — Son Topluluk Postları */}
          <div className="w-full lg:w-[340px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} color="#06b6d4" />
              <h2 className="font-bold text-white text-lg">Topluluktan</h2>
            </div>
            <div className="flex flex-col gap-3">
              {posts.length === 0 ? (
                <div className="card p-6 text-center text-sm" style={{ color: '#64748b' }}>Henüz gönderi yok</div>
              ) : (
                posts.map((p, i) => (
                  <div key={p.id} className="card p-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)', color: 'white' }}>
                        {p.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="font-semibold text-sm text-white">{p.username}</span>
                      <span className="text-xs ml-auto" style={{ color: '#64748b' }}>{timeAgo(p.createdAt)}</span>
                    </div>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>{p.content}</p>
                  </div>
                ))
              )}

              {/* CTA */}
              <div
                className="card p-5 text-center mt-2 flex flex-col items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))', border: '1px solid rgba(139,92,246,0.25)' }}
              >
                <p className="text-sm font-semibold text-white mb-1 break-words">Topluluğa katıl!</p>
                <p className="text-xs mb-3 break-words" style={{ color: '#64748b' }}>Gönderilerini paylaş ve diğer oyuncularla tanış</p>
                <button onClick={onRegister} className="btn-primary text-xs px-4 py-2 w-full max-w-[200px]">
                  Ücretsiz Üye Ol
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
