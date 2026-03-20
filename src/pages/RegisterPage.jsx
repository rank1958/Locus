import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, ArrowLeft } from 'lucide-react';

export default function RegisterPage({ onGoLogin }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', passwordConfirm: '', gender: '', age: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, age: parseInt(form.age) || 0 });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--color-bg)', padding: '2rem 1rem' }}>
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(80px)' }} />

      <div className="card animate-fade-in w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onGoLogin} className="btn-secondary" style={{ padding: '0.4rem 0.7rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Gamepad2 size={22} color="#8b5cf6" />
            <h1 className="text-xl font-black tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif', color: '#c4b5fd' }}>Kayıt Ol</h1>
          </div>
        </div>

        <form onSubmit={handle} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Kullanıcı Adı</label>
            <input className="input-field" value={form.username} onChange={e => set('username', e.target.value)} placeholder="kullanici_adi" required />
          </div>
          <div>
            <label className="form-label">E-posta</label>
            <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ornek@mail.com" required />
          </div>
          <div>
            <label className="form-label">Şifre</label>
            <input className="input-field" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required />
          </div>
          <div>
            <label className="form-label">Şifre (Tekrar)</label>
            <input className="input-field" type="password" value={form.passwordConfirm} onChange={e => set('passwordConfirm', e.target.value)} placeholder="••••••••" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Cinsiyet</label>
              <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)} required>
                <option value="">Seçin</option>
                <option>Erkek</option>
                <option>Kadın</option>
                <option>Diğer</option>
              </select>
            </div>
            <div>
              <label className="form-label">Yaş</label>
              <input className="input-field" type="number" min="13" max="99" value={form.age} onChange={e => set('age', e.target.value)} placeholder="25" required />
            </div>
          </div>

          {error && (
            <div className="rounded-lg px-4 py-2 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </button>
        </form>
      </div>
    </div>
  );
}
