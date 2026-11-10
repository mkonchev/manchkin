// ============================================================================
//  КАРТЫ ИГРЫ — СГЕНЕРИРОВАНО из tools/cards-data.json (node tools/build-cards.js)
//  Источник правды — Excel «карты.xlsx»: правь его и скинь обратно,
//  либо правь cards-data.json и пересобери этой командой.
// ============================================================================

let seq = 0;
const c = (x) => ({ id: 'c' + (++seq), ...x });
const DOOR_DECK = [];
const TREASURE_DECK = [];
const rep = (deck, n, make) => { for (let i = 0; i < n; i++) deck.push(c(make())); };
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Димас-вайбик","text":"Бородатый. Вайбовый. Больше о нём неизвестно ничего.","img":"demo.jpg","level":1,"levels":1,"treasures":1,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Джунгарик-мальчик","text":"Крошечный. Пушистый. Беременный.","img":null,"level":1,"levels":1,"treasures":1,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Собака-камикадзе","text":"Целилась в Данила. Попала в бампер. Собака жива, бампер — герой.","img":null,"level":2,"levels":1,"treasures":1,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Стакан воды Славы","text":"Не трогай. Это — СЛАВА. Зато босиком ходишь честно.","img":null,"level":2,"levels":1,"treasures":1,"bad":{"t":"loseSlot","slot":"feet"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Правки от заказчика","text":"«Сделай как было, только красиво». Ты больше не дизайнер.","img":null,"level":3,"levels":1,"treasures":1,"bad":{"t":"loseClass"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Альтушка с Дайвинчика","text":"Кузян уже написал. История молчит.","img":null,"level":4,"levels":1,"treasures":1,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Лысина Кузяна","text":"Блеснула на солнце — ты ослеплён. −1 уровень.","img":null,"level":4,"levels":1,"treasures":1,"bad":{"t":"loseLevel","n":1},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Шестёрка без педалей","text":"Тормоз — это же левая? Всегда?.. Ботинки в пол не помогают.","img":null,"level":4,"levels":1,"treasures":2,"bad":{"t":"loseSlot","slot":"feet"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Сема Загрудаев","text":"Выиграл айфон в камень-ножницы-бумагу. Просто КНБ. Айфон.","img":null,"level":4,"levels":1,"treasures":1,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Сбор шишек в тайге","text":"Шишка. Ещё шишка. Это работа, да.","img":null,"level":4,"levels":1,"treasures":1,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Кузян на горных лыжах","text":"Едет? Нет. Катится. Кувырком. Шлем слетел, твой тоже.","img":null,"level":5,"levels":1,"treasures":2,"bad":{"t":"loseSlot","slot":"head"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Серёга с мячом","text":"В стенку играем? В стенку играем.","img":null,"level":5,"levels":1,"treasures":2,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Обезьянник на сутки","text":"Мокрый хлеб, друг-бомж, сутки за красный свет. Легенда Тимура.","img":null,"level":5,"levels":1,"treasures":1,"bad":{"t":"loseLevel","n":1},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Дизайнер-перфекционист","text":"Кернинг. КЕРНИНГ!","img":null,"level":5,"levels":1,"treasures":2,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Теннисная тройка","text":"Макс, Данил и Слава. Все занимались. Никто не умеет.","img":null,"level":6,"levels":1,"treasures":2,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Китайский автопром Данила","text":"Едет! Осталось выяснить — куда. Всё из рук вывалилось.","img":null,"level":6,"levels":1,"treasures":2,"bad":{"t":"loseSlot","slot":"hands"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Наезд ментов","text":"Вы похожи. На кого? Да на всех! Забрали прямо со школы.","img":null,"level":6,"levels":1,"treasures":2,"bad":{"t":"loseClass"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Дзен-Валера","text":"Был в Японии. Зачем? Что привёз? Никто не знает.","img":null,"level":6,"levels":1,"treasures":2,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Кузян-куряга","text":"Волосы выпадают от стресса. От твоего.","img":null,"level":6,"levels":1,"treasures":2,"bad":{"t":"loseLevel","n":1},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Бригада на стройке","text":"Работа до заката, зарплата до понедельника.","img":null,"level":6,"levels":1,"treasures":2,"bad":{"t":"loseLevel","n":1},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Дача Кузяна в Аэропорту","text":"Папа Дима наливает. Мама всё узнаёт по телефону.","img":null,"level":6,"levels":1,"treasures":2,"bad":{"t":"loseLevel","n":1},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Молотов, борец MMA","text":"«Кто тут пиццу заказывал?» Кузян заказывает с доставкой.","img":null,"level":7,"levels":1,"treasures":2,"bad":{"t":"loseSlot","slot":"body"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"ГПЛ против УТЛа","text":"Школьная вражда. Данил перебежал к врагу и не оглянулся.","img":null,"level":7,"levels":1,"treasures":2,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Подъёмник на Снегирях","text":"Сломался. Ты наверху. Опять. Лыжи идут в сброс.","img":null,"level":7,"levels":1,"treasures":2,"bad":{"t":"loseSlot","slot":"feet"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Нижегородское прошлое Валеры","text":"Мы не спрашиваем. Он не рассказывает.","img":null,"level":7,"levels":1,"treasures":2,"bad":{"t":"loseLevel","n":1},"tag":"undead","classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Тимур и два мальчика","text":"Джунгарики наблюдают. Они всё видели.","img":null,"level":7,"levels":2,"treasures":2,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Рехаб-ежегодник","text":"Год среди торчков. Выехал другим человеком.","img":null,"level":8,"levels":1,"treasures":3,"bad":{"t":"loseLevel","n":1},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Джунгарики на ПМЖ в Ухте","text":"Тимур уехал в рехаб и отправил их на родину. Имена придумать не успел.","img":null,"level":8,"levels":1,"treasures":3,"bad":{"t":"none"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Сыктывкарские гаишники","text":"Жезл виден издалека. Права — под арест. Пропусти ход.","img":null,"level":8,"levels":1,"treasures":3,"bad":{"t":"skipTurn"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Тимур, главный мем","text":"Не понимай его. Переживи его.","img":null,"level":10,"levels":2,"treasures":3,"bad":{"t":"loseLevel","n":2},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Беременный джунгарик №2","text":"Мальчик. Беременный. Наука в шоке.","img":null,"level":10,"levels":2,"treasures":3,"bad":{"t":"loseLevel","n":2},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Лудоман Тимур","text":"Нигде не работал. Проиграл 12 миллионов. Математика?","img":null,"level":11,"levels":2,"treasures":4,"bad":{"t":"loseLevel","n":2},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Гараж Макса","text":"Ещё одна машина поместится. Всегда. Твоя броня уже внутри.","img":null,"level":12,"levels":2,"treasures":4,"bad":{"t":"loseSlot","slot":"body"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Прод в пятницу","text":"Разрабы знают. Вы — нет. Пятница, 23:58.","img":null,"level":12,"levels":2,"treasures":4,"bad":{"t":"loseLevel","n":2},"tag":"undead","classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Макс-перекуп хот-вилс","text":"Предложение, от которого ты не откажешься.","img":null,"level":13,"levels":2,"treasures":4,"bad":{"t":"loseLevel","n":2},"tag":null,"classMod":null}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Полная полка хот-вилс","text":"300 машинок. 100 тысяч рублей. СМЕРТЬ. Твоему кошельку: всё в сброс, уровень 1, добери 4 Двери.","img":null,"level":14,"levels":3,"treasures":5,"bad":{"t":"death"},"tag":null,"classMod":null}));
rep(DOOR_DECK, 2, () => ({"type":"curse","name":"Мы не пьяные!","text":"Кузян, папа Дима и один звонок маме. Вы абсолютно трезвы — монстр проверит (+5 в след. бою).","img":null,"effect":"pendingMonster","arg":5}));
rep(DOOR_DECK, 2, () => ({"type":"curse","name":"Скрины уйдут маме","text":"Одноклассница уже делает скриншот. Теряй случайный предмет — мама будет недовольна.","img":null,"effect":"loseRandomSlot","arg":null}));
rep(DOOR_DECK, 2, () => ({"type":"curse","name":"Красный свет","text":"Тимур проехал. Тебе — сутки в обезьяннике: пропусти следующий ход.","img":null,"effect":"skipTurn","arg":null}));
rep(DOOR_DECK, 2, () => ({"type":"curse","name":"Двенадцать миллионов","text":"Ещё одна ставка. Ну, почти последняя. −1 уровень.","img":null,"effect":"loseLevel","arg":1}));
rep(DOOR_DECK, 2, () => ({"type":"curse","name":"Теперь ты Бебра","text":"Компания проголосовала. Эпоха Бебры наступила. Потеряй класс.","img":null,"effect":"loseClass","arg":null}));
rep(DOOR_DECK, 1, () => ({"type":"curse","name":"Чат компании всё знает","text":"Скрин ушёл в общий чат. В следующем бою монстр +5 — все придут смотреть.","img":null,"effect":"pendingMonster","arg":5}));
rep(DOOR_DECK, 2, () => ({"type":"curse","name":"Джомы порвались","text":"Серёга расплакался. Потеряй обувь.","img":null,"effect":"loseSlot","arg":"feet"}));
rep(DOOR_DECK, 2, () => ({"type":"curse","name":"Шлем забыт на Снегирях","text":"Подъёмник сломался вместе с ним. Потеряй головной убор.","img":null,"effect":"loseSlot","arg":"head"}));
rep(DOOR_DECK, 2, () => ({"type":"curse","name":"Ноутбук уехал в 2110-й","text":"Обмен был неравным. Потеряй всё из рук.","img":null,"effect":"loseSlot","arg":"hands"}));
rep(DOOR_DECK, 2, () => ({"type":"curse","name":"Куртка осталась на стройке","text":"Чуваши сочувствуют. Потеряй броню.","img":null,"effect":"loseSlot","arg":"body"}));
rep(DOOR_DECK, 2, () => ({"type":"curse","name":"Потеряй уровень","text":"Менты перепутали снова. Обидно и бессмысленно.","img":null,"effect":"loseLevel","arg":1}));
rep(DOOR_DECK, 3, () => ({"type":"enhancer","name":"Его настиг WATAFUK","text":"+5 к силе монстра. Кричат из чата.","img":null,"bonus":5}));
rep(DOOR_DECK, 3, () => ({"type":"enhancer","name":"Тимур поставил на него","text":"+10 к силе монстра. Ставка удвоилась. Монстр тоже.","img":null,"bonus":10}));
rep(DOOR_DECK, 1, () => ({"type":"item","name":"Ключ на 10","text":"У Макса в гараже найдётся любой ключ. Даже на 10.","img":null,"bonus":3,"slot":"hands","hands":1,"big":false,"price":200,"runBonus":0,"synergy":null}));
rep(DOOR_DECK, 1, () => ({"type":"oneShot","name":"Мокрый тюремный хлеб","text":"+3 в бою. Ел Тимур. Подружился с бомжом.","img":null,"bonus":3}));
rep(DOOR_DECK, 1, () => ({"type":"oneShot","name":"Друг-бомж из обезьянника","text":"+5 в бою. Знает все лазейки. Тимур познакомился за мокрый хлеб.","img":null,"bonus":5}));
rep(DOOR_DECK, 1, () => ({"type":"oneShot","name":"Халяльная пицца из Додо","text":"+4 в бою. Тимур одобряет.","img":null,"bonus":4}));
rep(DOOR_DECK, 1, () => ({"type":"oneShot","name":"Пятница. Додо. Ухта.","text":"+6 в бою. Место силы, пока пицца горячая.","img":null,"bonus":6}));
rep(DOOR_DECK, 1, () => ({"type":"oneShot","name":"Кузя, переведи!","text":"+3 в бою. Никто не понял, но все согласны.","img":null,"bonus":3}));
rep(DOOR_DECK, 1, () => ({"type":"item","name":"Гаечный ключ из гаража","text":"Подходит ко всему, кроме того, что сломалось.","img":null,"bonus":2,"slot":"hands","hands":1,"big":false,"price":200,"runBonus":0,"synergy":null}));
rep(DOOR_DECK, 1, () => ({"type":"oneShot","name":"Вода из-под крана","text":"+2 в бою. Слава морщится, но пьёт.","img":null,"bonus":2}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Кепка перекупа","text":"Козырёк решает. Цена — никогда.","img":null,"bonus":2,"slot":"head","hands":1,"big":false,"price":200,"runBonus":0,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Шлем со Снегирей","text":"Найден под сломанным подъёмником.","img":null,"bonus":3,"slot":"head","hands":1,"big":false,"price":400,"runBonus":0,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Борода Димаса","text":"Прикреплена вайбом.","img":null,"bonus":4,"slot":"head","hands":1,"big":false,"price":600,"runBonus":0,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Куртка со стройки","text":"Пахнет бетоном и победой.","img":null,"bonus":2,"slot":"body","hands":1,"big":false,"price":200,"runBonus":0,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Броня лудомана","text":"Внутри пусто, как после казино.","img":null,"bonus":4,"slot":"body","hands":1,"big":false,"price":600,"runBonus":0,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Мантия дзен-Валеры","text":"Из Японии. Не спрашивай.","img":null,"bonus":5,"slot":"body","hands":1,"big":true,"price":800,"runBonus":0,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Полка хот-вилс","text":"300 машинок. 100 тысяч рублей. Возить с собой — честь.","img":null,"bonus":6,"slot":"body","hands":1,"big":true,"price":900,"runBonus":0,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Падел-ракетка Славы","text":"После игры — вода в стекле. Обязательно.","img":null,"bonus":2,"slot":"hands","hands":1,"big":false,"price":200,"runBonus":0,"synergy":{"power":"levelHead2","bonus":2}}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Ракетка теннисной тройки","text":"Все занимались. Никто не умеет.","img":null,"bonus":2,"slot":"hands","hands":1,"big":false,"price":200,"runBonus":0,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Битый бампер Данила","text":"Трофей собаки-камикадзе.","img":null,"bonus":3,"slot":"hands","hands":2,"big":false,"price":400,"runBonus":0,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Омода Данила","text":"Лучше Чангана в 100 раз. Чанган тоже +3.","img":null,"bonus":3,"slot":"hands","hands":2,"big":false,"price":400,"runBonus":0,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Королла 95 года","text":"Макс любит праворульные. Руль мешает, зато стиль.","img":null,"bonus":4,"slot":"hands","hands":2,"big":false,"price":600,"runBonus":0,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Тапочки обезьянника","text":"Мокрый хлеб в комплекте.","img":null,"bonus":1,"slot":"feet","hands":1,"big":false,"price":100,"runBonus":1,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Джомы Серёги","text":"Играют в любые игры. Всегда выигрывают.","img":null,"bonus":2,"slot":"feet","hands":1,"big":false,"price":300,"runBonus":2,"synergy":{"power":"run2","bonus":2}}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Старлетка","text":"За ней он ЛЕТАЛ В ИЖЕВСК. Toyota, между прочим.","img":null,"bonus":2,"slot":"feet","hands":1,"big":false,"price":300,"runBonus":3,"synergy":{"power":"multiTransport","bonus":2}}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"2109 за 30 тыщ","text":"Куплена за 30. Продана за 5. Экономика.","img":null,"bonus":1,"slot":"feet","hands":1,"big":false,"price":100,"runBonus":0,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"2110-я за ноутбук","text":"Обменял машину на ноут. Разраб обеспечивает.","img":null,"bonus":2,"slot":"feet","hands":1,"big":false,"price":300,"runBonus":1,"synergy":null}));
rep(TREASURE_DECK, 2, () => ({"type":"oneShot","name":"Стакан воды","text":"+4 в бою. Слава уже несётся.","img":null,"bonus":4}));
rep(TREASURE_DECK, 1, () => ({"type":"oneShot","name":"Айфон Семы","text":"+5 в бою. Выигран в КНБ. Просто КНБ.","img":null,"bonus":5}));
rep(TREASURE_DECK, 2, () => ({"type":"oneShot","name":"Серёга взялся за игру","text":"+6 в бою. Умеет играть в любые игры. Всегда выигрывает.","img":null,"bonus":6}));
rep(TREASURE_DECK, 2, () => ({"type":"oneShot","name":"WATAFUK!","text":"+8 в бою. Сказано в нужный момент. Компания одобряет.","img":null,"bonus":8}));
rep(TREASURE_DECK, 1, () => ({"type":"oneShot","name":"Слёзы лудомана","text":"+3 в бою. 12 миллионов слёз.","img":null,"bonus":3}));
rep(TREASURE_DECK, 1, () => ({"type":"oneShot","name":"Вайб Димаса","text":"+4 в бою. Непонятно почему работает.","img":null,"bonus":4}));
rep(TREASURE_DECK, 8, () => ({"type":"levelUp","name":"Пятница в Додо","text":"Сбор по традиции. +1 уровень (но не до 10-й победы).","img":null,"arg":1}));
rep(TREASURE_DECK, 3, () => ({"type":"levelUp","name":"Гениальная идея в чате в 3:00","text":"+2 уровня (но не до 10-й победы).","img":null,"arg":2}));
rep(TREASURE_DECK, 2, () => ({"type":"levelUp","name":"Наступила эпоха WATAFUK","text":"+2 уровня (но не до 10-й победы).","img":null,"arg":2}));
rep(TREASURE_DECK, 1, () => ({"type":"levelUp","name":"Кузя, переведи!","text":"+1 уровень (но не до 10-й победы). Перевёл так, что стало лучше.","img":null,"arg":1}));
rep(TREASURE_DECK, 1, () => ({"type":"levelUp","name":"Собака подала голос","text":"+1 уровень (но не до 10-й победы). Знак одобрения от собаки-камикадзе.","img":null,"arg":1}));
rep(DOOR_DECK, 1, () => ({"type":"klass","name":"Серёга","text":"Умеет играть в любые игры и всегда выигрывает. +2 к любому броску побега.","img":null,"power":"run2"}));
rep(DOOR_DECK, 1, () => ({"type":"klass","name":"Макс","text":"Машин много не бывает. Носит сколько угодно транспортов.","img":null,"power":"multiTransport"}));
rep(DOOR_DECK, 1, () => ({"type":"klass","name":"Данил","text":"Раз за игру крадёт шмотку. Однажды украл сникерс в Пятёрочке. Спалили. Позвонили маме.","img":null,"power":"thief"}));
rep(DOOR_DECK, 1, () => ({"type":"klass","name":"Слава","text":"Вода в стекле лечит всё: +1 уровень раз за игру. И две шмотки на голову — тоже Слава.","img":null,"power":"levelHead2"}));
rep(DOOR_DECK, 1, () => ({"type":"klass","name":"Кузян","text":"Сколько угодно обуви. Для прогулок к Додо и обратно.","img":null,"power":"multiFeet"}));
rep(DOOR_DECK, 1, () => ({"type":"klass","name":"Валера","text":"Носит несколько крупных шмоток сразу. Всё дзен.","img":null,"power":"multiBig"}));
rep(DOOR_DECK, 1, () => ({"type":"klass","name":"Тимур","text":"Раз за игру сбегает без броска кубика. Педали тут ни при чём.","img":null,"power":"escapeOnce"}));
rep(DOOR_DECK, 2, () => ({"type":"race","name":"Ухта","text":"Родина. Додо на каждом шагу.","img":null,"power":"ukhta"}));
rep(DOOR_DECK, 2, () => ({"type":"race","name":"Москва","text":"Деньги в воздухе, но Максу, Серёге и Тимуру туда нельзя.","img":null,"power":"moscow"}));
rep(DOOR_DECK, 2, () => ({"type":"race","name":"СПб","text":"Культурная столица. Но не для Данила, Славы, Кузяна и Валеры.","img":null,"power":"spb"}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"ДПС на трассе","text":"Видит твой багажник издалека. Макс страдает сильнее всех.","img":null,"level":8,"levels":1,"treasures":2,"bad":{"t":"loseSlot","slot":"transport"},"tag":null,"classMod":{"power":"multiTransport","bonus":5}}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Собеседование в Москве","text":"Для тех, кто живёт в Москве, вопрос «где вы видите себя через 5 лет» становится личным.","img":null,"level":9,"levels":1,"treasures":2,"bad":{"t":"loseLevel","n":1},"tag":null,"classMod":{"power":"moscow","bonus":3}}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Питерская сырость","text":"Пронизывает насквозь. Особенно жителей СПб.","img":null,"level":6,"levels":1,"treasures":1,"bad":{"t":"none"},"tag":null,"classMod":{"power":"spb","bonus":4}}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Ухтинская тёща","text":"Ухтинцам её жалко, поэтому они дерутся вполсилы.","img":null,"level":7,"levels":1,"treasures":2,"bad":{"t":"loseLevel","n":1},"tag":null,"classMod":{"power":"ukhta","bonus":-3}}));
rep(DOOR_DECK, 1, () => ({"type":"monster","name":"Сломанный подъёмник, часть 2","text":"На этот раз — с тобой наверху и с твоими вещами.","img":null,"level":7,"levels":2,"treasures":2,"bad":{"t":"loseRandomSlot"},"tag":null,"classMod":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Старлетка","text":"За ней он ЛЕТАЛ В ИЖЕВСК. Toyota, между прочим.","img":null,"bonus":2,"slot":"transport","hands":1,"big":false,"price":300,"runBonus":3,"synergy":{"power":"multiTransport","bonus":2}}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Праворульная Королла","text":"Руль справа, сердце слева.","img":null,"bonus":4,"slot":"transport","hands":1,"big":false,"price":700,"runBonus":2,"synergy":null}));
rep(TREASURE_DECK, 1, () => ({"type":"item","name":"Омода","text":"Лучше Чангана в 100 раз. Чанган тоже +3.","img":null,"bonus":3,"slot":"transport","hands":1,"big":false,"price":500,"runBonus":1,"synergy":null}));

const CARD_INFO = {
  doorCount: DOOR_DECK.length,
  treasureCount: TREASURE_DECK.length,
  monsters: DOOR_DECK.filter((c) => c.type === 'monster').length,
  curses: DOOR_DECK.filter((c) => c.type === 'curse').length,
};

module.exports = { DOOR_DECK, TREASURE_DECK, CARD_INFO };
