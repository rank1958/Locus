import { useState, useEffect } from 'react';
import { getVoidNews, addVoidNews, deleteVoidNews } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import { Zap, Plus, Trash2, X } from 'lucide-react';

export default function VoidNews() {
  const { isAdmin, user } = useAuth();
  const [news, setNews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  const load = async () => setNews(await getVoidNews());
  useEffect(() => { load(); }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    addVoidNews({ ...form, author: user.username });
    setForm({ title: '', content: '' });
    setShowForm(false);
    load();
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="section-title"><Zap size={18} color="#8b5cf6" /> Evren Haberleri</div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'İptal' : 'Haber Ekle'}
          </button>
        )}
      </div>

      <p className="text-sm mb-5" style={{ color: '#64748b' }}>The Void Grid evrenindeki son gelişmeler ve boyut yarıkları.</p>

      {showForm && (
        <div className="card p-5 mb-5 animate-fade-in">
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div><label className="form-label">Başlık</label><input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div><label className="form-label">İçerik</label><textarea className="input-field" rows={3} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required style={{ resize: 'vertical' }} /></div>
            <button type="submit" className="btn-primary self-end">Yayınla</button>
          </form>
        </div>
      )}

      {news.length === 0 ? (
        <div className="card p-12 text-center" style={{ color: '#4b5563' }}><span className="text-3xl block mb-3">🌌</span>Henüz evren haberi yok.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {news.map((item, i) => (
            <div key={item.id} className="card p-5 animate-fade-in" style={{ animationDelay: `${i * 0.06}s`, borderColor: 'rgba(99,38,246,0.3)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} color="#8b5cf6" />
                    <h3 className="font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-sm mb-3" style={{ color: '#94a3b8' }}>{item.content}</p>
                  <div className="text-xs" style={{ color: '#4b5563' }}>✍️ {item.author} · 📅 {new Date(item.createdAt).toLocaleDateString('tr-TR')}</div>
                </div>
                {isAdmin && (
                  <button onClick={() => { deleteVoidNews(item.id); load(); }} className="btn-danger" style={{ padding: '0.375rem' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
