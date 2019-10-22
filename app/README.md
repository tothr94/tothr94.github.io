# LegoViz

## Témaválasztás
A beadandó elkészítése során a LEGO által legyártott és az általam birtokolt különböző színek arányait ábrázoltam.

## Az adatok forrása
Az elkészítés során a LEGO-fanatikusok által működtetett BrickLink (https://www.bricklink.com/v2/main.page) webhely adatait használtam fel, ahol jelenleg (2018. december 15.)  14895 darab különböző készlet található meg. Az adatbázis tartalmazza a készletek kiadási évét, valamint a bennük szereplő alkatrészeket, extra elemeket, minifigurákat, összetett tételeket, valamint egyéb összetevőket is. A számunkra érdekes kockák esetében ismert azok azonosítója, színe és (többnyire) a tömege is.

## Előfeldolgozás
A készletek és a bennük szereplő kockák többségéhez ugyan minden adat rendelkezésre áll, de jelentős mennyiségű előfeldolgozást kellett elvégeznem a megjelenítés előtt. Törlésre kerültek azok a készletek, amelyek csak más készleteket tartalmaznak (csomagok), továbbá eltávolítottam a különböző kiegészítő tételeket (pl. könyveket, tárolókat, magazinokat) is. Azokkal a kockákkal sem tudtam dolgozni, melyekhez nem ismertek a tömegre vonatkozó adatok. Az ábrázolhatóság kedvéért csak a Solid Colors kategóriába tartozó színek kerültek feldolgozásra (https://www.bricklink.com/catalogColors.asp). A szűrés után aggregálást is végeztem az adathalmazon, így állt elő a legyártott (`produced.json`) és az általam birtokolt (`owned.json`) kockák adatait tartalmazó két állomány. Ezek színenként és évenként tartalmazzák az összesített darabszámra és tömegre vonatkozó adatokat.  Ugyancsak kinyertem az előbb említett színskála adatait is, melyeket a `colors.json` állományban tárolok. Az előfeldolgozás lépéseit Java-nyelvű programmal végeztem el.

## A vizualizáció
Egy olyan SVG-alapú, interaktív ábrát készítettem el, amely pontos megjelenése kapcsolókkal szabályozható. Az elkészítés során az AngularJS keretrendszert és a D3.js könyvtárat használtam fel. 

### Interakció a kapcsolókkal
* **Rendezett** - A különböző évekhez tartozó adatok rendezhetők. Ekkor minden egyes évben a nagyság szerint csökkenő sorrendben helyezkednek el a színekhez tartozó téglalapok. Így válik kihangsúlyozhatóvá az, hogy miként lett az adott szín az évek során hangsúlyosabb vagy éppen kevésbé népszerű.
* **Kockák tömege** - Alapértelmezettként a kockák darabszáma kerül ábrázolásra, ám ez cserélhető azok tömegére. Így válik szemléltethetővé az, hogy nem ugyanaz a különböző színekhez tartozó darabszám és tömegadatok aránya. Néhány szín esetében inkább kisebb, de több kockával találkozunk, míg mások esetében kevesebb, de nagyobb elemmel.
* **Saját kockák** - Az általam birtokolt kockák ábrázolása a kiadott készletekhez tartozók helyett. 
* **Logaritmikus értékek** - A különböző színekhez tartozó kockák adatai nagyon különbözőek, nagyságrendekkel eltérnek egymástól. Az opció bekapcsolásával a különböző színekhez tartozó valós darabszámok/tömegek helyett azok kettes alapú logaritmussal vett értéke kerül ábrázolásra.

## Üzembe helyezés
A vizualizáció egy JavaScript futtatásra is képes böngészőben az `index.html` állományra kattintva tekinthető meg.