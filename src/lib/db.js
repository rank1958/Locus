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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── localStorage fallback ─────────────────────────────────
const KEYS = {
  USERS: 'gh_users', GAMES: 'gh_games', SESSIONS: 'gh_sessions',
  POSTS: 'gh_posts', NEWS: 'gh_news', CHARACTERS: 'gh_characters',
  VOID_GAMES: 'gh_void_games', VOID_NEWS: 'gh_void_news',
  FAVORITES: 'gh_favorites', RATINGS: 'gh_ratings', ROLES: 'gh_roles',
  GROUPS: 'gh_groups', GROUP_REQUESTS: 'gh_group_requests'
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
  
  const roles = lsRead(KEYS.ROLES);
  const defaultRole = roles.find(r => r.isDefault) || roles.find(r => r.id === 'user') || { id: 'user' };

  // Remove direct allowedPages mapping, rely strictly on assigned Role ID.
  const refinedData = { ...data };
  delete refinedData.allowedPages;

  const user = { 
    id: uid(), 
    ...refinedData, 
    role: data.role || defaultRole.id, 
    createdAt: Date.now(), 
    online: false 
  };
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
  try {
    // KÖPRÜ (BRIDGE): PUSH Deployment Center'daki Aktif yamaları otomatik çeker
    const pushRes = await fetch('http://localhost:4000/api/push_news');
    if (pushRes.ok) {
      const pushNews = await pushRes.json();
      list.push(...pushNews);
    }
  } catch (e) {
    console.warn("PUSH Motoruna ulaşılamadı (Aktif değil veya kapalı).");
  }
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

// ── FAVORITES ─────────────────────────────────────────────
export const getFavorites = async (userId) => {
  const all = API() ? await apiFetch('favorites') : lsRead(KEYS.FAVORITES);
  return userId ? all.filter(f => f.userId === userId) : all;
};
export const toggleFavorite = async (userId, gameId) => {
  if (API()) return apiFetch('favorites/toggleFavorite', { method: 'POST', body: { userId, gameId } });
  const favs = lsRead(KEYS.FAVORITES);
  const exists = favs.find(f => f.userId === userId && f.gameId === gameId);
  if (exists) lsWrite(KEYS.FAVORITES, favs.filter(f => !(f.userId === userId && f.gameId === gameId)));
  else lsWrite(KEYS.FAVORITES, [...favs, { id: uid(), userId, gameId, createdAt: Date.now() }]);
  return { favorited: !exists };
};

// ── RATINGS ───────────────────────────────────────────────
export const getRatings = async () => API() ? apiFetch('ratings') : lsRead(KEYS.RATINGS);
export const rateGame = async (userId, gameId, rating) => {
  if (API()) return apiFetch('ratings/rateGame', { method: 'POST', body: { userId, gameId, rating } });
  const ratings = lsRead(KEYS.RATINGS).filter(r => !(r.userId === userId && r.gameId === gameId));
  lsWrite(KEYS.RATINGS, [...ratings, { id: uid(), userId, gameId, rating, createdAt: Date.now() }]);
};
export const getGameRating = async (gameId) => {
  const ratings = await getRatings();
  const gameRatings = ratings.filter(r => r.gameId === gameId);
  if (!gameRatings.length) return { avg: 0, count: 0 };
  return { avg: gameRatings.reduce((s, r) => s + r.rating, 0) / gameRatings.length, count: gameRatings.length };
};

// ── ROLES ──────────────────────────────────────────────────
export const getRoles = async () => {
  try {
    return API() ? await apiFetch('roles') : lsRead(KEYS.ROLES);
  } catch (err) {
    console.error("Roller çekilemedi:", err);
    return [];
  }
};
export const addRole = async (data) => {
  if (API()) return apiFetch('roles', { method: 'POST', body: data });
  const role = { id: uid(), ...data, isSystem: false, createdAt: Date.now() };
  lsWrite(KEYS.ROLES, [...lsRead(KEYS.ROLES), role]);
  return role;
};
export const updateRole = async (id, patch) => {
  if (API()) return apiFetch(`roles/${id}`, { method: 'PUT', body: patch });
  let roles = lsRead(KEYS.ROLES);
  if (patch.isDefault) {
    // only one default role is allowed
    roles = roles.map(r => ({ ...r, isDefault: false }));
  }
  lsWrite(KEYS.ROLES, roles.map(r => r.id === id ? { ...r, ...patch } : r));
};
export const deleteRole = async (id) => {
  if (API()) return apiFetch(`roles/${id}`, { method: 'DELETE' });
  const roles = lsRead(KEYS.ROLES);
  const role = roles.find(r => r.id === id);
  if (role && role.isSystem) throw new Error("Sistem rolleri silinemez.");
  lsWrite(KEYS.ROLES, roles.filter(r => r.id !== id));
};

// ── SEED ───────────────────────────────────────────────────
// In network mode, the API server seeds itself. Only needed for offline localStorage mode.
export const seedIfEmpty = () => {
  if (API()) return; // API server handles seeding
  if (lsRead(KEYS.ROLES).length === 0) {
    lsWrite(KEYS.ROLES, [
      { id: 'admin', name: 'Admin', color: '#f59e0b', allowedPages: ['all'], isDefault: false, isSystem: true, createdAt: Date.now() },
      { id: 'user', name: 'Standart', color: '#8b5cf6', allowedPages: ['games', 'community', 'news', 'void-lore', 'void-games', 'void-news', 'void-characters'], isDefault: true, isSystem: true, createdAt: Date.now() }
    ]);
  }
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

// ── GROUPS & GUILDS ─────────────────────────────────────────
export const getGroups = async () => API() ? apiFetch('groups') : lsRead(KEYS.GROUPS);

export const createGroup = async (name, desc, ownerId) => {
  if (API()) return apiFetch('groups', { method: 'POST', body: { name, desc, ownerId } });
  const groups = lsRead(KEYS.GROUPS);
  const inviteId = 'G-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const group = { 
    id: uid(), 
    inviteId, 
    name, 
    desc, 
    ownerId, 
    members: [ownerId],
    createdAt: Date.now() 
  };
  lsWrite(KEYS.GROUPS, [...groups, group]);
  return group;
};

export const getGroupRequests = async () => API() ? apiFetch('groupRequests') : lsRead(KEYS.GROUP_REQUESTS);

export const requestJoinGroup = async (inviteId, userId) => {
  if (API()) return apiFetch('groupRequests/join', { method: 'POST', body: { inviteId, userId } });
  
  const groups = lsRead(KEYS.GROUPS);
  const targetGroup = groups.find(g => g.inviteId === inviteId);
  if (!targetGroup) throw new Error("Geçersiz Grup Kimliği (ID).");
  if (targetGroup.members.includes(userId)) throw new Error("Zaten bu grubun üyesisiniz.");
  
  const requests = lsRead(KEYS.GROUP_REQUESTS);
  if (requests.find(r => r.groupId === targetGroup.id && r.userId === userId && r.status === 'pending')) {
    throw new Error("Liderden hala bir yanıt bekliyorsunuz.");
  }
  
  const request = { id: uid(), groupId: targetGroup.id, userId, status: 'pending', createdAt: Date.now() };
  lsWrite(KEYS.GROUP_REQUESTS, [...requests, request]);
  return request;
};

export const acceptJoinRequest = async (requestId) => {
  if (API()) return apiFetch(`groupRequests/${requestId}/accept`, { method: 'POST' });
  
  let requests = lsRead(KEYS.GROUP_REQUESTS);
  const reqItem = requests.find(r => r.id === requestId);
  if (!reqItem) throw new Error("İstek bulunamadı.");
  
  reqItem.status = 'accepted';
  lsWrite(KEYS.GROUP_REQUESTS, requests.map(r => r.id === requestId ? reqItem : r));
  
  let groups = lsRead(KEYS.GROUPS);
  const grp = groups.find(g => g.id === reqItem.groupId);
  if (grp && !grp.members.includes(reqItem.userId)) {
    grp.members.push(reqItem.userId);
    lsWrite(KEYS.GROUPS, groups.map(g => g.id === grp.id ? grp : g));
  }
};

export const rejectJoinRequest = async (requestId) => {
  if (API()) return apiFetch(`groupRequests/${requestId}/reject`, { method: 'POST' });
  
  let requests = lsRead(KEYS.GROUP_REQUESTS);
  const reqItem = requests.find(r => r.id === requestId);
  if (reqItem) {
    reqItem.status = 'rejected';
    lsWrite(KEYS.GROUP_REQUESTS, requests.map(r => r.id === requestId ? reqItem : r));
  }
};
