import { useState, useEffect } from 'react';
import { getSessions, getUsers } from '../../lib/db';
import { Activity, Clock, User, Gamepad2 } from 'lucide-react';

export default function AdminAnalytics() {
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);

  const load = async () => {
    try {
      const s = await getSessions();
      const u = await getUsers();
      setSessions(Array.isArray(s) ? s : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch (err) {
      console.error(err);
      setSessions([]);
      setUsers([]);
    }
  };
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  const getUserName = (id) => users.find(u => u.id === id)?.username || id;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="section-title"><Activity size={18} color="#8b5cf6" /> Canlı Veri Akışı</div>
      <p className="text-sm mb-5" style={{ color: '#64748b' }}>Kim, hangi oyunu, ne zaman, kaç dakika oynadı — 5 saniyede bir güncellenir.</p>

      <div className="card overflow-hidden">
        <div className="grid text-xs font-bold px-4 py-3" style={{ gridTemplateColumns: '180px 1fr 140px 100px 120px', color: '#64748b', borderBottom: '1px solid rgba(139,92,246,0.15)', background: 'rgba(0,0,0,0.2)' }}>
          <span className="flex items-center gap-1"><User size={12} /> Oyuncu</span>
          <span className="flex items-center gap-1"><Gamepad2 size={12} /> Oyun</span>
          <span>Tarih</span>
          <span>Saat</span>
          <span className="flex items-center gap-1"><Clock size={12} /> Süre</span>
        </div>
        {sessions.length === 0 ? (
          <div className="p-10 text-center" style={{ color: '#4b5563' }}>Henüz oturum verisi yok.</div>
        ) : (
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {sessions.map((s, i) => (
              <div key={s.id} className="grid text-sm px-4 py-3 transition-colors" style={{ gridTemplateColumns: '180px 1fr 140px 100px 120px', borderBottom: '1px solid rgba(139,92,246,0.07)', background: i % 2 === 0 ? 'transparent' : 'rgba(99,102,241,0.03)' }}>
                <span className="font-semibold" style={{ color: '#a5b4fc' }}>{getUserName(s.userId)}</span>
                <span className="text-white">{s.gameName}{s.isVoid ? <span className="badge badge-purple ml-2" style={{ fontSize: '0.6rem' }}>VOID</span> : null}</span>
                <span style={{ color: '#64748b' }}>{s.date}</span>
                <span style={{ color: '#64748b' }}>{s.time}</span>
                <span className="font-mono" style={{ color: '#34d399' }}>{s.durationStr}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
