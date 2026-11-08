# -*- coding: utf-8 -*-
# Шаблон по структуре оригинального Манчкина (95 дверей + 73 сокровища):
#   python tools/make_template_xlsx.py  →  шаблон_карт.xlsx
# Механика проставлена, названия и тексты пустые — заполняешь своими.
import os, sys

XLSX_SKILL_DIR = r"C:\Users\maksi\.zcode\cli\plugins\cache\zcode-plugins-official\spreadsheets\0.2.1\skills\xlsx"
for sub in [XLSX_SKILL_DIR, os.path.join(XLSX_SKILL_DIR, "templates")]:
    if sub not in sys.path:
        sys.path.insert(0, sub)
from base import (setup_sheet, style_header_row, style_data_row,
                  auto_fit_columns, auto_fit_row_heights)
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from base import NEUTRAL_600

HEADERS = ["Копий", "Колода", "Тип", "Название", "Сила/Бонус", "Награда: уровней",
           "Награда: сокровищ", "Слот", "Дурняк/Эффект", "Параметр эффекта",
           "Нежить", "Крупное", "Две руки", "Бонус к побегу",
           "Против (класс/ПМЖ)", "Модификатор силы", "Цена (золота)", "Текст/шутка"]

rows = []
def add(typ, bonus=None, lu=None, tr=None, slot="", eff="", param="", undead="",
        big="", hands2="", runb="", price="", deck=None, cm="", cmb=""):
    d = deck or ("Сокровища" if typ in ("Шмот", "Разовая", "Карта уровня") else "Двери")
    rows.append({"Копий": 1, "Колода": d, "Тип": typ, "Название": "", "Сила/Бонус": bonus,
                 "Награда: уровней": lu, "Награда: сокровищ": tr, "Слот": slot,
                 "Дурняк/Эффект": eff, "Параметр эффекта": param, "Нежить": undead,
                 "Крупное": big, "Две руки": hands2, "Бонус к побегу": runb,
                 "Против класса": cm, "Модификатор силы": cmb, "Цена (золота)": price,
                 "Текст/шутка": ""})

# ================= ДВЕРИ (95) =================
# --- Монстры: 56 штук, силы распределены как в оригинале (много слабых, мало боссов)
monster_plan = [
    (1, 4), (2, 4), (3, 4), (4, 6), (5, 5), (6, 5), (7, 4), (8, 5),
    (9, 5), (10, 5), (11, 2), (12, 2), (14, 2), (16, 1), (18, 1), (20, 1),
]
bad_cycle = [
    ("Ничего", ""), ("Ничего", ""), ("Потеряй уровень", "1"), ("Ничего", ""),
    ("Потеряй предмет", "Голова"), ("Ничего", ""), ("Потеряй предмет", "Ноги"),
    ("Ничего", ""), ("Потеряй предмет", "Руки"), ("Ничего", ""),
]
i = 0
for level, n in monster_plan:
    for _ in range(n):
        eff, p = bad_cycle[i % len(bad_cycle)]
        if eff == "Потеряй уровень":
            p = "1"
        lu, tr = (1, 1)
        if level >= 5: lu, tr = 1, 1 if level < 8 else 2
        if level >= 11: lu, tr = 2, 2
        if level >= 14: lu, tr = 2, 3
        if level >= 18: lu, tr = 2, 4
        if level >= 20: lu, tr = 3, 5
        undead = "да" if (level in (10, 12) and i % 2 == 0) else ""
        add("Монстр", bonus=level, lu=lu, tr=tr, eff=eff, param=p, undead=undead)
        i += 1
# два последних босса — СМЕРТЬ
rows[-1][8], rows[-2][8] = "Смерть", "Смерть"

# --- Проклятия: 20
add("Проклятие", eff="Потеряй уровень", param=1)
add("Проклятие", eff="Потеряй уровень", param=1)
add("Проклятие", eff="Потеряй уровень", param=1)
for slot in ("Голова", "Тело", "Руки", "Ноги"):
    add("Проклятие", slot=slot, eff="Потеряй предмет")
    add("Проклятие", slot=slot, eff="Потеряй предмет")
add("Проклятие", eff="Потеряй класс")
add("Проклятие", eff="Потеряй случайный предмет")
add("Проклятие", eff="Потеряй случайный предмет")
add("Проклятие", eff="Пропусти ход")
add("Проклятие", eff="Пропусти ход")
add("Проклятие", eff="Монстр +N в след. бою", param=5)
add("Проклятие", eff="Монстр +N в след. бою", param=5)
add("Проклятие", eff="Потеряй уровень", param=2)
add("Проклятие", eff="Потеряй уровень", param=2)

# --- Классы: 7 персональных, по одному на друга
add("Класс", eff="+2 к побегу")
add("Класс", eff="Несколько транспортов")
add("Класс", eff="Кража шмотки, раз за игру")
add("Класс", eff="+1 уровень, раз за игру и 2 шмотки на голову")
add("Класс", eff="Несколько обуви")
add("Класс", eff="Несколько крупных шмоток")
add("Класс", eff="Побег без кубика, раз за игру")

# --- ПМЖ: 6 (3 резиденции × 2)
for _ in range(2): add("Раса", eff="ПМЖ: Ухта")
for _ in range(2): add("Раса", eff="ПМЖ: Москва")
for _ in range(2): add("Раса", eff="ПМЖ: СПб")

# --- Усилители монстра: 8
for _ in range(5): add("Усилитель монстра", bonus=5)
for _ in range(3): add("Усилитель монстра", bonus=10)

# --- Странный хлам в дверях: 3
add("Шмот", bonus=1, slot="Руки", price=100, deck="Двери")
add("Шмот", bonus=2, slot="Тело", price=200, deck="Двери")
add("Разовая", bonus=3, deck="Двери")

# ================= СОКРОВИЩА (73) =================
# --- Шмот: 42
head_plan = [(1, 3, 100), (2, 2, 200), (3, 2, 400), (4, 1, 600), (5, 1, 800)]
body_plan = [(1, 3, 100), (2, 2, 200), (3, 2, 400), (4, 1, 500), (5, 1, 800, "да"), (6, 1, 900, "да")]
hands_plan = [(1, 2, 100), (2, 3, 200), (3, 3, 400), (4, 2, 600, "", "да"), (5, 1, 800, "", "да"), (6, 1, 900, "да", "да")]
feet_plan = [(1, 2, 100), (2, 4, 200), (3, 3, 400), (4, 2, 600)]
for bonus, n, price in head_plan:
    for _ in range(n): add("Шмот", bonus=bonus, slot="Голова", price=price)
for bonus, n, price, *rest in body_plan:
    for _ in range(n): add("Шмот", bonus=bonus, slot="Тело", price=price, big=rest[0] if rest else "")
for bonus, n, price, *rest in hands_plan:
    for _ in range(n):
        add("Шмот", bonus=bonus, slot="Руки", price=price,
            hands2=rest[1] if len(rest) > 1 else "", big=rest[0] if rest else "")
run_bonus_cycle = ["", "", 1, "", 2, "", 3, "", 1, ""]
fi = 0
for bonus, n, price in feet_plan:
    for _ in range(n):
        add("Шмот", bonus=bonus, slot="Ноги", price=price, runb=run_bonus_cycle[fi % len(run_bonus_cycle)])
        fi += 1

# --- Транспорт: 4 (названия впишешь сам)
add("Шмот", bonus=1, slot="Транспорт", price=200)
add("Шмот", bonus=2, slot="Транспорт", price=400, runb=1)
add("Шмот", bonus=3, slot="Транспорт", price=600, runb=1)
add("Шмот", bonus=4, slot="Транспорт", price=800, runb=2)

# --- Разовые: 16
for bonus, n in [(4, 5), (5, 4), (6, 3), (8, 2), (10, 2)]:
    for _ in range(n): add("Разовая", bonus=bonus)

# --- Карты уровней: 15
for _ in range(12): add("Карта уровня", bonus=1)
for _ in range(3): add("Карта уровня", bonus=2)

# ================= сборка книги =================
wb = Workbook()
ws = wb.active
ws.title = "Шаблон"
last_col = len(HEADERS) + 1
setup_sheet(ws, title="Шаблон по оригиналу (95 дверей + 73 сокровища) — заполни Название и Текст", last_col=last_col)
for col, h in enumerate(HEADERS, start=2):
    ws.cell(row=4, column=col, value=h)
style_header_row(ws, row_num=4, col_start=2, col_end=last_col)

INPUT_FILL = PatternFill("solid", fgColor="FFF8E1")  # светлый маркер «сюда писать»
for i, row in enumerate(rows):
    rn = 5 + i
    for col, h in enumerate(HEADERS, start=2):
        ws.cell(row=rn, column=col, value=row[h])
    style_data_row(ws, row_num=rn, col_start=2, col_end=last_col, row_index=i)
    # колонки «Название» (E) и «Текст/шутка» (Q) — помечаем как поле ввода
    for col in (5, 17):
        cell = ws.cell(row=rn, column=col)
        cell.fill = INPUT_FILL
    for col in (2, 6, 7, 8, 11, 15, 16):
        cell = ws.cell(row=rn, column=col)
        if isinstance(cell.value, (int, float)):
            cell.alignment = Alignment(horizontal="right", vertical="center")

# подсказка над таблицей
hint = ws.cell(row=3, column=5, value="↓ заполняешь только жёлтые колонки: Название и Текст/шутка. Остальное уже настроено — можно менять, если знаешь зачем.")
hint.font = Font(name=FONT_NAME_HINT, size=9, color=NEUTRAL_600) if (FONT_NAME_HINT := "Calibri") else None

last_row = 4 + len(rows)
from openpyxl.worksheet.datavalidation import DataValidation
def dv_list(values, col_letter):
    dv = DataValidation(type="list", formula1='"' + ",".join(values) + '"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"{col_letter}5:{col_letter}{last_row}")
dv_list(["Двери", "Сокровища"], "C")
dv_list(["Монстр", "Проклятие", "Класс", "Раса", "Усилитель монстра", "Шмот", "Разовая", "Карта уровня"], "D")
dv_list(["Голова", "Тело", "Руки", "Ноги", "Транспорт"], "I")
dv_list(["да"], "L"); dv_list(["да"], "M"); dv_list(["да"], "N")
dv_list(["+2 к побегу", "Несколько транспортов", "Кража шмотки, раз за игру",
         "+1 уровень, раз за игру и 2 шмотки на голову", "Несколько обуви",
         "Несколько крупных шмоток", "Побег без кубика, раз за игру",
         "ПМЖ: Ухта", "ПМЖ: Москва", "ПМЖ: СПб"], "P")
dv_list(["+2 к побегу", "Несколько транспортов", "Кража шмотки, раз за игру",
         "+1 уровень, раз за игру и 2 шмотки на голову", "Несколько обуви",
         "Несколько крупных шмоток", "Побег без кубика, раз за игру",
         "ПМЖ: Ухта", "ПМЖ: Москва", "ПМЖ: СПб"], "P")

n = wb.create_sheet("Справка")
setup_sheet(n, title="Как заполнить", last_col=3)
notes = [
    ("Идея", "Механика уже расставлена по структуре оригинала (силы монстров, награды, дурняки, слоты шмота, цены). Тебе — только жёлтые колонки: Название и Текст/шутка."),
    ("Что писать в Текст/шутка", "Одна-две строчки на карте. Дурняк и эффект уже указаны отдельными колонками — в текст можно добавить юмор про это."),
    ("Нежить", "«да» — Вайбик бьёт монстра на +3. Пара штук уже помечена."),
    ("ПМЖ", "6 строк: Ухта, Москва, СПб (по 2). Данил, Слава, Кузян и Валера не могут жить в СПб; Макс, Серёга и Тимур — в Москве. Игра сама не даст сыграть запрещённое ПМЖ."),
    ("Транспорт", "Отдельный слот шмота: одна машина надета, даёт бонус и часто +к побегу. 4 строки в сокровищах — впиши свои тачки (Старлетка, Омода, Королла…)."),
    ("Классы", "7 персональных классов — по одному на друга. Способность уже выставлена, впиши Название: Серёга (+2 к побегу), Макс (несколько транспортов), Данил (кража шмотки), Слава (+1 ур. и 2 головы), Кузян (несколько обуви), Валера (несколько крупных), Тимур (побег без кубика)."),
    ("Против (класс/ПМЖ)", "Монстру можно указать класс ИЛИ ПМЖ, против которого он сильнее/слабее: выбери из списка и поставь «Модификатор силы» (+5 или −3)."),
    ("Классы", "7 персональных классов — по одному на друга. Способность уже выставлена, впиши Название: Серёга (+2 к побегу), Макс (несколько транспортов), Данил (кража шмотки), Слава (+1 ур. и 2 головы), Кузян (несколько обуви), Валера (несколько крупных), Тимур (побег без кубика)."),
    ("Против (класс/ПМЖ)", "Монстру можно указать класс ИЛИ ПМЖ, против которого он сильнее/слабее: выбери из списка и поставь «Модификатор силы» (+5 или −3)."),
    ("Меняй и механику", "Сила, дурняки, цены — не приговор. Меняй как хочешь, я проверю при загрузке."),
    ("Добавить/удалить", "Строку можно добавить внизу или удалить — пропорции оригинала не обязательны, это ориентир."),
    ("Двери/Сокровища", "Двери: монстры/проклятия/классы/усилители. Сокровища: шмот/разовые/уровни. Как в оригинале."),
    ("Пропорции", "В шаблоне: 56 монстров из 95 дверей (~59%), 42 шмота из 73 сокровищ (~58%) — близко к оригиналу."),
    ("Готово", "Скинь файл мне — залью в игру и пересоберу галерею."),
]
for col, h in enumerate(["Пункт", "Пояснение"], start=2):
    n.cell(row=4, column=col, value=h)
style_header_row(n, row_num=4, col_start=2, col_end=3)
for i, (a, b) in enumerate(notes):
    rn = 5 + i
    n.cell(row=rn, column=2, value=a)
    n.cell(row=rn, column=3, value=b)
    style_data_row(n, row_num=rn, col_start=2, col_end=3, row_index=i)

auto_fit_columns(ws, min_width=8, max_width=36, header_row=4, data_start_row=5)
auto_fit_row_heights(ws, header_row=4, data_start_row=5)
auto_fit_columns(n, min_width=10, max_width=80, header_row=4, data_start_row=5)
auto_fit_row_heights(n, header_row=4, data_start_row=5)

wb.properties.creator = "Z.ai"
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "шаблон_карт_v2.xlsx")
wb.save(out)
doors = sum(1 for r in rows if r[1] == "Двери")
trs = sum(1 for r in rows if r[1] == "Сокровища")
print(f"Сохранено: {out} | строк: {len(rows)} (Дверей {doors}, Сокровищ {trs})")
