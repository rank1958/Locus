'use strict';
/**
 * GameHub API Server — port 3001
 * Stores all shared data in data/db.json
 * Provides REST API for real-time sync across all connected clients
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Ensure data dir exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// Load DB
function loadDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {
      users: [],
      games: [],
      voidGames: [],
      sessions: [],
      posts: [],
      news: [],
      voidNews: [],
      characters: [],
    };
  }
}

// Save DB
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

// Seed default data
function seedDB(db) {
  if (!db.users.find(u => u.username === 'admin')) {
    db.users.push({
      id: 'admin-001', username: 'admin', password: '123',
      email: 'admin@gamehub.com', role: 'admin',
      gender: 'Erkek', age: 30, createdAt: Date.now(), online: false,
    });
  }
  if (db.games.length === 0) {
    db.games.push(
      { id: uid(), name: 'Space Runner', category: 'Aksiyon', color: '#8b5cf6', url: 'https://scratch.mit.edu/projects/embed/1/', plays: 145, uniquePlayers: [], totalTime: 0, createdAt: Date.now() },
      { id: uid(), name: 'Math Blaster', category: 'Bulmaca', color: '#06b6d4', url: '', plays: 98, uniquePlayers: [], totalTime: 0, createdAt: Date.now() },
    );
  }
  if (db.news.length === 0) {
    db.news.push({ id: uid(), title: 'GameHub v1.0 Yayında!', content: 'Modern oyun platformumuz artık resmi olarak açık.', author: 'admin', createdAt: Date.now() - 86400000 });
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

// Parse body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

// Send JSON
function send(res, status, data) {
  const json = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(json);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.replace(/^\/api\//, '').split('/');
  const collection = parts[0]; // e.g. 'games'
  const id = parts[1];         // e.g. 'game-id'
  const db = loadDB();

  // CORS preflight
  if (req.method === 'OPTIONS') { send(res, 200, {}); return; }

  const colMap = {
    games: 'games', voidGames: 'voidGames', users: 'users',
    sessions: 'sessions', posts: 'posts', news: 'news',
    voidNews: 'voidNews', characters: 'characters',
  };

  const col = colMap[collection];
  if (!col) { send(res, 404, { error: 'Not found' }); return; }

  try {
    if (req.method === 'GET') {
      // Special: get by id
      if (id) {
        const item = db[col].find(x => x.id === id);
        if (!item) { send(res, 404, { error: 'Not found' }); return; }
        send(res, 200, item);
      } else {
        send(res, 200, db[col]);
      }

    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      // Special actions
      if (id === 'recordPlay') {
        // body: { gameId, userId, durationSeconds, isVoid }
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
        saveDB(db);
        send(res, 200, { ok: true }); return;
      }
      if (id === 'toggleLike') {
        const { postId, userId } = body;
        db.posts = db.posts.map(p => {
          if (p.id !== postId) return p;
          const likes = p.likes || [];
          return { ...p, likes: likes.includes(userId) ? likes.filter(l => l !== userId) : [...likes, userId] };
        });
        saveDB(db); send(res, 200, { ok: true }); return;
      }
      if (id === 'addComment') {
        const { postId, comment } = body;
        db.posts = db.posts.map(p => p.id !== postId ? p : { ...p, comments: [...(p.comments || []), { id: uid(), ...comment, createdAt: Date.now() }] });
        saveDB(db); send(res, 200, { ok: true }); return;
      }
      // Default: add item
      const item = { id: uid(), createdAt: Date.now(), ...body };
      if (col === 'users') {
        if (db.users.find(u => u.username === body.username)) { send(res, 409, { error: 'Kullanıcı adı alınmış' }); return; }
        item.role = item.role || 'user';
      }
      if (col === 'games' || col === 'voidGames') { item.plays = item.plays || 0; item.uniquePlayers = []; item.totalTime = 0; }
      if (col === 'posts') { item.likes = []; item.comments = []; }
      db[col].push(item);
      saveDB(db);
      send(res, 201, item);

    } else if (req.method === 'PUT') {
      const body = await parseBody(req);
      db[col] = db[col].map(x => x.id === id ? { ...x, ...body } : x);
      saveDB(db);
      send(res, 200, db[col].find(x => x.id === id));

    } else if (req.method === 'DELETE') {
      db[col] = db[col].filter(x => x.id !== id);
      saveDB(db);
      send(res, 200, { ok: true });

    } else {
      send(res, 405, { error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('[API Error]', err.message);
    send(res, 500, { error: err.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[GameHub API] Sunucu çalışıyor → http://0.0.0.0:${PORT}`);
});
