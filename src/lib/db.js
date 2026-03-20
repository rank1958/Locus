/**
 * db.js — GameHub Data Layer
 * When window.GH_API_URL is set (network mode), all reads/writes go to the API server.
 * Otherwise, falls back to localStorage (offline mode).
 */

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ── API helpers ───────────────────────────────────────────
const API = () => window.GH_API_URL || null;

async function apiFetch(path, opts = {}) {
  const base = API();
  if (!base) throw new Error('offline');
  const res = await fetch(`${base}/api/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

// ── localStorage fallback ─────────────────────────────────
const KEYS = {
  USERS: 'gh_users', GAMES: 'gh_games', SESSIONS: 'gh_sessions',
  POSTS: 'gh_posts', NEWS: 'gh_news', CHARACTERS: 'gh_characters',
  VOID_GAMES: 'gh_void_games', VOID_NEWS: 'gh_void_news',
};
const lsRead  = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
const lsWrite = (k, d) => localStorage.setItem(k, JSON.stringify(d));

// ── USERS ──────────────────────────────────────────────────
export const getUsers  = async () => API() ? apiFetch('users') : lsRead(KEYS.USERS);
export const findUser  = async (un) => (await getUsers()).find(u => u.username === un);
export const findUserById = async (id) => (await getUsers()).find(u => u.id === id);

export const createUser = async (data) => {
  if (API()) return apiFetch('users', { method: 'POST', body: data });
  const users = lsRead(KEYS.USERS);
  if (users.find(u => u.username === data.username)) throw new Error('Kullanıcı adı zaten alınmış');
  const user = { id: uid(), ...data, role: 'user', createdAt: Date.now(), online: false };
  lsWrite(KEYS.USERS, [...users, user]);
  return user;
};

export const updateUser = async (id, patch) => {
  if (API()) return apiFetch(`users/${id}`, { method: 'PUT', body: patch });
  lsWrite(KEYS.USERS, lsRead(KEYS.USERS).map(u => u.id === id ? { ...u, ...patch } : u));
};

export const deleteUser = async (id) => {
  if (API()) return apiFetch(`users/${id}`, { method: 'DELETE' });
  lsWrite(KEYS.USERS, lsRead(KEYS.USERS).filter(u => u.id !== id));
};

// ── GAMES ──────────────────────────────────────────────────
export const getGames = async () => {
  const list = API() ? await apiFetch('games') : lsRead(KEYS.GAMES);
  return [...list].sort((a, b) => (b.plays || 0) - (a.plays || 0));
};
export const getGameById = async (id) => (await getGames()).find(g => g.id === id);

export const addGame = async (data) => {
  if (API()) return apiFetch('games', { method: 'POST', body: data });
  const games = lsRead(KEYS.GAMES);
  const game = { id: uid(), plays: 0, uniquePlayers: [], totalTime: 0, ...data, createdAt: Date.now() };
  lsWrite(KEYS.GAMES, [...games, game]);
  return game;
};

export const deleteGame = async (id) => {
  if (API()) return apiFetch(`games/${id}`, { method: 'DELETE' });
  lsWrite(KEYS.GAMES, lsRead(KEYS.GAMES).filter(g => g.id !== id));
};

export const recordPlay = async (gameId, userId, durationSeconds) => {
  if (API()) return apiFetch('sessions/recordPlay', { method: 'POST', body: { gameId, userId, durationSeconds, isVoid: false } });
  const games = lsRead(KEYS.GAMES).map(g => {
    if (g.id !== gameId) return g;
    const unique = g.uniquePlayers || [];
    return { ...g, plays: (g.plays || 0) + 1, uniquePlayers: unique.includes(userId) ? unique : [...unique, userId], totalTime: (g.totalTime || 0) + durationSeconds };
  });
  lsWrite(KEYS.GAMES, games);
  const game = games.find(g => g.id === gameId);
  const mins = Math.floor(durationSeconds / 60), secs = durationSeconds % 60;
  lsWrite(KEYS.SESSIONS, [...lsRead(KEYS.SESSIONS), { id: uid(), userId, gameId, gameName: game?.name || '?', duration: durationSeconds, durationStr: `${mins}d ${secs}s`, date: new Date().toLocaleDateString('tr-TR'), time: new Date().toLocaleTimeString('tr-TR'), createdAt: Date.now() }]);
};

// ── VOID GAMES ─────────────────────────────────────────────
export const getVoidGames = async () => {
  const list = API() ? await apiFetch('voidGames') : lsRead(KEYS.VOID_GAMES);
  return [...list].sort((a, b) => (b.plays || 0) - (a.plays || 0));
};
export const addVoidGame = async (data) => {
  if (API()) return apiFetch('voidGames', { method: 'POST', body: data });
  const games = lsRead(KEYS.VOID_GAMES);
  const game = { id: uid(), plays: 0, uniquePlayers: [], totalTime: 0, ...data, createdAt: Date.now() };
  lsWrite(KEYS.VOID_GAMES, [...games, game]);
  return game;
};
export const deleteVoidGame = async (id) => {
  if (API()) return apiFetch(`voidGames/${id}`, { method: 'DELETE' });
  lsWrite(KEYS.VOID_GAMES, lsRead(KEYS.VOID_GAMES).filter(g => g.id !== id));
};
export const recordVoidPlay = async (gameId, userId, durationSeconds) => {
  if (API()) return apiFetch('sessions/recordPlay', { method: 'POST', body: { gameId, userId, durationSeconds, isVoid: true } });
  const games = lsRead(KEYS.VOID_GAMES).map(g => {
    if (g.id !== gameId) return g;
    const unique = g.uniquePlayers || [];
    return { ...g, plays: (g.plays || 0) + 1, uniquePlayers: unique.includes(userId) ? unique : [...unique, userId], totalTime: (g.totalTime || 0) + durationSeconds };
  });
  lsWrite(KEYS.VOID_GAMES, games);
};

// ── SESSIONS ───────────────────────────────────────────────
export const getSessions = async () => {
  const list = API() ? await apiFetch('sessions') : lsRead(KEYS.SESSIONS);
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
};

// ── POSTS ──────────────────────────────────────────────────
export const getPosts = async () => {
  const list = API() ? await apiFetch('posts') : lsRead(KEYS.POSTS);
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
};
export const addPost = async (data) => {
  if (API()) return apiFetch('posts', { method: 'POST', body: data });
  const post = { id: uid(), likes: [], comments: [], ...data, createdAt: Date.now() };
  lsWrite(KEYS.POSTS, [...lsRead(KEYS.POSTS), post]);
  return post;
};
export const toggleLike = async (postId, userId) => {
  if (API()) return apiFetch('posts/toggleLike', { method: 'POST', body: { postId, userId } });
  lsWrite(KEYS.POSTS, lsRead(KEYS.POSTS).map(p => {
    if (p.id !== postId) return p;
    const likes = p.likes || [];
    return { ...p, likes: likes.includes(userId) ? likes.filter(l => l !== userId) : [...likes, userId] };
  }));
};
export const addComment = async (postId, comment) => {
  if (API()) return apiFetch('posts/addComment', { method: 'POST', body: { postId, comment } });
  lsWrite(KEYS.POSTS, lsRead(KEYS.POSTS).map(p => p.id !== postId ? p : { ...p, comments: [...(p.comments || []), { id: uid(), ...comment, createdAt: Date.now() }] }));
};
export const getTrendingTopics = async () => {
  const posts = await getPosts();
  const counts = {};
  posts.forEach(p => { const tags = (p.content || '').match(/#\w+/g) || []; tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; }); });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count }));
};

// ── NEWS ───────────────────────────────────────────────────
export const getNews = async () => {
  const list = API() ? await apiFetch('news') : lsRead(KEYS.NEWS);
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
};
export const addNews = async (data) => {
  if (API()) return apiFetch('news', { method: 'POST', body: data });
  const item = { id: uid(), ...data, createdAt: Date.now() };
  lsWrite(KEYS.NEWS, [...lsRead(KEYS.NEWS), item]);
  return item;
};
export const deleteNews = async (id) => {
  if (API()) return apiFetch(`news/${id}`, { method: 'DELETE' });
  lsWrite(KEYS.NEWS, lsRead(KEYS.NEWS).filter(n => n.id !== id));
};

// ── VOID NEWS ──────────────────────────────────────────────
export const getVoidNews = async () => {
  const list = API() ? await apiFetch('voidNews') : lsRead(KEYS.VOID_NEWS);
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
};
export const addVoidNews = async (data) => {
  if (API()) return apiFetch('voidNews', { method: 'POST', body: data });
  const item = { id: uid(), ...data, createdAt: Date.now() };
  lsWrite(KEYS.VOID_NEWS, [...lsRead(KEYS.VOID_NEWS), item]);
  return item;
};
export const deleteVoidNews = async (id) => {
  if (API()) return apiFetch(`voidNews/${id}`, { method: 'DELETE' });
  lsWrite(KEYS.VOID_NEWS, lsRead(KEYS.VOID_NEWS).filter(n => n.id !== id));
};

// ── CHARACTERS ─────────────────────────────────────────────
export const getCharacters = async () => API() ? apiFetch('characters') : lsRead(KEYS.CHARACTERS);
export const addCharacter = async (data) => {
  if (API()) return apiFetch('characters', { method: 'POST', body: data });
  const char = { id: uid(), ...data, createdAt: Date.now() };
  lsWrite(KEYS.CHARACTERS, [...lsRead(KEYS.CHARACTERS), char]);
  return char;
};
export const deleteCharacter = async (id) => {
  if (API()) return apiFetch(`characters/${id}`, { method: 'DELETE' });
  lsWrite(KEYS.CHARACTERS, lsRead(KEYS.CHARACTERS).filter(c => c.id !== id));
};

// ── SEED ───────────────────────────────────────────────────
// In network mode, the API server seeds itself. Only needed for offline localStorage mode.
export const seedIfEmpty = () => {
  if (API()) return; // API server handles seeding
  if (!lsRead(KEYS.USERS).find(u => u.username === 'admin')) {
    lsWrite(KEYS.USERS, [...lsRead(KEYS.USERS), { id: 'admin-001', username: 'admin', password: '123', email: 'admin@gamehub.com', role: 'admin', gender: 'Erkek', age: 30, createdAt: Date.now(), online: false }]);
  }
  if (lsRead(KEYS.GAMES).length === 0) {
    lsWrite(KEYS.GAMES, [{ id: uid(), name: 'Space Runner', category: 'Aksiyon', color: '#8b5cf6', url: 'https://scratch.mit.edu/projects/embed/1/', plays: 0, uniquePlayers: [], totalTime: 0, createdAt: Date.now() }]);
  }
  if (lsRead(KEYS.NEWS).length === 0) {
    lsWrite(KEYS.NEWS, [{ id: uid(), title: 'GameHub v1.0 Yayında!', content: 'Modern oyun platformumuz artık resmi olarak açık.', author: 'admin', createdAt: Date.now() }]);
  }
};
