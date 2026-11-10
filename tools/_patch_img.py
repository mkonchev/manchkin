# -*- coding: utf-8 -*-
# Картинки на картах: поле img, папка public/img, Excel-колонка «Картинка», клиент и галерея
import io, os, json

# ---------- 1. движок: img в вид карты ----------
p = 'game/engine.js'
s = io.open(p, encoding='utf-8').read()
old = """      levels: c.levels, treasures: c.treasures, hands: c.hands,
      power: c.power, classMod: c.classMod || null,
    };"""
new = """      levels: c.levels, treasures: c.treasures, hands: c.hands,
      power: c.power, classMod: c.classMod || null, img: c.img || null,
    };"""
assert old in s, 'cardPublic'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('engine: img в cardPublic')

# ---------- 2. клиент: отрисовка картинки + кнопка подкидывания ----------
p = 'public/client.js'
s = io.open(p, encoding='utf-8').read()

old = """function cardHTML(c, extraClass = '') {
  if (!c) return '';
  const bits = [];"""
new = """function cardHTML(c, extraClass = '') {
  if (!c) return '';
  const imgHTML = c.img
    ? `<div class="c-img"><img src="/img/${encodeURIComponent(c.img)}" alt="" loading="lazy"
         onerror="this.parentElement.remove()"></div>`
    : '';
  const bits = [];"""
assert old in s, 'cardHTML img'
s = s.replace(old, new)

old = """  return `<div class="card t-${c.type} ${extraClass}" data-uid="${c.uid}">
    <div class="c-bonus">${bonusLabel(c)}</div>
    <div class="c-ico">${cardEmoji(c)}</div>"""
new = """  return `<div class="card t-${c.type} ${extraClass}" data-uid="${c.uid}">
    <div class="c-bonus">${bonusLabel(c)}</div>
    ${imgHTML || `<div class="c-ico">${cardEmoji(c)}</div>`}"""
assert old in s, 'cardHTML replace'
s = s.replace(old, new)

# кнопка «Подкинуть монстра» в зоне боя для не-участников
old = """  $('monsterCards').innerHTML = c.monsters.map((m) => cardHTML(m)).join('') +"""
new = """  const acts = $('combatActions');
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
  $('monsterCards').innerHTML = c.monsters.map((m) => cardHTML(m)).join('') +"""
assert old in s, 'wander button'
s = s.replace(old, new)

# пикер монстра из руки
old = """function openPlayerMenu(p) {"""
new = """function openMonsterPicker(mine) {
  openModal(`
    <h3>👹 Кого подкидываем?</h3>
    <div class="player-pick">
      ${mine.map((c, i) => `<button class="btn" data-i="${i}"><span>${esc(c.name)}</span><span>сила ${c.level}</span></button>`).join('')}
    </div>`);
  $('modalBox').querySelectorAll('[data-i]').forEach((el) => {
    el.onclick = () => { closeModal(); act({ t: 'wanderMonster', uid: mine[+el.dataset.i].uid }); };
  });
}

function openPlayerMenu(p) {"""
assert old in s, 'picker'
s = s.replace(old, new)

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('client: img + wander button + picker')

# ---------- 3. CSS картинок ----------
p = 'public/style.css'
s = io.open(p, encoding='utf-8').read()
old = """.card .c-ico { font-size: 18px; }"""
new = """.card .c-ico { font-size: 18px; }
.card .c-img {
  height: 52px; border-radius: 6px; overflow: hidden;
  flex-shrink: 0; background: rgba(0,0,0,.3);
}
.card .c-img img { width: 100%; height: 100%; object-fit: cover; display: block; }"""
assert old in s, 'css'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('css: img styles')

# ---------- 4. конвейер: dump/build/render ----------
p = 'tools/dump-cards.js'
s = io.open(p, encoding='utf-8').read()
old = """  const o = { type: c.type, name: c.name, text: c.text || '' };"""
new = """  const o = { type: c.type, name: c.name, text: c.text || '', img: c.img || null };"""
assert old in s, 'dump img'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)

p = 'tools/build-cards.js'
s = io.open(p, encoding='utf-8').read()
old = """  const card = { type: r.type, name: r.name, text: r.text || '' };"""
new = """  const card = { type: r.type, name: r.name, text: r.text || '', img: r.img || null };"""
assert old in s, 'build img'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)

p = 'tools/render-cards.js'
s = io.open(p, encoding='utf-8').read()
old = """function cardHTML(c) {
  const emoji = c.type === 'item' ? (SLOT_EMOJI[c.slot] || '🧳') : TYPE_EMOJI[c.type];
  const bonus = c.type === 'monster' ? `${c.level}` : (c.bonus ? `+${c.bonus}` : (c.arg ? `+${c.arg}⭐` : ''));
  return `<div class="card t-${c.type}">
    ${bonus ? `<div class="c-bonus">${bonus}</div>` : ''}
    <div class="c-ico">${emoji}</div>"""
new = """function cardHTML(c) {
  const emoji = c.type === 'item' ? (SLOT_EMOJI[c.slot] || '🧳') : TYPE_EMOJI[c.type];
  const bonus = c.type === 'monster' ? `${c.level}` : (c.bonus ? `+${c.bonus}` : (c.arg ? `+${c.arg}⭐` : ''));
  const imgHTML = c.img ? `<div class="c-img"><img src="/img/${encodeURIComponent(c.img)}" alt="" loading="lazy"
      onerror="this.parentElement.remove()"></div>` : '';
  return `<div class="card t-${c.type}">
    ${bonus ? `<div class="c-bonus">${bonus}</div>` : ''}
    ${imgHTML || `<div class="c-ico">${emoji}</div>`}"""
assert old in s, 'render img'
s = s.replace(old, new)
old = """  .card { width: 190px; min-height: 170px; cursor: default; }"""
new = """  .card { width: 190px; min-height: 170px; cursor: default; }
  .card .c-img { height: 90px; }"""
assert old in s, 'render css'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('pipeline: img passthrough')

# ---------- 5. читатель Excel: колонка «Картинка» ----------
p = 'tools/read_cards_xlsx.py'
s = io.open(p, encoding='utf-8').read()
old = '''    text = ws.cell(row=rn, column=H("Текст/шутка")).value
    text = str(text).strip() if text else ""'''
new = '''    text = ws.cell(row=rn, column=H("Текст/шутка")).value
    text = str(text).strip() if text else ""
    img_raw = val(rn, "Картинка")
    img = str(img_raw).strip() if img_raw else None
    if img and ("/" in img or chr(92) in img or ".." in img):
        row_err.append(f"«Картинка» — только имя файла без путей («{img}»)"); img = None'''
assert old in s, 'reader img'
s = s.replace(old, new)
old = '''    card = {"deck": deck or "door", "count": count, "type": ctype or "monster", "name": name, "text": text}'''
new = '''    card = {"deck": deck or "door", "count": count, "type": ctype or "monster", "name": name,
            "text": text, "img": img}'''
assert old in s, 'reader img field'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('reader: колонка «Картинка»')

# ---------- 6. writers: make_cards_xlsx.py ----------
p = 'tools/make_cards_xlsx.py'
s = io.open(p, encoding='utf-8').read()
old = '''           "Нежить", "Крупное", "Две руки", "Бонус к побегу", "Цена (золота)", "Текст/шутка"]'''
new = '''           "Нежить", "Крупное", "Две руки", "Бонус к побегу", "Цена (золота)", "Текст/шутка", "Картинка"]'''
assert old in s, 'writer headers'
s = s.replace(old, new)
old = '''    r = {"Копий": c["count"], "Колода": DECK_RU[c["deck"]], "Тип": TYPE_RU[c["type"]],
         "Название": c["name"], "Текст/шутка": c["text"]}'''
new = '''    r = {"Копий": c["count"], "Колода": DECK_RU[c["deck"]], "Тип": TYPE_RU[c["type"]],
         "Название": c["name"], "Текст/шутка": c["text"], "Картинка": c.get("img") or ""}'''
assert old in s, 'writer row'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('make_cards_xlsx: «Картинка»')

# ---------- 7. генератор шаблона ----------
p = 'tools/make_template_xlsx.py'
s = io.open(p, encoding='utf-8').read()
old = '''           "Нежить", "Крупное", "Две руки", "Бонус к побегу",
           "Против (класс/ПМЖ)", "Модификатор силы", "Цена (золота)", "Текст/шутка"]'''
new = '''           "Нежить", "Крупное", "Две руки", "Бонус к побегу",
           "Против (класс/ПМЖ)", "Модификатор силы", "Цена (золота)", "Текст/шутка", "Картинка"]'''
assert old in s, 'gen headers'
s = s.replace(old, new)
old = '''                 "Против класса": cm, "Модификатор силы": cmb, "Цена (золота)": price,
                 "Текст/шутка": ""})'''
new = '''                 "Против класса": cm, "Модификатор силы": cmb, "Цена (золота)": price,
                 "Текст/шутка": "", "Картинка": ""})'''
assert old in s, 'gen add'
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('make_template_xlsx: «Картинка»')

# ---------- 8. v2 на месте: колонка «Картинка» в конец ----------
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
fn = 'шаблон_карт_v2.xlsx'
wb = load_workbook(fn)
ws = wb['Шаблон']
newCol = ws.max_column + 1
if ws.cell(row=4, column=newCol).value != 'Картинка':
    ws.cell(row=4, column=newCol, value='Картинка')
    src = ws.cell(row=4, column=newCol - 1)
    dst = ws.cell(row=4, column=newCol)
    dst.font = src.font.copy(); dst.fill = src.fill.copy()
    dst.alignment = src.alignment.copy(); dst.border = src.border.copy()
    for r in range(5, ws.max_row + 1):
        src = ws.cell(row=r, column=newCol - 1)
        dst = ws.cell(row=r, column=newCol)
        dst.font = src.font.copy(); dst.fill = src.fill.copy()
        dst.alignment = Alignment(horizontal='left', vertical='center', wrap_text=True)
    for rng in list(ws.merged_cells.ranges):
        if rng.min_row == 2 and rng.min_col == 2:
            ws.merged_cells.ranges.remove(rng)
            ws.merge_cells(start_row=2, start_column=2, end_row=2, end_column=newCol)
            break
    g = wb['Справка']
    r0 = g.max_row + 1
    g.cell(row=r0, column=2, value='Картинка')
    g.cell(row=r0, column=3, value='Имя файла картинки для карты (например «джунгарик.jpg»). Файл клади в папку public/img в проекте. Без путей, только имя.')
    print('v2: колонка «Картинка» добавлена (колонка', newCol, ')')
else:
    print('v2: колонка «Картинка» уже есть')
try:
    wb.save(fn); print('v2 сохранён')
except PermissionError:
    wb.save('шаблон_карт_v3.xlsx'); print('v2 залочен — сохранил шаблон_карт_v3.xlsx')

# ---------- 9. папка картинок ----------
os.makedirs('public/img', exist_ok=True)
if not os.path.exists('public/img/README.txt'):
    io.open('public/img/README.txt', 'w', encoding='utf-8').write(
        'Клади сюда картинки карт (jpg/png/webp).\n'
        'Имя файла указывается в Excel-колонке «Картинка» или в поле "img" в tools/cards-data.json.\n')
print('public/img готова')
