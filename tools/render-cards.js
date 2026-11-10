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
    const SYN_RU = { run2: 'Серёге', multiTransport: 'Максу', thief: 'Данилу',
      levelHead2: 'Славе', multiFeet: 'Кузяну', multiBig: 'Валере', escapeOnce: 'Тимуру',
      ukhta: 'жителям Ухты', moscow: 'жителям Москвы', spb: 'жителям СПб' };
    if (c.synergy) b.push(`🌟 ${SYN_RU[c.synergy.power] || c.synergy.power}: +${c.synergy.bonus}`);
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Philosopher:wght@400;700&family=Neucha&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<style>
  body { overflow: auto; height: auto; padding: 24px; }
  #ambient span { position: absolute; bottom: auto; top: -12px; }
  @keyframes emberRise { 0% { transform: translate(0,0); opacity: 0; } 8% { opacity: .5; } 100% { transform: translate(var(--ember-sway,30px), 120vh); opacity: 0; } }
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
<div id="ambient"></div>
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
<script>
(function makeEmbers() {
  const wrap = document.getElementById('ambient');
  const colors = ['#ffc857', '#8f6cff', '#ff5d5d', '#7dde8b', '#63c7ff'];
  for (let i = 0; i < 26; i++) {
    const sp = document.createElement('span');
    sp.style.left = (Math.random() * 100).toFixed(1) + '%';
    sp.style.setProperty('--ember-d', (9 + Math.random() * 14).toFixed(1) + 's');
    sp.style.setProperty('--ember-delay', (Math.random() * 16).toFixed(1) + 's');
    sp.style.setProperty('--ember-sway', (Math.round((Math.random() - 0.5) * 160)) + 'px');
    sp.style.setProperty('--ember-c', colors[i % colors.length]);
    const sz = 2 + Math.random() * 4;
    sp.style.width = sp.style.height = sz.toFixed(1) + 'px';
    wrap.appendChild(sp);
  }
})();
let tiltCard = null;
function tiltReset(card) {
  card.style.transition = 'transform .5s cubic-bezier(.2,.8,.3,1), box-shadow .5s';
  card.style.transform = ''; card.style.boxShadow = '';
  card.style.setProperty('--shine', '0');
}
document.addEventListener('mousemove', (e) => {
  const card = e.target && e.target.closest ? e.target.closest('.card') : null;
  if (tiltCard && (!card || card !== tiltCard)) { tiltReset(tiltCard); tiltCard = null; }
  if (!card) return;
  const r = card.getBoundingClientRect();
  if (e.clientX < r.left - 4 || e.clientX > r.right + 4 || e.clientY < r.top - 4 || e.clientY > r.bottom + 4) return;
  const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
  card.style.transition = 'box-shadow .2s';
  card.style.transform = 'perspective(750px) rotateX(' + (-py * 12).toFixed(2) + 'deg) rotateY(' + (px * 12).toFixed(2) + 'deg) translateY(-3px) scale(1.03)';
  card.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
  card.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
  card.style.setProperty('--shine', '1');
  card.style.boxShadow = '0 14px 32px rgba(0,0,0,.5), 0 0 14px rgba(143,108,255,.18)';
  tiltCard = card;
});
document.addEventListener('mouseout', (e) => {
  const card = e.target && e.target.closest ? e.target.closest('.card') : null;
  if (card && (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.card'))) {
    tiltReset(card);
    if (tiltCard === card) tiltCard = null;
  }
});
</script>
</body></html>`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'cards.html'), html);
console.log(`Галерея: public/cards.html — Дверей ${CARD_INFO.doorCount}, Сокровищ ${CARD_INFO.treasureCount}`);
