// Сборка game/cards.js из tools/cards-data.json:  node tools/build-cards.js
// Файл game/cards.js перезаписывается — источник правды теперь Excel/JSON.
'use strict';
const fs = require('fs');
const path = require('path');
const data = require('./cards-data.json');

let src = `// ============================================================================
//  КАРТЫ ИГРЫ — СГЕНЕРИРОВАНО из tools/cards-data.json (node tools/build-cards.js)
//  Источник правды — Excel «карты.xlsx»: правь его и скинь обратно,
//  либо правь cards-data.json и пересобери этой командой.
// ============================================================================

let seq = 0;
const c = (x) => ({ id: 'c' + (++seq), ...x });
const DOOR_DECK = [];
const TREASURE_DECK = [];
const rep = (deck, n, make) => { for (let i = 0; i < n; i++) deck.push(c(make())); };
`;

const js = (v) => JSON.stringify(v);
for (const r of data) {
  const deck = r.deck === 'door' ? 'DOOR_DECK' : 'TREASURE_DECK';
  const card = { type: r.type, name: r.name, text: r.text || '', img: r.img || null };
  if (r.type === 'monster') Object.assign(card, {
    level: r.level, levels: r.levels, treasures: r.treasures, bad: r.bad, tag: r.tag || null,
    classMod: r.classMod || null,
  });
  if (r.type === 'curse') Object.assign(card, { effect: r.effect, arg: r.arg ?? null });
  if (r.type === 'klass') Object.assign(card, { power: r.power });
  if (r.type === 'race') Object.assign(card, { power: r.power });
  if (r.type === 'enhancer') Object.assign(card, { bonus: r.bonus });
  if (r.type === 'item') Object.assign(card, {
    bonus: r.bonus, slot: r.slot, hands: r.hands || 1, big: !!r.big,
    price: r.price || 0, runBonus: r.runBonus || 0, synergy: r.synergy || null,
  });
  if (r.type === 'oneShot') Object.assign(card, { bonus: r.bonus });
  if (r.type === 'levelUp') Object.assign(card, { arg: r.arg });
  src += `rep(${deck}, ${r.count}, () => (${js(card)}));\n`;
}

src += `
const CARD_INFO = {
  doorCount: DOOR_DECK.length,
  treasureCount: TREASURE_DECK.length,
  monsters: DOOR_DECK.filter((c) => c.type === 'monster').length,
  curses: DOOR_DECK.filter((c) => c.type === 'curse').length,
};

module.exports = { DOOR_DECK, TREASURE_DECK, CARD_INFO };
`;
fs.writeFileSync(path.join(__dirname, '..', 'game', 'cards.js'), src);
const doors = data.filter((r) => r.deck === 'door').reduce((a, r) => a + r.count, 0);
const trs = data.filter((r) => r.deck === 'treasure').reduce((a, r) => a + r.count, 0);
console.log(`game/cards.js собран: Дверей ${doors}, Сокровищ ${trs}`);
