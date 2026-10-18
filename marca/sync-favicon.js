/* Gera ../favicon.svg a partir de marca/brand.js (fonte unica).
   Uso: node marca/sync-favicon.js      (a partir da raiz do projeto)
   Depois de mudar a logo, rode isto para o favicon nao ficar defasado. */
var fs = require("fs");
var path = require("path");

var dir = __dirname;
global.window = {};
(function () { eval(fs.readFileSync(path.join(dir, "brand.js"), "utf8")); })();

if (typeof global.window.SGOM_brandMark !== "function") {
  console.error("ERRO: SGOM_brandMark nao encontrada em marca/brand.js");
  process.exit(1);
}

var svg = global.window.SGOM_brandMark(48, { variant: "compact", tone: "color" });
var out = path.join(dir, "..", "favicon.svg");
fs.writeFileSync(out, svg + "\n", "utf8");
console.log("OK -> " + out + " (" + svg.length + " bytes)");
