// Inlines timing.js + piece.js into one self-contained player: "LlamaParse Sponsor.html"
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8')
  .replace('<script src="timing.js"></script>', () => `<script>\n${fs.readFileSync(__dirname + '/timing.js', 'utf8')}</script>`)
  .replace('<script src="piece.js"></script>', () => `<script>\n${fs.readFileSync(__dirname + '/piece.js', 'utf8')}</script>`);
fs.writeFileSync(__dirname + '/LlamaParse Sponsor.html', html);
console.log('built', html.length, 'bytes');
