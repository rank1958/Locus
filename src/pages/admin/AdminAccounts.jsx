import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getRoles } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Plus, Trash2, Key, X, AlertTriangle } from 'lucide-react';

export default function AdminAccounts() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', gender: 'Erkek', age: '', role: 'user' });
  const [pwChange, setPwChange] = useState({}); 
  const [error, setError] = useState('');

  const load = async () => {
    const list = await getUsers();
    setUsers(list);
    const roleList = await getRoles();
    setRoles(roleList);
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!form.role) {
        throw new Error("Lütfen bir rol seçin");
      }
      await createUser({ ...form, age: parseInt(form.age) || 0 });
      setForm({ username: '', email: '', password: '', gender: 'Erkek', age: '', role: 'user' });
      setShowAdd(false);
      load();
    } catch (err) { setError(err.message); }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    if (userId === currentUser.id) return;
    await updateUser(userId, { role: newRoleId });
    load();
  };

  const handleDelete = async (u) => {
    if (u.id === currentUser.id) return;
    await deleteUser(u.id);
    load();
  };

  const handlePwChange = async (userId) => {
    const pw = pwChange[userId];
    if (!pw || pw.length < 4) return;
    await updateUser(userId, { password: pw });
    setPwChange(p => ({ ...p, [userId]: '' }));
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="flex items-center justify-between mb-5">
        <div className="section-title"><Users size={18} color="#8b5cf6" /> Hesap Yönetimi</div>
        <button onClick={() => setShowAdd(!showAdd)} className={showAdd ? 'btn-danger' : 'btn-primary'} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          {showAdd ? <><X size={13} /> İptal</> : <><Plus size={13} /> Hesap Ekle</>}
        </button>
      </div>

      {showAdd && (
        <div className="card p-5 mb-5 animate-fade-in">
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div><label className="form-label">Kullanıcı Adı</label><input className="input-field" value={form.username} onChange={e => set('username', e.target.value)} required /></div>
              <div><label className="form-label">E-posta</label><input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
              <div><label className="form-label">Şifre</label><input className="input-field" type="password" value={form.password} onChange={e => set('password', e.target.value)} required /></div>
              <div>
                <label className="form-label">Rol</label>
                <select className="input-field" value={form.role} onChange={e => set('role', e.target.value)}>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name} {r.isDefault ? '(Varsayılan)' : ''}</option>
                  ))}
                </select>
              </div>
              <div><label className="form-label">Cinsiyet</label><select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}><option>Erkek</option><option>Kadın</option><option>Diğer</option></select></div>
              <div><label className="form-label">Yaş</label><input className="input-field" type="number" value={form.age} onChange={e => set('age', e.target.value)} required /></div>
            </div>
            {error && <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>}
            <button type="submit" className="btn-primary self-end flex items-center gap-2"><Plus size={14} /> Oluştur</button>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="grid text-xs font-bold px-4 py-3" style={{ gridTemplateColumns: '150px 160px 60px 60px 140px 160px 80px', color: '#64748b', borderBottom: '1px solid rgba(139,92,246,0.15)', background: 'rgba(0,0,0,0.2)' }}>
          <span>Kullanıcı</span><span>E-posta</span><span>Yaş</span><span>Cin.</span><span>Rol Seçimi</span><span>Şifre Değiştir</span><span>İşlem</span>
        </div>
        {users.map((u, i) => {
          const isSelf = u.id === currentUser.id;
          const userRoleObj = roles.find(r => r.id === u.role) || { name: 'Bilinmiyor', color: '#64748b' };
          
          return (
            <div key={u.id} className="flex flex-col" style={{ borderBottom: '1px solid rgba(139,92,246,0.07)', background: i % 2 === 0 ? 'transparent' : 'rgba(99,102,241,0.03)' }}>
              <div className="grid items-center text-sm px-4 py-3 gap-2" style={{ gridTemplateColumns: '150px 160px 60px 60px 140px 160px 80px' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `linear-gradient(135deg,${userRoleObj.color},#000000)` }}>
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="font-semibold text-white truncate">{u.username}{isSelf && <span className="text-xs ml-1" style={{ color: '#64748b' }}>(sen)</span>}</span>
                </div>
                <span className="text-xs truncate" style={{ color: '#64748b' }}>{u.email}</span>
                <span style={{ color: '#94a3b8' }}>{u.age || '-'}</span>
                <span style={{ color: '#94a3b8' }}>{u.gender?.[0] || '-'}</span>
                
                <select 
                  className="input-field p-1 text-xs h-7" 
                  value={u.role || 'user'} 
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  disabled={isSelf}
                  style={{ width: '100%', minWidth: 0, paddingLeft: 6, opacity: isSelf ? 0.6 : 1, borderColor: userRoleObj.color + 'aa' }}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>

                <div className="flex gap-1 justify-end pr-2">
                  <input className="input-field" style={{ flex: 1, fontSize: '0.75rem', padding: '0.3rem 0.5rem', minWidth: 0 }} placeholder="Yeni şifre..." value={pwChange[u.id] || ''} onChange={e => setPwChange(p => ({ ...p, [u.id]: e.target.value }))} />
                  <button onClick={() => handlePwChange(u.id)} className="btn-secondary" style={{ padding: '0.3rem 0.5rem', flexShrink: 0 }} title="Şifre Değiştir"><Key size={12} /></button>
                </div>
                <button onClick={() => !isSelf && handleDelete(u)} className="btn-danger flex items-center gap-1 ml-auto" style={{ padding: '0.3rem 0.5rem', opacity: isSelf ? 0.4 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}>
                  {isSelf ? <AlertTriangle size={12} /> : <Trash2 size={12} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
