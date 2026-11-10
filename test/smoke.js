// Смоук-тест: случайная партия по движку.  npm test
'use strict';
const { Game } = require('../game/engine');
const { CARD_INFO } = require('../game/cards');

const rnd = () => Math.random();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const g = new Game('TEST');
g.addPlayer('p1', 'Аня');
g.addPlayer('p2', 'Боря');
g.addPlayer('p3', 'Вика');
g.start();

// действие, которое может законно не сработать по правилам — молча пропускаем
function attempt(fn) { try { fn(); } catch { /* ожидаемый отказ правил */ } }

let steps = 0;
const MAX = 20000;
while (g.phase !== 'over' && steps < MAX) {
  steps++;
  const cur = g.turnPlayer();
  try {
    switch (g.phase) {
      case 'kick': {
        if (rnd() < 0.3) {
          const it = cur.hand.find((c) => c.type === 'item');
          if (it) attempt(() => g.action(cur.id, { t: 'equip', uid: it.uid }));
        }
        if (rnd() < 0.15) {
          const kl = cur.hand.find((c) => c.type === 'klass');
          if (kl) attempt(() => g.action(cur.id, { t: 'playClass', uid: kl.uid }));
        }
        if (rnd() < 0.1) {
          const lu = cur.hand.find((c) => c.type === 'levelUp');
          if (lu) attempt(() => g.action(cur.id, { t: 'levelUp', uid: lu.uid }));
        }
        g.action(cur.id, { t: 'kick' });
        break;
      }
      case 'combat': {
        const c = g.combat;
        for (const p of g.players) {
          if (p.id === c.fighterId || p.id === c.helperId) continue;
          if (rnd() < 0.12) {
            const e = p.hand.find((cc) => cc.type === 'enhancer');
            if (e) attempt(() => g.action(p.id, { t: 'playEnhancer', uid: e.uid }));
          }
          if (rnd() < 0.08) {
            const cu = p.hand.find((cc) => cc.type === 'curse');
            if (cu) attempt(() => g.action(p.id, { t: 'playCurse', uid: cu.uid, targetId: c.fighterId }));
          }
        }
        const f = g.fighter();
        if (rnd() < 0.3) {
          const o = f.hand.find((cc) => cc.type === 'oneShot');
          if (o) attempt(() => g.action(f.id, { t: 'playOneShot', uid: o.uid }));
        }
        if (f.klass?.power === 'warrior' && f.hand.length && rnd() < 0.4) {
          attempt(() => g.action(f.id, { t: 'warriorDiscard', uid: f.hand[0].uid }));
        }
        if (!c.helperId && rnd() < 0.35) {
          const other = pick(g.players.filter((p) => p.id !== f.id));
          g.action(f.id, { t: 'askHelp', targetId: other.id });
          g.action(other.id, { t: 'respondHelp', accept: rnd() < 0.5 });
        }
        g.action(f.id, { t: 'resolve' });
        break;
      }
      case 'run': {
        const f = g.fighter();
        if (f.klass?.power === 'wizard' && g.combat && !g.combat.wizardEscaped && rnd() < 0.5) {
          g.action(f.id, { t: 'wizardEscape' });
        } else {
          g.action(f.id, { t: 'run' });
        }
        break;
      }
      case 'curseChoice': {
        if (rnd() < 0.5) {
          g.action(cur.id, { t: 'curseSelf', uid: g.pendingCurse.uid });
        } else {
          const victim = pick(g.players.filter((p) => p.id !== cur.id));
          g.action(cur.id, { t: 'curseThrow', uid: g.pendingCurse.uid, targetId: victim.id });
        }
        break;
      }
      case 'trouble': {
        const m = cur.hand.find((c) => c.type === 'monster');
        if (m && rnd() < 0.5) {
          g.action(cur.id, { t: 'lookForTrouble', uid: m.uid });
        } else if (rnd() < 0.5) {
          g.action(cur.id, { t: 'lootRoom' });
        } else {
          g.action(cur.id, { t: 'skipTrouble' });
        }
        break;
      }
      case 'charity': {
        const thief = g.players.find((p) => p.klass?.power === 'thief' && !p.stealUsed);
        if (thief && rnd() < 0.25) {
          const victim = pick(g.players.filter((p) => p.id !== thief.id));
          attempt(() => g.action(thief.id, { t: 'steal', targetId: victim.id }));
        }
        const cleric = g.players.find((p) => p.klass?.power === 'cleric' && !p.healUsed);
        if (cleric && rnd() < 0.25) attempt(() => g.action(cleric.id, { t: 'heal' }));
        if (cur.hand.length > 5) {
          g.action(cur.id, { t: 'discard', uid: cur.hand[0].uid });
        } else {
          g.action(cur.id, { t: 'endTurn' });
        }
        break;
      }
    }
  } catch (e) {
    console.error(`\n❌ ПАДЕНИЕ на шаге ${steps}, фаза «${g.phase}»: ${e.message}`);
    console.error(e.stack.split('\n').slice(0, 4).join('\n'));
    process.exit(1);
  }
}

console.log(`\nКолода Дверей: ${CARD_INFO.doorCount} карт (монстров ${CARD_INFO.monsters}, проклятий ${CARD_INFO.curses}), Сокровищ: ${CARD_INFO.treasureCount}`);

if (g.phase === 'over') {
  const w = g.players.find((p) => p.id === g.winner);
  console.log(`✅ Партия завершена за ${steps} действий. Победитель: ${w.name} (ур. ${w.level})`);
} else {
  console.log(`⚠ Достигнут лимит ${MAX} шагов, фаза: ${g.phase} (возможно, слишком долгая партия)`);
}
console.log('\nПоследние события:');
for (const l of g.log.slice(-12)) console.log('  •', l.text);
