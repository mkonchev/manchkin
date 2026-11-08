// ============================================================================
//  СЕРВЕР: статика + WebSocket. Запуск:  npm start  →  http://localhost:3000
// ============================================================================

'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { createRoom, getRoom, deleteRoomIfEmpty } = require('./game/rooms');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: require('./game/rooms').rooms.size }));
    return;
  }
  if (urlPath === '/') urlPath = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Не найдено'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

function send(ws, obj) {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function broadcast(room) {
  for (const [playerId, ws] of room.sockets) {
    if (room.game.find(playerId)) send(ws, { t: 'state', state: room.game.viewFor(playerId) });
  }
}

function roomOfSocket(ws) {
  return ws.roomCode ? getRoom(ws.roomCode) : null;
}

function leaveRoom(ws) {
  const room = roomOfSocket(ws);
  if (!room) return;
  room.sockets.delete(ws.playerId);
  const p = room.game.find(ws.playerId);
  if (p) {
    if (room.game.phase === 'lobby') room.game.removePlayer(ws.playerId);
    else { p.connected = false; room.game.say(`${p.name} отключается.`); }
  }
  if (room.sockets.size === 0) deleteRoomIfEmpty(room);
  else broadcast(room);
  ws.roomCode = null;
  ws.playerId = null;
}

wss.on('connection', (ws) => {
  ws.roomCode = null;
  ws.playerId = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    try {
      // --- подключение к комнате ---
      if (msg.t === 'create') {
        if (ws.roomCode) leaveRoom(ws);
        const room = createRoom();
        const name = String(msg.name || '').trim().slice(0, 20) || 'Игрок';
        const pid = 'p' + Math.random().toString(36).slice(2, 10);
        room.game.addPlayer(pid, name);
        ws.roomCode = room.code; ws.playerId = pid;
        room.sockets.set(pid, ws);
        send(ws, { t: 'joined', playerId: pid, code: room.code });
        broadcast(room);
        return;
      }
      if (msg.t === 'join') {
        if (ws.roomCode) leaveRoom(ws);
        const room = getRoom(msg.code);
        if (!room) return send(ws, { t: 'error', error: 'Комната не найдена' });
        const name = String(msg.name || '').trim().slice(0, 20) || 'Игрок';
        // реконнект под своим именем
        const existing = room.game.players.find(
          (p) => p.name.toLowerCase() === name.toLowerCase() && !p.connected);
        let pid;
        if (existing) {
          pid = existing.id; existing.connected = true;
          room.game.say(`${name} снова с нами!`);
        } else {
          if (room.game.phase !== 'lobby')
            return send(ws, { t: 'error', error: 'Игра уже началась' });
          if (room.game.players.some((p) => p.name.toLowerCase() === name.toLowerCase()))
            return send(ws, { t: 'error', error: 'Имя уже занято, выбери другое' });
          if (room.game.players.length >= 8)
            return send(ws, { t: 'error', error: 'В комнате уже 8 игроков' });
          pid = 'p' + Math.random().toString(36).slice(2, 10);
          room.game.addPlayer(pid, name);
        }
        ws.roomCode = room.code; ws.playerId = pid;
        room.sockets.set(pid, ws);
        send(ws, { t: 'joined', playerId: pid, code: room.code });
        broadcast(room);
        return;
      }

      // --- игровой действия ---
      const room = roomOfSocket(ws);
      if (!room || !ws.playerId) return send(ws, { t: 'error', error: 'Ты не в комнате' });
      if (msg.t === 'action' || msg.t === 'chat') {
        const payload = msg.t === 'chat' ? { t: 'chat', text: msg.text } : msg.action;
        room.game.action(ws.playerId, payload);
      } else if (msg.t === 'leave') {
        leaveRoom(ws);
        send(ws, { t: 'left' });
        return;
      }
      broadcast(room);
    } catch (e) {
      send(ws, { t: 'error', error: e.message });
    }
  });

  ws.on('close', () => leaveRoom(ws));
});

server.listen(PORT, () => {
  console.log(`⚔  Манчкин онлайн: http://localhost:${PORT}`);
});
