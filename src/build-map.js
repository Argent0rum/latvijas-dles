// Builds the map paths and the place list for the "Kur ir" game.
const topo = require("topojson-client");
const world = require("world-atlas/countries-10m.json");
const cities = require("all-the-cities");
const fs = require("fs");

const LON0 = 20.8, LON1 = 28.4, LAT0 = 55.55, LAT1 = 58.15;
const COS = Math.cos((56.85 * Math.PI) / 180);
const K = 1000 / ((LON1 - LON0) * COS);
const W = 1000, H = Math.round((LAT1 - LAT0) * K);
const proj = ([lon, lat]) => [(lon - LON0) * COS * K, (LAT1 - lat) * K];

// Sutherland–Hodgman clip of a ring against an expanded viewport.
const PAD = 20;
const edges = [
  [(p) => p[0] >= -PAD, (a, b) => inter(a, b, 0, -PAD)],
  [(p) => p[0] <= W + PAD, (a, b) => inter(a, b, 0, W + PAD)],
  [(p) => p[1] >= -PAD, (a, b) => inter(a, b, 1, -PAD)],
  [(p) => p[1] <= H + PAD, (a, b) => inter(a, b, 1, H + PAD)],
];
function inter(a, b, axis, v) {
  const t = (v - a[axis]) / (b[axis] - a[axis]);
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}
function clip(ring) {
  let out = ring;
  for (const [inside, cut] of edges) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i], prev = inp[(i + inp.length - 1) % inp.length];
      if (inside(cur)) { if (!inside(prev)) out.push(cut(prev, cur)); out.push(cur); }
      else if (inside(prev)) out.push(cut(prev, cur));
    }
    if (!out.length) break;
  }
  return out;
}
function toPath(feature, simplify = 0.6) {
  const polys = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  let d = "";
  for (const poly of polys) for (const ring of poly) {
    let pts = clip(ring.map(proj));
    if (pts.length < 3) continue;
    // drop points closer than `simplify` units to the previous kept one
    const kept = [pts[0]];
    for (const p of pts.slice(1)) {
      const q = kept[kept.length - 1];
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= simplify) kept.push(p);
    }
    if (kept.length < 3) continue;
    d += "M" + kept.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
  }
  return d;
}

const countries = topo.feature(world, world.objects.countries).features;
const byId = (id) => countries.find((f) => String(f.id) === id);
const latvia = toPath(byId("428"));
const neighbours = ["233", "440", "643", "112"].map((id) => toPath(byId(id))).filter(Boolean).join("");

// Places: Latvian populated places from GeoNames, minus Riga and Riga districts.
const skip = new Set(["Riga", "Krustpils", "Jaunciems", "Bolderaja", "Daugavgrīva", "Karosta", "Mežaparks"]);
const lv = cities
  .filter((c) => c.country === "LV" && c.featureCode !== "PPLX" && !skip.has(c.name))
  .map((c) => ({ n: c.name, p: c.population, lat: +c.loc.coordinates[1].toFixed(4), lon: +c.loc.coordinates[0].toFixed(4) }));
const tier = (p) => (p >= 8000 ? 0 : p >= 2000 ? 1 : 2);
const tiers = [[], [], []];
for (const c of lv) tiers[tier(c.p)].push([c.n, c.lat, c.lon]);

const riga = proj([24.106, 56.946]);
const data = { W, H, LON0, LAT1, COS, K, latvia, neighbours, riga: riga.map((v) => +v.toFixed(1)), tiers };
fs.writeFileSync(__dirname + "/data/data.json", JSON.stringify(data));
console.log("viewBox", W, H, "latvia path", latvia.length, "neigh", neighbours.length, "tiers", tiers.map((t) => t.length));
