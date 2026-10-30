// Pārbauda jautājumu bankas un to, ka izmaiņas nemaina šodienas un iepriekšējo dienu mīklas.
//   node scripts/check.cjs            – salīdzina ar origin/main (vai HEAD) index.html
//   node scripts/check.cjs base.html  – salīdzina ar norādīto failu
const fs = require("fs"), path = require("path"), { execSync } = require("child_process");
const { load, day, rigaDayIndex } = require("./picks.cjs");
const root = path.join(__dirname, ".."), data = (f) => JSON.parse(fs.readFileSync(path.join(root, "src/data", f), "utf8"));
const errors = [];
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const metaOk = (m, where) => {
  if (m == null) return;
  for (const k of Object.keys(m)) if (!["from", "to"].includes(k)) errors.push(`${where}: nezināms lauks "${k}"`);
  if (m.from && !isDate(m.from)) errors.push(`${where}: "from" jābūt GGGG-MM-DD`);
  if (m.to && !isDate(m.to)) errors.push(`${where}: "to" jābūt GGGG-MM-DD`);
};
// events: [gads, "teksts", {from?, to?}?]
const seen = new Set();
data("events.json").forEach((e, i) => {
  const w = `events.json #${i + 1}`;
  if (!Number.isInteger(e[0]) || typeof e[1] !== "string" || !e[1].trim()) errors.push(`${w}: jābūt [gads, "teksts"]`);
  if (e.length > 3 || (e.length === 3 && typeof e[2] !== "object")) errors.push(`${w}: lieks elements`);
  metaOk(e[2], w);
  if (seen.has(e[1])) errors.push(`${w}: dublēts notikums`); seen.add(e[1]);
});
// fermi: ["jautājums?", atbilde, "mērvienība", "avots", decimāldaļas, {from?, to?}?]
data("fermi.json").forEach((q, i) => {
  const w = `fermi.json #${i + 1}`;
  if (typeof q[0] !== "string" || !(q[1] > 0) || typeof q[2] !== "string" || typeof q[3] !== "string" || !Number.isInteger(q[4]))
    errors.push(`${w}: jābūt ["jautājums", pozitīvs skaitlis, "mērvienība", "avots", decimāldaļas]`);
  if (q.length > 6) errors.push(`${w}: lieks elements`);
  metaOk(q[5], w);
});
// prices: {n, u, p, t:"GGGGMmm", p15, p10, csp, from?, to?}
data("prices.json").items.forEach((it, i) => {
  const w = `prices.json #${i + 1} ${it.n}`;
  if (!it.n || !it.u || !(it.p > 0) || !/^\d{4}M\d{2}$/.test(it.t || "")) errors.push(`${w}: trūkst n/u/p/t`);
  for (const k of ["p15", "p10"]) if (it[k] != null && !(it[k] > 0)) errors.push(`${w}: ${k} jābūt skaitlim vai null`);
  metaOk({ ...(it.from ? { from: it.from } : {}), ...(it.to ? { to: it.to } : {}) }, w);
});
if (errors.length) { console.error("Kļūdas datos:\n- " + errors.join("\n- ")); process.exit(1); }

execSync("node src/build.js", { cwd: root, stdio: "ignore" });
let baseHtml = process.argv[2] ? fs.readFileSync(process.argv[2], "utf8") : null;
if (!baseHtml) for (const ref of ["origin/main", "HEAD"]) {
  try { baseHtml = execSync(`git show ${ref}:index.html`, { cwd: root, encoding: "utf8", maxBuffer: 1 << 26, stdio: ["ignore", "pipe", "ignore"] }); break; } catch {}
}
const now = load(path.join(root, "index.html"));
const today = rigaDayIndex(now.EPOCH);
if (baseHtml) {
  const base = load(baseHtml);
  for (let d = 0; d <= today; d++) {
    const a = JSON.stringify(day(base, d)), b = JSON.stringify(day(now, d));
    if (a !== b) { console.error(`Izmaiņas maina ${d + 1}. dienas mīklas (šodien ir ${today + 1}. diena). Jauniem ierakstiem pievieno {"from": "<rītdienas datums vai vēlāk>"}, un vecos nedzēs un nepārkārto.`); process.exit(1); }
  }
  console.log(`Dienas 1–${today + 1}: mīklas nemainījās.`);
} else console.log("Nav ar ko salīdzināt (nav git vēstures) — salīdzināšana izlaista.");
for (let d = today + 1; d <= today + 60; d++) day(now, d);   // future days must still draw without errors
console.log("Dati kārtībā. Nākamo 60 dienu mīklas izvēlas bez kļūdām.");
