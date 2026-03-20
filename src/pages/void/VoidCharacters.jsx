import { useState, useEffect, useRef } from 'react';
import { getCharacters, addCharacter, deleteCharacter } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, X, Trash2, User } from 'lucide-react';
import * as THREE from 'three';

const CLASSES = ['Savaşçı', 'Büyücü', 'Suikastçi', 'Okçu', 'Kahin', 'Titan'];
const CLASS_ICONS = { Savaşçı: '⚔️', Büyücü: '🔮', Suikastçi: '🗡️', Okçu: '🏹', Kahin: '👁️', Titan: '🛡️' };

function ThreePreview({ charClass, color }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, 1.5, 4);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(parseInt(color.replace('#', '0x')), 2, 8);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    // Character group
    const group = new THREE.Group();
    scene.add(group);

    const mat = new THREE.MeshStandardMaterial({ color: parseInt(color.replace('#', '0x')), roughness: 0.4, metalness: 0.6 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7 });

    // Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 1.0, 8), mat);
    body.position.y = 0.5;
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), mat);
    head.position.y = 1.35;
    group.add(head);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.7, 8);
    const lArm = new THREE.Mesh(armGeo, darkMat);
    lArm.position.set(-0.5, 0.6, 0);
    lArm.rotation.z = 0.4;
    group.add(lArm);
    const rArm = new THREE.Mesh(armGeo, darkMat);
    rArm.position.set(0.5, 0.6, 0);
    rArm.rotation.z = -0.4;
    group.add(rArm);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 8);
    const lLeg = new THREE.Mesh(legGeo, darkMat);
    lLeg.position.set(-0.18, -0.4, 0);
    group.add(lLeg);
    const rLeg = new THREE.Mesh(legGeo, darkMat);
    rLeg.position.set(0.18, -0.4, 0);
    group.add(rLeg);

    // Weapon based on class
    if (charClass === 'Savaşçı' || charClass === 'Suikastçi') {
      // Sword / Dagger
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.9, 0.05), new THREE.MeshStandardMaterial({ color: 0xaaaaff, metalness: 1, roughness: 0.1 }));
      blade.position.set(0.75, 0.7, 0);
      blade.rotation.z = -0.3;
      group.add(blade);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8), new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
      handle.position.set(0.75, 0.26, 0);
      handle.rotation.z = -0.3;
      group.add(handle);
    } else if (charClass === 'Büyücü' || charClass === 'Kahin') {
      // Staff
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x6b4c00, roughness: 0.8 }));
      staff.position.set(0.62, 0.6, 0);
      group.add(staff);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), new THREE.MeshStandardMaterial({ color: parseInt(color.replace('#', '0x')), emissive: parseInt(color.replace('#', '0x')), emissiveIntensity: 0.5, roughness: 0 }));
      orb.position.set(0.62, 1.4, 0);
      group.add(orb);
    } else if (charClass === 'Okçu') {
      // Bow
      const bowMat = new THREE.MeshStandardMaterial({ color: 0x6b4c00 });
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 20, Math.PI), bowMat);
      bow.position.set(0.7, 0.7, 0);
      bow.rotation.z = Math.PI / 2;
      group.add(bow);
    } else {
      // Shield for Titan
      const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 6), mat);
      shield.position.set(0.7, 0.7, 0);
      shield.rotation.z = Math.PI / 2;
      group.add(shield);
    }

    // Floating ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 40), new THREE.MeshStandardMaterial({ color: parseInt(color.replace('#', '0x')), emissive: parseInt(color.replace('#', '0x')), emissiveIntensity: 0.5 }));
    ring.position.y = -0.2;
    ring.rotation.x = Math.PI / 4;
    group.add(ring);

    group.position.y = -0.7;

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      group.rotation.y += 0.012;
      renderer.render(scene, camera);
    };
    animate();

    sceneRef.current = { renderer, frame };
    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [charClass, color]);

  return <div ref={mountRef} style={{ width: '100%', height: 240, borderRadius: 12 }} />;
}

export default function VoidCharacters() {
  const { isAdmin, user } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', title: '', charClass: 'Savaşçı', story: '', color: '#8b5cf6' });

  const load = async () => {
    try {
      const data = await getCharacters();
      setCharacters(data || []);
    } catch (err) {
      console.error('Failed to load characters:', err);
      setCharacters([]);
    }
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addCharacter({ ...form, createdBy: user.username });
      setForm({ name: '', title: '', charClass: 'Savaşçı', story: '', color: '#8b5cf6' });
      setShowForm(false);
      load();
    } catch (err) {
      console.error('Failed to add character:', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="section-title"><User size={18} color="#8b5cf6" /> Karakterler</div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'İptal' : 'Karakter Tasarla'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="grid gap-6 mb-8 animate-fade-in" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Form */}
          <div className="card p-5">
            <h3 className="font-bold mb-4" style={{ color: '#c4b5fd' }}>Yeni Karakter</h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="form-label">İsim</label>
                <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Unvan</label>
                <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Sınıf</label>
                <select className="input-field" value={form.charClass} onChange={e => set('charClass', e.target.value)}>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Tema Rengi</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }} />
                  <span className="text-sm" style={{ color: '#64748b' }}>{form.color}</span>
                </div>
              </div>
              <div>
                <label className="form-label">Hikaye</label>
                <textarea className="input-field" rows={3} value={form.story} onChange={e => set('story', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" className="btn-primary">Oluştur</button>
            </form>
          </div>

          {/* Live 3D Preview */}
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="font-bold" style={{ color: '#c4b5fd' }}>Canlı 3D Önizleme</h3>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{CLASS_ICONS[form.charClass] || '⚔️'}</span>
              <span className="badge badge-purple">{form.charClass}</span>
            </div>
            <ThreePreview charClass={form.charClass} color={form.color} />
            <p className="text-xs text-center" style={{ color: '#4b5563' }}>Model sınıf ve renge göre güncellenir</p>
          </div>
        </div>
      )}

      {/* Characters gallery */}
      {characters.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center" style={{ color: '#4b5563' }}>
          <span className="text-4xl">👤</span>
          <p>Henüz karakter oluşturulmamış.</p>
          {isAdmin && <p className="text-sm">Yukarıdaki "Karakter Tasarla" butonunu kullanın.</p>}
        </div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))' }}>
          {characters.map((c, i) => (
            <div key={c.id} className="card p-5 flex flex-col gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.06}s`, borderColor: `${c.color}55` }}>
              <ThreePreview charClass={c.charClass} color={c.color} />
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-lg">{c.name}</h3>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>{c.title}</p>
                  </div>
                  <span className="text-2xl">{CLASS_ICONS[c.charClass] || '⚔️'}</span>
                </div>
                <span className="badge badge-purple mt-1">{c.charClass}</span>
                {c.story && <p className="text-xs mt-2 leading-relaxed" style={{ color: '#64748b' }}>{c.story}</p>}
              </div>
              {isAdmin && (
                <button onClick={async () => { await deleteCharacter(c.id); load(); }} className="btn-danger flex items-center gap-1 self-end" style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>
                  <Trash2 size={12} /> Sil
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
