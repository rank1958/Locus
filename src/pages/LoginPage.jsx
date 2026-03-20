import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage({ onGoRegister }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(80px)' }} />

      <div className="card animate-fade-in w-full max-w-md mx-4 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-glow" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
            <Gamepad2 size={32} color="white" />
          </div>
          <h1 className="text-2xl font-black tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif', color: '#c4b5fd' }}>GAMEHUB</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Oyun dünyasına giriş yap</p>
        </div>

        <form onSubmit={handle} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Kullanıcı Adı</label>
            <input className="input-field" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="kullanici_adi" required />
          </div>
          <div>
            <label className="form-label">Şifre</label>
            <div className="relative">
              <input className="input-field" type={show ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required style={{ paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg px-4 py-2 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <hr className="divider mt-6" />

        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-sm" style={{ color: '#64748b' }}>
            Hesabın yok mu?{' '}
            <button onClick={onGoRegister} className="font-semibold" style={{ color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer' }}>
              Kayıt Ol
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
