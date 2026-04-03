'use strict';
/**
 * GameHub Production Server
 * Serves static React build + REST API on a single port
 * Ready for Railway / Render deployment
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3001;
const DIST_DIR = path.join(__dirname, 'dist');
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Ensure data directory
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// MIME types
const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.zip':  'application/zip',
  '.wasm': 'application/wasm',
};

function loadDB() {
  try { 
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    if (!db.roles) db.roles = []; // Migrate older JSONs
    return db;
  }
  catch { return { users: [], games: [], voidGames: [], sessions: [], posts: [], news: [], voidNews: [], characters: [], favorites: [], ratings: [], roles: [] }; }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function seedDB(db) {
  if (!db.roles) db.roles = [];
  if (db.roles.length === 0) {
    db.roles.push(
      { id: 'admin', name: 'Admin', color: '#f59e0b', allowedPages: ['all'], isDefault: false, isSystem: true, createdAt: Date.now() },
      { id: 'user', name: 'Standart', color: '#8b5cf6', allowedPages: ['games', 'community', 'news', 'void-lore', 'void-games', 'void-news', 'void-characters'], isDefault: true, isSystem: true, createdAt: Date.now() }
    );
  }
  if (!db.users.find(u => u.username === 'admin')) {
    db.users.push({ id: 'admin-001', username: 'admin', password: '123', email: 'admin@gamehub.com', role: 'admin', gender: 'Erkek', age: 30, createdAt: Date.now(), online: false });
  }
  if (db.games.length === 0) {
    db.games.push({ id: uid(), name: 'Space Runner', category: 'Aksiyon', color: '#8b5cf6', url: 'https://scratch.mit.edu/projects/embed/1/', plays: 0, uniquePlayers: [], totalTime: 0, createdAt: Date.now() });
  }
  if (db.news.length === 0) {
    db.news.push({ id: uid(), title: 'GameHub Yayında! 🎉', content: 'Modern oyun platformumuz artık herkesin erişimine açık!', author: 'admin', createdAt: Date.now() });
  }
  if (db.voidGames.length === 0) {
    db.voidGames.push({ id: uid(), name: 'Uyanış', category: 'RPG', color: '#7c3aed', url: '', plays: 0, uniquePlayers: [], totalTime: 0, createdAt: Date.now() });
  }
  if (db.voidNews.length === 0) {
    db.voidNews.push({ id: uid(), title: 'Karanlık Enerji Yayılıyor', content: 'Void Grid evreninde yeni bir boyut yarığı tespit edildi...', author: 'admin', createdAt: Date.now() });
  }
  saveDB(db);
}

const db = loadDB();
seedDB(db);

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, data) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const stat = fs.statSync(filePath);
      res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size });
      fs.createReadStream(filePath).pipe(res);
    } else {
      throw new Error('Not found or is a directory');
    }
  } catch {
    // SPA fallback — serve index.html
    try {
      const indexPath = path.join(DIST_DIR, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(indexPath).pipe(res);
      } else {
        res.writeHead(404); res.end('Not found');
      }
    } catch {
      res.writeHead(404); res.end('Not found');
    }
  }
}

const COL_MAP = { games: 'games', voidGames: 'voidGames', users: 'users', sessions: 'sessions', posts: 'posts', news: 'news', voidNews: 'voidNews', characters: 'characters', favorites: 'favorites', ratings: 'ratings', roles: 'roles' };
const server = http.createServer(async (req, res) => {
  if (req.url === '/GameHub-Setup.exe') {
    res.writeHead(302, { 'Location': 'https://github.com/rank1958/Locus/releases/download/v1.0.0/GameHub-Setup.exe' });
    return res.end();
  }
  const parsed = url.parse(req.url);
  const pathname = parsed.pathname;

  // CORS
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }

  // API routes
  if (pathname.startsWith('/api/')) {
    const parts = pathname.replace(/^\/api\//, '').split('/');
    const collection = parts[0];
    const id = parts[1];
    const col = COL_MAP[collection];

    if (!col) { json(res, 404, { error: 'Not found' }); return; }

    const db = loadDB();
    try {
      if (req.method === 'GET') {
        if (id) {
          const item = db[col].find(x => x.id === id);
          item ? json(res, 200, item) : json(res, 404, { error: 'Not found' });
        } else {
          json(res, 200, db[col]);
        }
      } else if (req.method === 'POST') {
        const body = await parseBody(req);
        if (id === 'toggleFavorite') {
          const { userId, gameId } = body;
          const exists = db.favorites.find(f => f.userId === userId && f.gameId === gameId);
          if (exists) db.favorites = db.favorites.filter(f => !(f.userId === userId && f.gameId === gameId));
          else db.favorites.push({ id: uid(), userId, gameId, createdAt: Date.now() });
          saveDB(db); json(res, 200, { ok: true, favorited: !exists }); return;
        }
        if (id === 'rateGame') {
          const { userId, gameId, rating } = body;
          db.ratings = db.ratings.filter(r => !(r.userId === userId && r.gameId === gameId));
          db.ratings.push({ id: uid(), userId, gameId, rating, createdAt: Date.now() });
          saveDB(db); json(res, 200, { ok: true }); return;
        }
        if (id === 'recordPlay') {
          const { gameId, userId, durationSeconds, isVoid } = body;
          const target = isVoid ? 'voidGames' : 'games';
          db[target] = db[target].map(g => {
            if (g.id !== gameId) return g;
            const unique = g.uniquePlayers || [];
            return { ...g, plays: (g.plays || 0) + 1, uniquePlayers: unique.includes(userId) ? unique : [...unique, userId], totalTime: (g.totalTime || 0) + durationSeconds };
          });
          const game = db[target].find(g => g.id === gameId);
          const mins = Math.floor(durationSeconds / 60), secs = durationSeconds % 60;
          db.sessions.push({ id: uid(), userId, gameId, gameName: game?.name || '?', duration: durationSeconds, durationStr: `${mins}d ${secs}s`, date: new Date().toLocaleDateString('tr-TR'), time: new Date().toLocaleTimeString('tr-TR'), createdAt: Date.now(), isVoid: !!isVoid });
          saveDB(db); json(res, 200, { ok: true }); return;
        }
        if (id === 'toggleLike') {
          const { postId, userId } = body;
          db.posts = db.posts.map(p => { if (p.id !== postId) return p; const likes = p.likes || []; return { ...p, likes: likes.includes(userId) ? likes.filter(l => l !== userId) : [...likes, userId] }; });
          saveDB(db); json(res, 200, { ok: true }); return;
        }
        if (id === 'addComment') {
          const { postId, comment } = body;
          db.posts = db.posts.map(p => p.id !== postId ? p : { ...p, comments: [...(p.comments || []), { id: uid(), ...comment, createdAt: Date.now() }] });
          saveDB(db); json(res, 200, { ok: true }); return;
        }
        const item = { id: uid(), createdAt: Date.now(), ...body };
        if (col === 'users') {
          if (db.users.find(u => u.username === body.username)) { json(res, 409, { error: 'Kullanıcı adı alınmış' }); return; }
          item.role = item.role || 'user';
        }
        if (col === 'games' || col === 'voidGames') { item.plays = item.plays || 0; item.uniquePlayers = []; item.totalTime = 0; }
        if (col === 'posts') { item.likes = []; item.comments = []; }
        db[col].push(item);
        saveDB(db); json(res, 201, item);
      } else if (req.method === 'PUT') {
        const body = await parseBody(req);
        if (col === 'roles' && body.isDefault) {
          db.roles = db.roles.map(r => ({ ...r, isDefault: false }));
        }
        db[col] = db[col].map(x => x.id === id ? { ...x, ...body } : x);
        saveDB(db);
        json(res, 200, db[col].find(x => x.id === id) || {});
      } else if (req.method === 'DELETE') {
        db[col] = db[col].filter(x => x.id !== id);
        saveDB(db); json(res, 200, { ok: true });
      } else {
        json(res, 405, { error: 'Method not allowed' });
      }
    } catch (err) {
      console.error('[API Error]', err.message);
      json(res, 500, { error: err.message });
    }
    return;
  }

  // Static files
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
  serveStatic(res, filePath);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ GameHub Server running on port ${PORT}`);
  console.log(`   Web: http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/`);
});
