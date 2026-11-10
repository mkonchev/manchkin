// Полный тест всех механик:  node test/mechanics.js
'use strict';
const { Game } = require('../game/engine');

let pass = 0, fail = 0, uidc = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  ✅', label); }
  else { fail++; console.log('  ❌', label); }
}
function expectThrow(fn, label, needle) {
  try { fn(); fail++; console.log('  ❌', label, '— не бросил исключение'); }
  catch (e) {
    if (needle && !String(e.message).includes(needle)) { fail++; console.log('  ❌', label, '— неверный текст:', e.message); }
    else { pass++; console.log('  ✅', label); }
  }
}
const item = (name, bonus, slot, o = {}) => ({
  type: 'item', name, bonus, slot, hands: o.hands || 1, big: !!o.big,
  price: o.price ?? 100 * bonus, runBonus: o.runBonus || 0, uid: 'x' + (++uidc),
});
const monster = (name, level, o = {}) => ({
  type: 'monster', name, level, levels: o.levels ?? 1, treasures: o.treasures ?? 1,
  bad: o.bad || { t: 'none' }, text: '', tag: o.tag || null,
  classMod: o.classMod || null, uid: 'm' + (++uidc),
});

console.log('=== 1. Ход: дверь ===');
{
  const g = new Game('T1');
  g.addPlayer('p1', 'Аня'); g.addPlayer('p2', 'Боря'); g.start();
  const a = g.find('p1'), b = g.find('p2');
  g.turnIdx = 0; g.phase = 'kick';
  while (a.hand.length > 5) g.discard(a.hand.pop());
  while (b.hand.length > 5) g.discard(b.hand.pop());

  // монстр из двери -> бой
  g.doorDeck.push(monster('Тестовый тролль', 3));
  g.action('p1', { t: 'kick' });
  ok(g.phase === 'combat' && g.combat.monsters[0].name === 'Тестовый тролль', 'дверь: монстр открывает бой');
  ok(g.combat.fighterId === 'p1', 'боец — тот, кто открыл дверь');

  // победа: уровни + сокровища
  const lvl0 = a.level, hand0 = a.hand.length;
  a.hand.push({ type: 'oneShot', name: 'Зелье', bonus: 10, uid: 'os1' });
  g.action('p1', { t: 'playOneShot', uid: 'os1' });
  g.action('p1', { t: 'resolve' });
  ok(a.level === lvl0 + 1, 'победа даёт уровень');
  ok(a.hand.length > hand0, 'победа даёт сокровища');
  ok(g.phase === 'charity', 'после победы — конец хода');

  // проклятие из двери
  g.turnIdx = 1; g.phase = 'kick';
  g.doorDeck.push({ type: 'curse', name: 'Сглаз', effect: 'loseLevel', arg: 1, text: '', uid: 'cu0' });
  const bLvl = b.level;
  g.action('p2', { t: 'kick' });
  ok(b.level === Math.max(1, bLvl - 1), 'дверь: проклятие применяется сразу');
  ok(g.phase === 'charity', 'после проклятия — конец хода');

  // предмет из двери — в руку
  g.turnIdx = 0; g.phase = 'kick';
  g.doorDeck.push(item('Мусор из двери', 1, 'hands'));
  const h0 = a.hand.length;
  g.action('p1', { t: 'kick' });
  ok(a.hand.length === h0 + 1 && g.phase === 'charity', 'дверь: хабар идёт в руку');
}

console.log('=== 2. Подкидывание монстра из руки ===');
{
  const g = new Game('T2');
  g.addPlayer('p1', 'Аня'); g.addPlayer('p2', 'Боря'); g.addPlayer('p3', 'Вика'); g.start();
  const [a, b, v] = [g.find('p1'), g.find('p2'), g.find('p3')];
  for (const p of [a, b, v]) while (p.hand.length > 5) g.discard(p.hand.pop());
  g.turnIdx = 0; g.phase = 'kick';
  g.doorDeck.push(monster('Слабый монстр', 1));
  g.action('p1', { t: 'kick' });

  const vHand0 = v.hand.length;
  v.hand.push(monster('Подкинутый', 6, { levels: 2, treasures: 2, bad: { t: 'loseLevel', n: 1 } }));
  g.action('p3', { t: 'wanderMonster', uid: v.hand[v.hand.length - 1].uid });
  ok(g.combat.monsters.length === 2 && v.hand.length === vHand0, 'монстр перешёл в бой из руки');
  ok(g.monsterPower() === 1 + 6, 'сила суммируется');

  // участник подкинуть не может
  a.hand.push(monster('Ещё монстр', 2));
  expectThrow(() => g.action('p1', { t: 'wanderMonster', uid: a.hand[a.hand.length - 1].uid }),
    'боец не может подкинуть', 'В свой бой');

  // вне боя нельзя
  const g2 = new Game('T2b');
  g2.addPlayer('q1', 'X'); g2.addPlayer('q2', 'Y'); g2.start();
  expectThrow(() => g2.action('q2', { t: 'wanderMonster', uid: 'nope' }),
    'вне боя подкинуть нельзя', 'во время боя');

  // победа над двумя: награды складываются; подкинуть в фазе побега тоже можно
  g.action('p1', { t: 'resolve' }); // 1+6=7 против Ани ~1 — проигрыш -> run
  ok(g.phase === 'run', 'проигрыш -> фаза побега');
  const v2hand = v.hand.length;
  v.hand.push(monster('В побег', 4, { levels: 1, treasures: 1, bad: { t: 'none' } }));
  g.action('p3', { t: 'wanderMonster', uid: v.hand[v.hand.length - 1].uid });
  ok(g.combat.monsters.length === 3 && v.hand.length === v2hand, 'подкидывание в фазе побега работает');
  const win0 = g.combat.monsters.reduce((s, m) => s + m.levels, 0);
  a.level = 10; a.hand.push({ type: 'oneShot', name: 'Бах', bonus: 50, uid: 'os2' });
  g.phase = 'combat';
  g.action('p1', { t: 'playOneShot', uid: 'os2' });
  g.action('p1', { t: 'resolve' });
  ok(a.level >= 10 && g.phase === 'over' && g.winner === 'p1', 'победа над тремя монстрами завершает игру');
}

console.log('=== 3. Побег и дурняки ===');
{
  const g = new Game('T3');
  g.addPlayer('p1', 'Аня'); g.addPlayer('p2', 'Боря'); g.start();
  const [a, b] = [g.find('p1'), g.find('p2')];
  for (const p of [a, b]) while (p.hand.length > 5) g.discard(p.hand.pop());
  g.turnIdx = 0; g.phase = 'kick';
  g.doorDeck.push(monster('Злюка', 9, { bad: { t: 'loseLevel', n: 2 } }));
  g.action('p1', { t: 'kick' });

  // успешный побег: 6 на кубике
  const realRandom = Math.random;
  Math.random = () => 0.99;
  a.equip.transport.push(item('Старлетка', 2, 'transport', { runBonus: 3 }));
  a.equip.feet.push(item('Джомы', 2, 'feet', { runBonus: 2 }));
  try { g.action('p1', { t: 'run' }); } finally { Math.random = realRandom; }
  ok(g.phase === 'charity', 'побег 6+5 бонусов = успех');
  ok(g.runBonus(a) === 5, 'бонус побега: транспорт + обувь (Серёгино +2 добавится классом)');

  // провал -> loseLevel
  g.turnIdx = 1; g.phase = 'kick';
  g.doorDeck.push(monster('Страшный', 9, { bad: { t: 'loseLevel', n: 2 } }));
  g.action('p2', { t: 'kick' });
  Math.random = () => 0; // кубик 1
  const bLvl = b.level;
  try { g.action('p2', { t: 'run' }); } finally { Math.random = realRandom; }
  ok(b.level === Math.max(1, bLvl - 2), 'дурняк: потеря уровня');

  // остальные дурняки напрямую
  const slot = item('Шлем', 1, 'head');
  b.equip.head.push(slot);
  g.applyBadStuff(b, monster('X', 1, { bad: { t: 'loseSlot', slot: 'head' } }));
  ok(b.equip.head.length === 0, 'дурняк: потеря слота');
  b.equip.feet.push(item('Обувь', 1, 'feet'));
  b.equip.hands.push(item('Меч', 1, 'hands'));
  g.applyBadStuff(b, monster('Y', 1, { bad: { t: 'loseRandomSlot' } }));
  ok(!b.equip.feet.length || !b.equip.hands.length, 'дурняк: случайный предмет');
  b.klass = { name: 'Ссыкло', power: 'wizard', uid: 'kk' };
  g.applyBadStuff(b, monster('Z', 1, { bad: { t: 'loseClass' } }));
  ok(!b.klass, 'дурняк: потеря класса');
  g.applyBadStuff(b, monster('W', 1, { bad: { t: 'skipTurn' } }));
  ok(b.skipNext === true, 'дурняк: пропуск хода');
  b.skipNext = false;
  b.equip.head.push(item('Мантия', 5, 'body', { big: true }));
  b.equip.body = item('Полка', 6, 'body', { big: true });
  g.applyBadStuff(b, monster('D', 1, { bad: { t: 'death' } }));
  ok(b.level === 1 && !b.equip.body && b.equip.head.length === 0, 'дурняк: смерть обнуляет');
  ok(b.hand.length > 0, 'дурняк: смерть даёт 4 двери');
}

console.log('=== 4. Классы и ПМЖ ===');
{
  const g = new Game('T4');
  g.addPlayer('p1', 'Аня'); g.addPlayer('p2', 'Боря'); g.start();
  const [a, b] = [g.find('p1'), g.find('p2')];
  for (const p of [a, b]) while (p.hand.length > 5) g.discard(p.hand.pop());
  g.turnIdx = 0; g.phase = 'charity';

  // Серёга: +2 к побегу
  a.klass = { name: 'Серёга', power: 'run2', uid: 'k1' };
  ok(g.runBonus(a) === 2, 'Серёга: +2 к побегу');

  // Макс: 3 транспорта; обычный — 1 с авто-заменой
  a.klass = { name: 'Макс', power: 'multiTransport', uid: 'k2' };
  a.hand.push(item('Т1', 1, 'transport'), item('Т2', 2, 'transport'), item('Т3', 3, 'transport'));
  g.action('p1', { t: 'equip', uid: 'x' + (uidc - 2) });
  g.action('p1', { t: 'equip', uid: 'x' + (uidc - 1) });
  g.action('p1', { t: 'equip', uid: 'x' + uidc });
  ok(a.equip.transport.length === 3, 'Макс: несколько транспортов');

  // Слава: 2 головы и +1 уровень раз за игру
  a.klass = { name: 'Слава', power: 'levelHead2', uid: 'k3' };
  a.hand.push(item('Кепка', 1, 'head'), item('Шляпа', 2, 'head'));
  g.action('p1', { t: 'equip', uid: 'x' + (uidc - 1) });
  g.action('p1', { t: 'equip', uid: 'x' + uidc });
  ok(a.equip.head.length === 2, 'Слава: 2 шмотки на голову');
  const lvl0 = a.level;
  g.action('p1', { t: 'heal' });
  expectThrow(() => g.action('p1', { t: 'heal' }), 'Слава: +1 уровень только раз', 'раз за игру');
  ok(a.level === lvl0 + 1, 'Слава: уровень вырос');

  // Кузян: несколько обуви
  a.klass = { name: 'Кузян', power: 'multiFeet', uid: 'k4' };
  a.hand.push(item('Обувь1', 1, 'feet'), item('Обувь2', 1, 'feet'), item('Обувь3', 1, 'feet'));
  g.action('p1', { t: 'equip', uid: 'x' + (uidc - 2) });
  g.action('p1', { t: 'equip', uid: 'x' + (uidc - 1) });
  g.action('p1', { t: 'equip', uid: 'x' + uidc });
  ok(a.equip.feet.length === 3, 'Кузян: несколько обуви');

  // Валера: несколько крупных по разным слотам
  a.klass = { name: 'Валера', power: 'multiBig', uid: 'k5' };
  a.hand.push(item('Крупное тело', 5, 'body', { big: true }), item('Крупный шлем', 3, 'head', { big: true }));
  a.equip.head.splice(0);
  g.action('p1', { t: 'equip', uid: 'x' + (uidc - 1) });
  g.action('p1', { t: 'equip', uid: 'x' + uidc });
  const bigs = [a.equip.body, ...a.equip.head].filter((c) => c && c.big).length;
  ok(bigs === 2, 'Валера: несколько крупных');
  b.hand.push(item('Крупное', 5, 'body', { big: true }));
  b.equip.body = item('Крупное2', 5, 'body', { big: true });
  g.turnIdx = 1; // передаём ход Боре, чтобы проверка «своего хода» прошла
  expectThrow(() => g.action('p2', { t: 'equip', uid: b.hand[b.hand.length - 1].uid }),
    'обычный: второй крупный запрещён', 'крупная вещь');

  // Тимур: побег без кубика раз за игру
  b.klass = { name: 'Тимур', power: 'escapeOnce', uid: 'k6' };
  g.combat = { fighterId: 'p2', monsters: [monster('Злюка2', 9)], monsterBonus: 0, monsterDebuff: 0,
    sideBonus: 0, helperId: null, askId: null, wizardEscaped: false };
  g.phase = 'run';
  g.action('p2', { t: 'wizardEscape' });
  ok(g.phase === 'charity', 'Тимур: побег без кубика');
  g.combat = { fighterId: 'p2', monsters: [monster('Злюка3', 9)], monsterBonus: 0, monsterDebuff: 0,
    sideBonus: 0, helperId: null, askId: null, wizardEscaped: false };
  g.phase = 'run';
  expectThrow(() => g.action('p2', { t: 'wizardEscape' }), 'Тимур: раз за игру', 'раз за игру');

  // Данил: кража раз за игру
  b.klass = { name: 'Данил', power: 'thief', uid: 'k7' };
  b.stealUsed = false;
  a.equip.transport.push(item('Старлетка', 2, 'transport'));
  const aEq = [a.equip.body, ...a.equip.head, ...a.equip.feet, ...a.equip.transport, ...a.equip.hands].filter(Boolean).length;
  const bHand0 = b.hand.length;
  g.action('p2', { t: 'steal', targetId: 'p1' });
  const aEq2 = [a.equip.body, ...a.equip.head, ...a.equip.feet, ...a.equip.transport, ...a.equip.hands].filter(Boolean).length;
  ok(aEq2 === aEq - 1 && b.hand.length === bHand0 + 1, 'Данил: кража шмотки (случайный предмет перешёл вору)');
  expectThrow(() => g.action('p2', { t: 'steal', targetId: 'p1' }), 'Данил: раз за игру', 'уже использована');

  // ПМЖ запреты (возвращаем ход Ане)
  g.turnIdx = 0;
  a.klass = { name: 'Данил', power: 'thief', uid: 'k8' };
  a.hand.push({ type: 'race', name: 'СПб', text: '', power: 'spb', uid: 'r1' });
  expectThrow(() => g.action('p1', { t: 'playRace', uid: 'r1' }), 'Данил не может в СПб', 'не может жить');
  a.klass = { name: 'Макс', power: 'multiTransport', uid: 'k9' };
  a.hand.push({ type: 'race', name: 'Москва', text: '', power: 'moscow', uid: 'r2' });
  expectThrow(() => g.action('p1', { t: 'playRace', uid: 'r2' }), 'Макс не может в Москву', 'не может жить');
  a.hand.push({ type: 'race', name: 'Ухта', text: '', power: 'ukhta', uid: 'r3' });
  g.action('p1', { t: 'playRace', uid: 'r3' });
  ok(a.race && a.race.power === 'ukhta', 'Ухта доступна всем');

  // обратный порядок: сначала ПМЖ, потом класс — запрет тоже работает
  a.klass = null; // сценарий «ПМЖ без класса»
  a.hand.push({ type: 'race', name: 'Москва', text: '', power: 'moscow', uid: 'r4' });
  g.action('p1', { t: 'playRace', uid: 'r4' }); // без класса Москва разрешена
  a.hand.push({ type: 'klass', name: 'Серёга', text: '', power: 'run2', uid: 'k10' });
  expectThrow(() => g.action('p1', { t: 'playClass', uid: 'k10' }),
    'Москва + Серёга после ПМЖ запрещено', 'там жить не может');
  a.hand.push({ type: 'klass', name: 'Кузян', text: '', power: 'multiFeet', uid: 'k11' });
  g.action('p1', { t: 'playClass', uid: 'k11' });
  ok(a.klass && a.klass.power === 'multiFeet', 'Москва + Кузян допустимо');
}

console.log('=== 5. Модификаторы монстров ===');
{
  const g = new Game('T5');
  g.addPlayer('p1', 'Аня'); g.addPlayer('p2', 'Боря'); g.start();
  const [a, b] = [g.find('p1'), g.find('p2')];
  for (const p of [a, b]) while (p.hand.length > 5) g.discard(p.hand.pop());
  a.klass = { name: 'Макс', power: 'multiTransport', uid: 'k1' };
  a.race = { name: 'СПб', power: 'spb', uid: 'r1' };
  g.combat = { fighterId: 'p1', monsters: [monster('Гаишники', 8, { classMod: { power: 'multiTransport', bonus: 5 } })],
    monsterBonus: 0, monsterDebuff: 0, sideBonus: 0, helperId: null, askId: null, wizardEscaped: false };
  g.phase = 'combat';
  ok(g.monsterPower() === 13, 'мод против класса активен (8+5)');
  ok(g.classModNote().active === true && g.classModNote().target === 'класс', 'заметка: класс активен');
  g.combat.monsters[0].classMod = { power: 'spb', bonus: 3 };
  ok(g.monsterPower() === 11, 'мод против ПМЖ активен (8+3)');
  ok(g.classModNote().target === 'ПМЖ', 'заметка: цель ПМЖ');
  g.combat.monsters[0].classMod = { power: 'thief', bonus: 5 };
  ok(g.monsterPower() === 8, 'мод на чужой класс не работает');
}

console.log('=== 6. Проклятия из руки и усиления ===');
{
  const g = new Game('T6');
  g.addPlayer('p1', 'Аня'); g.addPlayer('p2', 'Боря'); g.start();
  const [a, b] = [g.find('p1'), g.find('p2')];
  for (const p of [a, b]) while (p.hand.length > 5) g.discard(p.hand.pop());
  const curse = (effect, arg) => ({ type: 'curse', name: 'Тест', effect, arg, text: '', uid: 'cu' + (++uidc) });
  const bLvl = b.level;
  a.hand.push(curse('loseLevel', 1));
  g.action('p1', { t: 'playCurse', uid: a.hand[a.hand.length - 1].uid, targetId: 'p2' });
  ok(b.level === Math.max(1, bLvl - 1), 'проклятие из руки: уровень');
  b.klass = { name: 'Ссыкло', power: 'wizard', uid: 'kk' };
  a.hand.push(curse('loseClass', null));
  g.action('p1', { t: 'playCurse', uid: a.hand[a.hand.length - 1].uid, targetId: 'p2' });
  ok(!b.klass, 'проклятие из руки: класс');
  a.hand.push(curse('pendingMonster', 5));
  g.action('p1', { t: 'playCurse', uid: a.hand[a.hand.length - 1].uid, targetId: 'p2' });
  ok(b.pendingMonsterBonus === 5, 'проклятие: монстр +5 в след. бою');
  b.pendingMonsterBonus = 0;
  a.hand.push(curse('skipTurn', null));
  g.action('p1', { t: 'playCurse', uid: a.hand[a.hand.length - 1].uid, targetId: 'p2' });
  ok(b.skipNext === true, 'проклятие: пропуск хода');
  b.skipNext = false;

  // усилитель монстра: только не-участник, в бою
  g.combat = { fighterId: 'p1', monsters: [monster('Тролль', 5)], monsterBonus: 0, monsterDebuff: 0,
    sideBonus: 0, helperId: null, askId: null, wizardEscaped: false };
  g.phase = 'combat';
  a.hand.push({ type: 'enhancer', name: 'Разозлили', bonus: 5, uid: 'en1' });
  expectThrow(() => g.action('p1', { t: 'playEnhancer', uid: 'en1' }), 'в свой бой усилить нельзя', 'В свой бой');
  b.hand.push({ type: 'enhancer', name: 'Разозлили', bonus: 5, uid: 'en2' });
  g.action('p2', { t: 'playEnhancer', uid: 'en2' });
  ok(g.monsterPower() === 10, 'усилитель от другого игрока работает');
  // одноразовые карты бьющими
  a.hand.push({ type: 'oneShot', name: 'Зелье', bonus: 4, uid: 'os1' });
  g.action('p1', { t: 'playOneShot', uid: 'os1' });
  ok(g.combat.sideBonus === 4, 'разовая карта добавляет силе');
  g.combat = null;
}

console.log('=== 7. Шмот: лимиты, продажа, уровни ===');
{
  const g = new Game('T7');
  g.addPlayer('p1', 'Аня'); g.addPlayer('p2', 'Боря'); g.start();
  const [a, b] = [g.find('p1'), g.find('p2')];
  for (const p of [a, b]) while (p.hand.length > 5) g.discard(p.hand.pop());
  g.turnIdx = 0; g.phase = 'charity';

  // две руки
  a.hand.push(item('Одна рука', 2, 'hands'), item('Две руки', 3, 'hands', { hands: 2 }));
  g.action('p1', { t: 'equip', uid: 'x' + (uidc - 1) });
  expectThrow(() => g.action('p1', { t: 'equip', uid: 'x' + uidc }),
    'третья рука запрещена', 'Не хватает рук');

  // продажа на уровень
  a.level = 4;
  a.hand.push(item('Золотая безделушка', 1, 'hands', { price: 1100 }));
  const lvl0 = a.level;
  g.action('p1', { t: 'sell', uids: [a.hand[a.hand.length - 1].uid] });
  ok(a.level === lvl0 + 1, 'продажа 1000+ золота = уровень');

  // карта уровня капится на 9
  a.level = 9;
  a.hand.push({ type: 'levelUp', name: 'Подарок', arg: 2, uid: 'lu1' });
  g.action('p1', { t: 'levelUp', uid: 'lu1' });
  ok(a.level === 9, 'карта уровня не даёт 10-й');

  // благотворительность
  for (let i = 0; i < 7; i++) a.hand.push(item('Хлам ' + i, 1, 'hands'));
  expectThrow(() => g.action('p1', { t: 'endTurn' }), 'ход нельзя закончить с 8 картами', 'Благотворительность');
  while (a.hand.length > 5) g.discard(a.hand.pop());
  g.action('p1', { t: 'endTurn' });
  ok(g.turnPlayer().id === 'p2', 'ход перешёл после сброса');
}

console.log('=== 8. Помощь, эльф, пересборка колоды ===');
{
  const g = new Game('T8');
  g.addPlayer('p1', 'Аня'); g.addPlayer('p2', 'Боря'); g.addPlayer('p3', 'Вика'); g.start();
  const [a, b, v] = [g.find('p1'), g.find('p2'), g.find('p3')];
  for (const p of [a, b, v]) while (p.hand.length > 5) g.discard(p.hand.pop());
  g.turnIdx = 0; g.phase = 'kick';
  g.doorDeck.push(monster('Грозный', 10));
  g.action('p1', { t: 'kick' });
  g.action('p1', { t: 'askHelp', targetId: 'p2' });
  g.action('p2', { t: 'respondHelp', accept: true });
  ok(g.combat.helperId === 'p2', 'помощник присоединился');
  g.combat.sideBonus = 30;
  const bLvl = b.level, bRace = { name: 'Мем-легенда', power: 'elf', uid: 'rr' };
  b.race = bRace;
  g.action('p1', { t: 'resolve' });
  ok(b.level === Math.min(9, bLvl + 1), 'эльф: +1 уровень за помощь (сокровище тоже прилетело)');

  // пересборка колоды
  const g2 = new Game('T8b');
  g2.addPlayer('q1', 'X'); g2.addPlayer('q2', 'Y'); g2.start();
  g2.doorDeck = [];
  g2.doorDiscard.push(monster('Из сброса', 1));
  g2.turnIdx = 0; g2.phase = 'kick';
  g2.action('q1', { t: 'kick' });
  ok(g2.combat && g2.combat.monsters[0].name === 'Из сброса', 'пустая колода пересобирается из сброса');
}

console.log('\n─────────────────────────────');
console.log(`ИТОГО: ✅ ${pass}  ❌ ${fail}`);
process.exit(fail ? 1 : 0);
