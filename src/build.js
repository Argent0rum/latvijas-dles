// Saliek index.html no src/page.html un datu failiem: node src/build.js
const fs = require("fs"), path = require("path");
const d = (f) => fs.readFileSync(path.join(__dirname, "data", f), "utf8");
const body = fs.readFileSync(path.join(__dirname, "page.html"), "utf8")
  .replace("/*DATA*/", d("data.json")).replace("/*EVENTS*/", d("events.json"))
  .replace("/*PRICES*/", d("prices.json")).replace("/*FERMI*/", d("fermi.json"));
const reset = 'html{color-scheme:light}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
const icon = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#9e3039"/><rect y="13" width="32" height="6" fill="#f7f4ee"/></svg>');
const desc = "Latviešu dienas spēles: Kur ir?, Silts–auksts, Laika līnija, Cik maksā? un Cik Latvijā? Katru dienu jaunas mīklas.";
const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${desc}">
<meta property="og:title" content="Latvijas dles">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#9e3039">
<link rel="icon" href="${icon}">
<style>${reset}</style>`;
if (process.argv[2]) fs.writeFileSync(process.argv[2], body);   // body only (for previews)
fs.writeFileSync(path.join(__dirname, "..", "index.html"), `<!doctype html>\n<html lang="lv">\n<head>\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`);
console.log("index.html uzbūvēts");
