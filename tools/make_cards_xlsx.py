# -*- coding: utf-8 -*-
# Excel со всеми картами:  python tools/make_cards_xlsx.py  →  карты.xlsx
import json, os, sys

XLSX_SKILL_DIR = r"C:\Users\maksi\.zcode\cli\plugins\cache\zcode-plugins-official\spreadsheets\0.2.1\skills\xlsx"
for sub in [XLSX_SKILL_DIR, os.path.join(XLSX_SKILL_DIR, "templates")]:
    if sub not in sys.path:
        sys.path.insert(0, sub)
from base import (FONT_NAME, PRIMARY, NEUTRAL_600, setup_sheet, style_header_row,
                  style_data_row, auto_fit_columns, auto_fit_row_heights,
                  font_caption)
from openpyxl import Workbook
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.styles import Alignment

HERE = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(HERE, "cards-data.json"), encoding="utf-8"))

TYPE_RU = {"monster": "Монстр", "curse": "Проклятие", "klass": "Класс",
           "race": "Раса", "enhancer": "Усилитель монстра", "item": "Шмот",
           "oneShot": "Разовая", "levelUp": "Карта уровня"}
DECK_RU = {"door": "Двери", "treasure": "Сокровища"}
SLOT_RU = {"head": "Голова", "body": "Тело", "hands": "Руки", "feet": "Ноги",
           "transport": "Транспорт"}
BAD_RU = {"none": "Ничего", "loseLevel": "Потеряй уровень", "loseSlot": "Потеряй предмет",
          "loseRandomSlot": "Потеряй случайный предмет", "loseClass": "Потеряй класс",
          "skipTurn": "Пропусти ход", "death": "Смерть"}
CURSE_RU = {"loseLevel": "Потеряй уровень", "loseSlot": "Потеряй предмет",
            "loseRandomSlot": "Потеряй случайный предмет", "loseClass": "Потеряй класс",
            "skipTurn": "Пропусти ход", "pendingMonster": "Монстр +N в след. бою"}
CLASS_POWER_RU = {"run2": "+2 к побегу",
                 "multiTransport": "Несколько транспортов",
                 "thief": "Кража шмотки, раз за игру",
                 "levelHead2": "+1 уровень, раз за игру и 2 шмотки на голову",
                 "multiFeet": "Несколько обуви",
                 "multiBig": "Несколько крупных шмоток",
                 "escapeOnce": "Побег без кубика, раз за игру",
                 "warrior": "Равенство = победа; сброс −1 монстру",
                 "wizard": "Побег без кубика, раз за бой",
                 "thief_legacy": "", "cleric": "+3 к нежити; +1 уровень раз за игру"}
RACE_POWER_RU = {"elf": "Уровень за помощь в чужом бою",
                 "dwarf": "Носит сколько угодно крупных",
                 "halfling": "Кража карты из руки, раз за игру"}

HEADERS = ["Копий", "Колода", "Тип", "Название", "Сила/Бонус", "Награда: уровней",
           "Награда: сокровищ", "Слот", "Дурняк/Эффект", "Параметр эффекта",
           "Против класса", "Модификатор силы",
           "Нежить", "Крупное", "Две руки", "Бонус к побегу", "Цена (золота)", "Текст/шутка",
           "Картинка", "Синергия с классом", "Бонус хозяину"]

def row_of(c):
    syn = c.get("synergy")
    r = {"Копий": c["count"], "Колода": DECK_RU[c["deck"]], "Тип": TYPE_RU[c["type"]],
         "Название": c["name"], "Текст/шутка": c["text"], "Картинка": c.get("img") or "",
         "Синергия с классом": POWER_RU.get(syn["power"], syn["power"]) if syn else "",
         "Бонус хозяину": syn["bonus"] if syn else ""}
    if c["type"] == "monster":
        bad = c["bad"]
        r["Сила/Бонус"] = c["level"]
        r["Награда: уровней"] = c["levels"]
        r["Награда: сокровищ"] = c["treasures"]
        if bad.get("t") == "loseSlot": r["Слот"] = SLOT_RU.get(bad.get("slot"), "")
        r["Дурняк/Эффект"] = BAD_RU[bad["t"]]
        if bad.get("t") == "loseLevel": r["Параметр эффекта"] = bad["n"]
        if c.get("classMod"):
            r["Против класса"] = POWER_RU.get(c["classMod"]["power"], c["classMod"]["power"])
            r["Модификатор силы"] = c["classMod"]["bonus"]
        if c.get("tag") == "undead": r["Нежить"] = "да"
    elif c["type"] == "curse":
        if c["effect"] == "loseSlot": r["Слот"] = SLOT_RU.get(c.get("arg"), "")
        r["Дурняк/Эффект"] = CURSE_RU[c["effect"]]
        if c["effect"] in ("loseLevel", "pendingMonster"): r["Параметр эффекта"] = c["arg"]
    elif c["type"] == "klass":
        r["Дурняк/Эффект"] = POWER_RU[c["power"]]
    elif c["type"] == "race":
        r["Дурняк/Эффект"] = RACE_POWER_RU[c["power"]]
    elif c["type"] == "enhancer":
        r["Сила/Бонус"] = c["bonus"]
    elif c["type"] == "item":
        r["Сила/Бонус"] = c["bonus"]
        r["Слот"] = SLOT_RU[c["slot"]]
        if c.get("big"): r["Крупное"] = "да"
        if c.get("hands") == 2: r["Две руки"] = "да"
        if c.get("runBonus"): r["Бонус к побегу"] = c["runBonus"]
        if c.get("price"): r["Цена (золота)"] = c["price"]
    elif c["type"] == "oneShot":
        r["Сила/Бонус"] = c["bonus"]
    elif c["type"] == "levelUp":
        r["Сила/Бонус"] = c["arg"]
    return [r.get(h, "") for h in HEADERS]

wb = Workbook()
ws = wb.active
ws.title = "Карты"
last_col = len(HEADERS) + 1  # B..Q
setup_sheet(ws, title="⚔ Карты компании — правь смело, потом скинь файл назад", last_col=last_col)

for col, h in enumerate(HEADERS, start=2):
    ws.cell(row=4, column=col, value=h)
style_header_row(ws, row_num=4, col_start=2, col_end=last_col)

NUM_COLS = {2, 6, 7, 8, 11, 15, 17, 18}  # Копий=2, Сила=6, НагрУр=7, НагрСокр=8, Параметр=11, Побег=15, Мод=17, Цена=18
for i, c in enumerate(data):
    rn = 5 + i
    for col, v in enumerate(row_of(c), start=2):
        cell = ws.cell(row=rn, column=col, value=v)
    style_data_row(ws, row_num=rn, col_start=2, col_end=last_col, row_index=i)
    for col in NUM_COLS:
        cell = ws.cell(row=rn, column=col)
        if isinstance(cell.value, (int, float)):
            cell.alignment = Alignment(horizontal="right", vertical="center")

# выпадающие списки
def dv_list(values, col_letter, last_row):
    dv = DataValidation(type="list", formula1='"' + ",".join(values) + '"', allow_blank=True)
    dv.error = "Выбери значение из списка"
    dv.errorTitle = "Нет в списке"
    ws.add_data_validation(dv)
    dv.add(f"{col_letter}5:{col_letter}{last_row}")

last_row = 4 + len(data)
dv_list(["Двери", "Сокровища"], "C", last_row)
dv_list(list(TYPE_RU.values()), "D", last_row)
dv_list(["Голова", "Тело", "Руки", "Ноги"], "I", last_row)
dv_list(["да"], "L", last_row)
dv_list(["да"], "M", last_row)
dv_list(["да"], "N", last_row)

# Справка
g = wb.create_sheet("Справка")
setup_sheet(g, title="Как править таблицу", last_col=3)
help_rows = [
    ("Колода", "Двери или Сокровища. Не меняй без нужды — от этого зависит, откуда тянут карту."),
    ("Тип", "Монстр / Проклятие / Класс / Усилитель монстра / Шмот / Разовая / Карта уровня."),
    ("Сила/Бонус", "Монстр — сила; шмот/разовая/усилитель — бонус; карта уровня — сколько уровней даёт."),
    ("Награда: уровней / сокровищ", "Только монстры: сколько уровней и карт Сокровищ даёт победа."),
    ("Слот", "Для шмота — куда надевается (Голова/Тело/Руки/Ноги). Для дурняка «Потеряй предмет» — какой слот теряется."),
    ("Дурняк/Эффект", "Монстр — что случается при провале побега. Проклятие — эффект. Класс — его способность."),
    ("Дурняк/Эффект: можно писать", "Ничего; Потеряй уровень; Потеряй предмет; Потеряй случайный предмет; Потеряй класс; Пропусти ход; Смерть; Монстр +N в след. бою (только проклятие)."),
    ("Параметр эффекта", "Число для «Потеряй уровень» (сколько) и «Монстр +N» (сколько)."),
    ("Нежить", "«да» — монстр-нежить, Вайбик бьёт её на +3."),
    ("Крупное", "«да» — крупный шмот, надет может быть только один."),
    ("Две руки", "«да» — занимает обе руки."),
    ("Бонус к побегу", "Шмот: прибавка к броску побега (нужно 5+)."),
    ("Цена (золота)", "Шмот: продажа от 1000 золота = 1 уровень."),
    ("Текст/шутка", "Что написано на карте. Пиши что хочешь 😈"),
    ("Копий", "Сколько одинаковых карт в колоде. Меняй свободно."),
    ("", ""),
    ("Добавить карту", "Просто добавь новую строку внизу и заполни: Копий, Колода, Тип, Название и что нужно."),
    ("Удалить карту", "Удали строку."),
    ("Если что-то не так", "Я проверю файл при загрузке и скажу, в каких строках ошибки."),
]
for col, h in enumerate(["Поле", "Что означает"], start=2):
    g.cell(row=4, column=col, value=h)
style_header_row(g, row_num=4, col_start=2, col_end=3)
for i, (a, b) in enumerate(help_rows):
    rn = 5 + i
    g.cell(row=rn, column=2, value=a)
    g.cell(row=rn, column=3, value=b)
    style_data_row(g, row_num=rn, col_start=2, col_end=3, row_index=i)

auto_fit_columns(ws, min_width=8, max_width=42, header_row=4, data_start_row=5)
auto_fit_row_heights(ws, header_row=4, data_start_row=5)
auto_fit_columns(g, min_width=10, max_width=80, header_row=4, data_start_row=5)
auto_fit_row_heights(g, header_row=4, data_start_row=5)

wb.properties.creator = "Z.ai"
out = os.path.join(os.path.dirname(HERE), "карты.xlsx")
wb.save(out)
print("Сохранено:", out, "| строк карт:", len(data))
