// Генератор галереи всех карт:  node tools/render-cards.js  →  public/cards.html
'use strict';
const fs = require('fs');
const path = require('path');
const { DOOR_DECK, TREASURE_DECK, CARD_INFO } = require('../game/cards');

const SLOT_RU = { head: 'голова', body: 'тело', hands: 'руки', feet: 'ноги', transport: 'транспорт' };
const TYPE_EMOJI = { monster: '👹', curse: '💀', klass: '🎭', item: '🧳', oneShot: '🧪', levelUp: '⭐', enhancer: '🔥' };
const SLOT_EMOJI = { head: '⛑️', body: '🛡️', hands: '⚔️', feet: '👢', transport: '🚗' };
const BAD_RU = { none: 'ничего', loseLevel: '−N уровня', loseSlot: 'потеряй предмет', loseRandomSlot: 'потеряй случайный предмет', loseClass: 'потеряй класс', skipTurn: 'пропусти ход', death: 'СМЕРТЬ' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function bits(c) {
  const b = [];
  const ABILITY_RU = { run2: '+2 к побегу', multiTransport: 'несколько транспортов', thief: 'кража шмотки',
    levelHead2: '+1 уровень и 2 шмотки на голову', multiFeet: 'несколько обуви', multiBig: 'несколько крупных',
    escapeOnce: 'побег без кубика', ukhta: 'ПМЖ Ухта', moscow: 'ПМЖ Москва', spb: 'ПМЖ СПб',
    warrior: 'Воин', wizard: 'Маг', cleric: 'Клирик' };
  if (c.type === 'monster') {
    b.push(`Сила ${c.level}`, `Награда: ${c.levels} ур. / ${c.treasures} 💎`);
    b.push(`Дурняк: ${BAD_RU[c.bad.t] || c.bad.t}` + (c.bad.t === 'loseLevel' ? ` (${c.bad.n})` : ''));
    if (c.classMod) b.push(`Против класса (${ABILITY_RU[c.classMod.power] || c.classMod.power}): ${c.classMod.bonus > 0 ? '+' : ''}${c.classMod.bonus}`);
    if (c.tag === 'undead') b.push('☠ нежить');
  }
  if (c.type === 'item') {
    b.push(`+${c.bonus} · ${SLOT_EMOJI[c.slot]} ${SLOT_RU[c.slot]}`);
    if (c.hands === 2) b.push('занимает две руки');
    if (c.big) b.push('🧱 крупное');
    if (c.runBonus) b.push(`👟 +${c.runBonus} к побегу`);
    if (c.price) b.push(`💰 ${c.price} золота`);
  }
  if (c.type === 'oneShot') b.push(`+${c.bonus} в бою, однократно`);
  if (c.type === 'levelUp') b.push(`+${c.arg} уровня (не до 10-й победы)`);
  if (c.type === 'enhancer') b.push(`+${c.bonus} к силе монстра`);
  if (c.type === 'curse') {
    const eff = {
      loseLevel: `потеряй ${c.arg} ур.`, loseSlot: `потеряй ${SLOT_RU[c.arg]}`,
      loseRandomSlot: 'потеряй случайный предмет', loseClass: 'потеряй класс',
      skipTurn: 'пропусти следующий ход', pendingMonster: `монстр +${c.arg} в след. бою`,
    }[c.effect] || c.effect;
    b.push(`Эффект: ${eff}`);
  }
  if (c.type === 'klass') {
    const p = { run2: '+2 к побегу', multiTransport: 'носит сколько угодно транспортов', thief: 'крадёт шмотку раз за игру',
      levelHead2: '+1 уровень раз за игру, носит 2 шмотки на голову', multiFeet: 'носит сколько угодно обуви',
      multiBig: 'носит сколько угодно крупных', escapeOnce: 'побег без кубика раз за игру',
      warrior: 'равенство = победа; сброс карты = −1 монстру', wizard: 'побег без кубика раз за бой',
      cleric: '+3 против нежити; +1 ур. раз за игру' }[c.power] || c.power;
    b.push(`Способность: ${p}`);
  }
  if (c.type === 'race') {
    const p = { ukhta: 'ПМЖ: Ухта', moscow: 'ПМЖ: Москва', spb: 'ПМЖ: СПб',
      elf: '+1 уровень за помощь в чужом победном бою', dwarf: 'носит сколько угодно крупных предметов',
      halfling: 'раз за игру тянет карту из руки другого игрока' }[c.power] || c.power;
    b.push(p);
  }
  return b;
}

function cardHTML(c) {
  const emoji = c.type === 'item' ? (SLOT_EMOJI[c.slot] || '🧳') : TYPE_EMOJI[c.type];
  const bonus = c.type === 'monster' ? `${c.level}` : (c.bonus ? `+${c.bonus}` : (c.arg ? `+${c.arg}⭐` : ''));
  const imgHTML = c.img ? `<div class="c-img"><img src="/img/${encodeURIComponent(c.img)}" alt="" loading="lazy"
      onerror="this.parentElement.remove()"></div>` : '';
  return `<div class="card t-${c.type}">
    ${bonus ? `<div class="c-bonus">${bonus}</div>` : ''}
    ${imgHTML || `<div class="c-ico">${emoji}</div>`}
    <div class="c-name">${esc(c.name)}</div>
    ${c.text ? `<div class="c-text">${esc(c.text)}</div>` : ''}
    <div class="c-bits">${bits(c).map(esc).join('<br>')}</div>
  </div>`;
}

function section(title, cards, note = '') {
  if (!cards.length) return '';
  return `<h2>${title} <span class="cnt">${cards.length}</span>${note ? `<span class="note">${note}</span>` : ''}</h2>
  <div class="grid">${cards.map(cardHTML).join('')}</div>`;
}

const doors = DOOR_DECK, tr = TREASURE_DECK;
const html = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Карты компании — галерея</title>
<link rel="stylesheet" href="/style.css">
<style>
  body { overflow: auto; height: auto; padding: 24px; }
  h1 { margin: 0 0 6px; }
  .sub { color: var(--muted); margin-bottom: 24px; }
  h2 { margin: 28px 0 12px; color: var(--gold); }
  .cnt { font-size: 14px; color: var(--muted); margin-left: 6px; }
  .note { font-size: 13px; color: var(--muted); margin-left: 12px; font-weight: 400; }
  .grid { display: flex; flex-wrap: wrap; gap: 10px; }
  .card { width: 190px; min-height: 170px; cursor: default; }
  .card .c-img { height: 90px; }
  .card:hover { transform: none; }
  .c-bits { font-size: 10px; color: #9a93b8; border-top: 1px dashed var(--line); padding-top: 4px; margin-top: auto; }
  .card { display: flex; flex-direction: column; gap: 3px; }
</style></head><body>
<h1>⚔ Карты компании</h1>
<div class="sub">Дверей: ${CARD_INFO.doorCount} · Сокровищ: ${CARD_INFO.treasureCount} · Монстров: ${CARD_INFO.monsters} · Проклятий: ${CARD_INFO.curses} — обновляется командой node tools/render-cards.js</div>
${section('👹 Монстры', doors.filter((c) => c.type === 'monster'))}
${section('💀 Проклятия', doors.filter((c) => c.type === 'curse'))}
${section('🎭 Классы', doors.filter((c) => c.type === 'klass'), '(в колоде по 2 экземпляра)')}
${section('🏠 ПМЖ', doors.filter((c) => c.type === 'race'), '(в колоде по 2 экземпляра)')}
${section('🔥 Усилители монстров', doors.filter((c) => c.type === 'enhancer'))}
${section('🧳 Странный хлам в дверях', doors.filter((c) => c.type === 'item' || c.type === 'oneShot'))}
${section('🧳 Шмот', tr.filter((c) => c.type === 'item'))}
${section('🧪 Разовые карты', tr.filter((c) => c.type === 'oneShot'))}
${section('⭐ Карты уровней', tr.filter((c) => c.type === 'levelUp'))}
</body></html>`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'cards.html'), html);
console.log(`Галерея: public/cards.html — Дверей ${CARD_INFO.doorCount}, Сокровищ ${CARD_INFO.treasureCount}`);
