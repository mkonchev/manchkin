// ============================================================================
//  Свой Манчкин Онлайн — клиент
// ============================================================================

'use strict';

let ws = null;
let S = null;                 // последний state с сервера
let me = null;                // мой playerId
let myName = localStorage.getItem('mk_name') || '';
let sellMode = false;         // режим продажи шмота
let sel = new Set();          // выбранные для продажи uid
let lastAskHandled = null;    // чтобы не спамить модалкой помощи
let lastRevealTs = 0;         // какая вытянутая карта уже показана
let lastOfferTs = 0;          // какое входящее предложение уже показано
let reconnectTimer = null;
let joining = null;           // {code} для автопереподключения

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------- соединение
function connect() {
  ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  ws.onopen = () => {
    if (joining) {
      send({ t: 'join', code: joining.code, name: myName });
    }
  };
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.t === 'state') { S = msg.state; render(); }
    else if (msg.t === 'joined') {
      me = msg.playerId; joining = { code: msg.code };
      history.replaceState(null, '', `/?room=${msg.code}`);
      $('lobby').classList.add('hidden');
      $('game').classList.remove('hidden');
      $('lobbyError').textContent = '';
    }
    else if (msg.t === 'error') {
      if (!me) { $('lobbyError').textContent = msg.error; joining = null; }
      else toast(msg.error);
    }
    else if (msg.t === 'left') {
      me = null; joining = null; S = null;
      $('game').classList.add('hidden');
      $('lobby').classList.remove('hidden');
    }
  };
  ws.onclose = () => {
    if (me || joining) {
      toast('Связь потеряна, переподключаемся…');
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 1500);
    }
  };
}
function send(obj) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)); }
function act(action) { send({ t: 'action', action }); }

// -------------------------------------------------------------------- утилиты
function toast(text, ok = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (ok ? ' ok' : '');
  el.textContent = text;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
const SLOT_EMOJI = { head: '⛑️', body: '🛡️', hands: '⚔️', feet: '👢', transport: '🚗' };
const SLOT_NAME = { head: 'Голова', body: 'Тело', hands: 'Руки', feet: 'Ноги', transport: 'Транспорт' };
const TYPE_EMOJI = { monster: '👹', curse: '💀', klass: '🎭', oneShot: '🧪', levelUp: '⭐', enhancer: '🔥' };
const KLASS_EMOJI = { run2: '🏃', multiTransport: '🚗', thief: '🗝️', levelHead2: '✨',
  multiFeet: '👟', multiBig: '🧱', escapeOnce: '🌀',
  warrior: '⚔️', wizard: '🧙', cleric: '✨' };
const KLASS_NAME = { run2: 'Серёге', multiTransport: 'Максу', thief: 'Данилу',
  levelHead2: 'Славе', multiFeet: 'Кузяну', multiBig: 'Валере', escapeOnce: 'Тимуру',
  ukhta: 'жителям Ухты', moscow: 'жителям Москвы', spb: 'жителям СПб' };

function cardEmoji(c) {
  if (c.type === 'item') return SLOT_EMOJI[c.slot] || '🧳';
  return TYPE_EMOJI[c.type] || '🃏';
}
function bonusLabel(c) {
  if (c.type === 'monster') return `${c.level} 👹`;
  if (c.type === 'item') return `+${c.bonusEff ?? c.bonus}`;
  if (c.type === 'oneShot' || c.type === 'enhancer') return `+${c.bonus}`;
  if (c.type === 'levelUp') return `+${c.arg}⭐`;
  return '';
}
function cardHTML(c, extraClass = '') {
  if (!c) return '';
  const imgHTML = c.img
    ? `<div class="c-img"><img src="/img/${encodeURIComponent(c.img)}" alt="" loading="lazy"
         onerror="this.parentElement.remove()"></div>`
    : '';
  const bits = [];
  if (c.type === 'item' && c.big) bits.push('🧱 крупное');
  if (c.type === 'item' && c.hands === 2) bits.push('✋✋ две руки');
  if (c.runBonus) bits.push(`👟 +${c.runBonus} к побегу`);
  if (c.type === 'item' && c.price) bits.push(`💰 ${c.price}`);
  if (c.synergy) bits.push(`🌟 ${KLASS_NAME[c.synergy.power] || c.synergy.power}: +${c.synergy.bonus}`);
  if (c.type === 'monster' && c.levels) bits.push(`⭐ ${c.levels} · 💎 ${c.treasures}`);
  return `<div class="card t-${c.type} ${extraClass}" data-uid="${c.uid}">
    <div class="c-bonus">${bonusLabel(c)}</div>
    ${imgHTML || `<div class="c-ico">${cardEmoji(c)}</div>`}
    <div class="c-name">${esc(c.name)}</div>
    ${c.text ? `<div class="c-text">${esc(c.text)}</div>` : ''}
    ${bits.length ? `<div class="c-text">${bits.join('<br>')}</div>` : ''}
  </div>`;
}

// --------------------------------------------------------------------- лобби
$('nameInput').value = myName;
const urlRoom = new URLSearchParams(location.search).get('room');
if (urlRoom) $('codeInput').value = urlRoom.toUpperCase();
$('createBtn').onclick = () => {
  myName = $('nameInput').value.trim();
  if (!myName) return void ($('lobbyError').textContent = 'Введи имя');
  localStorage.setItem('mk_name', myName);
  joining = null;
  send({ t: 'create', name: myName });
};
$('joinBtn').onclick = () => {
  myName = $('nameInput').value.trim();
  const code = $('codeInput').value.trim().toUpperCase();
  if (!myName) return void ($('lobbyError').textContent = 'Введи имя');
  if (code.length !== 4) return void ($('lobbyError').textContent = 'Код — 4 символа');
  localStorage.setItem('mk_name', myName);
  joining = { code };
  send({ t: 'join', code, name: myName });
};
$('codeInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('joinBtn').click(); });
$('nameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') (urlRoom ? $('joinBtn') : $('createBtn')).click(); });

$('copyBtn').onclick = () => {
  const url = `${location.origin}/?room=${S?.code || joining?.code || ''}`;
  navigator.clipboard?.writeText(url).then(() => toast('Ссылка скопирована — кидай друзьям!', true));
};
$('roomCode').onclick = $('copyBtn').onclick;
$('leaveBtn').onclick = () => { if (confirm('Выйти из игры?')) { me = null; joining = null; send({ t: 'leave' }); } };

$('chatForm').onsubmit = (e) => {
  e.preventDefault();
  const text = $('chatInput').value.trim();
  if (!text) return;
  send({ t: 'chat', text });
  $('chatInput').value = '';
};

// -------------------------------------------------------------------- рендер
function render() {
  if (!S) return;
  $('roomCode').textContent = S.code;
  renderPhase();
  renderPlayers();
  renderDecks();
  renderCombat();
  renderTurnActions();
  renderMyPanel();
  renderHand();
  renderLog();
  renderWin();
  renderReveal();
  renderOffers();
  renderHelpModal();
}

// большая всплывашка с вытянутой картой
function renderReveal() {
  const r = S.reveal;
  if (!r || r.ts === lastRevealTs) return;
  if (r.secret && r.byId !== me) return;   // сокровища видит только взявший
  lastRevealTs = r.ts;
  const title = r.kind === 'door' ? `🚪 ${esc(r.byName)} открывает дверь`
    : r.kind === 'death' ? `☠ ${esc(r.byName)} начинает заново`
    : r.kind === 'helper' ? `💎 Сокровище помощнику: ${esc(r.byName)}`
    : `💎 Сокровища за победу: ${esc(r.byName)}`;
  openModal(`
    <h3>${title}</h3>
    <div class="reveal-wrap">${r.cards.map((c) => cardHTML(c, 'reveal')).join('')}</div>
    <p style="text-align:center;color:var(--muted);font-size:12px;margin-top:10px">клик — закрыть</p>`);
  $('modalBox').onclick = () => closeModal();
  setTimeout(() => {
    if (!$('modal').classList.contains('hidden') && $('modalBox').dataset.revealTs == r.ts)
      closeModal();
  }, 6000);
  $('modalBox').dataset.revealTs = r.ts;
}

function phaseText() {
  const tp = S.players.find((p) => p.id === S.turnPlayerId);
  const name = tp ? tp.name : '—';
  switch (S.phase) {
    case 'lobby': return 'Лобби — жди начала';
    case 'kick': return `🚪 ${name}: открывает дверь`;
    case 'trouble': return `🔍 ${name}: ищет приключения`;
    case 'combat': return `⚔ БОЙ: ${name} против монстра!`;
    case 'run': return `🏃 ${name} убегает!`;
    case 'charity': return `🎒 ${name} заканчивает ход`;
    case 'over': return '🏆 Игра окончена';
  }
  return '';
}
function renderPhase() { $('phaseBar').textContent = phaseText(); }

function renderPlayers() {
  const box = $('playersPanel');
  box.innerHTML = '';
  for (const p of S.players) {
    const el = document.createElement('div');
    el.className = 'player-card' +
      (p.id === me ? ' me' : '') +
      (p.id === S.turnPlayerId ? ' turn' : '') +
      (p.connected ? '' : ' offline');
    const equipList = p.equippedCards.map((c) => `${cardEmoji(c)} ${esc(c.name)} +${c.bonus}`).join('<br>');
    el.innerHTML = `
      <div class="p-name"><span>${esc(p.name)}${p.pending ? ' 🤬' : ''}</span>
        <span class="hand-ico">🖐${p.handCount}</span></div>
      <div class="p-stats">
        <span>⭐ ${p.level}</span><span>⚔ ${p.power}</span>
        ${p.klass ? `<span class="badge">${KLASS_EMOJI[p.klass.power] || '🎭'} ${esc(p.klass.name)}</span>` : ''}
        ${p.race ? `<span class="badge">🧬 ${esc(p.race.name)}</span>` : ''}
        ${p.id === me ? '<span class="badge">ты</span>' : ''}
      </div>
      ${equipList ? `<div class="p-equip">${equipList}</div>` : ''}`;
    el.onclick = () => { if (p.id !== me) openPlayerMenu(p); };
    box.appendChild(el);
  }
}

function renderDecks() {
  $('deckDoorN').textContent = S.decks.door;
  $('deckTreasureN').textContent = S.decks.treasure;
  const dd = S.decks.doorDiscardTop, dt = S.decks.treasureDiscardTop;
  $('discardInfo').innerHTML =
    `Сброс дверей${dd ? `: <b>${cardEmoji(dd)} ${esc(dd.name)}</b>` : ' пуст'}<br>` +
    `Сброс сокровищ${dt ? `: <b>${cardEmoji(dt)} ${esc(dt.name)}</b>` : ' пуст'}`;
}

function renderCombat() {
  const area = $('combatArea');
  if (!S.combat) { area.classList.add('hidden'); return; }
  area.classList.remove('hidden');
  const c = S.combat;
  $('monsterPower').textContent = c.monsterPower;
  $('sidePower').textContent = c.sidePower;
  const fighter = S.players.find((p) => p.id === c.fighterId);
  const helper = S.players.find((p) => p.id === c.helperId);
  const acts = $('combatActions');
  acts.innerHTML = '';
  const yh = you();
  if (S.phase === 'combat' && c.fighterId !== me && c.helperId !== me && yh) {
    const mine = yh.hand.filter((x) => x.type === 'monster');
    if (mine.length) {
      const wb = document.createElement('button');
      wb.className = 'btn danger';
      wb.textContent = `👹 Подкинуть монстра (${mine.length})`;
      wb.onclick = () => openMonsterPicker(mine);
      acts.appendChild(wb);
    }
  }
  $('monsterCards').innerHTML = c.monsters.map((m) => cardHTML(m)).join('') +
    (c.monsterBonus ? `<div class="side-label">усиления: ${c.monsterBonus > 0 ? '+' : ''}${c.monsterBonus}</div>` : '') +
    (c.classModNote ? `<div class="side-label" style="color:${c.classModNote.active ? 'var(--red)' : 'var(--muted)'}">против класса: ${c.classModNote.bonus > 0 ? '+' : ''}${c.classModNote.bonus}${c.classModNote.active ? ' — АКТИВЕН!' : ''}</div>` : '');
  $('sideCards').innerHTML =
    `<div class="side-label">${esc(fighter?.name || '?')}${helper ? ` + ${esc(helper.name)}` : ''}</div>` +
    (c.sideBonus ? `<div class="side-label">разовые карты: +${c.sideBonus}</div>` : '');
}

function myTurn() { return S.turnPlayerId === me; }
function you() { return S.you; }

function renderTurnActions() {
  const box = $('turnActions');
  box.innerHTML = '';
  const y = you();
  if (S.phase === 'lobby') {
    const b = document.createElement('button');
    b.className = 'btn primary big';
    b.textContent = `▶ Начать игру (${S.players.length})`;
    b.disabled = S.players.length < 2;
    b.title = S.players.length < 2 ? 'Нужно минимум 2 игрока' : '';
    b.onclick = () => act({ t: 'start' });
    box.appendChild(b);
    const hint = document.createElement('div');
    hint.className = 'my-stat';
    hint.style.width = '100%';
    hint.style.textAlign = 'center';
    hint.textContent = 'Кидай друзьям ссылку из шапки — и старт!';
    box.appendChild(hint);
    return;
  }
  if (S.phase === 'over') return;
  const c = S.combat;
  const iAmFighter = c && c.fighterId === me;
  const iAmHelper = c && c.helperId === me;

  if (!myTurn() && !iAmFighter && !iAmHelper && S.phase !== 'combat' && S.phase !== 'run') {
    const hint = document.createElement('div');
    hint.className = 'my-stat';
    const tp = S.players.find((p) => p.id === S.turnPlayerId);
    hint.textContent = `Сейчас ходит: ${tp ? tp.name : '—'}`;
    box.appendChild(hint);
  }

  if (myTurn() && S.phase === 'kick') {
    const b = document.createElement('button');
    b.className = 'btn primary big';
    b.textContent = '🚪 Открыть дверь';
    b.onclick = () => act({ t: 'kick' });
    box.appendChild(b);
  }
  if (myTurn() && S.phase === 'trouble') {
    const y = you();
    const loot = document.createElement('button');
    loot.className = 'btn primary big';
    loot.textContent = '🎲 Обыскать комнату';
    loot.title = 'Добрать одну тёмную карту Дверей в руку';
    loot.onclick = () => act({ t: 'lootRoom' });
    box.appendChild(loot);
    const mine = y.hand.filter((x) => x.type === 'monster');
    if (mine.length) {
      const trouble = document.createElement('button');
      trouble.className = 'btn danger big';
      trouble.textContent = `👹 Искать неприятности (${mine.length})`;
      trouble.title = 'Сыграть монстра из руки и подраться с ним за награду';
      trouble.onclick = () => openMonsterPicker(mine, (uid) => ({ t: 'lookForTrouble', uid }));
      box.appendChild(trouble);
    }
    const skip = document.createElement('button');
    skip.className = 'btn big';
    skip.textContent = '➡️ Достаточно';
    skip.onclick = () => act({ t: 'skipTrouble' });
    box.appendChild(skip);
  }
  if (S.phase === 'combat' && iAmFighter) {
    const b = document.createElement('button');
    b.className = 'btn danger big';
    b.textContent = '⚔ Решить бой';
    b.onclick = () => act({ t: 'resolve' });
    box.appendChild(b);
    const f = document.createElement('button');
    f.className = 'btn big';
    f.textContent = '🏃 Убегать сразу';
    f.title = 'Без боя: кубик 5+, при провале — дурные последствия';
    f.onclick = () => act({ t: 'run' });
    box.appendChild(f);
    if (!c.helperId) {
      const h = document.createElement('button');
      h.className = 'btn big';
      h.textContent = '🙋 Позвать на помощь';
      h.onclick = () => pickPlayer((t) => act({ t: 'askHelp', targetId: t.id }), 'Кого позвать?');
      box.appendChild(h);
    }
  }
  if (S.phase === 'run' && iAmFighter) {
    const b = document.createElement('button');
    b.className = 'btn primary big';
    b.textContent = '🏃 Убегать!';
    b.onclick = () => act({ t: 'run' });
    box.appendChild(b);
    const esc1 = [S.players.find((p) => p.id === c.fighterId), S.players.find((p) => p.id === c.helperId)]
      .some((p) => p?.klass?.power === 'escapeOnce' && !p.escapeUsed);
    if (esc1) {
      const w = document.createElement('button');
      w.className = 'btn big';
      w.textContent = '🌀 Побег без кубика';
      w.onclick = () => act({ t: 'wizardEscape' });
      box.appendChild(w);
    }
  }
  if (myTurn() && S.phase === 'charity') {
    const b = document.createElement('button');
    b.className = 'btn primary big';
    const excess = Math.max(0, y.hand.length - 5);
    b.textContent = excess ? `Сбрось ${excess} карт(ы) — потом закончи ход` : '✅ Закончить ход';
    b.onclick = () => act({ t: 'endTurn' });
    box.appendChild(b);
  }
}

function renderMyPanel() {
  const y = you();
  const box = $('myPanel');
  if (!y) { box.innerHTML = ''; return; }
  let slotsHTML = '';
  slotsHTML += y.equip.body
    ? cardHTML(y.equip.body)
    : `<div class="slot-empty">🛡️<br>Тело</div>`;
  for (const s of ['head', 'feet', 'transport']) {
    slotsHTML += y.equip[s].length
      ? y.equip[s].map((c) => cardHTML(c)).join('')
      : `<div class="slot-empty">${SLOT_EMOJI[s]}<br>${SLOT_NAME[s]}</div>`;
  }
  slotsHTML += y.equip.hands.length
    ? y.equip.hands.map((c) => cardHTML(c)).join('')
    : `<div class="slot-empty">✋<br>Руки</div>`;

  const canSell = myTurn() && S.phase === 'charity';
  const canHeal = y.klass?.power === 'levelHead2' && !y.healUsed && y.level < 9;
  box.innerHTML = `
    <div class="my-stat">⭐ Уровень<br><b>${y.level}</b></div>
    <div class="my-stat">⚔ Сила<br><b>${y.power}</b></div>
    <div class="my-stat">👟 Побег<br><b>+${(y.equippedCards || []).reduce((a, c) => a + (c.runBonus || 0), 0)}</b></div>
    <div class="my-stat">🎭 Класс<br><b>${y.klass ? esc(y.klass.name) : 'нет'}</b></div>
    <div class="my-stat">🧬 Раса<br><b>${y.race ? esc(y.race.name) : 'нет'}</b></div>
    <div class="my-slots">${slotsHTML}</div>
    ${canSell ? `<button class="btn small" id="sellBtn">${sellMode ? '❌ Отмена продажи' : '💰 Продать хлам'}</button>` : ''}
    ${canHeal ? `<button class="btn small" id="healBtn" title="Способность класса: раз за игру">✨ +1 уровень (раз за игру)</button>` : ''}
  `;
  box.querySelectorAll('.my-slots .card').forEach((el) => {
    el.onclick = () => {
      if (sellMode) { toggleSel(el.dataset.uid); return; }
      const c = [...y.equip.head, y.equip.body, ...y.equip.feet, ...y.equip.transport, ...y.equip.hands]
        .filter(Boolean).find((c) => c.uid === el.dataset.uid);
      if (c) openEquippedMenu(c);
    };
  });
  const sell = $('sellBtn');
  if (sell) sell.onclick = () => { sellMode = !sellMode; sel.clear(); render(); };
  const heal = $('healBtn');
  if (heal) heal.onclick = () => act({ t: 'heal' });
}

function renderHand() {
  const y = you();
  const box = $('hand');
  if (!y) { box.innerHTML = ''; return; }
  const excess = Math.max(0, y.hand.length - 5);
  $('handTitle').textContent = sellMode
    ? `Режим продажи: выбирай шмот (рука + надетое). Нужно 1000 золота за уровень.`
    : excess && myTurn() && S.phase === 'charity'
      ? `Благотворительность: сбрось ${excess} карт(ы) до 5`
      : `Твоя рука (${y.hand.length}/5 — лимит на конец хода)`;
  box.innerHTML = y.hand.map((c) => cardHTML(c, sel.has(c.uid) ? 'selected' : '')).join('');
  box.querySelectorAll('.card').forEach((el) => {
    el.onclick = () => {
      const c = y.hand.find((c) => c.uid === el.dataset.uid);
      if (!c) return;
      if (sellMode) return toggleSel(c.uid);
      openCardMenu(c);
    };
  });
  if (sellMode) renderSellBar();
}

function toggleSel(uid) {
  if (sel.has(uid)) sel.delete(uid); else sel.add(uid);
  render();
}
function sellTotal() {
  const y = you();
  if (!y) return 0;
  let total = 0;
  for (const c of y.hand) if (sel.has(c.uid) && c.type === 'item') total += c.price || 0;
  for (const c of y.equippedCards) if (sel.has(c.uid)) total += c.price || 0;
  return total;
}
function renderSellBar() {
  if (!sellMode || !you()) return;
  const total = sellTotal();
  $('handTitle').innerHTML =
    `💰 Выбрано на <b>${total}</b> золота (нужно 1000) &nbsp;
     <button class="btn small ${total >= 1000 ? 'primary' : ''}" id="doSell" ${total < 1000 ? 'disabled' : ''}>Продать и получить уровень</button>
     <button class="btn small ghost" id="cancelSell">Отмена</button>`;
  $('doSell')?.addEventListener('click', () => {
    act({ t: 'sell', uids: [...sel] });
    sellMode = false; sel.clear();
  });
  $('cancelSell')?.addEventListener('click', () => { sellMode = false; sel.clear(); render(); });
}

function renderLog() {
  const box = $('logList');
  const lines = [...S.log.map((l) => ({ ...l, isChat: false })),
                 ...S.chat.map((l) => ({ ...l, isChat: true }))]
    .sort((a, b) => a.ts - b.ts).slice(-60);
  box.innerHTML = lines.map((l) =>
    l.isChat
      ? `<div class="log-line chat"><b>${esc(l.name)}:</b> ${esc(l.text)}</div>`
      : `<div class="log-line ${l.text.includes('ПОБЕДА') || l.text.includes('🏆') || l.text.includes('ПОГИБАЕТ') || l.text.includes('крадёт') ? 'big' : ''}">${esc(l.text)}</div>`
  ).join('');
  box.scrollTop = box.scrollHeight;
}

function renderWin() {
  const ov = $('winOverlay');
  if (S.phase !== 'over') { ov.classList.add('hidden'); return; }
  const w = S.players.find((p) => p.id === S.winner);
  ov.classList.remove('hidden');
  $('winBox').innerHTML = `
    <div style="font-size:60px">🏆</div>
    <h2>${esc(w ? w.name : '?')} ПОБЕДИЛ!</h2>
    <button class="btn primary big" id="restartBtn">🔁 Новая игра</button>`;
  $('restartBtn').onclick = () => act({ t: 'restart' });
}

function renderHelpModal() {
  const c = S.combat;
  if (c && c.askId === me && lastAskHandled !== c.askId + ':' + c.fighterId) {
    lastAskHandled = c.askId + ':' + c.fighterId;
    const f = S.players.find((p) => p.id === c.fighterId);
    openModal(`
      <h3>🙋 ${esc(f?.name || '?')} просит помощи в бою!</h3>
      <p style="text-align:center;color:var(--muted)">Помогешь — получишь 1 сокровище при победе.<br>Но монстр будет бить по вам обоим…</p>
      <div class="m-actions">
        <button class="btn primary" id="helpYes">🤝 Помогаю</button>
        <button class="btn danger" id="helpNo">🙈 Отказываю</button>
      </div>`, true);
    $('helpYes').onclick = () => { act({ t: 'respondHelp', accept: true }); closeModal(); };
    $('helpNo').onclick = () => { act({ t: 'respondHelp', accept: false }); closeModal(); };
  }
  if (!c || c.askId !== me) lastAskHandled = null;
}

// ------------------------------------------------------------------- модалки
function openModal(html, locked = false) {
  $('modalBox').innerHTML = html;
  $('modal').classList.remove('hidden');
  $('modal').onclick = locked ? null : (e) => { if (e.target === $('modal')) closeModal(); };
}
function closeModal() { $('modal').classList.add('hidden'); }

function openCardMenu(c) {
  const y = you();
  const btns = [];
  const canActNow = myTurn() || (S.combat && (S.combat.fighterId === me || S.combat.helperId === me));
  const mustDiscard = y.hand.length > 5 && myTurn() && S.phase === 'charity';
  if (c.type === 'item' && canActNow) btns.push(['🧥 Надеть', () => act({ t: 'equip', uid: c.uid })]);
  if (c.type === 'klass' && canActNow) btns.push([`🎭 Стать: ${c.name}`, () => act({ t: 'playClass', uid: c.uid })]);
  if (c.type === 'race' && canActNow) btns.push([`🧬 Стать: ${c.name}`, () => act({ t: 'playRace', uid: c.uid })]);
  if (c.type === 'levelUp') btns.push([`⭐ Поднять уровень (+${c.arg})`, () => act({ t: 'levelUp', uid: c.uid })]);
  if (c.type === 'oneShot' && S.combat && (S.combat.fighterId === me || S.combat.helperId === me))
    btns.push([`⚔ Применить в бою (+${c.bonus})`, () => act({ t: 'playOneShot', uid: c.uid })]);
  if (c.type === 'enhancer' && S.combat && S.phase === 'combat' &&
      S.combat.fighterId !== me && S.combat.helperId !== me)
    btns.push([`🔥 Подкинуть монстру (+${c.bonus})`, () => act({ t: 'playEnhancer', uid: c.uid })]);
  if (c.type === 'monster' && S.combat && (S.phase === 'combat' || S.phase === 'run') &&
      S.combat.fighterId !== me && S.combat.helperId !== me)
    btns.push(['👹 Подкинуть в бой', () => act({ t: 'wanderMonster', uid: c.uid })]);
  if (c.type === 'curse')
    btns.push(['💀 Кинуть в игрока…', () => pickPlayer((t) => act({ t: 'playCurse', uid: c.uid, targetId: t.id }), `Кого проклинаем «${c.name}»?`)]);
  btns.push([mustDiscard ? '🗑 Сбросить (обязательно)' : '🗑 Сбросить', () => act({ t: 'discard', uid: c.uid })]);

  openModal(`
    <div style="display:flex;justify-content:center">${cardHTML(c)}</div>
    <div class="m-actions">
      ${btns.map((x, i) => `<button class="btn" data-i="${i}">${x[0]}</button>`).join('')}
    </div>`);
  $('modalBox').querySelectorAll('[data-i]').forEach((el) => {
    el.onclick = () => { closeModal(); btns[+el.dataset.i][1](); };
  });
}

function openEquippedMenu(c) {
  openModal(`
    <div style="display:flex;justify-content:center">${cardHTML(c)}</div>
    <div class="m-actions">
      <button class="btn" id="mUneq">🧺 Снять в руку</button>
    </div>`);
  $('mUneq').onclick = () => { closeModal(); act({ t: 'unequip', uid: c.uid }); };
}

// мульти-выбор карт из своей руки
function pickCardsModal(cards, title, onDone) {
  const sel = new Set();
  openModal(`
    <h3>${esc(title)}</h3>
    <div class="pick-cards">${cards.map((c) => cardHTML(c)).join('')}</div>
    <p style="text-align:center;color:var(--muted);font-size:12px">кликай по картам, чтобы выбрать</p>
    <div class="m-actions">
      <button class="btn primary" id="pickDone" disabled>Отправить (0)</button>
    </div>`);
  const refresh = () => {
    const btn = $('pickDone');
    btn.textContent = `Отправить (${sel.size})`;
    btn.disabled = sel.size === 0;
    $('modalBox').querySelectorAll('.pick-cards .card').forEach((el) =>
      el.classList.toggle('selected', sel.has(el.dataset.uid)));
  };
  $('modalBox').querySelectorAll('.pick-cards .card').forEach((el) => {
    el.onclick = () => {
      if (sel.has(el.dataset.uid)) sel.delete(el.dataset.uid); else sel.add(el.dataset.uid);
      refresh();
    };
  });
  $('pickDone').onclick = () => {
    const uids = [...sel];
    closeModal();
    onDone(uids);
  };
}

// входящие предложения обмена
function renderOffers() {
  if (!$('modal').classList.contains('hidden')) return;   // не перебиваем открытые окна
  const r = S.offers && [...S.offers].sort((a, b) => b.ts - a.ts)
    .find((o) => o.targetId === me && o.ts !== lastOfferTs);
  if (!r) return;
  lastOfferTs = r.ts;
  if (r.kind === 'offer') {
    openModal(`
      <h3>🤝 ${esc(r.fromName)} предлагает тебе обмен</h3>
      <p style="text-align:center;color:var(--muted);font-size:13px">Ты получишь эти карты просто так:</p>
      <div class="reveal-wrap">${r.cards.map((c) => cardHTML(c, 'reveal')).join('')}</div>
      <div class="m-actions">
        <button class="btn primary" id="ofAccept">🤝 Принять</button>
        <button class="btn" id="ofCounter">🔁 Ответить обменом (выбрать свои карты)</button>
        <button class="btn danger" id="ofDecline">🙈 Отказать</button>
      </div>`);
    $('ofAccept').onclick = () => { closeModal(); act({ t: 'tradeAccept', offerId: r.id }); };
    $('ofCounter').onclick = () => {
      pickCardsModal(you().hand, '🔁 Твои карты в ответ ' + r.fromName, (sel) =>
        act({ t: 'tradeCounter', offerId: r.id, uids: sel }));
    };
    $('ofDecline').onclick = () => { closeModal(); act({ t: 'tradeDecline', offerId: r.id }); };
  } else if (r.kind === 'counter') {
    openModal(`
      <h3>🔁 ${esc(r.fromName)} отвечает обменом</h3>
      <p style="text-align:center;color:var(--muted);font-size:13px">Ты отдаёшь свои карты:</p>
      <div class="reveal-wrap">${(r.baseCards || []).map((c) => cardHTML(c, 'reveal')).join('')}</div>
      <p style="text-align:center;color:var(--muted);font-size:13px;margin-top:8px">…и получаешь взамен:</p>
      <div class="reveal-wrap">${r.cards.map((c) => cardHTML(c, 'reveal')).join('')}</div>
      <div class="m-actions">
        <button class="btn primary" id="cfAccept">🤝 Принять обмен</button>
        <button class="btn danger" id="cfDecline">🙈 Отказать</button>
      </div>`);
    $('cfAccept').onclick = () => { closeModal(); act({ t: 'tradeAccept', offerId: r.id }); };
    $('cfDecline').onclick = () => { closeModal(); act({ t: 'tradeDecline', offerId: r.id }); };
  }
}

function openMonsterPicker(mine, makeAction) {
  const act_ = makeAction || ((uid) => ({ t: 'wanderMonster', uid }));
  openModal(`
    <h3>👹 Кого подкидываем?</h3>
    <div class="player-pick">
      ${mine.map((c, i) => `<button class="btn" data-i="${i}"><span>${esc(c.name)}</span><span>сила ${c.level}</span></button>`).join('')}
    </div>`);
  $('modalBox').querySelectorAll('[data-i]').forEach((el) => {
    el.onclick = () => { closeModal(); act(act_(mine[+el.dataset.i].uid)); };
  });
}

function openPlayerMenu(p) {
  const y = you();
  const btns = [];
  if (S.combat && S.phase === 'combat' && S.combat.fighterId === me && !S.combat.helperId)
    btns.push(['🙋 Позвать на помощь', () => act({ t: 'askHelp', targetId: p.id })]);
  if (y.klass?.power === 'thief' && !y.stealUsed)
    btns.push(['🗝️ Украсть шмотку (Вор)', () => act({ t: 'steal', targetId: p.id })]);
  if (y.race?.power === 'halfling' && !y.halflingUsed)
    btns.push(['🫳 Тянуть карту из руки (раса)', () => act({ t: 'stealFromHand', targetId: p.id })]);
  if (y.hand.length) btns.push(['🎁 Подарить карты', () => pickCardsModal(y.hand, '🎁 Что дарим ' + p.name + '?', (sel) => act({ t: 'gift', targetId: p.id, uids: sel }))]);
  if (y.hand.length) btns.push(['🤝 Предложить обмен', () => pickCardsModal(y.hand, '🤝 Твои карты в обмене с ' + p.name, (sel) => act({ t: 'tradeOffer', targetId: p.id, uids: sel }))]);
  if (!btns.length) btns.push([`ℹ️ ${p.name}: ур. ${p.level}, сила ${p.power}`, closeModal]);
  openModal(`
    <h3>${esc(p.name)}</h3>
    <p style="text-align:center;color:var(--muted)">
      ⭐ ${p.level} · ⚔ ${p.power} ${p.klass ? '· ' + (KLASS_EMOJI[p.klass.power] || p.klass.name) : ''}<br>
      ${p.equippedCards.map((c) => `${cardEmoji(c)} ${esc(c.name)} +${c.bonus}`).join('<br>') || 'Ничего не надето'}</p>
    <div class="m-actions">${btns.map((x, i) => `<button class="btn" data-i="${i}">${x[0]}</button>`).join('')}</div>`);
  $('modalBox').querySelectorAll('[data-i]').forEach((el) => {
    el.onclick = () => { closeModal(); btns[+el.dataset.i][1](); };
  });
}

function pickPlayer(cb, title) {
  const others = S.players.filter((p) => p.id !== me);
  openModal(`
    <h3>${esc(title)}</h3>
    <div class="player-pick">
      ${others.map((p, i) =>
        `<button class="btn" data-i="${i}"><span>${esc(p.name)}</span><span>⭐${p.level} ⚔${p.power}</span></button>`).join('')}
    </div>`);
  $('modalBox').querySelectorAll('[data-i]').forEach((el) => {
    el.onclick = () => { closeModal(); cb(others[+el.dataset.i]); };
  });
}

// ------------------------------------------------ 3D-наклон карт под курсор
let tiltCard = null;
function tiltReset(card) {
  card.style.transition = 'transform .5s cubic-bezier(.2,.8,.3,1), box-shadow .5s';
  card.style.transform = '';
  card.style.boxShadow = '';
  card.style.setProperty('--shine', '0');
}
document.addEventListener('mousemove', (e) => {
  const card = e.target && e.target.closest ? e.target.closest('.card') : null;
  if (tiltCard && (!card || card !== tiltCard)) {
    tiltReset(tiltCard);
    tiltCard = null;
  }
  if (!card) return;
  const r = card.getBoundingClientRect();
  if (e.clientX < r.left - 4 || e.clientX > r.right + 4 || e.clientY < r.top - 4 || e.clientY > r.bottom + 4) return;
  const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
  const py = (e.clientY - r.top) / r.height - 0.5;
  card.style.transition = 'box-shadow .2s';
  card.style.transform =
    `perspective(750px) rotateX(${(-py * 12).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg) translateY(-3px) scale(1.03)`;
  card.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
  card.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
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

// ---------------------------------------------------- живой фон (угольки)
(function makeEmbers() {
  const wrap = document.getElementById('ambient');
  if (!wrap) return;
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

// --------------------------------------------------------------------- старт
connect();
