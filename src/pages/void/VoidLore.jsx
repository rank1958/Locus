export default function VoidLore() {
  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8" style={{ background: 'linear-gradient(135deg, #1a0533, #0d0d2b)', border: '1px solid rgba(139,92,246,0.3)', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,38,246,0.25), transparent 70%)' }} />
        <div className="relative text-center p-10">
          <div className="text-5xl mb-4 animate-float">🌌</div>
          <h1 className="text-4xl font-black mb-3" style={{ fontFamily: 'Orbitron, sans-serif', background: 'linear-gradient(135deg,#c4b5fd,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            THE VOID GRID
          </h1>
          <p className="text-lg" style={{ color: '#94a3b8', maxWidth: 520, margin: '0 auto' }}>
            Karanlığın ötesinde bir evren. Hiçliğin yaratıkları uyanıyor. Kadim sırlar hâlâ fısıldıyor.
          </p>
        </div>
      </div>

      {/* Lore sections */}
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))' }}>
        {[
          { icon: '⚫', title: 'Yarat\'ılış', text: 'Void Grid, tüm gerçekliklerin dışında, boşluk ve enerji arasında sıkışmış kadim bir boyuttur. Burası ne ışık ne de karanlık tarafından kurallanır — sadece "Hiçlik" egemendir.' },
          { icon: '⚡', title: 'Karanlık Enerji', text: '"Karanlık Enerji", Void Grid\'in ham yakıtıdır. İnsan anlayışının ötesinde, tüm savaşçıların, büyücülerin ve suikastçilerin güç kaynağıdır.' },
          { icon: '👹', title: 'Hiçlik Yaratıkları', text: 'Boyutlar arası çatlakların derinliklerinden sızan bu varlıklar, formsuz ve amansızdır. Her savaşçı, onları yok etmek için özel silahlar geliştirmek zorundadır.' },
          { icon: '📜', title: 'Kadim Sırlar', text: 'Void Grid\'in merkezinde, kuruluş sırlarını barındıran Yedi Mühür vardır. Her mühür, bir boyutu kapatır. Bir mühür kırıldığında... bilinmez.' },
          { icon: '⚔️', title: 'Savaşçılar', text: 'Seçilmiş savaşçılar, Void\'e çağrılarak eğitilir. Sınıfına göre farklı güçler kazanırlar: kılıç, asa veya gizli bıçak.' },
          { icon: '🌀', title: 'Boyut Yarıkları', text: 'Zaman zaman boyutlar arası dengesizlikler yaşanır. Bu yarıklarda hem tehlikeler hem de nadide güçler saklanmaktadır.' },
        ].map((item, i) => (
          <div key={i} className="card p-5 animate-fade-in" style={{ animationDelay: `${i * 0.07}s`, borderColor: 'rgba(139,92,246,0.25)' }}>
            <div className="text-2xl mb-2">{item.icon}</div>
            <h3 className="font-bold mb-2" style={{ color: '#c4b5fd' }}>{item.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
