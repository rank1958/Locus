import { useState, useEffect } from 'react';
import { getNews, addNews, deleteNews } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { Newspaper, Plus, Trash2, X } from 'lucide-react';

export default function NewsPage() {
  const { isAdmin, user } = useAuth();
  const [news, setNews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  const load = async () => setNews(await getNews());
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    await addNews({ ...form, author: user.username });
    setForm({ title: '', content: '' });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => { await deleteNews(id); load(); };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="section-title"><Newspaper size={18} color="#8b5cf6" /> Platform Haberleri</div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'İptal' : 'Haber Ekle'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-5 mb-6 animate-fade-in">
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div>
              <label className="form-label">Başlık</label>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Haber başlığı..." required />
            </div>
            <div>
              <label className="form-label">İçerik</label>
              <textarea className="input-field" rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Haber içeriği..." required style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn-primary self-end">Yayınla</button>
          </form>
        </div>
      )}

      {news.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3" style={{ color: '#4b5563' }}>
          <Newspaper size={40} color="#1e293b" />
          <p>Henüz haber yayınlanmamış.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {news.map((item, i) => (
            <div key={item.id} className="card p-5 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg mb-1">{item.title}</h3>
                  <p className="text-sm mb-3" style={{ color: '#94a3b8', lineHeight: 1.6 }}>{item.content}</p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: '#4b5563' }}>
                    <span>✍️ {item.author}</span>
                    <span>📅 {new Date(item.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(item.id)} className="btn-danger" style={{ padding: '0.375rem' }}>
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
