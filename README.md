# Latvijas dilles

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

- `index.html` – gatavā lapa (to publicē Vercel)
- `src/page.html` – lapas kods
- `src/data/` – jautājumu bankas:
  - `events.json` – vēstures notikumi `[gads, "teksts"]`
  - `fermi.json` – "Cik Latvijā?" `["jautājums?", atbilde, "mērvienība", "avots", decimāldaļas]`
  - `prices.json` – cenas `{n, u, p, t, p15, p10, csp}` (`t` = periods, piem. `2026M09`; `csp` = nosaukums CSP tabulā)
  - `data.json` – karte un vietas
- `src/build.js` – saliek `index.html` (`npm run build`)
- `scripts/check.cjs` – pārbauda datus un to, ka šodienas mīklas nemainās
- `scripts/update-prices.mjs` – ielādē jaunākās CSP cenas

## Kā pievienot jautājumus

1. Pievieno jaunos ierakstus **saraksta beigās**. Vecos nedzēs un nepārkārto, jo no to secības ir atkarīgas iepriekšējās mīklas.
2. Katram jaunajam ierakstam pievieno sākuma datumu, ne agrāku par rītdienu:
   - `[1999, "Notikums", {"from": "2026-11-15"}]`
   - `["Jautājums?", 123, "vienības", "CSP, 2025", 0, {"from": "2026-11-15"}]`
   - cenām: lauks `"from": "2026-11-15"`
3. Lai ierakstu izņemtu, pievieno `"to": "GGGG-MM-DD"`, nevis dzēs to.
4. Palaid `npm run build` un `node scripts/check.cjs`.

## Atkārtošanās

No 2026. gada 2. novembra viens un tas pats ieraksts neatkārtojas ātrāk kā pēc ~3 nedēļām: notikumi, cenas un "Cik Latvijā?" jautājumi ne biežāk kā reizi 21 dienā (ja banka par mazu, vismaz 14), pilsētas un vietas 18–120 dienas atkarībā no lieluma, Silts–auksts mērķis 50 dienas. Pievienojot jaunus ierakstus, šie logi tikai uzlabojas.

## Automātiskā atjaunošana

- **Cenas**: `.github/workflows/cenas.yml` katra mēneša 12. un 20. datumā naktī ielādē jaunākās CSP vidējās cenas (tabula PCC010m) un iesūta izmaiņas. Atjauno tikai tās preces, kuras izdevās viennozīmīgi atrast un kuru cena nav mainījusies aizdomīgi stipri. Ja CSP maina tabulas struktūru, darbība apstājas un faili netiek mainīti. Var palaist arī ar roku: Actions → Cenu atjaunošana → Run workflow.
- **Pārbaude**: `.github/workflows/parbaude.yml` katram pull request un iesūtījumam pārbauda datus un to, ka šodienas mīklas nemainās.
- **Jauni jautājumi**: ieplānots Claude uzdevums katra mēneša 1. datumā pievieno jaunus, avotos pārbaudītus notikumus un jautājumus un iesūta tos tieši `main` zarā (tikai tad, ja `scripts/check.cjs` izdodas). Jo lielāka banka, jo mazāk jaunu ierakstu katru reizi. Commit ziņā ir katra ieraksta avots.

## Avoti

- Vietu koordinātas: GeoNames (pakete `all-the-cities`); kontūras: Natural Earth (`world-atlas`)
- Cenas: CSP ceturkšņa pārskati "Patēriņa cenas" (2010, 2015, 2025. gada IV cet.)
- Statistika: CSP "Latvia 2025. Statistics in brief"
