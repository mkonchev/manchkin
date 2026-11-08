// Выгрузка карт в JSON (для Excel):  node tools/dump-cards.js  →  tools/cards-data.json
'use strict';
const fs = require('fs');
const path = require('path');
const { DOOR_DECK, TREASURE_DECK } = require('../game/cards');

// смысловые поля карты без id — по ним склеиваем одинаковые карты в "Копий"
function fields(c) {
  const o = { type: c.type, name: c.name, text: c.text || '' };
  if (c.type === 'monster') {
    o.level = c.level; o.levels = c.levels; o.treasures = c.treasures;
    o.bad = c.bad; o.tag = c.tag || null; o.classMod = c.classMod || null;
  }
  if (c.type === 'curse') { o.effect = c.effect; o.arg = c.arg ?? null; }
  if (c.type === 'klass') { o.power = c.power; }
  if (c.type === 'race') { o.power = c.power; }
  if (c.type === 'enhancer') { o.bonus = c.bonus; }
  if (c.type === 'item') {
    o.bonus = c.bonus; o.slot = c.slot; o.hands = c.hands || 1;
    o.big = !!c.big; o.price = c.price || 0; o.runBonus = c.runBonus || 0;
  }
  if (c.type === 'oneShot') { o.bonus = c.bonus; }
  if (c.type === 'levelUp') { o.arg = c.arg; }
  return o;
}

const out = [];
for (const [deck, cards] of [['door', DOOR_DECK], ['treasure', TREASURE_DECK]]) {
  const seen = new Map();
  for (const c of cards) {
    const f = fields(c);
    const k = JSON.stringify(f);
    if (!seen.has(k)) seen.set(k, { deck, count: 0, ...f });
    seen.get(k).count++;
  }
  out.push(...seen.values());
}

fs.writeFileSync(path.join(__dirname, 'cards-data.json'), JSON.stringify(out, null, 2));
console.log(`Уникальных карт: ${out.length}, всего в колодах: ${DOOR_DECK.length + TREASURE_DECK.length}`);
