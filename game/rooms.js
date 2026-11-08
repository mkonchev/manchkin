// ============================================================================
//  КОМНАТЫ: код комнаты → игра + сокеты
// ============================================================================

'use strict';
const { Game } = require('./engine');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rooms = new Map();

function newCode() {
  for (;;) {
    let code = '';
    for (let i = 0; i < 4; i++)
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    if (!rooms.has(code)) return code;
  }
}

function createRoom() {
  const code = newCode();
  const room = { code, game: new Game(code), sockets: new Map() }; // playerId → ws
  rooms.set(code, room);
  return room;
}
function getRoom(code) {
  return rooms.get(String(code || '').toUpperCase()) || null;
}
function deleteRoomIfEmpty(room) {
  if (room.sockets.size === 0 && room.game.players.length === 0) rooms.delete(room.code);
}

// Очистка брошенных лобби (никто не подключён и игра не начата)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (room.sockets.size === 0 && room.game.phase === 'lobby') {
      room.lastEmpty = room.lastEmpty || now;
      if (now - room.lastEmpty > 10 * 60 * 1000) rooms.delete(code);
    } else room.lastEmpty = null;
  }
}, 60 * 1000).unref();

module.exports = { rooms, createRoom, getRoom, deleteRoomIfEmpty };
