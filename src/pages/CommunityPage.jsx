import { useState, useEffect } from 'react';
import { getPosts, addPost, toggleLike, addComment, getTrendingTopics } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Send, TrendingUp, Hash, ChevronDown, ChevronUp } from 'lucide-react';

const TOPICS = ['#Rehber', '#Muhabbet', '#Yardım', '#Strateji', '#Haber', '#Tanıtım'];

function PostCard({ post, currentUserId, onRefresh }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { user } = useAuth();
  const liked = (post.likes || []).includes(currentUserId);

  const handleLike = async () => { await toggleLike(post.id, currentUserId); onRefresh(); };
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment(post.id, { text: commentText, author: user.username, userId: user.id });
    setCommentText('');
    onRefresh();
  };

  const tags = (post.content || '').match(/#\w+/g) || [];

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
          {post.author?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm text-white">{post.author}</p>
          <p className="text-xs" style={{ color: '#4b5563' }}>{post.date}</p>
        </div>
        {tags.length > 0 && (
          <div className="ml-auto flex gap-1 flex-wrap">
            {tags.map(t => <span key={t} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{t}</span>)}
          </div>
        )}
      </div>

      <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>
        {(post.content || '').split(/(#\w+)/g).map((part, i) =>
          part.startsWith('#')
            ? <span key={i} style={{ color: '#a78bfa' }}>{part}</span>
            : part
        )}
      </p>

      <div className="flex items-center gap-4 pt-2" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <button onClick={handleLike} className="flex items-center gap-1.5 text-sm transition-all" style={{ color: liked ? '#f472b6' : '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Heart size={15} fill={liked ? '#f472b6' : 'none'} />
          <span>{(post.likes || []).length}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm" style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
          <MessageCircle size={15} />
          <span>{(post.comments || []).length}</span>
          {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {showComments && (
        <div className="flex flex-col gap-2 mt-1">
          {(post.comments || []).map(c => (
            <div key={c.id} className="flex gap-2 p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.05)' }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {c.author?.[0]?.toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-semibold" style={{ color: '#a5b4fc' }}>{c.author} </span>
                <span className="text-xs" style={{ color: '#94a3b8' }}>{c.text}</span>
              </div>
            </div>
          ))}
          <form onSubmit={handleComment} className="flex gap-2 mt-1">
            <input className="input-field" style={{ flex: 1 }} placeholder="Yorum yaz..." value={commentText} onChange={e => setCommentText(e.target.value)} />
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem' }}><Send size={14} /></button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const load = async () => {
    setPosts(await getPosts());
    setTrending(await getTrendingTopics());
  };
  useEffect(() => { load(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    const text = selectedTag ? `${content} ${selectedTag}` : content;
    await addPost({ content: text, author: user.username, userId: user.id, date: new Date().toLocaleDateString('tr-TR') });
    setContent('');
    setSelectedTag('');
    load();
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="section-title">💬 Topluluk</div>

      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        {/* Main feed */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Create post */}
          <div className="card p-5">
            <form onSubmit={handlePost} className="flex flex-col gap-3">
              <textarea className="input-field" rows={3} placeholder="Düşüncelerini paylaş..." value={content} onChange={e => setContent(e.target.value)} style={{ resize: 'none' }} />
              <div className="flex items-center gap-2 flex-wrap">
                {TOPICS.map(t => (
                  <button key={t} type="button" onClick={() => setSelectedTag(selectedTag === t ? '' : t)} className={selectedTag === t ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}>
                    <Hash size={10} className="inline mr-1" />{t.slice(1)}
                  </button>
                ))}
                <button type="submit" className="btn-primary ml-auto flex items-center gap-2">
                  <Send size={14} /> Paylaş
                </button>
              </div>
            </form>
          </div>

          {posts.length === 0 ? (
            <div className="card p-10 flex flex-col items-center gap-3 text-center" style={{ color: '#4b5563' }}>
              <span className="text-3xl">💬</span>
              <p>Henüz gönderi yok. İlk paylaşımı sen yap!</p>
            </div>
          ) : (
            posts.map(p => <PostCard key={p.id} post={p} currentUserId={user.id} onRefresh={load} />)
          )}
        </div>

        {/* Trending sidebar */}
        <div className="flex flex-col gap-4" style={{ width: 220, flexShrink: 0 }}>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} color="#8b5cf6" />
              <span className="font-bold text-sm" style={{ color: '#c4b5fd' }}>Trending Topics</span>
            </div>
            {trending.length === 0 ? (
              <p className="text-xs" style={{ color: '#4b5563' }}>Henüz konu yok.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {trending.map(({ tag, count }, i) => (
                  <div key={tag} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#a78bfa' }}>{i + 1}. {tag}</span>
                    <span className="badge badge-purple">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
