# -*- coding: utf-8 -*-
# Синергия шмота с классом: item.synergy = { power, bonus } — хозяину предмета бонус выше
import io, os, json

# ---------- 1. движок ----------
p = 'game/engine.js'
s = io.open(p, encoding='utf-8').read()

old = """  equipBonus(p) {
    let b = 0;
    if (p.equip.body) b += p.equip.body.bonus;
    for (const s of ['head', 'feet', 'transport', 'hands'])
      b += p.equip[s].reduce((a, c) => a + c.bonus, 0);
    return b;
  }"""
new = """  // эффективный бонус предмета: базовый + синергия, если надел «свой» класс
  effBonus(p, c) {
    let b = c.bonus;
    if (c.synergy && p.klass && p.klass.power === c.synergy.power) b += c.synergy.bonus;
    return b;
  }
  equipBonus(p) {
    let b = 0;
    if (p.equip.body) b += this.effBonus(p, p.equip.body);
    for (const s of ['head', 'feet', 'transport', 'hands'])
      b += p.equip[s].reduce((a, c) => a + this.effBonus(p, c), 0);
    return b;
  }"""
assert old in s, 'equipBonus'
s = s.replace(old, new)

old = """      power: c.power, classMod: c.classMod || null, img: c.img || null,
    };"""
new = """      power: c.power, classMod: c.classMod || null, img: c.img || null,
      synergy: c.synergy || null,
    };"""
assert old in s, 'cardPublic synergy'
s = s.replace(old, new)

# вид надетых карт: bonusEff — фактический бонус на этом игроке
old = """  playerPublic(p, withHand) {"""
new = """  cardPubEff(p, c) {
    if (!c) return null;
    return { ...this.cardPublic(c), bonusEff: this.effBonus(p, c) };
  }
  playerPublic(p, withHand) {"""
assert old in s, 'cardPubEff'
s = s.replace(old, new)

old = """      equip: {
        head: p.equip.head.map((c) => this.cardPublic(c)),
        body: this.cardPublic(p.equip.body),
        feet: p.equip.feet.map((c) => this.cardPublic(c)),
        transport: p.equip.transport.map((c) => this.cardPublic(c)),
        hands: p.equip.hands.map((c) => this.cardPublic(c)),
      },
      equippedCards: equipped.map((c) => this.cardPublic(c)),"""
new = """      equip: {
        head: p.equip.head.map((c) => this.cardPubEff(p, c)),
        body: this.cardPubEff(p, p.equip.body),
        feet: p.equip.feet.map((c) => this.cardPubEff(p, c)),
        transport: p.equip.transport.map((c) => this.cardPubEff(p, c)),
        hands: p.equip.hands.map((c) => this.cardPubEff(p, c)),
      },
      equippedCards: equipped.map((c) => this.cardPubEff(p, c)),"""
assert old in s, 'equip view'
s = s.replace(old, new)

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('engine: synergy')

# ---------- 2. клиент ----------
p = 'public/client.js'
s = io.open(p, encoding='utf-8').read()

old = """const KLASS_EMOJI = { run2: '🏃', multiTransport: '🚗', thief: '🗝️', levelHead2: '✨',
  multiFeet: '👟', multiBig: '🧱', escapeOnce: '🌀',
  warrior: '⚔️', wizard: '🧙', cleric: '✨' };"""
new = """const KLASS_EMOJI = { run2: '🏃', multiTransport: '🚗', thief: '🗝️', levelHead2: '✨',
  multiFeet: '👟', multiBig: '🧱', escapeOnce: '🌀',
  warrior: '⚔️', wizard: '🧙', cleric: '✨' };
const KLASS_NAME = { run2: 'Серёге', multiTransport: 'Максу', thief: 'Данилу',
  levelHead2: 'Славе', multiFeet: 'Кузяну', multiBig: 'Валере', escapeOnce: 'Тимуру' };"""
assert old in s, 'KLASS_NAME'
s = s.replace(old, new)

old = """  if (c.type === 'item') return `+${c.bonus}`;"""
new = """  if (c.type === 'item') return `+${c.bonusEff ?? c.bonus}`;"""
assert old in s, 'bonus label'
s = s.replace(old, new)

old = """  if (c.type === 'item' && c.price) bits.push(`💰 ${c.price}`);"""
new = """  if (c.type === 'item' && c.price) bits.push(`💰 ${c.price}`);
  if (c.synergy) bits.push(`🌟 ${KLASS_NAME[c.synergy.power] || c.synergy.power}: +${c.synergy.bonus}`);"""
assert old in s, 'bits synergy'
s = s.replace(old, new)

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('client: synergy')

# ---------- 3. CSS-звёздочка не нужна, текст достаточно ----------

# ---------- 4. конвейер: dump/build/render ----------
p = 'tools/dump-cards.js'
s = io.open(p, encoding='utf-8').read()
old = """    o.bonus = c.bonus; o.slot = c.slot; o.hands = c.hands || 1;
    o.big = !!c.big; o.price = c.price || 0; o.runBonus = c.runBonus || 0;"""
new = """    o.bonus = c.bonus; o.slot = c.slot; o.hands = c.hands || 1;
    o.big = !!c.big; o.price = c.price || 0; o.runBonus = c.runBonus || 0;
    o.synergy = c.synergy || null;"""
assert old in s, 'dump'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)

p = 'tools/build-cards.js'
s = io.open(p, encoding='utf-8').read()
old = """  if (r.type === 'item') Object.assign(card, {
    bonus: r.bonus, slot: r.slot, hands: r.hands || 1, big: !!r.big,
    price: r.price || 0, runBonus: r.runBonus || 0,
  });"""
new = """  if (r.type === 'item') Object.assign(card, {
    bonus: r.bonus, slot: r.slot, hands: r.hands || 1, big: !!r.big,
    price: r.price || 0, runBonus: r.runBonus || 0, synergy: r.synergy || null,
  });"""
assert old in s, 'build'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)

p = 'tools/render-cards.js'
s = io.open(p, encoding='utf-8').read()
old = """  if (c.runBonus) b.push(`👟 +${c.runBonus} к побегу`);
  if (c.type === 'item' && c.price) b.push(`💰 ${c.price} золота`);"""
new = """  if (c.runBonus) b.push(`👟 +${c.runBonus} к побегу`);
  if (c.synergy) b.push(`🌟 для своего класса: +${c.synergy.bonus}`);
  if (c.type === 'item' && c.price) b.push(`💰 ${c.price} золота`);"""
assert old in s, 'render bits'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('pipeline: synergy')

# ---------- 5. читатель Excel ----------
p = 'tools/read_cards_xlsx.py'
s = io.open(p, encoding='utf-8').read()
old = '''    elif ctype == "item":
        if bonus is None: row_err.append("у шмота пустая «Сила/Бонус»")
        if not slot: row_err.append("у шмота нет слота")'''
new = '''    elif ctype == "item":
        if bonus is None: row_err.append("у шмота пустая «Сила/Бонус»")
        if not slot: row_err.append("у шмота нет слота")
        syn_label = val(rn, "Синергия с классом")
        synergy = None
        if syn_label:
            syn_power = POWER_BACK.get(str(syn_label).strip())
            syn_bonus = num(val(rn, "Бонус хозяину"))
            if not syn_power: row_err.append(f"неизвестный класс синергии «{syn_label}» (см. Справку)")
            elif syn_bonus is None: row_err.append("есть «Синергия с классом», но пустой «Бонус хозяину»")
            else: synergy = {"power": syn_power, "bonus": syn_bonus}'''
assert old in s, 'reader syn'
s = s.replace(old, new)
old = '''        card.update(bonus=bonus if bonus is not None else 1, slot=slot or "hands",
                    hands=2 if yes("Две руки") else 1, big=yes("Крупное"),
                    runBonus=runb or 0, price=price or 0)'''
new = '''        card.update(bonus=bonus if bonus is not None else 1, slot=slot or "hands",
                    hands=2 if yes("Две руки") else 1, big=yes("Крупное"),
                    runBonus=runb or 0, price=price or 0, synergy=synergy)'''
assert old in s, 'reader syn update'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('reader: синергия')

# ---------- 6. writers ----------
p = 'tools/make_cards_xlsx.py'
s = io.open(p, encoding='utf-8').read()
old = '''           "Нежить", "Крупное", "Две руки", "Бонус к побегу", "Цена (золота)", "Текст/шутка", "Картинка"]'''
new = '''           "Нежить", "Крупное", "Две руки", "Бонус к побегу", "Цена (золота)", "Текст/шутка",
           "Картинка", "Синергия с классом", "Бонус хозяину"]'''
assert old in s, 'writer headers'
s = s.replace(old, new)
old = '''    r = {"Копий": c["count"], "Колода": DECK_RU[c["deck"]], "Тип": TYPE_RU[c["type"]],
         "Название": c["name"], "Текст/шутка": c["text"], "Картинка": c.get("img") or ""}'''
new = '''    syn = c.get("synergy")
    r = {"Копий": c["count"], "Колода": DECK_RU[c["deck"]], "Тип": TYPE_RU[c["type"]],
         "Название": c["name"], "Текст/шутка": c["text"], "Картинка": c.get("img") or "",
         "Синергия с классом": POWER_RU.get(syn["power"], syn["power"]) if syn else "",
         "Бонус хозяину": syn["bonus"] if syn else ""}'''
assert old in s, 'writer row'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('make_cards_xlsx: синергия')

p = 'tools/make_template_xlsx.py'
s = io.open(p, encoding='utf-8').read()
old = '''           "Против (класс/ПМЖ)", "Модификатор силы", "Цена (золота)", "Текст/шутка", "Картинка"]'''
new = '''           "Против (класс/ПМЖ)", "Модификатор силы", "Цена (золота)", "Текст/шутка", "Картинка",
           "Синергия с классом", "Бонус хозяину"]'''
assert old in s, 'gen headers'
s = s.replace(old, new)
old = '''                 "Против класса": cm, "Модификатор силы": cmb, "Цена (золота)": price,
                 "Текст/шутка": "", "Картинка": ""})'''
new = '''                 "Против класса": cm, "Модификатор силы": cmb, "Цена (золота)": price,
                 "Текст/шутка": "", "Картинка": "", "Синергия с классом": "", "Бонус хозяину": ""})'''
assert old in s, 'gen add'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('make_template_xlsx: синергия')

# ---------- 7. v2 на месте: две колонки в конец ----------
from openpyxl import load_workbook
from openpyxl.styles import Alignment
from openpyxl.worksheet.datavalidation import DataValidation
fn = 'шаблон_карт_v2.xlsx'
wb = load_workbook(fn)
ws = wb['Шаблон']
labels_cls = ['+2 к побегу', 'Несколько транспортов', 'Кража шмотки, раз за игру',
              '+1 уровень, раз за игру и 2 шмотки на голову', 'Несколько обуви',
              'Несколько крупных шмоток', 'Побег без кубика, раз за игру']
add_cols = ['Синергия с классом', 'Бонус хозяину']
changed = False
for name in add_cols:
    newCol = ws.max_column + 1
    if ws.cell(row=4, column=newCol).value == name: continue
    ws.cell(row=4, column=newCol, value=name)
    src = ws.cell(row=4, column=newCol - 1)
    dst = ws.cell(row=4, column=newCol)
    dst.font = src.font.copy(); dst.fill = src.fill.copy()
    dst.alignment = src.alignment.copy(); dst.border = src.border.copy()
    for r in range(5, ws.max_row + 1):
        src = ws.cell(row=r, column=newCol - 1)
        dst = ws.cell(row=r, column=newCol)
        dst.font = src.font.copy(); dst.fill = src.fill.copy()
        dst.alignment = Alignment(horizontal='right' if name == 'Бонус хозяину' else 'left',
                                  vertical='center', wrap_text=True)
    for rng in list(ws.merged_cells.ranges):
        if rng.min_row == 2 and rng.min_col == 2:
            ws.merged_cells.ranges.remove(rng)
            ws.merge_cells(start_row=2, start_column=2, end_row=2, end_column=newCol)
            break
    changed = True
if changed:
    dv = DataValidation(type='list', formula1='"' + ','.join(labels_cls) + '"', allow_blank=True)
    ws.add_data_validation(dv)
    col_syn = None
    for col in range(2, ws.max_column + 1):
        if ws.cell(row=4, column=col).value == 'Синергия с классом': col_syn = col
    from openpyxl.utils import get_column_letter
    dv.add(f'{get_column_letter(col_syn)}5:{get_column_letter(col_syn)}{ws.max_row + 10}')
    g = wb['Справка']
    r0 = g.max_row + 1
    g.cell(row=r0, column=2, value='Синергия с классом')
    g.cell(row=r0, column=3, value='Шмот можно привязать к классу: выбери способность в «Синергия с классом» и укажи «Бонус хозяину» (+2). Носильщик с этим классом получает предмет с повышенным бонусом (Джомы: +2 всем, +4 Серёге).')
try:
    wb.save(fn); print('v2: синергия-колонки добавлены' if changed else 'v2: уже есть')
except PermissionError:
    wb.save('шаблон_карт_v3.xlsx'); print('v2 залочен — шаблон_карт_v3.xlsx')

# ---------- 8. живая колода: синергия на личных предметах ----------
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')
data = json.load(open('tools/cards-data.json', encoding='utf-8'))
syn_map = {'Джомы Серёги': {'power': 'run2', 'bonus': 2},
           'Старлетка': {'power': 'multiTransport', 'bonus': 2},
           'Падел-ракетка Славы': {'power': 'levelHead2', 'bonus': 2}}
n = 0
for c in data:
    if c['name'] in syn_map:
        c['synergy'] = syn_map[c['name']]; n += 1
json.dump(data, open('tools/cards-data.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f'живая колода: синергия на {n} предметах')
