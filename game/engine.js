// ============================================================================
//  ДВИЖОК ИГРЫ — правила манчкина (упрощённое ядро)
//  Сервер авторитетный: все действия проверяются здесь.
// ============================================================================

'use strict';
const { DOOR_DECK, TREASURE_DECK } = require('./cards');

let UID = 0;
const newUid = () => 'u' + (++UID);

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const HAND_LIMIT = 5;
const WIN_LEVEL = 10;
const SELL_LEVEL = 1000;

class Game {
  constructor(code) {
    this.code = code;
    this.phase = 'lobby';           // lobby | kick | combat | run | charity | over
    this.players = [];
    this.turnIdx = 0;
    this.doorDeck = shuffle(DOOR_DECK.map((cd) => ({ ...cd, uid: newUid() })));
    this.doorDiscard = [];
    this.treasureDeck = shuffle(TREASURE_DECK.map((cd) => ({ ...cd, uid: newUid() })));
    this.treasureDiscard = [];
    this.combat = null;
    this.winner = null;
    this.log = [];
    this.chat = [];
  }

  // ------------------------------------------------------------------ утилиты
  say(text) {
    this.log.push({ text, ts: Date.now() });
    if (this.log.length > 80) this.log.splice(0, this.log.length - 80);
  }
  chatMsg(name, text) {
    this.chat.push({ name, text: String(text).slice(0, 200), ts: Date.now() });
    if (this.chat.length > 80) this.chat.splice(0, this.chat.length - 80);
  }
  turnPlayer() { return this.players[this.turnIdx] || null; }
  find(id) { return this.players.find((p) => p.id === id) || null; }
  isFighterOrHelper(p) {
    return !!this.combat && (p.id === this.combat.fighterId || p.id === this.combat.helperId);
  }
  ownTurnOrInCombat(p) {
    return this.turnPlayer()?.id === p.id || this.isFighterOrHelper(p);
  }

  // ------------------------------------------------------------------- лобби
  addPlayer(id, name) {
    this.players.push({
      id, name,
      level: 1,
      klass: null,                       // инстанс карты класса
      equip: { head: [], body: null, feet: [], transport: [], hands: [] },
      race: null,                        // инстанс карты расы
      halflingUsed: false,               // Хафлинг: кража из руки
      escapeUsed: false,                 // Тимур: побег без кубика раз за игру
      healUsed: false,                   // Слава: +1 уровень раз за игру
      hand: [],
      pendingMonsterBonus: 0,            // «Слухи за спиной»
      skipNext: false,                   // «Красный свет»
      stealUsed: false,                  // Вор
      healUsed: false,                   // Клирик
      connected: true,
    });
    this.say(`${name} присоединяется к игре.`);
  }
  removePlayer(id) {
    const i = this.players.findIndex((p) => p.id === id);
    if (i >= 0) this.say(`${this.players[i].name} выходит из игры.`);
    this.players.splice(i, 1);
    if (this.turnIdx >= this.players.length) this.turnIdx = 0;
  }

  start() {
    if (this.players.length < 2) throw new Error('Нужно минимум 2 игрока');
    for (const p of this.players) {
      p.hand.push(...this.draw('door', 4));
      p.hand.push(...this.draw('treasure', 4));
      if (!p.hand.some((c) => c.type === 'klass')) {
        const i = this.doorDeck.findIndex((c) => c.type === 'klass');
        if (i >= 0) p.hand.push(this.doorDeck.splice(i, 1)[0]);
      }
    }
    this.turnIdx = Math.floor(Math.random() * this.players.length);
    this.phase = 'kick';
    this.say(`Игра началась! Первый ход: ${this.turnPlayer().name}.`);
  }

  // --------------------------------------------------------------- карты/рука
  draw(kind, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const deck = kind === 'door' ? this.doorDeck : this.treasureDeck;
      const disc = kind === 'door' ? this.doorDiscard : this.treasureDiscard;
      if (!deck.length) {
        if (!disc.length) break;
        deck.push(...shuffle(disc.splice(0)));
        this.say(`Колода «${kind === 'door' ? 'Дверей' : 'Сокровищ'}» пересобрана из сброса.`);
      }
      out.push(deck.pop());
    }
    return out;
  }
  discard(c) {
    (c.type === 'item' || c.type === 'levelUp' || c.type === 'oneShot'
      ? this.treasureDiscard : this.doorDiscard).push(c);
  }
  takeFromHand(p, uid) {
    const i = p.hand.findIndex((c) => c.uid === uid);
    if (i < 0) throw new Error('Карты нет в руке');
    return p.hand.splice(i, 1)[0];
  }

  equipBonus(p) {
    let b = 0;
    if (p.equip.body) b += p.equip.body.bonus;
    for (const s of ['head', 'feet', 'transport', 'hands'])
      b += p.equip[s].reduce((a, c) => a + c.bonus, 0);
    return b;
  }
  runBonus(p) {
    let b = 0;
    if (p.equip.body) b += p.equip.body.runBonus || 0;
    for (const s of ['head', 'feet', 'transport', 'hands'])
      b += p.equip[s].reduce((a, c) => a + (c.runBonus || 0), 0);
    if (this.hasClass(p, 'run2')) b += 2;   // Серёга
    return b;
  }
  powerOf(p) { return p.level + this.equipBonus(p); }

  hasClass(p, power) { return !!p.klass && p.klass.power === power; }
  hasRace(p, power) { return !!p.race && p.race.power === power; }

  // ПМЖ: кто где не может жить (ключи — способности классов друзей)
  static PZH_FORBIDDEN = {
    spb: ['thief', 'levelHead2', 'multiFeet', 'multiBig'],      // Данил, Слава, Кузян, Валера
    moscow: ['multiTransport', 'run2', 'escapeOnce'],           // Макс, Серёга, Тимур
  };
  static CLASS_POWERS = ['run2', 'multiTransport', 'thief', 'levelHead2', 'multiFeet', 'multiBig', 'escapeOnce', 'warrior', 'wizard', 'cleric'];
  static RACE_POWERS = ['ukhta', 'moscow', 'spb', 'elf', 'dwarf', 'halfling'];

  // ---------------------------------------------------------------- шмот/класс
  slotLimit(p, slot) {
    if (slot === 'head') return this.hasClass(p, 'levelHead2') ? 2 : 1;           // Слава
    if (slot === 'feet') return this.hasClass(p, 'multiFeet') ? 99 : 1;           // Кузян
    if (slot === 'transport') return this.hasClass(p, 'multiTransport') ? 99 : 1; // Макс
    return 1;
  }
  equipCard(p, uid) {
    if (!this.ownTurnOrInCombat(p)) throw new Error('Сейчас нельзя экипировать');
    const card = this.takeFromHand(p, uid);
    if (card.type !== 'item') { p.hand.push(card); throw new Error('Это не шмот'); }
    const anyBig = p.equip.hands.some((c) => c.big) || (p.equip.body && p.equip.body.big) ||
      ['head', 'feet', 'transport'].some((s) => p.equip[s].some((c) => c.big));
    if (card.big && anyBig && !this.hasRace(p, 'dwarf') && !this.hasClass(p, 'multiBig')) {
      p.hand.push(card);
      throw new Error('Уже надета крупная вещь — сначала сними её');
    }
    if (card.slot === 'body') {
      const old = p.equip.body;
      p.equip.body = card;
      if (old) p.hand.push(old);
    } else if (card.slot === 'hands') {
      const used = p.equip.hands.reduce((a, c) => a + c.hands, 0);
      if (used + card.hands > 2) {
        p.hand.push(card);
        throw new Error('Не хватает рук (максимум 2)');
      }
      p.equip.hands.push(card);
    } else {
      const slot = p.equip[card.slot];
      const limit = this.slotLimit(p, card.slot);
      if (slot.length >= limit) {
        if (limit === 1) {
          p.hand.push(slot.shift());        // авто-замена единственной вещи
        } else {
          p.hand.push(card);
          throw new Error('Больше ' + (limit === 2 ? 'двух' : limit) + ' вещей в этом слоте не надеть');
        }
      }
      slot.push(card);
    }
    this.say(`${p.name} надевает «${card.name}».`);
  }
  unequipCard(p, uid) {
    if (this.phase === 'over') throw new Error('Игра окончена');
    let card = null;
    if (p.equip.body?.uid === uid) { card = p.equip.body; p.equip.body = null; }
    for (const s of ['head', 'feet', 'transport', 'hands']) {
      const i = p.equip[s].findIndex((c) => c.uid === uid);
      if (i >= 0) card = p.equip[s].splice(i, 1)[0];
    }
    if (!card) throw new Error('Это не надетая вещь');
    p.hand.push(card);
    this.say(`${p.name} снимает «${card.name}».`);
  }
  playClass(p, uid) {
    if (!this.ownTurnOrInCombat(p)) throw new Error('Сейчас нельзя сменить класс');
    const card = this.takeFromHand(p, uid);
    if (card.type !== 'klass') throw new Error('Это не класс');
    if (p.klass) this.discard(p.klass);
    p.klass = card;
    this.say(`${p.name} теперь ${card.name}!`);
  }
  playRace(p, uid) {
    if (!this.ownTurnOrInCombat(p)) throw new Error('Сейчас нельзя сменить ПМЖ');
    const card = this.takeFromHand(p, uid);
    if (card.type !== 'race') { p.hand.push(card); throw new Error('Это не ПМЖ'); }
    const forbidden = Game.PZH_FORBIDDEN[card.power] || [];
    if (p.klass && forbidden.includes(p.klass.power)) {
      p.hand.push(card);
      throw new Error(`${p.name} не может жить в «${card.name}»!`);
    }
    if (p.race) this.discard(p.race);
    p.race = card;
    this.say(`🧬 ${p.name} теперь живёт: ${card.name}!`);
  }
  stealFromHand(p, targetId) {
    if (!this.hasRace(p, 'halfling')) throw new Error('Кража из руки — это способность Хафлинга');
    if (p.halflingUsed) throw new Error('Кража из руки уже использована');
    const t = this.find(targetId);
    if (!t || t.id === p.id) throw new Error('Жертву выбери другую');
    if (!t.hand.length) throw new Error('У него пусто в руке');
    const card = t.hand[Math.floor(Math.random() * t.hand.length)];
    t.hand.splice(t.hand.indexOf(card), 1);
    p.hand.push(card);
    p.halflingUsed = true;
    this.say(`🫳 ${p.name} (${p.race.name}) наугад тянет карту из руки ${t.name}!`);
  }
  sellItems(p, uids) {
    if (!(this.turnPlayer()?.id === p.id && this.phase === 'charity'))
      throw new Error('Продавать можно в конце своего хода');
    const findEq = (uid) => {
      if (p.equip.body?.uid === uid) return p.equip.body;
      for (const s of ['head', 'feet', 'transport', 'hands']) {
        const c = p.equip[s].find((c) => c.uid === uid);
        if (c) return c;
      }
      return null;
    };
    const total = uids.reduce((a, uid) => {
      const c = p.hand.find((c) => c.uid === uid) || findEq(uid);
      if (!c || c.type !== 'item') throw new Error('Продавать можно только шмот');
      return a + (c.price || 0);
    }, 0);
    if (total < SELL_LEVEL) throw new Error(`Нужно золота на ${SELL_LEVEL}, а вышло ${total}`);
    for (const uid of uids) {
      try { this.discard(this.takeFromHand(p, uid)); continue; } catch {}
      if (p.equip.body?.uid === uid) { this.discard(p.equip.body); p.equip.body = null; continue; }
      for (const s of ['head', 'feet', 'transport', 'hands']) {
        const i = p.equip[s].findIndex((c) => c.uid === uid);
        if (i >= 0) this.discard(p.equip[s].splice(i, 1)[0]);
      }
    }
    p.level = Math.min(WIN_LEVEL - 1, p.level + 1);
    this.say(`${p.name} продал хлама на ${total} золота и поднял уровень (${p.level}).`);
  }
  discardFromHand(p, uid) {
    this.discard(this.takeFromHand(p, uid));
  }
  playLevelUp(p, uid) {
    const card = this.takeFromHand(p, uid);
    if (card.type !== 'levelUp') { p.hand.push(card); throw new Error('Это не карта уровня'); }
    p.level = Math.min(WIN_LEVEL - 1, p.level + card.arg);
    this.discard(card);
    this.say(`${p.name} играет «${card.name}»: +${card.arg} ур. (теперь ${p.level}).`);
  }

  // --------------------------------------------------------------------- ход
  kickDoor(p) {
    if (this.turnPlayer()?.id !== p.id) throw new Error('Не твой ход');
    if (this.phase !== 'kick') throw new Error('Сейчас не фаза двери');
    const card = this.draw('door', 1)[0];
    if (!card) throw new Error('В колоде кончились карты');
    if (card.type === 'monster') {
      this.say(`${p.name} открыл дверь: ${card.name} (сила ${card.level})! БОЙ!`);
      this.startCombat(p, card);
    } else if (card.type === 'curse') {
      this.say(`${p.name} открыл дверь: проклятие «${card.name}».`);
      this.applyCurse(p, card);
      this.discard(card);
      this.phase = 'charity';
    } else {
      p.hand.push(card);
      this.say(`${p.name} открывает дверь — там «${card.name}». Забирает в руку.`);
      this.phase = 'charity';
    }
  }

  // --------------------------------------------------------------------- бой
  startCombat(fighter, card) {
    this.combat = {
      fighterId: fighter.id,
      monsters: [card],
      monsterBonus: 0,
      monsterDebuff: 0,
      sideBonus: 0,
      helperId: null,
      askId: null,
      wizardEscaped: false,
    };
    if (fighter.pendingMonsterBonus) {
      this.combat.monsterBonus += fighter.pendingMonsterBonus;
      this.say(`Проклятие сработало: монстр +${fighter.pendingMonsterBonus}!`);
      fighter.pendingMonsterBonus = 0;
    }
    this.phase = 'combat';
  }
  fighter() { return this.combat ? this.find(this.combat.fighterId) : null; }
  helper() { return this.combat && this.combat.helperId ? this.find(this.combat.helperId) : null; }
  modApplies(p, power) {
    return (p.klass && p.klass.power === power) || (p.race && p.race.power === power);
  }
  monsterPower() {
    let mp = this.combat.monsters.reduce((a, m) => a + m.level, 0)
      + this.combat.monsterBonus - this.combat.monsterDebuff;
    const side = [this.fighter(), this.helper()].filter(Boolean);
    for (const m of this.combat.monsters) {
      if (m.classMod && side.some((p) => this.modApplies(p, m.classMod.power)))
        mp += m.classMod.bonus;
    }
    return mp;
  }
  classModNote() {
    const m = this.combat.monsters[0];
    if (!m || !m.classMod) return null;
    const side = [this.fighter(), this.helper()].filter(Boolean);
    const active = side.some((p) => this.modApplies(p, m.classMod.power));
    const target = Game.CLASS_POWERS.includes(m.classMod.power) ? 'класс' : 'ПМЖ';
    return { bonus: m.classMod.bonus, active, target };
  }
  sidePower() {
    const f = this.fighter(), h = this.helper();
    return this.powerOf(f) + (h ? this.powerOf(h) : 0) + this.combat.sideBonus;
  }
  sideHasWarrior() {
    return [this.fighter(), this.helper()].some((p) => p && this.hasClass(p, 'warrior'));
  }

  resolveFight(p) {
    if (!this.combat || this.combat.fighterId !== p.id) throw new Error('Ты не ведёшь этот бой');
    if (this.phase !== 'combat') throw new Error('Бой уже решён');
    const mp = this.monsterPower(), sp = this.sidePower();
    const win = sp > mp || (sp === mp && this.sideHasWarrior());
    const f = this.fighter(), h = this.helper();
    if (win) {
      const levels = this.combat.monsters.reduce((a, m) => a + m.levels, 0);
      const treasures = this.combat.monsters.reduce((a, m) => a + m.treasures, 0);
      this.say(`ПОБЕДА! ${f.name} (${sp}) побеждает ${this.combat.monsters[0].name} (${mp}).`);
      for (const m of this.combat.monsters) this.discard(m);
      f.level = Math.min(WIN_LEVEL, f.level + levels);
      this.say(`${f.name} получает ${levels} ур. (${f.level}) и ${treasures} сокровищ(а).`);
      if (h) {
        const bonus = this.draw('treasure', 1);
        h.hand.push(...bonus);
        this.say(`${h.name} (помощник) получает 1 сокровище.`);
        if (this.hasRace(h, 'elf') && h.level < WIN_LEVEL - 1) {
          h.level += 1;
          this.say(`🧝 ${h.name} (${h.race.name}) получает +1 уровень за помощь.`);
        }
      }
      const tr = this.draw('treasure', treasures);
      f.hand.push(...tr);
      this.combat = null;
      this.phase = 'charity';
      if (f.level >= WIN_LEVEL) return this.winGame(f);
    } else {
      this.say(`Бой проигран: ${sp} против ${mp}. ${f.name} пытается убежать!`);
      this.phase = 'run';
    }
  }
  winGame(p) {
    this.winner = p.id;
    this.phase = 'over';
    this.combat = null;
    this.say(`🏆 ${p.name} достиг ${WIN_LEVEL}-го уровня и ПОБЕДИЛ!`);
  }

  askHelp(p, targetId) {
    if (!this.combat || this.phase !== 'combat' || this.combat.fighterId !== p.id)
      throw new Error('Помощь просит только боец');
    if (this.combat.helperId) throw new Error('Помощник уже есть');
    if (targetId === p.id) throw new Error('Себя звать не надо');
    const t = this.find(targetId);
    if (!t) throw new Error('Игрока нет');
    if (this.combat.askId === targetId) throw new Error('Он уже думает');
    this.combat.askId = targetId;
    this.say(`${p.name} зовёт на помощь: ${t.name}, выручай!`);
  }
  respondHelp(p, accept) {
    if (!this.combat || this.combat.askId !== p.id) throw new Error('Тебя не звали');
    const f = this.fighter();
    if (accept) {
      if (this.combat.helperId) throw new Error('Помощник уже есть');
      this.combat.helperId = p.id;
      this.say(`🤝 ${p.name} помогает в бою!`);
    } else {
      this.say(`${p.name} отказывает в помощи. Как некрасиво.`);
    }
    this.combat.askId = null;
  }

  wanderMonster(p, uid) {
    if (!this.combat || !['combat', 'run'].includes(this.phase))
      throw new Error('Подкидывать монстра можно только во время боя или побега');
    if (this.isFighterOrHelper(p)) throw new Error('В свой бой подкидывать нельзя');
    const card = this.takeFromHand(p, uid);
    if (card.type !== 'monster') { p.hand.push(card); throw new Error('Это не монстр'); }
    this.combat.monsters.push(card);
    this.say(`👹 ${p.name} подкидывает в бой ${card.name} (сила ${card.level})!`);
  }
  playOneShot(p, uid) {
    if (!this.combat || this.phase !== 'combat') throw new Error('Только в бою');
    if (!this.isFighterOrHelper(p)) throw new Error('Только участник боя');
    const card = this.takeFromHand(p, uid);
    if (card.type !== 'oneShot') throw new Error('Это не разовая карта');
    this.combat.sideBonus += card.bonus;
    this.discard(card);
    this.say(`${p.name} применяет «${card.name}»: +${card.bonus} команде.`);
  }
  playEnhancer(p, uid) {
    if (!this.combat || this.phase !== 'combat') throw new Error('Только в бою');
    if (this.isFighterOrHelper(p)) throw new Error('В свой бой подыгрывать монстру нельзя');
    const card = this.takeFromHand(p, uid);
    if (card.type !== 'enhancer') throw new Error('Это не усилитель монстра');
    this.combat.monsterBonus += card.bonus;
    this.discard(card);
    this.say(`${p.name} подкидывает монстру «${card.name}»: +${card.bonus}!`);
  }
  warriorDiscard(p, uid) {
    if (!this.combat || this.phase !== 'combat') throw new Error('Только в бою');
    if (!this.isFighterOrHelper(p) || !this.hasClass(p, 'warrior'))
      throw new Error('Только Воин в бою');
    const card = this.takeFromHand(p, uid);
    this.combat.monsterDebuff += 1;
    this.discard(card);
    this.say(`${p.name}-${p.klass.name} сбрасывает карту: монстр −1 (${this.monsterPower()}).`);
  }
  thiefSteal(p, targetId) {
    if (!this.hasClass(p, 'thief')) throw new Error('Это умеет только Данил (Вор)');
    if (p.stealUsed) throw new Error('Кража уже использована');
    const t = this.find(targetId);
    if (!t || t.id === p.id) throw new Error('Жертву выбери другую');
    const small = [
      ...(t.equip.body && !t.equip.body.big ? [t.equip.body] : []),
      ...['head', 'feet', 'transport', 'hands'].flatMap((s) => t.equip[s].filter((c) => !c.big)),
    ];
    if (!small.length) throw new Error('У него нечего спереть (только крупное или пусто)');
    const card = small[Math.floor(Math.random() * small.length)];
    let removed = false;
    if (t.equip.body?.uid === card.uid) { t.equip.body = null; removed = true; }
    for (const s of ['head', 'feet', 'transport', 'hands']) {
      const i = t.equip[s].findIndex((c) => c.uid === card.uid);
      if (i >= 0) { t.equip[s].splice(i, 1); removed = true; }
    }
    if (removed) p.hand.push(card);
    p.stealUsed = true;
    this.say(`😵 ${p.name}-${p.klass.name} крадёт «${card.name}» у ${t.name}!`);
  }
  clericHeal(p) {
    if (!this.hasClass(p, 'levelHead2')) throw new Error('+1 уровень — это способность Славы');
    if (p.healUsed) throw new Error('Уже использовано (раз за игру)');
    if (p.level >= WIN_LEVEL - 1) throw new Error('Уровень слишком высок для этого');
    p.level += 1;
    p.healUsed = true;
    this.say(`✨ ${p.name} (${p.klass.name}) получает +1 уровень (${p.level}).`);
  }

  // ------------------------------------------------------------------- побег
  wizardEscape(p) {
    if (!this.combat || this.phase !== 'run') throw new Error('Поздно телепортироваться');
    if (!this.isFighterOrHelper(p) || !this.hasClass(p, 'escapeOnce'))
      throw new Error('Побег без кубика — это способность ' + (p.klass ? p.klass.name : 'Тимура'));
    if (p.escapeUsed) throw new Error('Этот побег уже использован (раз за игру)');
    p.escapeUsed = true;
    const f = this.fighter();
    this.say(`🌀 ${p.name} (${p.klass.name}) уносит отряд без броска!`);
    for (const m of this.combat.monsters) this.discard(m);
    this.combat = null;
    this.phase = 'charity';
  }
  tryRun(p) {
    if (!this.combat || !['combat', 'run'].includes(this.phase) || this.combat.fighterId !== p.id)
      throw new Error('Убегает только боец');
    const roll = 1 + Math.floor(Math.random() * 6);
    const bonus = this.runBonus(p) + (this.helper() ? this.runBonus(this.helper()) : 0);
    const total = roll + bonus;
    this.say(`${p.name} убегает: кубик ${roll}${bonus ? ` + ${bonus} за шмот` : ''} = ${total} (нужно 5+).`);
    for (const m of this.combat.monsters) this.discard(m);
    const monster = this.combat.monsters[0];
    this.combat = null;
    if (total >= 5) {
      this.say(`${p.name} удирает, унося целыми штаны.`);
      this.phase = 'charity';
    } else {
      this.say(`Побег не удался! Дурные последствия: ${monster.text}`);
      this.applyBadStuff(p, monster);
      this.phase = 'charity';
    }
  }
  applyBadStuff(p, monster) {
    const bad = monster.bad;
    switch (bad.t) {
      case 'none': break;
      case 'loseLevel':
        p.level = Math.max(1, p.level - bad.n);
        this.say(`${p.name} теряет ${bad.n} ур. (теперь ${p.level}).`);
        break;
      case 'loseSlot': {
        const pool = bad.slot === 'body' ? (p.equip.body ? [p.equip.body] : [])
          : [...p.equip[bad.slot]];
        if (!pool.length) { this.say(`…но у ${p.name} там и так пусто.`); break; }
        const card = pool[Math.floor(Math.random() * pool.length)];
        if (bad.slot === 'body') p.equip.body = null;
        else p.equip[bad.slot].splice(p.equip[bad.slot].indexOf(card), 1);
        this.discard(card);
        this.say(`${p.name} теряет «${card.name}».`);
        break;
      }
      case 'loseClass':
        if (p.klass) { this.discard(p.klass); this.say(`${p.name} теряет класс «${p.klass.name}».`); p.klass = null; }
        else this.say(`…но у ${p.name} и так нет класса.`);
        break;
      case 'loseRandomSlot': {
        const pool = [
          ...(p.equip.body ? [p.equip.body] : []),
          ...['head', 'feet', 'transport', 'hands'].flatMap((s) => p.equip[s]),
        ];
        if (!pool.length) { this.say(`…но у ${p.name} и так нечего терять.`); break; }
        const lost = pool[Math.floor(Math.random() * pool.length)];
        if (p.equip.body?.uid === lost.uid) p.equip.body = null;
        for (const s of ['head', 'feet', 'transport', 'hands']) {
          const li = p.equip[s].findIndex((x) => x.uid === lost.uid);
          if (li >= 0) p.equip[s].splice(li, 1);
        }
        this.discard(lost);
        this.say(`${p.name} теряет «${lost.name}».`);
        break;
      }
      case 'skipTurn':
        p.skipNext = true;
        this.say(`${p.name} пропустит следующий ход.`);
        break;
      case 'death': {
        this.say(`☠ ${p.name} ПОГИБАЕТ. Уровень сброшен, шмот в сброс.`);
        p.level = 1;
        p.klass && this.discard(p.klass); p.klass = null;
        p.race && this.discard(p.race); p.race = null;
        if (p.equip.body) { this.discard(p.equip.body); p.equip.body = null; }
        for (const s of ['head', 'feet', 'transport', 'hands'])
          for (const c of p.equip[s].splice(0)) this.discard(c);
        p.hand.push(...this.draw('door', 4));
        this.say(`${p.name} начинает заново и добирает 4 карты Дверей.`);
        break;
      }
    }
  }

  // --------------------------------------------------------------- проклятия
  applyCurse(target, card) {
    switch (card.effect) {
      case 'loseLevel':
        target.level = Math.max(1, target.level - card.arg);
        this.say(`${target.name}: −${card.arg} ур. (теперь ${target.level}).`);
        break;
      case 'loseSlot': {
        const pool = card.arg === 'body' ? (target.equip.body ? [target.equip.body] : [])
          : [...target.equip[card.arg]];
        if (!pool.length) { this.say(`Проклятие «${card.name}» не сработало: пусто.`); break; }
        const c = pool[Math.floor(Math.random() * pool.length)];
        if (card.arg === 'body') target.equip.body = null;
        else target.equip[card.arg].splice(target.equip[card.arg].indexOf(c), 1);
        this.discard(c);
        this.say(`${target.name} теряет «${c.name}» (проклятие).`);
        break;
      }
      case 'loseClass':
        if (target.klass) {
          this.say(`${target.name} теряет класс «${target.klass.name}» (проклятие).`);
          this.discard(target.klass); target.klass = null;
        } else this.say(`Проклятие «${card.name}» не сработало: класса нет.`);
        break;
      case 'pendingMonster':
        target.pendingMonsterBonus += card.arg;
        this.say(`На ${target.name} наведены слухи: следующий монстр +${card.arg}.`);
        break;
      case 'loseRandomSlot': {
        const pool = [
          ...(target.equip.body ? [target.equip.body] : []),
          ...['head', 'feet', 'transport', 'hands'].flatMap((s) => target.equip[s]),
        ];
        if (!pool.length) { this.say(`Проклятие «${card.name}» не сработало: пусто.`); break; }
        const lost = pool[Math.floor(Math.random() * pool.length)];
        if (target.equip.body?.uid === lost.uid) target.equip.body = null;
        for (const s of ['head', 'feet', 'transport', 'hands']) {
          const li = target.equip[s].findIndex((x) => x.uid === lost.uid);
          if (li >= 0) target.equip[s].splice(li, 1);
        }
        this.discard(lost);
        this.say(`${target.name} теряет «${lost.name}» — скрины ушли маме.`);
        break;
      }
      case 'skipTurn':
        target.skipNext = true;
        this.say(`${target.name} пропустит следующий ход (красный свет!).`);
        break;
    }
  }
  playCurse(p, uid, targetId) {
    const t = this.find(targetId);
    if (!t) throw new Error('Жертва не найдена');
    const card = this.takeFromHand(p, uid);
    if (card.type !== 'curse') throw new Error('Это не проклятие');
    this.say(`${p.name} накладывает «${card.name}» на ${t.name}!`);
    this.applyCurse(t, card);
    this.discard(card);
  }

  // -------------------------------------------------------------- конец хода
  endTurn(p) {
    if (this.turnPlayer()?.id !== p.id) throw new Error('Не твой ход');
    if (this.combat) throw new Error('Сначала закончи бой');
    if (p.hand.length > HAND_LIMIT)
      throw new Error(`Благотворительность: сбрось ${p.hand.length - HAND_LIMIT} карт(ы)`);
    this.phase = 'kick';
    this.turnIdx = (this.turnIdx + 1) % this.players.length;
    let guard = 0;
    while (this.turnPlayer().skipNext && guard++ < this.players.length) {
      this.say(`🚦 ${this.turnPlayer().name} пропускает ход.`);
      this.turnPlayer().skipNext = false;
      this.turnIdx = (this.turnIdx + 1) % this.players.length;
    }
    this.say(`Ход переходит: ${this.turnPlayer().name}.`);
  }

  // ------------------------------------------------------------------ протокол
  action(playerId, msg) {
    const p = this.find(playerId);
    if (!p) throw new Error('Ты не в игре');
    switch (msg.t) {
      case 'start': this.start(); return;
      case 'kick': return this.kickDoor(p);
      case 'resolve': return this.resolveFight(p);
      case 'run': return this.tryRun(p);
      case 'wizardEscape': return this.wizardEscape(p);
      case 'askHelp': return this.askHelp(p, msg.targetId);
      case 'respondHelp': return this.respondHelp(p, !!msg.accept);
      case 'playOneShot': return this.playOneShot(p, msg.uid);
      case 'playEnhancer': return this.playEnhancer(p, msg.uid);
      case 'wanderMonster': return this.wanderMonster(p, msg.uid);
      case 'warriorDiscard': return this.warriorDiscard(p, msg.uid);
      case 'equip': return this.equipCard(p, msg.uid);
      case 'unequip': return this.unequipCard(p, msg.uid);
      case 'playClass': return this.playClass(p, msg.uid);
      case 'playRace': return this.playRace(p, msg.uid);
      case 'stealFromHand': return this.stealFromHand(p, msg.targetId);
      case 'sell': return this.sellItems(p, msg.uids || []);
      case 'discard': return this.discardFromHand(p, msg.uid);
      case 'playCurse': return this.playCurse(p, msg.uid, msg.targetId);
      case 'steal': return this.thiefSteal(p, msg.targetId);
      case 'heal': return this.clericHeal(p);
      case 'levelUp': return this.playLevelUp(p, msg.uid);
      case 'endTurn': return this.endTurn(p);
      case 'chat': return this.chatMsg(p.name, msg.text);
      default: throw new Error('Неизвестное действие');
    }
  }

  // ------------------------------------------------------ новая игра в комнате
  restart() {
    if (this.phase !== 'over') throw new Error('Игра ещё не закончилась');
    for (const p of this.players) {
      p.level = 1;
      p.klass = null;
      p.equip = { head: [], body: null, feet: [], transport: [], hands: [] };
      p.hand = [];
      p.race = null;
      p.halflingUsed = false;
      p.pendingMonsterBonus = 0;
      p.skipNext = false;
      p.stealUsed = false;
      p.healUsed = false;
      p.connected = this.find(p.id)?.connected ?? true;
    }
    this.doorDeck = shuffle(DOOR_DECK.map((cd) => ({ ...cd, uid: newUid() })));
    this.doorDiscard = [];
    this.treasureDeck = shuffle(TREASURE_DECK.map((cd) => ({ ...cd, uid: newUid() })));
    this.treasureDiscard = [];
    this.combat = null;
    this.winner = null;
    this.phase = 'lobby';
    this.say('Новая игра! Все вернулись в лобби.');
  }

  // -------------------------------------------------------------- виды клиента
  cardPublic(c) {
    if (!c) return null;
    return {
      uid: c.uid, type: c.type, name: c.name, text: c.text || '',
      bonus: c.bonus, level: c.level, slot: c.slot, big: c.big,
      runBonus: c.runBonus, price: c.price, arg: c.arg,
      levels: c.levels, treasures: c.treasures, hands: c.hands,
      power: c.power, classMod: c.classMod || null, img: c.img || null,
    };
  }
  playerPublic(p, withHand) {
    const equipped = [
      ...(p.equip.body ? [p.equip.body] : []),
      ...['head', 'feet', 'transport', 'hands'].flatMap((s) => p.equip[s]),
    ];
    return {
      id: p.id, name: p.name, level: p.level,
      klass: p.klass ? { name: p.klass.name, power: p.klass.power } : null,
      race: p.race ? { name: p.race.name, power: p.race.power } : null,
      halflingUsed: p.halflingUsed,
      power: this.powerOf(p),
      equipBonus: this.equipBonus(p),
      handCount: p.hand.length,
      pending: p.pendingMonsterBonus > 0,
      stealUsed: p.stealUsed, healUsed: p.healUsed, escapeUsed: p.escapeUsed,
      connected: p.connected,
      equip: {
        head: p.equip.head.map((c) => this.cardPublic(c)),
        body: this.cardPublic(p.equip.body),
        feet: p.equip.feet.map((c) => this.cardPublic(c)),
        transport: p.equip.transport.map((c) => this.cardPublic(c)),
        hands: p.equip.hands.map((c) => this.cardPublic(c)),
      },
      equippedCards: equipped.map((c) => this.cardPublic(c)),
      hand: withHand ? p.hand.map((c) => this.cardPublic(c)) : undefined,
    };
  }
  viewFor(playerId) {
    const me = this.find(playerId);
    return {
      code: this.code,
      phase: this.phase,
      winner: this.winner,
      turnPlayerId: this.turnPlayer()?.id || null,
      decks: {
        door: this.doorDeck.length,
        doorDiscardTop: this.cardPublic(this.doorDiscard[this.doorDiscard.length - 1] || null),
        treasure: this.treasureDeck.length,
        treasureDiscardTop: this.cardPublic(this.treasureDiscard[this.treasureDiscard.length - 1] || null),
      },
      players: this.players.map((p) => this.playerPublic(p, false)),
      you: me ? this.playerPublic(me, true) : null,
      combat: this.combat ? {
        fighterId: this.combat.fighterId,
        helperId: this.combat.helperId,
        askId: this.combat.askId,
        monsters: this.combat.monsters.map((m) => this.cardPublic(m)),
        monsterPower: this.monsterPower(),
        sidePower: this.sidePower(),
        sideBonus: this.combat.sideBonus,
        monsterBonus: this.combat.monsterBonus - this.combat.monsterDebuff,
        wizardEscaped: this.combat.wizardEscaped,
        classModNote: this.classModNote(),
      } : null,
      log: this.log.slice(-40),
      chat: this.chat.slice(-40),
    };
  }
}

module.exports = { Game };
