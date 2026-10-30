// Izvelk spēļu dienas izvēles loģiku no uzbūvētā index.html (bez pārlūka), lai varētu salīdzināt versijas.
const fs = require("fs");
function load(htmlOrPath) {
  const html = htmlOrPath.includes("<script") ? htmlOrPath : fs.readFileSync(htmlOrPath, "utf8");
  const js = html.split("<script>")[1].split("</script>")[0];
  const stub = new Proxy(function () {}, { get: () => stub, apply: () => stub, set: () => true });
  const pure = js.split("/* ================= page shell")[0];
  return new Function("document", "window", "localStorage",
    pure + "; return {kurPicks, sTarget, lPicks, priceRounds, fermiRounds, EPOCH};")(
    { getElementById: () => stub, createElementNS: () => stub, createElement: () => stub, querySelectorAll: () => [] }, {}, null);
}
function day(f, d) {
  return {
    kur: f.kurPicks(d).map((p) => p[0]),
    silts: f.sTarget(d).name,
    laiks: f.lPicks(d),
    // price values may change (monthly CSP update); which products are drawn must not
    cena: f.priceRounds(d).map((r) => [r.name, r.past ? r.year : "now"]),
    fermi: f.fermiRounds(d).map((r) => [r.title, r.a]),
  };
}
function rigaDayIndex(EPOCH, date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Riga", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(date).map((x) => [x.type, x.value]));
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day) - EPOCH) / 864e5);
}
module.exports = { load, day, rigaDayIndex };
