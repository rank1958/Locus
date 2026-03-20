import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Clock, ExternalLink, Terminal } from 'lucide-react';
import { recordPlay, recordVoidPlay } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';

const isExePath = (url) => url && (url.match(/\.exe$/i) || (url.match(/^[A-Za-z]:[\\\/]/) && !url.match(/\.html?$/i)));
const isLocalHtml = (url) => url && url.match(/^[A-Za-z]:[\\\/].*\.html?$/i);

export default function GameModal({ game, onClose, isVoid = false }) {
  const { user } = useAuth();
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [launchError, setLaunchError] = useState('');
  const intervalRef = useRef(null);

  const gameUrl = game.url || '';
  const isExe = isExePath(gameUrl) || game.gameType === 'exe';
  const isLocal = isLocalHtml(gameUrl);

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    // Auto-launch .exe games
    if (isExe && window.electronAPI) {
      handleLaunchExe();
    }
    return () => clearInterval(intervalRef.current);
  }, []);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleLaunchExe = async () => {
    if (!window.electronAPI) {
      setLaunchError('Bu özellik sadece masaüstü uygulamasında çalışır.');
      return;
    }
    const result = await window.electronAPI.launchGameExe(gameUrl);
    if (result?.error) {
      setLaunchError(result.error);
    } else {
      setLaunched(true);
    }
  };

  const handleSave = useCallback(async () => {
    clearInterval(intervalRef.current);
    setSaving(true);
    try {
      if (isVoid) await recordVoidPlay(game.id, user.id, elapsed);
      else await recordPlay(game.id, user.id, elapsed);
      setSaved(true);
      setTimeout(onClose, 1000);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }, [elapsed, game.id, user.id, isVoid, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="animate-fade-in" style={{ width: '90vw', maxWidth: 900, background: 'var(--color-card)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full animate-glow" style={{ background: '#8b5cf6' }} />
            <span className="font-bold text-white">{game.name}</span>
            <span className="badge badge-purple">{game.category}</span>
            {isExe && <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}>🎮 Masaüstü</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Clock size={14} color="#a78bfa" />
              <span className="font-mono text-sm font-bold" style={{ color: '#c4b5fd' }}>{fmt(elapsed)}</span>
            </div>
            <button onClick={handleSave} className="btn-primary" disabled={saving || saved} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
              {saved ? '✓ Kaydedildi' : saving ? 'Kaydediliyor...' : 'Kapat ve Kaydet'}
            </button>
            <button onClick={onClose} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative" style={{ overflow: 'hidden' }}>
          {isExe ? (
            // .exe game — launched externally
            <div className="flex flex-col items-center justify-center h-full gap-5">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl animate-float" style={{ background: game.color || '#8b5cf6', boxShadow: `0 8px 32px ${game.color || '#8b5cf6'}55` }}>
                🎮
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{game.name}</h2>
                {launched ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>
                      ✓ Oyun açıldı! Oynamayı bitirince "Kapat ve Kaydet"e bas.
                    </div>
                    <button onClick={handleLaunchExe} className="btn-secondary text-sm">
                      Tekrar Aç
                    </button>
                  </div>
                ) : launchError ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="px-4 py-2 rounded-lg text-sm text-center max-w-md" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                      ⚠️ {launchError}
                    </div>
                    <p className="text-xs" style={{ color: '#64748b' }}>Dosya yolu: <code style={{ color: '#a78bfa' }}>{gameUrl}</code></p>
                    <button onClick={handleLaunchExe} className="btn-primary text-sm">Tekrar Dene</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
                    <Terminal size={14} />
                    <span>Oyun başlatılıyor...</span>
                  </div>
                )}
              </div>
            </div>
          ) : gameUrl ? (
            <iframe
              src={isLocal ? `file://${gameUrl}` : gameUrl}
              title={game.name}
              className="w-full h-full"
              style={{ border: 'none' }}
              allow="fullscreen"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl animate-float" style={{ background: game.color || '#8b5cf6', boxShadow: `0 8px 32px ${game.color || '#8b5cf6'}44` }}>
                🎮
              </div>
              <h2 className="text-2xl font-bold text-white">{game.name}</h2>
              <p className="text-sm" style={{ color: '#64748b' }}>Bu oyun için URL tanımlanmamış.</p>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#a78bfa' }}>
                <ExternalLink size={14} />
                <span>Oyun admin panelinden güncellenebilir</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
