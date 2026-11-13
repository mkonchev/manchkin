# -*- coding: utf-8 -*-
# 1) Добыча делится: помощник берёт сторгованное, бойцу — остаток.
# 2) Превью боя: все монстры на столе, исходы по каждому, дублирующие обработчики.
import io

# ================= ДВИЖОК: делёж добычи =================
p = 'game/engine.js'
s = io.open(p, encoding='utf-8').read()

old = """      const cap = h ? WIN_LEVEL - 1 : WIN_LEVEL;   // с помощником 10-го не достигают
      const before = f.level;
      f.level = Math.min(cap, f.level + levels);
      this.say(`${f.name} получает ${levels} ур. (${f.level}) и ${treasures} сокровищ(а).`);
      if (h && before + levels >= WIN_LEVEL)
        this.say(`⚖ С помощником до ${WIN_LEVEL}-го уровня не дорастают!`);
      if (h) {
        const fee = this.combat.helperFee || 0;
        const bonus = this.draw('treasure', 1 + fee);
        h.hand.push(...bonus);
        this.say(`${h.name} (помощник) получает ${1 + fee} сокровищ(а)${fee ? ` (по торгу +${fee})` : ''}.`);
        if (bonus.length) this.reveal = { kind: 'helper', byId: h.id, byName: h.name,
          secret: true, cards: bonus, ts: Date.now() };
        if (this.hasRace(h, 'elf') && h.level < WIN_LEVEL - 1) {
          h.level += 1;
          this.say(`🧝 ${h.name} (${h.race.name}) получает +1 уровень за помощь.`);
        }
      }
      const tr = this.draw('treasure', treasures);
      f.hand.push(...tr);
      if (tr.length) this.reveal = { kind: 'treasure', byId: f.id, byName: f.name,
        secret: true, cards: tr, ts: Date.now() };
      this.combat = null;
      this.phase = 'charity';
      if (f.level >= WIN_LEVEL) return this.winGame(f);"""
new = """      const cap = h ? WIN_LEVEL - 1 : WIN_LEVEL;   // с помощником 10-го не достигают
      const before = f.level;
      f.level = Math.min(cap, f.level + levels);
      this.say(`${f.name} получает ${levels} ур. (${f.level}).`);
      if (h && before + levels >= WIN_LEVEL)
        this.say(`⚖ С помощником до ${WIN_LEVEL}-го уровня не дорастают!`);
      // общая добыча делится: помощник берёт сторгованное (или 1 по классике), бойцу — остаток
      const tr = this.draw('treasure', treasures);
      if (h) {
        const fee = this.combat.helperFee || 0;
        const helperShare = Math.min(fee || 1, tr.length);
        const helperCards = tr.splice(0, helperShare);
        h.hand.push(...helperCards);
        f.hand.push(...tr);
        this.say(`💰 ${f.name} — ${tr.length} сокровищ(а), ${h.name} (помощник) — ${helperCards.length}${fee ? ` (по торгу ${fee})` : ''}.`);
        if (helperCards.length) this.reveal = { kind: 'helper', byId: h.id, byName: h.name,
          secret: true, cards: helperCards, ts: Date.now() };
        if (this.hasRace(h, 'elf') && h.level < WIN_LEVEL - 1) {
          h.level += 1;
          this.say(`🧝 ${h.name} (${h.race.name}) получает +1 уровень за помощь.`);
        }
      } else {
        f.hand.push(...tr);
        if (tr.length) this.reveal = { kind: 'treasure', byId: f.id, byName: f.name,
          secret: true, cards: tr, ts: Date.now() };
      }
      this.combat = null;
      this.phase = 'charity';
      if (f.level >= WIN_LEVEL) return this.winGame(f);"""
assert old in s, 'resolveFight split'
s = s.replace(old, new)

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('engine: делёж добычи')

# ================= КЛИЕНТ: превью стола + делегирование =================
p = 'public/client.js'
s = io.open(p, encoding='utf-8').read()

# 1) openCombatPreview: показывает ВСЕ монстры боя (или карту из руки)
old_start = """// превью: что будет, если выиграть / проиграть этот бой
function openCombatPreview(uid) {
  let card = S.combat ? S.combat.monsters.find((m) => m.uid === uid) : null;
  if (!card) card = (you().hand || []).find((c) => c.uid === uid);
  if (!card) return;
  const first = S.combat ? S.combat.monsters[0] : card;
  const totLv = S.combat ? S.combat.monsters.reduce((a, m) => a + (m.levels ?? 1), 0) : (card.levels ?? 1);
  const totTr = S.combat ? S.combat.monsters.reduce((a, m) => a + (m.treasures ?? 1), 0) : (card.treasures ?? 1);
  const mp = S.combat ? S.combat.monsterPower : card.level;
  const sp = S.combat ? S.combat.sidePower : (you()?.power || 0);
  const badText = {
    none: 'ничего страшного',
    loseLevel: `потеряешь ${first.bad.n ?? 1} ур.`,
    loseSlot: `потеряешь ${SLOT_NAME[first.bad.slot] || first.bad.slot}`,
    loseRandomSlot: 'потеряешь случайный предмет',
    loseClass: 'потеряешь класс',
    skipTurn: 'пропустишь ход',
    death: 'СМЕРТЬ: уровень 1, шмот в сброс, добор 4 дверей',
  }[first.bad.t] || '';
  const btns = [];
  const inCombatNow = S.combat && S.combat.monsters.some((m) => m.uid === uid);
  if (!inCombatNow && S.combat && (S.phase === 'combat' || S.phase === 'run') &&
      S.combat.fighterId !== me && S.combat.helperId !== me &&
      (you().hand || []).some((c) => c.uid === uid))
    btns.push(['👹 Подкинуть в бой', () => act({ t: 'wanderMonster', uid })]);
  const helperNote = S.combat && S.combat.helperId
    ? ' · <b>с помощником до 10-го не дорастёшь</b>' + (S.combat.helperFee ? ` · помощнику +${S.combat.helperFee} 💎` : '')
    : '';
  openModal(`
    <h3>🔍 Что будет в бою?</h3>
    <div class="reveal-wrap">${cardHTML(card, 'reveal')}</div>
    <div class="pv-outcomes">
      <div class="pv-block pv-win">
        <b>🏆 Если победишь</b>
        <div>+${totLv} ур. и ${totTr} сокровищ(а)${helperNote}</div>
      </div>
      <div class="pv-block pv-lose">
        <b>💀 Если проиграешь и не убежишь</b>
        <div>${esc(first.name)} — ${esc(badText)}</div>
        ${first.text ? `<div style="color:var(--muted);font-size:11px">${esc(first.text)}</div>` : ''}
        <div style="color:var(--muted);font-size:11px;margin-top:4px">Побег: кубик 5+ (+бонус шмота) — тогда ничего не будет</div>
      </div>
      ${S.combat ? `<div style="text-align:center;color:var(--muted);font-size:12px">Сейчас в бою: монстр <b>${mp}</b> против отряда <b>${sp}</b></div>` : ''}
    </div>
    ${btns.length ? `<div class="m-actions">${btns.map((x, i) => `<button class="btn" data-pv="${i}">${x[0]}</button>`).join('')}</div>` : ''}`);
  $('modalBox').querySelectorAll('[data-pv]').forEach((el) => {
    el.onclick = () => { const i = +el.dataset.pv; closeModal(); btns[i][1](); };
  });
}"""
new_start = """// превью: что будет, если выиграть / проиграть этот бой
function openCombatPreview(uid) {
  if (!S.combat) return;
  const monsters = S.combat.monsters.map((m) => m);
  if (!monsters.length) return;
  const totLv = monsters.reduce((a, m) => a + (m.levels ?? 1), 0);
  const totTr = monsters.reduce((a, m) => a + (m.treasures ?? 1), 0);
  const mp = S.combat.monsterPower, sp = S.combat.sidePower;
  const badText = (m) => ({
    none: 'ничего страшного',
    loseLevel: `потеряешь ${m.bad.n ?? 1} ур.`,
    loseSlot: `потеряешь ${SLOT_NAME[m.bad.slot] || m.bad.slot}`,
    loseRandomSlot: 'потеряешь случайный предмет',
    loseClass: 'потеряешь класс',
    skipTurn: 'пропустишь ход',
    death: 'СМЕРТЬ: уровень 1, шмот в сброс, добор 4 дверей',
  }[m.bad.t] || '');
  const helperNote = S.combat.helperId
    ? ' · <b>с помощником до 10-го не дорастёшь</b>' + (S.combat.helperFee ? ` · помощнику +${S.combat.helperFee} 💎` : '')
    : '';
  const cardsHTML = monsters.map((m) => cardHTML(m, 'reveal')).join('');
  const loseList = monsters.map((m) =>
    `<div>«${esc(m.name)}» — ${esc(badText(m))}</div>`).join('');
  const btns = [];
  if ((S.phase === 'combat' || S.phase === 'run') && S.combat.fighterId !== me &&
      S.combat.helperId !== me && (you().hand || []).some((c) => c.type === 'monster'))
    btns.push(['👹 Подкинуть монстра из руки', () => openMonsterPicker(
      you().hand.filter((c) => c.type === 'monster'))]);
  openModal(`
    <h3>🔍 Что будет в этом бою?</h3>
    <div class="reveal-wrap">${cardsHTML}</div>
    <div class="pv-outcomes">
      <div class="pv-block pv-win">
        <b>🏆 Если победишь</b>
        <div>+${totLv} ур. и ${totTr} сокровищ(а)${helperNote}</div>
      </div>
      <div class="pv-block pv-lose">
        <b>💀 Если проиграешь и не убежишь (кубик меньше 5)</b>
        ${loseList}
        <div style="color:var(--muted);font-size:11px;margin-top:4px">Успешный побег: кубик 5+ (+бонус шмота) — тогда ничего не будет</div>
      </div>
      <div style="text-align:center;color:var(--muted);font-size:12px">Сейчас в бою: монстр <b>${mp}</b> против отряда <b>${sp}</b></div>
    </div>
    ${btns.length ? `<div class="m-actions">${btns.map((x, i) => `<button class="btn" data-pv="${i}">${x[0]}</button>`).join('')}</div>` : ''}`);
  $('modalBox').querySelectorAll('[data-pv]').forEach((el) => {
    el.onclick = () => { const i = +el.dataset.pv; closeModal(); btns[i][1](); };
  });
}"""
assert old_start in s, 'preview fn'
s = s.replace(old_start, new_start)

# 2) клик по монстру на столе: делегирование (работает при любых перерисовках)
old = """  $('monsterCards').querySelectorAll('.card').forEach((el) => {
    el.onclick = () => openCombatPreview(el.dataset.uid);
  });"""
new = ""
assert old in s, 'remove per-element bind'
s = s.replace(old, new)

old = """// ------------------------------------------------ 3D-наклон карт под курсор"""
new = """// клик по карте монстра на столе боя -> превью (делегирование)
document.addEventListener('click', (e) => {
  const el = e.target && e.target.closest ? e.target.closest('#monsterCards .card') : null;
  if (el && S && S.combat) openCombatPreview(el.dataset.uid);
});

// ------------------------------------------------ 3D-наклон карт под курсор"""
assert old in s, 'delegation'
s = s.replace(old, new)

# 3) кнопка «Что будет?» для всех в бою
old = """  if (S.combat && (S.phase === 'combat' || S.phase === 'run') && !iAmFighter && !iAmHelper && y) {
    const mine = y.hand.filter((x) => x.type === 'monster');
    if (mine.length) {
      const wb = document.createElement('button');
      wb.className = 'btn danger big';
      wb.textContent = `👹 Подкинуть монстра (${mine.length})`;
      wb.title = 'Бросить монстра из руки в текущий бой';
      wb.onclick = () => openMonsterPicker(mine);
      box.appendChild(wb);
    }
  }"""
new = """  if (S.combat && (S.phase === 'combat' || S.phase === 'run') && !iAmFighter && !iAmHelper && y) {
    const mine = y.hand.filter((x) => x.type === 'monster');
    if (mine.length) {
      const wb = document.createElement('button');
      wb.className = 'btn danger big';
      wb.textContent = `👹 Подкинуть монстра (${mine.length})`;
      wb.title = 'Бросить монстра из руки в текущий бой';
      wb.onclick = () => openMonsterPicker(mine);
      box.appendChild(wb);
    }
  }
  if (S.combat && (S.phase === 'combat' || S.phase === 'run')) {
    const pb = document.createElement('button');
    pb.className = 'btn big';
    pb.textContent = '🔍 Что будет?';
    pb.title = 'Исходы боя: победа, поражение, побег';
    pb.onclick = () => openCombatPreview();
    box.appendChild(pb);
  }"""
assert old in s, 'what-will button'
s = s.replace(old, new)

# 4) в меню карты монстра из руки: превью показывает бой на столе, если он идёт
old = """  if (c.type === 'monster')
    btns.unshift(['🔍 Исходы боя', () => openCombatPreview(c.uid)]);"""
new = """  if (c.type === 'monster')
    btns.unshift(['🔍 Исходы боя', () => openCombatPreview(S.combat ? null : c.uid)]);"""
assert old in s, 'menu preview target'
s = s.replace(old, new)

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('client: превью стола + делегирование + кнопка')
