import { Wrench, Settings } from 'lucide-react';

export default function MaintenancePage({ onAdminLogin }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Kayan arka plan efektleri */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[100px] bg-purple-600/30 -top-48 -left-48 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] bg-indigo-600/20 bottom-[-200px] right-[-100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="glass max-w-lg w-full p-10 rounded-2xl text-center relative z-10 border border-purple-500/20 shadow-[0_0_50px_rgba(139,92,246,0.15)] animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 relative" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
          <div className="absolute inset-0 rounded-2xl blur-md bg-purple-500/50 animate-glow"></div>
          <Wrench size={32} color="white" className="relative z-10 animate-[spin_4s_linear_infinite]" />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
          SİTEMİZ <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">YAPIM AŞAMASINDA</span>
        </h1>
        
        <p className="text-slate-300 mb-8 leading-relaxed">
          GameHub şu anda büyük bir güncelleme ve bakım çalışması sürecinde. Sizlere çok daha iyi bir deneyim sunabilmek için altyapımızı yeniliyoruz. Lütfen daha sonra tekrar ziyaret edin.
        </p>

        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 w-2/3 animate-[slideRight_2s_ease-in-out_infinite_alternate]"></div>
        </div>
        <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">
          SİSTEMLER GÜNCELLENİYOR...
        </p>
      </div>

      {/* Yöneticiler için gizli giriş butonu */}
      <button 
        onClick={onAdminLogin}
        className="absolute bottom-6 right-6 p-3 rounded-full text-slate-600 hover:text-purple-400 hover:bg-purple-500/10 transition-colors opacity-30 hover:opacity-100"
        title="Sistem Girişi (Sadece Yetkililer)"
      >
        <Settings size={20} />
      </button>

      <style>{`
        @keyframes slideRight {
          0% { width: 30%; transform: translateX(0); }
          100% { width: 50%; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
