# -*- coding: utf-8 -*-
# Запрет ПМЖ↔класс в обе стороны: теперь и при смене класса проверяем текущее ПМЖ
import io

p = 'game/engine.js'
s = io.open(p, encoding='utf-8').read()

old = """  playClass(p, uid) {
    if (!this.ownTurnOrInCombat(p)) throw new Error('Сейчас нельзя сменить класс');
    const card = this.takeFromHand(p, uid);
    if (card.type !== 'klass') { p.hand.push(card); throw new Error('Это не класс'); }
    if (p.klass) this.discard(p.klass);
    p.klass = card;
    this.say(`${p.name} теперь ${card.name}!`);
  }"""
new = """  playClass(p, uid) {
    if (!this.ownTurnOrInCombat(p)) throw new Error('Сейчас нельзя сменить класс');
    const card = this.takeFromHand(p, uid);
    if (card.type !== 'klass') { p.hand.push(card); throw new Error('Это не класс'); }
    for (const [res, powers] of Object.entries(Game.PZH_FORBIDDEN)) {
      if (p.race && p.race.power === res && powers.includes(card.power)) {
        p.hand.push(card);
        throw new Error(`Ты живёшь в «${p.race.name}» — «${card.name}» там жить не может!`);
      }
    }
    if (p.klass) this.discard(p.klass);
    p.klass = card;
    this.say(`${p.name} теперь ${card.name}!`);
  }"""
assert old in s, 'playClass'
s = s.replace(old, new)

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('engine: ПМЖ-проверка при смене класса')

# тест в общий набор
p = 'test/mechanics.js'
s = io.open(p, encoding='utf-8').read()
old = """  a.hand.push({ type: 'race', name: 'Ухта', text: '', power: 'ukhta', uid: 'r3' });
  g.action('p1', { t: 'playRace', uid: 'r3' });
  ok(a.race && a.race.power === 'ukhta', 'Ухта доступна всем');"""
new = """  a.hand.push({ type: 'race', name: 'Ухта', text: '', power: 'ukhta', uid: 'r3' });
  g.action('p1', { t: 'playRace', uid: 'r3' });
  ok(a.race && a.race.power === 'ukhta', 'Ухта доступна всем');

  // обратный порядок: сначала ПМЖ, потом класс — запрет тоже работает
  a.hand.push({ type: 'race', name: 'Москва', text: '', power: 'moscow', uid: 'r4' });
  g.action('p1', { t: 'playRace', uid: 'r4' }); // без класса Москва разрешена
  a.hand.push({ type: 'klass', name: 'Серёга', text: '', power: 'run2', uid: 'k10' });
  expectThrow(() => g.action('p1', { t: 'playClass', uid: 'k10' }),
    'Москва + Серёга после ПМЖ запрещено', 'там жить не может');
  a.hand.push({ type: 'klass', name: 'Кузян', text: '', power: 'multiFeet', uid: 'k11' });
  g.action('p1', { t: 'playClass', uid: 'k11' });
  ok(a.klass && a.klass.power === 'multiFeet', 'Москва + Кузян допустимо');"""
assert old in s, 'test add'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('test: обратный порядок ПМЖ/класс')
