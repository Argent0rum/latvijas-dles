// Atjauno src/data/prices.json ar jaunākajām CSP vidējām cenām (datubāzes tabula PCC010m).
// Laiž GitHub Action (.github/workflows/cenas.yml); var palaist arī pats: node scripts/update-prices.mjs
// Drošība: atjauno tikai preces, kuras izdevās viennozīmīgi atrast un kuru cena mainījusies ne vairāk kā 0,6–1,7 reizes.
import fs from "node:fs";

const FILE = new URL("../src/data/prices.json", import.meta.url);
const API = process.env.CSP_API || "https://data.stat.gov.lv/api/v1/lv/OSP_PUB/START/VEK/PC/PCC/PCC010m";
const MIN_RATIO = 0.6, MAX_RATIO = 1.7;

const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/\([^)]*\)/g, " ")
  .replace(/\d+([.,]\d+)?\s*[-–]\s*\d+([.,]\d+)?\s*%/g, " ")
  .replace(/\d+([.,]\d+)?\s*%/g, " ")
  .replace(/\b\d+([.,]\d+)?\s*(kg|g|l|ml|gab)\b\.?/g, " ")
  .replace(/\b(eur|euro|par)\b/g, " ")
  .replace(/[^a-z0-9]+/g, " ").trim();
const short = (s) => norm(String(s).split(",")[0]);

async function getJson(url, body) {
  const res = await fetch(url, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {});
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

const meta = await getJson(API);
const vars = meta.variables;
const timeVar = vars.find((v) => v.time) || vars.find((v) => /^(time|laiks)$/i.test(v.code) || /laik|time|period/i.test(v.text));
if (!timeVar) throw new Error("Neatradu laika dimensiju: " + vars.map((v) => v.code).join(", "));
const others = vars.filter((v) => v !== timeVar);
const goods = others.reduce((a, b) => (b.values.length > a.values.length ? b : a));
console.log(`Tabula: ${meta.title}\nPreču dimensija: ${goods.code} (${goods.values.length} vērtības), laiks: ${timeVar.code}, pēdējais periods: ${timeVar.values.at(-1)}`);

const query = [
  { code: timeVar.code, selection: { filter: "top", values: ["3"] } },
  ...others.map((v) => ({ code: v.code, selection: { filter: "item", values: v === goods ? v.values : [v.values[0]] } })),
];
const res = await getJson(API, { query, response: { format: "json" } });
const keyCodes = res.columns.filter((c) => c.type !== "c").map((c) => c.code);
const gi = keyCodes.indexOf(goods.code), ti = keyCodes.indexOf(timeVar.code);
const latest = new Map();
for (const row of res.data) {
  const v = parseFloat(String(row.values[0]).replace(",", "."));
  if (!Number.isFinite(v) || v <= 0) continue;
  const g = row.key[gi], t = row.key[ti];
  if (!latest.has(g) || t > latest.get(g).t) latest.set(g, { t, v });
}

const byFull = new Map(), byShort = new Map();
goods.values.forEach((code, i) => {
  const tx = goods.valueTexts[i];
  byFull.set(norm(tx), byFull.has(norm(tx)) ? null : code);
  const s = short(tx); byShort.set(s, byShort.has(s) ? null : code);
});

const P = JSON.parse(fs.readFileSync(FILE, "utf8"));
const report = { updated: [], same: [], notFound: [], suspicious: [] };
for (const it of P.items) {
  const name = it.csp || it.n;
  const code = byFull.get(norm(name)) || byShort.get(short(name)) || null;
  const hit = code && latest.get(code);
  if (!hit) { report.notFound.push(it.n); continue; }
  if (hit.t < it.t) { report.same.push(it.n); continue; }
  const ratio = hit.v / it.p;
  if (ratio < MIN_RATIO || ratio > MAX_RATIO) { report.suspicious.push(`${it.n}: ${it.p} → ${hit.v} (${hit.t})`); continue; }
  if (hit.t === it.t && hit.v === it.p) { report.same.push(it.n); continue; }
  report.updated.push(`${it.n}: ${it.p} (${it.t}) → ${hit.v} (${hit.t})`);
  it.p = Math.round(hit.v * 100) / 100; it.t = hit.t;
}
const found = P.items.length - report.notFound.length;
const lines = [
  `Atrastas ${found} no ${P.items.length} precēm; atjauninātas ${report.updated.length}.`,
  ...report.updated.map((x) => "  ✓ " + x),
  report.suspicious.length ? "Aizdomīgas izmaiņas (netika mainītas):\n" + report.suspicious.map((x) => "  ! " + x).join("\n") : "",
  report.notFound.length ? "Neatrastas CSP tabulā:\n  " + report.notFound.join(", ") : "",
].filter(Boolean).join("\n");
console.log(lines);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, "## Cenu atjaunošana\n```\n" + lines + "\n```\n");
if (found < P.items.length * 0.5) {
  console.error("Atrasta mazāk nekā puse preču — iespējams, CSP mainījis tabulas struktūru. Faili netika mainīti.");
  process.exit(1);
}
fs.writeFileSync(FILE, '{"items":[\n' + P.items.map((x) => JSON.stringify(x)).join(",\n") + "\n]}\n");
