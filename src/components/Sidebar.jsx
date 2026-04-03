import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Gamepad2, Home, Users, Newspaper, BarChart2, Settings,
  ChevronDown, ChevronRight, LogOut, Star, Shield, Globe, Download, User
} from 'lucide-react';

const VOID_ITEMS = [
  { key: 'void-lore', label: 'Ana Hikaye' },
  { key: 'void-games', label: 'Void Oyunlar' },
  { key: 'void-news', label: 'Evren Haberleri' },
  { key: 'void-characters', label: 'Karakterler' },
];

const ADMIN_ITEMS = [
  { key: 'admin-analytics', label: 'Canlı Veri', icon: BarChart2 },
  { key: 'admin-stats', label: 'İstatistikler', icon: BarChart2 },
  { key: 'admin-games', label: 'Oyun Yönetimi', icon: Gamepad2 },
  { key: 'admin-accounts', label: 'Hesap Yönetimi', icon: Users },
  { key: 'admin-roles', label: 'Rol Yönetimi', icon: Shield },
];

export default function Sidebar({ active, onNav }) {
  const { user, userRole, logout, isAdmin } = useAuth();
  const [gamesOpen, setGamesOpen] = useState(true);
  const [voidOpen, setVoidOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const DEFAULT_ALLOWED = ['home', 'profile'];
  const hasAccess = (key) => isAdmin || DEFAULT_ALLOWED.includes(key) || (userRole?.allowedPages && (userRole.allowedPages.includes('all') || userRole.allowedPages.includes(key)));

  const navItem = (key, icon, label, indent = false) => {
    if (!hasAccess(key)) return null;
    return (
      <button key={key} onClick={() => onNav(key)} className={`nav-item${active === key ? ' active' : ''}`} style={indent ? { paddingLeft: '2rem', fontSize: '0.8rem' } : {}}>
        {icon && <span>{icon}</span>}
        {label}
      </button>
    );
  };

  return (
    <aside className="flex flex-col" style={{ width: 220, minHeight: '100vh', background: 'var(--color-surface)', borderRight: '1px solid rgba(139,92,246,0.15)', padding: '1.25rem 0.75rem', flexShrink: 0 }}>
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
          <Gamepad2 size={18} color="white" />
        </div>
        <span className="font-black tracking-widest text-sm" style={{ fontFamily: 'Orbitron,sans-serif', color: '#c4b5fd' }}>GAMEHUB</span>
      </div>

      {/* User info */}
      <div className="glass rounded-xl p-3 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate text-white">{user?.username}</p>
          <span className={`badge ${isAdmin ? 'badge-purple' : 'badge-cyan'}`} style={{ fontSize: '0.6rem' }}>
            {isAdmin ? 'Admin' : 'Oyuncu'}
          </span>
        </div>
      </div>

      <hr className="divider" />

      {/* Main nav */}
      <div className="flex flex-col gap-1 flex-1">
        {navItem('home', <Home size={14} />, 'Ana Sayfa')}

        {/* Games accordion */}
        {hasAccess('games') && (
          <>
            <button onClick={() => setGamesOpen(!gamesOpen)} className="nav-item justify-between">
              <span className="flex items-center gap-2"><Gamepad2 size={14} /> Oyunlar</span>
              {gamesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {gamesOpen && (
              <div className="flex flex-col gap-0.5 pl-2">
                {navItem('games', null, '🎮 Tüm Oyunlar', true)}
              </div>
            )}
          </>
        )}

        {/* The Void Grid */}
        {VOID_ITEMS.some(i => hasAccess(i.key)) && (
          <>
            <button onClick={() => setVoidOpen(!voidOpen)} className={`nav-item justify-between${active?.startsWith('void') ? ' active' : ''}`}>
              <span className="flex items-center gap-2"><Globe size={14} /> The Void Grid</span>
              {voidOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {voidOpen && (
              <div className="flex flex-col gap-0.5 pl-2">
                {VOID_ITEMS.map(item => navItem(item.key, null, item.label, true))}
              </div>
            )}
          </>
        )}

        {navItem('community', <Users size={14} />, 'Topluluk')}
        {navItem('news', <Newspaper size={14} />, 'Haberler')}
        {navItem('profile', <User size={14} />, 'Profilim')}

        {/* Admin section */}
        {isAdmin && (
          <>
            <hr className="divider" />
            <button onClick={() => setAdminOpen(!adminOpen)} className={`nav-item justify-between${active?.startsWith('admin') ? ' active' : ''}`}>
              <span className="flex items-center gap-2"><Shield size={14} color="#f59e0b" /> Admin</span>
              {adminOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {adminOpen && (
              <div className="flex flex-col gap-0.5 pl-2">
                {ADMIN_ITEMS.map(item => navItem(item.key, null, item.label, true))}
              </div>
            )}
          </>
        )}
      </div>

     {/* Download App */}
      <a
        href="https://github.com/rank1958/Locus/releases/download/v1.0.0/GameHub-Setup-Yeni.exe"
        className="nav-item mt-2"
        style={{ color: '#06b6d4', textDecoration: 'none' }}
        title="Masaüstü uygulamasını indir"
      >
        <Download size={14} /> Uygulamayı İndir
      </a>

      {/* Logout */}
      <button onClick={logout} className="nav-item mt-1" style={{ color: '#f87171' }}>
        <LogOut size={14} /> Çıkış Yap
      </button>
    </aside>
  );
}
