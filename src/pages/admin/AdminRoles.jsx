import { useState, useEffect } from 'react';
import { getRoles, addRole, updateRole, deleteRole } from '../../lib/db';
import { Shield, Plus, Trash2, Edit2, Star, Check, X } from 'lucide-react';

const PAGE_OPTS = [
  { id: 'games', label: 'Tüm Oyunlar' },
  { id: 'community', label: 'Topluluk' },
  { id: 'news', label: 'Haberler' },
  { id: 'void-lore', label: 'Ana Hikaye (Void)' },
  { id: 'void-games', label: 'Void Oyunlar' },
  { id: 'void-news', label: 'Evren Haberleri' },
  { id: 'void-characters', label: 'Karakterler' }
];

export default function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', color: '#8b5cf6', allowedPages: [] });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = async () => setRoles(await getRoles());
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await addRole(form);
    setForm({ name: '', color: '#8b5cf6', allowedPages: [] });
    setShowForm(false);
    load();
  };

  const setAsDefault = async (r) => {
    if (r.isDefault) return;
    await updateRole(r.id, { isDefault: true });
    load();
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditForm({ name: r.name, color: r.color, allowedPages: r.allowedPages });
  };

  const saveEdit = async (id) => {
    await updateRole(id, editForm);
    setEditingId(null);
    load();
  };

  const handleDel = async (id) => {
    try {
      await deleteRole(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="flex items-center justify-between mb-5">
        <div className="section-title"><Shield size={18} color="#8b5cf6" /> Rol Yönetimi</div>
        <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn-danger' : 'btn-primary'} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          {showForm ? <><X size={13} /> İptal</> : <><Plus size={13} /> Yeni Rol</>}
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-5 animate-fade-in border border-purple-500/30">
          <h3 className="text-white font-bold mb-3">Yeni Rol Ekle</h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Rol Adı</label>
                <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Örn: Moderatör" />
              </div>
              <div>
                <label className="form-label">Rol Rengi / Rozet Rengi</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer" />
                  <span className="text-sm text-slate-400">{form.color}</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="form-label">Bu rol hangi sayfalara erişebilir?</label>
              <div className="flex flex-wrap gap-4 mt-2 p-4 rounded-lg bg-black/20 border border-indigo-500/10">
                {PAGE_OPTS.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer text-slate-300 hover:text-white transition-colors">
                    <input 
                      type="checkbox" 
                      checked={form.allowedPages.includes(p.id)} 
                      onChange={(e) => setForm(f => ({
                        ...f, 
                        allowedPages: e.target.checked ? [...f.allowedPages, p.id] : f.allowedPages.filter(id => id !== p.id)
                      }))} 
                      style={{ accentColor: '#8b5cf6', width: 14, height: 14 }}
                    /> 
                    {p.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">* Ana Sayfa ve Profil tüm kullanıcılara otomatik açıktır.</p>
            </div>

            <button type="submit" className="btn-primary self-start px-6"><Plus size={14} className="inline mr-2 -mt-1"/> Kaydet</button>
          </form>
        </div>
      )}

      {roles.length > 0 && (
        <div className="card p-4 mb-5 flex items-center justify-between border border-amber-500/20 bg-amber-500/5">
          <div>
            <h3 className="font-bold text-amber-400 flex items-center gap-2"><Star size={16} /> Yeni Kayıt (Varsayılan) Rolü</h3>
            <p className="text-xs text-slate-400 mt-1">Sisteme dışarıdan yeni kayıt olan kişilere otomatik olarak verilecek rolü belirleyin.</p>
          </div>
          <select 
            className="input-field max-w-[200px]" 
            value={roles.find(r => r.isDefault)?.id || ''} 
            onChange={(e) => {
              const selected = roles.find(r => r.id === e.target.value);
              if (selected) setAsDefault(selected);
            }}
          >
            {roles.filter(r => r.id !== 'admin').map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4">
        {roles.map(r => (
          <div key={r.id} className="card p-4 flex flex-col gap-3" style={{ borderLeft: `4px solid ${r.color}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="badge" style={{ background: `${r.color}33`, color: r.color, border: `1px solid ${r.color}66` }}>
                  {r.name}
                </span>
                {r.isSystem && <span className="text-xs text-slate-500 font-semibold uppercase">(Sistem)</span>}
              </div>
              <div className="flex items-center gap-2">
                {r.isDefault ? (
                  <span className="badge bg-amber-500/20 text-amber-500 border-amber-500/30 flex items-center gap-1">
                    <Star size={10} /> Yeni Üye Varsayılanı
                  </span>
                ) : (
                  <button onClick={() => setAsDefault(r)} className="text-xs text-slate-400 hover:text-amber-500 disabled:opacity-30 transition-colors flex items-center gap-1" disabled={r.id === 'admin'}>
                    <Star size={12} /> Varsayılan Yap
                  </button>
                )}
              </div>
            </div>

            {editingId === r.id ? (
              <div className="mt-2 p-3 bg-black/30 rounded border border-white/5 flex flex-col gap-3">
                <div className="flex gap-4 items-center">
                  <input className="input-field max-w-[200px]" value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} />
                  <input type="color" className="w-8 h-8 rounded border-0 cursor-pointer" value={editForm.color} onChange={e => setEditForm(f => ({...f, color: e.target.value}))} />
                </div>
                {r.id !== 'admin' && (
                  <div className="flex flex-wrap gap-3">
                    {PAGE_OPTS.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer text-slate-300">
                        <input type="checkbox" checked={editForm.allowedPages.includes(p.id)} onChange={e => setEditForm(f => ({...f, allowedPages: e.target.checked ? [...f.allowedPages, p.id] : f.allowedPages.filter(id => id !== p.id)}))} style={{accentColor: '#8b5cf6'}} /> {p.label}
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(r.id)} className="btn-primary" style={{padding: '0.3rem 0.8rem', fontSize:'0.75rem'}}><Check size={12} className="inline mr-1"/> Kaydet</button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary" style={{padding: '0.3rem 0.8rem', fontSize:'0.75rem'}}>İptal</button>
                </div>
              </div>
            ) : (
              <div className="flex items-end justify-between mt-1">
                <div className="text-xs text-slate-400">
                  <strong className="text-slate-300">İzin Verilen Sayfalar: </strong>
                  {r.id === 'admin' ? 'Tüm Sayfalar ve Admin Panelleri' : (r.allowedPages.length > 0 ? r.allowedPages.map(p => PAGE_OPTS.find(o => o.id === p)?.label).filter(Boolean).join(', ') : 'Hiçbiri')}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(r)} className="btn-secondary" style={{padding: '0.3rem 0.5rem'}} title="Düzenle"><Edit2 size={12} /></button>
                  {!r.isSystem && (
                    <button onClick={() => handleDel(r.id)} className="btn-danger" style={{padding: '0.3rem 0.5rem'}} title="Sil"><Trash2 size={12} /></button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
