import { useState, useEffect, useRef } from 'react';
import { getGames, addGame, deleteGame, addVoidGame, deleteVoidGame, getVoidGames } from '../../lib/db';
import { Plus, Trash2, X, Upload, Link, Gamepad2, FolderOpen } from 'lucide-react';

const CATEGORIES = ['Aksiyon', 'Bulmaca', 'Strateji', 'Yarış', 'Spor', 'RPG', 'Macera', 'Diğer'];
const COLORS_PICK = ['#8b5cf6', '#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

function GameForm({ onAdd, isVoid = false }) {
  const [form, setForm] = useState({ name: '', category: 'Aksiyon', color: '#8b5cf6', url: '' });
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadedName, setUploadedName] = useState('');
  const [gameType, setGameType] = useState('url'); // 'url' | 'html' | 'exe'
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Pick .exe via Electron dialog
  const handlePickExe = async () => {
    if (!window.electronAPI) return alert('Bu özellik sadece masaüstü uygulamasında çalışır.');
    const path = await window.electronAPI.pickGameExe();
    if (path) {
      set('url', path);
      setUploadedName(path.split(/[\\/]/).pop());
    }
  };

  // Pick .html via Electron dialog
  const handlePickHtml = async () => {
    if (!window.electronAPI) return alert('Bu özellik sadece masaüstü uygulamasında çalışır.');
    const path = await window.electronAPI.pickGameHtml();
    if (path) {
      set('url', path);
      setUploadedName(path.split(/[\\/]/).pop());
    }
  };

  // Web upload fallback
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedName(file.name);
    setUploadProgress(0);
    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.random() * 15 + 5;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
        setTimeout(() => {
          setUploadProgress(null);
          const reader = new FileReader();
          reader.onload = (ev) => set('url', ev.target.result);
          reader.readAsDataURL(file);
        }, 400);
      }
      setUploadProgress(Math.round(pct));
    }, 200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({ ...form, gameType });
    setForm({ name: '', category: 'Aksiyon', color: '#8b5cf6', url: '' });
    setUploadedName('');
    setGameType('url');
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 mb-5 animate-fade-in">
      <h3 className="font-bold mb-4 text-sm" style={{ color: '#c4b5fd' }}>{isVoid ? '⚫ Yeni Void Oyunu' : '🎮 Yeni Oyun'}</h3>
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label className="form-label">Oyun Adı</label>
          <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Kategori</label>
          <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Tema Rengi</label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLORS_PICK.map(c => (
              <button key={c} type="button" onClick={() => set('color', c)} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: form.color === c ? '3px solid white' : 'none', cursor: 'pointer' }} />
            ))}
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6 }} />
          </div>
        </div>
      </div>

      {/* Game Source Tabs */}
      <div className="mt-4">
        <label className="form-label mb-2">Oyun Kaynağı</label>
        <div className="flex gap-2 mb-3">
          {[
            { k: 'url', label: '🌐 Web URL' },
            { k: 'exe', label: '🎮 .exe Dosyası (Godot/Windows)' },
            { k: 'html', label: '📄 HTML Dosyası' },
          ].map(({ k, label }) => (
            <button key={k} type="button" onClick={() => { setGameType(k); set('url', ''); setUploadedName(''); }}
              className={gameType === k ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.75rem' }}>
              {label}
            </button>
          ))}
        </div>

        {gameType === 'url' && (
          <div className="relative">
            <Link size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
            <input className="input-field" style={{ paddingLeft: '2rem' }} value={form.url}
              onChange={e => set('url', e.target.value)} placeholder="https://..." />
          </div>
        )}

        {gameType === 'exe' && (
          <div className="flex flex-col gap-2">
            {isElectron ? (
              <button type="button" onClick={handlePickExe}
                className="btn-secondary flex items-center gap-2" style={{ width: 'fit-content' }}>
                <FolderOpen size={14} /> Godot .exe Dosyasını Seç
              </button>
            ) : (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)' }}>
                ⚠️ .exe dosyası seçimi sadece masaüstü uygulamasında çalışır. Tam yolu elle girebilirsiniz:
              </div>
            )}
            <input className="input-field" value={form.url} onChange={e => set('url', e.target.value)}
              placeholder="C:\Users\...\OyunAdi.exe" />
            {uploadedName && <span className="text-xs" style={{ color: '#94a3b8' }}>✓ {uploadedName}</span>}
          </div>
        )}

        {gameType === 'html' && (
          <div className="flex flex-col gap-2">
            {isElectron ? (
              <button type="button" onClick={handlePickHtml}
                className="btn-secondary flex items-center gap-2" style={{ width: 'fit-content' }}>
                <FolderOpen size={14} /> HTML Dosyasını Seç
              </button>
            ) : (
              <>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="btn-secondary flex items-center gap-2" style={{ width: 'fit-content' }}>
                  <Upload size={14} /> Dosya Seç (.html)
                </button>
                <input ref={fileRef} type="file" accept=".html,.htm" style={{ display: 'none' }} onChange={handleFile} />
              </>
            )}
            {uploadedName && <span className="text-xs" style={{ color: '#94a3b8' }}>✓ {uploadedName}</span>}
            {uploadProgress !== null && (
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: '#64748b' }}>
                  <span>Yükleniyor...</span><span>{uploadProgress}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }} /></div>
              </div>
            )}
          </div>
        )}
      </div>

      <button type="submit" className="btn-primary flex items-center gap-2 mt-4"><Plus size={14} /> Ekle</button>
    </form>
  );
}

export default function AdminGames() {
  const [games, setGames] = useState([]);
  const [voidGames, setVoidGames] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showVoidForm, setShowVoidForm] = useState(false);
  const [tab, setTab] = useState('main');

  const load = async () => { setGames(await getGames()); setVoidGames(await getVoidGames()); };
  useEffect(() => { load(); }, []);

  const handleAdd = async (form) => { await addGame(form); setShowForm(false); load(); };
  const handleAddVoid = async (form) => { await addVoidGame(form); setShowVoidForm(false); load(); };

  const list = tab === 'main' ? games : voidGames;
  const handleDel = async (id) => { if (tab === 'main') await deleteGame(id); else await deleteVoidGame(id); load(); };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="section-title"><Gamepad2 size={18} color="#8b5cf6" /> Oyun Yönetimi</div>
        <div className="flex gap-2">
          <button onClick={() => { setShowForm(!showForm); setShowVoidForm(false); }} className={showForm ? 'btn-danger' : 'btn-primary'} style={{ fontSize: '0.8rem' }}>
            {showForm ? <><X size={13} /> İptal</> : <><Plus size={13} /> Normal Oyun</>}
          </button>
          <button onClick={() => { setShowVoidForm(!showVoidForm); setShowForm(false); }} className={showVoidForm ? 'btn-danger' : 'btn-secondary'} style={{ fontSize: '0.8rem' }}>
            {showVoidForm ? <><X size={13} /> İptal</> : <><Plus size={13} /> Void Oyun</>}
          </button>
        </div>
      </div>

      {showForm && <GameForm onAdd={handleAdd} />}
      {showVoidForm && <GameForm onAdd={handleAddVoid} isVoid />}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('main')} className={tab === 'main' ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.8rem' }}>Normal ({games.length})</button>
        <button onClick={() => setTab('void')} className={tab === 'void' ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.8rem' }}>Void ({voidGames.length})</button>
      </div>

      <div className="card overflow-hidden">
        <div className="grid text-xs font-bold px-4 py-3" style={{ gridTemplateColumns: '2fr 120px 80px 100px 60px', color: '#64748b', borderBottom: '1px solid rgba(139,92,246,0.15)', background: 'rgba(0,0,0,0.2)' }}>
          <span>Oyun Adı</span><span>Kategori</span><span>Oynanma</span><span>Kaynak</span><span></span>
        </div>
        {list.length === 0 ? (
          <div className="p-8 text-center" style={{ color: '#4b5563' }}>Oyun eklenmemiş.</div>
        ) : list.map((g, i) => (
          <div key={g.id} className="grid items-center text-sm px-4 py-3" style={{ gridTemplateColumns: '2fr 120px 80px 100px 60px', borderBottom: '1px solid rgba(139,92,246,0.07)', background: i % 2 === 0 ? 'transparent' : 'rgba(99,102,241,0.03)' }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: g.color }} />
              <span className="font-semibold text-white">{g.name}</span>
            </div>
            <span className="badge badge-purple">{g.category}</span>
            <span style={{ color: '#94a3b8' }}>{g.plays || 0}</span>
            <span className="text-xs truncate" style={{ color: '#4b5563' }}>
              {g.url ? (g.gameType === 'exe' ? '🎮 .exe' : g.gameType === 'html' ? '📄 HTML' : '🌐 URL') : '—'}
            </span>
            <button onClick={() => handleDel(g.id)} className="btn-danger" style={{ padding: '0.25rem 0.4rem' }}><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
