# -*- coding: utf-8 -*-
# Чтение отредактированного Excel обратно в JSON:
#   python tools/read_cards_xlsx.py [путь_к_файлу.xlsx]  →  tools/cards-data.json
import json, os, sys
from openpyxl import load_workbook

HERE = os.path.dirname(os.path.abspath(__file__))
xlsx_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(HERE), "карты.xlsx")

TYPE_BACK = {"Монстр": "monster", "Проклятие": "curse", "Класс": "klass",
             "Раса": "race", "Усилитель монстра": "enhancer", "Шмот": "item",
             "Разовая": "oneShot", "Карта уровня": "levelUp"}
DECK_BACK = {"Двери": "door", "Сокровища": "treasure"}
SLOT_BACK = {"Голова": "head", "Тело": "body", "Руки": "hands", "Ноги": "feet",
             "Транспорт": "transport"}
BAD_BACK = {"Ничего": "none", "Потеряй уровень": "loseLevel", "Потеряй предмет": "loseSlot",
            "Потеряй случайный предмет": "loseRandomSlot", "Потеряй класс": "loseClass",
            "Пропусти ход": "skipTurn", "Смерть": "death"}
CURSE_BACK = dict(BAD_BACK, **{"Монстр +N в след. бою": "pendingMonster"})
POWER_BACK = {"Равенство = победа; сброс −1 монстру": "warrior",
              "Побег без кубика, раз за бой": "wizard",
              "Кража шмотки, раз за игру": "thief",
              "+3 к нежити; +1 уровень раз за игру": "cleric",
              "+2 к побегу": "run2",
              "Несколько транспортов": "multiTransport",
              "+1 уровень, раз за игру и 2 шмотки на голову": "levelHead2",
              "Несколько обуви": "multiFeet",
              "Несколько крупных шмоток": "multiBig",
              "Побег без кубика, раз за игру": "escapeOnce"}
RACE_POWER_BACK = {"ПМЖ: Ухта": "ukhta", "ПМЖ: Москва": "moscow", "ПМЖ: СПб": "spb",
                   "Уровень за помощь в чужом бою": "elf",
                   "Носит сколько угодно крупных": "dwarf",
                   "Кража карты из руки, раз за игру": "halfling"}
YES = ("да", "да ", "ДА", "Да")

wb = load_workbook(xlsx_path, data_only=True)
ws = wb["Карты"]

headers = {}
for col in range(2, ws.max_column + 1):
    v = ws.cell(row=4, column=col).value
    if v: headers[str(v).strip()] = col
need = ["Копий", "Колода", "Тип", "Название", "Сила/Бонус", "Дурняк/Эффект", "Текст/шутка"]
missing = [h for h in need if h not in headers]
if missing:
    print("❌ Нет обязательных колонок: " + ", ".join(missing)); sys.exit(1)
def H(name): return headers.get(name)
def val(rn, name):
    col = H(name)
    return ws.cell(row=rn, column=col).value if col else None

def num(v):
    if v in (None, ""): return None
    if isinstance(v, (int, float)): return int(v)
    try: return int(str(v).strip())
    except ValueError: return None

errors, cards = [], []
for rn in range(5, ws.max_row + 1):
    name = val(rn, "Название")
    type_ru = val(rn, "Тип")
    deck_ru = val(rn, "Колода")
    if name in (None, ""):
        continue  # строка без названия — ещё не заполнена, пропускаем
    row_err = []
    name = str(name).strip() if name else ""
    type_ru = str(type_ru).strip() if type_ru else ""
    deck_ru = str(deck_ru).strip() if deck_ru else ""
    if not name: row_err.append("нет названия")
    ctype = TYPE_BACK.get(type_ru)
    if not ctype: row_err.append(f"неизвестный тип «{type_ru}»")
    deck = DECK_BACK.get(deck_ru)
    if not deck: row_err.append(f"неизвестная колода «{deck_ru}»")
    count = num(val(rn, "Копий"))
    if count is None: count = 1
    if count < 1: row_err.append("«Копий» меньше 1")
    bonus = num(val(rn, "Сила/Бонус"))
    param = num(val(rn, "Параметр эффекта"))
    text = val(rn, "Текст/шутка")
    text = str(text).strip() if text else ""
    img_raw = val(rn, "Картинка")
    img = str(img_raw).strip() if img_raw else None
    if img and ("/" in img or chr(92) in img or ".." in img):
        row_err.append(f"«Картинка» — только имя файла без путей («{img}»)"); img = None
    eff_ru = val(rn, "Дурняк/Эффект")
    eff_ru = str(eff_ru).strip() if eff_ru else ""
    slot_ru = val(rn, "Слот")
    slot_ru = str(slot_ru).strip() if slot_ru else ""
    slot = SLOT_BACK.get(slot_ru)
    if slot_ru and not slot: row_err.append(f"неизвестный слот «{slot_ru}»")
    yes = lambda col: ws.cell(row=rn, column=H(col)).value in YES if H(col) else False

    card = {"deck": deck or "door", "count": count, "type": ctype or "monster", "name": name,
            "text": text, "img": img}
    if ctype == "monster":
        if bonus is None: row_err.append("у монстра пустая «Сила/Бонус»")
        bad_ru = eff_ru
        bad_t = BAD_BACK.get(bad_ru)
        if bad_ru and not bad_t: row_err.append(f"неизвестный дурняк «{bad_ru}»")
        bad = {"t": bad_t or "none"}
        if bad["t"] == "loseLevel":
            bad["n"] = param if param is not None else 1
        elif bad["t"] == "loseSlot":
            if not slot: row_err.append("дурняку «Потеряй предмет» нужен слот")
            bad["slot"] = slot or "head"
        cm_label = val(rn, "Против (класс/ПМЖ)") or val(rn, "Против класса")
        class_mod = None
        if cm_label:
            cm_power = POWER_BACK.get(str(cm_label).strip())
            cm_bonus = num(val(rn, "Модификатор силы"))
            if not cm_power: row_err.append(f"неизвестный класс/ПМЖ для модификатора «{cm_label}» (см. Справку)")
            elif cm_bonus is None: row_err.append("есть «Против (класс/ПМЖ)», но пустой «Модификатор силы»")
            else: class_mod = {"power": cm_power, "bonus": cm_bonus}
        card.update(level=bonus if bonus is not None else 1,
                    levels=num(val(rn, "Награда: уровней")) or 1,
                    treasures=num(val(rn, "Награда: сокровищ")) or 1,
                    bad=bad, tag="undead" if yes("Нежить") else None,
                    classMod=class_mod)
    elif ctype == "curse":
        eff = CURSE_BACK.get(eff_ru)
        if not eff: row_err.append(f"неизвестный эффект проклятия «{eff_ru}»")
        card.update(effect=eff or "loseLevel", arg=None)
        if eff == "loseLevel" or eff == "pendingMonster":
            card["arg"] = param if param is not None else 1
        if eff == "loseSlot":
            if not slot: row_err.append("проклятию «Потеряй предмет» нужен слот")
            card["arg"] = slot or "head"
    elif ctype == "klass":
        power = POWER_BACK.get(eff_ru)
        if not power: row_err.append(f"неизвестная способность класса «{eff_ru}» (см. Справку)")
        card.update(power=power or "warrior")
    elif ctype == "race":
        power = RACE_POWER_BACK.get(eff_ru)
        if not power: row_err.append(f"неизвестная способность расы «{eff_ru}» (см. Справку)")
        card.update(power=power or "elf")
    elif ctype == "enhancer":
        if bonus is None: row_err.append("у усилителя пустая «Сила/Бонус»")
        card.update(bonus=bonus if bonus is not None else 5)
    elif ctype == "item":
        if bonus is None: row_err.append("у шмота пустая «Сила/Бонус»")
        if not slot: row_err.append("у шмота нет слота")
        syn_label = val(rn, "Синергия (класс/ПМЖ)") or val(rn, "Синергия с классом")
        synergy = None
        if syn_label:
            syn_power = POWER_BACK.get(str(syn_label).strip()) or RACE_POWER_BACK.get(str(syn_label).strip())
            syn_bonus = num(val(rn, "Бонус хозяину"))
            if not syn_power: row_err.append(f"неизвестный класс синергии «{syn_label}» (см. Справку)")
            elif syn_bonus is None: row_err.append("есть «Синергия с классом», но пустой «Бонус хозяину»")
            else: synergy = {"power": syn_power, "bonus": syn_bonus}
        runb = num(val(rn, "Бонус к побегу")) if H("Бонус к побегу") else None
        price = num(val(rn, "Цена (золота)")) if H("Цена (золота)") else None
        card.update(bonus=bonus if bonus is not None else 1, slot=slot or "hands",
                    hands=2 if yes("Две руки") else 1, big=yes("Крупное"),
                    runBonus=runb or 0, price=price or 0, synergy=synergy)
    elif ctype == "oneShot":
        if bonus is None: row_err.append("у разовой карты пустая «Сила/Бонус»")
        card.update(bonus=bonus if bonus is not None else 3)
    elif ctype == "levelUp":
        card.update(arg=bonus if bonus is not None else 1)

    if row_err:
        errors.append(f"строка {rn} («{name or '?'}»): " + "; ".join(row_err))
    else:
        cards.append(card)

if errors:
    print("❌ Ошибки в таблице — исправь и скинь снова:")
    for e in errors: print("  •", e)
    sys.exit(1)

json.dump(cards, open(os.path.join(HERE, "cards-data.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
total = sum(c["count"] for c in cards)
doors = sum(c["count"] for c in cards if c["deck"] == "door")
print(f"✅ Прочитано: {len(cards)} уникальных карт, всего {total} (Дверей {doors}, Сокровищ {total - doors})")
