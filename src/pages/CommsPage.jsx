import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Hash, Volume2, MonitorPlay, Send, Users, Link, Key, Disc, Video, Mic, LogOut, Code, UserPlus, Plus, Globe, Shield, MailOpen, X, LogIn, Check } from 'lucide-react';
import { getGroups, createGroup, requestJoinGroup, getGroupRequests, acceptJoinRequest, rejectJoinRequest } from '../lib/db';

export default function CommsPage() {
  const { user } = useAuth();
  
  const peerRef = useRef(null);
  const connectionsRef = useRef({});
  const callsRef = useRef({});
  
  const [peerId, setPeerId] = useState('');
  const [targetId, setTargetId] = useState('');
  
  const [peersList, setPeersList] = useState([]);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Sistem', text: 'Gamehub İletişim Portalı\'na Hoş Geldiniz! Güvenli WebRTC P2P ağı kullanılmaktadır.', isSystem: true }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  
  const [activeChannel, setActiveChannel] = useState('general');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const videoRefs = useRef({});

  // --- GROUPS (GUILDS) STATE ---
  const [groups, setGroups] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [joinInviteId, setJoinInviteId] = useState('');
  const [createdInviteId, setCreatedInviteId] = useState(null);

  const loadGroupsData = async () => {
    try {
      const gList = await getGroups();
      const rList = await getGroupRequests();
      setGroups(gList);
      setRequests(rList);
    } catch(err) { console.error('Gruplar çekilirken hata:', err); }
  };

  useEffect(() => { loadGroupsData(); }, []);

  const myGroups = user ? groups.filter(g => g.members.includes(user.id)) : [];
  const incomingReqs = user ? requests.filter(r => r.status === 'pending' && groups.some(g => g.id === r.groupId && g.ownerId === user.id)) : [];

  // 1. PeerJS Yükleme ve Başlatma
  useEffect(() => {
    if (window.Peer) {
      initPeer();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
      script.onload = () => initPeer();
      document.body.appendChild(script);
    }
    
    return () => {
      if (peerRef.current) peerRef.current.destroy();
      stopMyStream();
    };
  }, []);

  // Gelen Yayınların Video Elementlerine Bağlanması
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([id, stream]) => {
      if (videoRefs.current[id] && videoRefs.current[id].srcObject !== stream) {
        videoRefs.current[id].srcObject = stream;
      }
    });
  }, [remoteStreams, activeChannel]);

  const initPeer = () => {
    // Rastgele ama kullanışlı bir ID öneki
    const idPrefix = user ? user.username.replace(/[^a-zA-Z0-9]/g, '') : 'guest';
    const peer = new window.Peer(`${idPrefix}-${Math.floor(Math.random() * 10000)}`);
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      addSystemMsg(`Sunucu kimliğiniz oluşturuldu. Odana davet etmek için ID'ni paylaş!`);
    });

    peer.on('connection', (conn) => {
      setupConnection(conn);
    });

    peer.on('call', (call) => {
      // Birisi bizi arıyor (ses veya video gönderiyor)
      call.answer(myStream); // Varsa kendi streamimizi döneriz
      call.on('stream', (remoteStream) => {
        setRemoteStreams(prev => ({ ...prev, [call.peer]: remoteStream }));
      });
      call.on('close', () => {
        setRemoteStreams(prev => {
          const ns = { ...prev };
          delete ns[call.peer];
          return ns;
        });
      });
      callsRef.current[call.peer] = call;
    });

    peer.on('error', (err) => {
      addSystemMsg(`Bağlantı Hatası: ${err.type}`);
    });
  };

  const setupConnection = (conn) => {
    conn.on('open', () => {
      connectionsRef.current[conn.peer] = conn;
      setPeersList(Object.keys(connectionsRef.current));
      
      // İlk bağlantıda selamlaşma (isim değişimi)
      conn.send({ type: 'hello', username: user?.username || 'Misafir' });
    });

    conn.on('data', (data) => {
      if (data.type === 'msg') {
        setMessages(prev => [...prev, { id: Date.now(), sender: data.sender, text: data.text }]);
      } else if (data.type === 'hello') {
        addSystemMsg(`${data.username} odaya katıldı! (${conn.peer})`);
      }
    });

    conn.on('close', () => {
      delete connectionsRef.current[conn.peer];
      setPeersList(Object.keys(connectionsRef.current));
      addSystemMsg(`${conn.peer} ayrıldı.`);
    });
  };

  const connectToPeer = () => {
    if (!targetId || targetId === peerId) return;
    const conn = peerRef.current.connect(targetId);
    setupConnection(conn);
    setTargetId('');
    addSystemMsg(`Bağlanılıyor: ${targetId}...`);
  };

  const broadcastMessage = (msgObj) => {
    Object.values(connectionsRef.current).forEach(conn => {
      if (conn.open) conn.send(msgObj);
    });
  };

  const addSystemMsg = (text) => {
    setMessages(prev => [...prev, { id: Date.now(), sender: 'Sistem', text, isSystem: true }]);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    
    const newMsg = { id: Date.now(), type: 'msg', sender: user?.username || 'Ben', text: inputMsg };
    setMessages(prev => [...prev, newMsg]);
    
    broadcastMessage({ type: 'msg', sender: user?.username || 'Ben', text: inputMsg });
    setInputMsg('');
  };

  // --- MEDYA YAKALAMA ---
  const stopMyStream = () => {
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
      setMyStream(null);
    }
  };

  const startVoiceChat = async () => {
    try {
      stopMyStream();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setMyStream(stream);
      setIsStreaming(true);
      
      // Herkese çağrı at (Mesh yayın)
      Object.keys(connectionsRef.current).forEach(peer => {
        const call = peerRef.current.call(peer, stream);
        call.on('stream', (remoteStream) => {
          setRemoteStreams(prev => ({ ...prev, [peer]: remoteStream }));
        });
        callsRef.current[peer] = call;
      });
      addSystemMsg(`Mikrofon açıldı ve ses yayını başladı.`);
    } catch (err) {
      addSystemMsg(`Mikrofon erişimi reddedildi veya hata oluştu.`);
    }
  };

  const startScreenShare = async () => {
    try {
      stopMyStream();
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setMyStream(stream);
      setIsStreaming(true);
      
      // Yayın kapatılırsa (tarayıcı butonu ile) yakalamak için:
      stream.getVideoTracks()[0].onended = () => {
        stopVoiceOrShare();
      };
      
      Object.keys(connectionsRef.current).forEach(peer => {
        const call = peerRef.current.call(peer, stream);
        call.on('stream', (remoteStream) => {
          setRemoteStreams(prev => ({ ...prev, [peer]: remoteStream }));
        });
        callsRef.current[peer] = call;
      });
      addSystemMsg(`Ekran yayını başlatıldı.`);
    } catch (err) {
      addSystemMsg(`Ekran paylaşımı iptal edildi.`);
    }
  };

  const stopVoiceOrShare = () => {
    stopMyStream();
    // Çağrıları kapat
    Object.values(callsRef.current).forEach(call => call.close());
    callsRef.current = {};
    setIsStreaming(false);
    addSystemMsg(`Yayın / Ses bağlantısı durduruldu.`);
  };

  // --- GROUP (GUILD) HANDLERS ---
  const handleGroupCreate = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !user) return;
    try {
      const g = await createGroup(newGroupName, newGroupDesc, user.id);
      setCreatedInviteId(g.inviteId);
      await loadGroupsData();
    } catch(err) { alert(err.message); }
  };

  const handleJoinReq = async (e) => {
    e.preventDefault();
    if (!joinInviteId.trim() || !user) return;
    try {
      await requestJoinGroup(joinInviteId, user.id);
      alert("İstek başarıyla gönderildi! Liderin onayını bekleyin.");
      setShowJoinModal(false);
      setJoinInviteId('');
      await loadGroupsData();
    } catch(err) { alert(err.message); }
  };

  const onAcceptReq = async (reqId) => {
    try {
      await acceptJoinRequest(reqId);
      await loadGroupsData();
    } catch(err) { alert(err.message); }
  };
  
  const onRejectReq = async (reqId) => {
    try {
      await rejectJoinRequest(reqId);
      await loadGroupsData();
    } catch(err) { alert(err.message); }
  };

  const activeGroup = activeGroupId ? groups.find(g => g.id === activeGroupId) : null;

  return (
    <div className="flex h-full bg-[#1e1e24] text-slate-200 overflow-hidden relative">
      
      {/* 1. GUILD SIDEBAR (EN SOL KOLON) */}
      <div className="w-[72px] bg-[#1a1a1f] border-r border-[#ffffff08] flex flex-col items-center py-4 gap-3 shrink-0 z-20 overflow-y-auto hidden-scrollbar">
        {/* Global Hub Button */}
        <button 
          onClick={() => setActiveGroupId(null)}
          className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all flex items-center justify-center shrink-0 ${activeGroupId === null ? 'bg-purple-600 rounded-[16px]' : 'bg-[#2a2a35] hover:bg-purple-500 text-slate-400 hover:text-white'}`}
          title="Genel Ağ"
        >
          <Globe size={24} />
        </button>
        
        <div className="w-8 h-[2px] bg-[#ffffff10] rounded-full my-1 shrink-0"></div>

        {/* My Groups List */}
        {myGroups.map(g => (
          <button 
            key={g.id}
            onClick={() => setActiveGroupId(g.id)}
            className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all flex items-center justify-center shrink-0 shadow-lg ${activeGroupId === g.id ? 'bg-indigo-600 rounded-[16px] text-white' : 'bg-[#2a2a35] text-slate-300 hover:bg-indigo-500'}`}
            title={g.name}
          >
            <span className="font-bold text-lg">{g.name.substring(0, 2).toUpperCase()}</span>
          </button>
        ))}

        {/* Join Group */}
        <button 
          onClick={() => setShowJoinModal(true)}
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#ffffff05] border border-dashed border-[#ffffff20] hover:border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 transition-all flex items-center justify-center shrink-0 mt-2"
          title="Davet ile Katıl"
        >
          <LogIn size={20} />
        </button>

        {/* Create Group */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#ffffff05] border border-dashed border-[#ffffff20] hover:border-purple-500 text-purple-500 hover:bg-purple-500/10 transition-all flex items-center justify-center shrink-0"
          title="Grup Oluştur"
        >
          <Plus size={24} />
        </button>
        
        {incomingReqs.length > 0 && (
           <button 
             onClick={() => setShowReqModal(true)}
             className="w-12 h-12 mt-4 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center relative animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]"
             title={`${incomingReqs.length} Katılma İsteği Bekliyor`}
           >
             <MailOpen size={20} />
             <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
               {incomingReqs.length}
             </div>
           </button>
        )}
      </div>

      {/* 2. ANA İÇERİK KISMI */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e24]">

      {/* Üst Bar (Oda ID Bilgisi) */}
      <div className="h-14 border-b border-[#ffffff10] flex items-center px-4 justify-between bg-[#232329] shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <Disc className="text-purple-500 animate-spin-slow" size={20} />
          <h2 className="font-bold text-lg text-white">İletişim Portalı</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1a1a1f] px-3 py-1.5 rounded-lg border border-[#ffffff15]">
            <span className="text-xs text-slate-400">Senin Oda Kimliğin:</span>
            <code className="text-sm font-bold text-cyan-400 select-all">{peerId || 'Bağlanıyor...'}</code>
          </div>
          <div className="flex items-center gap-1">
            <input 
              type="text" 
              placeholder="Arkadaşının Kimliği..." 
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              className="bg-[#1a1a1f] text-sm border border-[#ffffff15] rounded-l-lg px-3 py-1.5 outline-none focus:border-purple-500 w-48 text-white transition-all"
            />
            <button 
              onClick={connectToPeer}
              className="bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-r-lg text-sm font-semibold transition-colors flex items-center gap-1"
            >
              <Link size={14} /> Bağlan
            </button>
          </div>
        </div>
      </div>

      {/* Discord Düzeni (3 Kolonlu) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Kanallar */}
        <div className="w-56 bg-[#27272f] border-r border-[#ffffff08] flex flex-col shrink-0">
          <div className="p-4 bg-[#232329] border-b border-[#ffffff08] shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Bağlantı Kanalları</h3>
          </div>
          
          <div className="p-2 flex flex-col gap-1 flex-1 overflow-y-auto mt-2">
            <button 
              onClick={() => setActiveChannel('general')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${activeChannel === 'general' ? 'bg-[#ffffff15] text-white' : 'text-slate-400 hover:bg-[#ffffff0a] hover:text-slate-200'}`}
            >
              <Hash size={18} /> Genel Sohbet
            </button>
            <button 
              onClick={() => setActiveChannel('voice')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${activeChannel === 'voice' ? 'bg-[#ffffff15] text-white' : 'text-slate-400 hover:bg-[#ffffff0a] hover:text-slate-200'}`}
            >
              <Volume2 size={18} /> Ses Odası
            </button>
            <button 
              onClick={() => setActiveChannel('stream')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${activeChannel === 'stream' ? 'bg-[#ffffff15] text-white' : 'text-slate-400 hover:bg-[#ffffff0a] hover:text-slate-200'}`}
            >
              <MonitorPlay size={18} /> Canlı Yayın
            </button>
          </div>

          {/* Bağlı Kullanıcılar (Sağ Alt Köşe gibi ama sol altta Listeleyelim) */}
          <div className="p-3 bg-[#232329] border-t border-[#ffffff08]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <Users size={12} /> Odaya Bağlı Eşler ({peersList.length})
            </h3>
            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
              {peersList.length === 0 ? (
                <div className="text-xs text-slate-500 italic">Kimse yok</div>
              ) : (
                peersList.map(pid => (
                  <div key={pid} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-slate-300 truncate" title={pid}>{pid}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Ana Ekran (Message veya Video) */}
        <div className="flex-1 flex flex-col relative bg-[#1c1c21] overflow-hidden">
          
          {/* DURUM 1: GENEL SOHBET */}
          {activeChannel === 'general' && (
            <>
              {/* Mesaj Listesi */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                {messages.map((m) => (
                  <div key={m.id} className="flex gap-3 relative group">
                    {/* Avatar Placeholder */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold ${m.isSystem ? 'bg-red-500/20 text-red-500' : 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white'}`}>
                      {m.isSystem ? '!' : m.sender.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className={`font-semibold text-sm ${m.isSystem ? 'text-red-400' : 'text-purple-300'}`}>{m.sender}</span>
                        <span className="text-[10px] text-slate-500">{new Date(m.id).toLocaleTimeString()}</span>
                      </div>
                      <p className={`text-sm mt-0.5 leading-relaxed ${m.isSystem ? 'text-slate-400 italic' : 'text-slate-200'}`}>
                        {m.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-[#232329] shrink-0 border-t border-[#ffffff08]">
                <form onSubmit={handleSend} className="relative">
                  <input 
                    type="text" 
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    placeholder="Mesaj gönder..."
                    className="w-full bg-[#303038] text-sm text-slate-200 px-4 py-3 rounded-xl border border-[#ffffff05] focus:outline-none focus:border-purple-500 focus:bg-[#383842] transition-colors pr-12"
                  />
                  <button type="submit" className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-purple-400 transition-colors">
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          )}

          {/* DURUM 2: SES VEYA YAYIN ODASI */}
          {(activeChannel === 'voice' || activeChannel === 'stream') && (
            <div className="flex-1 p-6 flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  {activeChannel === 'voice' ? <Mic className="text-purple-400" /> : <MonitorPlay className="text-purple-400" />} 
                  {activeChannel === 'voice' ? 'Ses Odası Konsolu' : 'Canlı Yayın Paneli'}
                </h2>
                
                {/* Yayın/Ses Kontrolleri */}
                <div className="flex items-center gap-2">
                  {!isStreaming ? (
                    <>
                      {activeChannel === 'voice' && (
                        <button onClick={startVoiceChat} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                          <Mic size={16} /> Konuşmaya Başla
                        </button>
                      )}
                      {activeChannel === 'stream' && (
                        <button onClick={startScreenShare} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                          <MonitorPlay size={16} /> Ekran Paylaş
                        </button>
                      )}
                    </>
                  ) : (
                    <button onClick={stopVoiceOrShare} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-rose-900/50 animate-pulse">
                      <LogOut size={16} /> Bağlantıyı Kes
                    </button>
                  )}
                </div>
              </div>

              {/* MEDYA GÖRÜK LİSTESİ */}
              <div className="flex-1 glass rounded-2xl border border-[#ffffff10] bg-[#15151a]/50 p-4 flex flex-wrap gap-4 overflow-y-auto content-start justify-center">
                {/* Her yayın için minik kare */}
                {Object.keys(remoteStreams).length === 0 && !myStream && (
                  <div className="flex flex-col items-center justify-center w-full h-full text-slate-500">
                    <Video size={48} className="mb-4 opacity-20" />
                    <p>Henüz aktif bir yayın veya ses akışı yok.</p>
                  </div>
                )}
                
                {/* Benim Medyam */}
                {myStream && (
                  <div className="relative bg-black rounded-xl overflow-hidden shadow-xl border-2 border-purple-500 w-full max-w-[400px] aspect-video flex-shrink-0 group">
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 z-10 backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div> SENİN YAYININ
                    </div>
                    {/* Eğer video track varsa göster */}
                    {myStream.getVideoTracks().length > 0 ? (
                      <video 
                        ref={v => { if (v && v.srcObject !== myStream) v.srcObject = myStream }} 
                        autoPlay muted playsInline 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#111]">
                        <Mic size={48} className="text-purple-500/50" />
                      </div>
                    )}
                  </div>
                )}

                {/* Uzak Medyalar */}
                {Object.entries(remoteStreams).map(([id, stream]) => (
                  <div key={id} className="relative bg-black rounded-xl overflow-hidden shadow-xl border border-[#ffffff20] w-full max-w-[400px] aspect-video flex-shrink-0 group hover:border-[#ffffff40] transition-colors">
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white z-10 backdrop-blur-sm truncate max-w-[80%]">
                      İzleniyor: {id.split('-')[0]}
                    </div>
                    {stream.getVideoTracks().length > 0 ? (
                      <video 
                        ref={el => { videoRefs.current[id] = el }} 
                        autoPlay playsInline 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#111]">
                        <div className="relative">
                          <Mic size={48} className="text-emerald-500/50" />
                          <div className="absolute -inset-4 bg-emerald-500/20 rounded-full animate-ping"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      </div>

      {/* --- MODALS --- */}
      {/* 1. GRUP KUR MODALI */}
      {showCreateModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 border-purple-500/30">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="text-purple-500" /> Yeni Grup Kur
                </h2>
                <p className="text-sm text-slate-400 mt-1">Arkadaşlarınla özel bir P2P ağı yarat.</p>
              </div>
              <button onClick={() => {setShowCreateModal(false); setCreatedInviteId(null);}} className="text-slate-400 hover:text-white"><XIcon/></button>
            </div>
            
            {createdInviteId ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                <Check className="text-emerald-500 w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Grup Başarıyla Kuruldu!</h3>
                <p className="text-sm text-slate-300 mb-4">Arkadaşlarına grubunuza katılmaları için aşağıdaki Davet ID'sini gönder.</p>
                <div className="bg-black/40 border border-[#ffffff10] rounded-lg p-3 font-mono text-xl text-emerald-400 select-all font-bold tracking-widest">
                  {createdInviteId}
                </div>
              </div>
            ) : (
              <form onSubmit={handleGroupCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Grup Adı</label>
                  <input type="text" maxLength={20} required value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} className="w-full bg-[#1a1a1f] border border-[#ffffff10] rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none" placeholder="Örn: Gece Kuşları"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Açıklama</label>
                  <input type="text" maxLength={100} value={newGroupDesc} onChange={e=>setNewGroupDesc(e.target.value)} className="w-full bg-[#1a1a1f] border border-[#ffffff10] rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none" placeholder="Bu grup ne amaçla kuruluyor?"/>
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-purple-900/30">
                  Grubu Kur ve Bağlan
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. GRUBA KATIL MODALI */}
      {showJoinModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full rounded-2xl p-6 border-indigo-500/30">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <LogIn className="text-indigo-500" /> Gruba Katıl
              </h2>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-white"><XIcon/></button>
            </div>
            <form onSubmit={handleJoinReq} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Davet ID</label>
                <input type="text" required value={joinInviteId} onChange={e=>setJoinInviteId(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1f] border border-[#ffffff10] rounded-lg px-4 py-3 font-mono text-center text-xl text-white focus:border-indigo-500 focus:outline-none placeholder-slate-700 tracking-widest uppercase" placeholder="G-XXXX"/>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-900/30">
                Lidere İstek At
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. İSTEKLERİ YÖNET MODALI */}
      {showReqModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 border-rose-500/30">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <UserPlus className="text-rose-500" /> Katılım İstekleri
                </h2>
                <p className="text-sm text-slate-400 mt-1">Grubunuza katılmak isteyenler.</p>
              </div>
              <button onClick={() => setShowReqModal(false)} className="text-slate-400 hover:text-white"><XIcon/></button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {incomingReqs.map(r => {
                const groupObj = groups.find(g => g.id === r.groupId);
                return (
                  <div key={r.id} className="bg-[#1a1a1f] border border-[#ffffff0a] p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">Kullanıcı: <span className="text-cyan-400">{r.userId}</span></h4>
                      <p className="text-xs text-slate-500">Grup: {groupObj?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={()=>onAcceptReq(r.id)} className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors">
                        <Check size={16}/>
                      </button>
                      <button onClick={()=>onRejectReq(r.id)} className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors">
                        <XIcon size={16}/>
                      </button>
                    </div>
                  </div>
                );
              })}
              {incomingReqs.length === 0 && (
                <div className="text-center py-8 text-slate-500 italic">
                  Bekleyen istek kalmadı.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
