# Latvijas dles

Latviešu dienas minēšanas spēles vienā lapā. Katru dienu pusnaktī (pēc Rīgas laika) visiem parādās tās pašas jaunas mīklas.

| Spēle | Kas jādara | Rezultāts |
|---|---|---|
| **Kur ir?** | Atzīmē kartē 5 Latvijas vietas | līdz 5000 punktiem pēc attāluma |
| **Silts–auksts** | Uzmini dienas pilsētu, rakstot nosaukumus | minējumu skaits |
| **Laika līnija** | Sakārto 6 notikumus no Latvijas vēstures | mēģinājumu skaits (max 5) |
| **Cik maksā?** | Uzmini vidējo cenu Latvijā (arī 2010. un 2015. g.) | līdz 5000 punktiem |
| **Cik Latvijā?** | Novērtē skaitļus par Latviju | līdz 5000 punktiem |

Progress glabājas spēlētāja pārlūkā. Serveris un konts nav vajadzīgs.

## Struktūra

- `index.html` – gatavā lapa (to arī publicē Vercel / GitHub Pages)
- `src/page.html` – lapas kods
- `src/data/` – jautājumu bankas: `events.json` (vēstures notikumi), `prices.json` (cenas), `fermi.json` (statistika), `data.json` (karte un vietas)
- `src/build.js` – saliek `index.html`: `npm run build`

Pēc izmaiņām `src/` palaid `npm run build` un iesūti arī jauno `index.html`.

## Avoti

- Vietu koordinātas: GeoNames (pakete `all-the-cities`); kontūras: Natural Earth (`world-atlas`)
- Cenas: CSP ceturkšņa pārskati "Patēriņa cenas" (2010, 2015, 2025. gada IV cet.)
- Statistika: CSP "Latvia 2025. Statistics in brief"
