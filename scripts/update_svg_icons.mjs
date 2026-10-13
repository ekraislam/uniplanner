import fs from 'fs';

const b64 = fs.readFileSync('public/icons/icon-512.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,${b64}" x="0" y="0" width="512" height="512" />
</svg>`;

fs.writeFileSync('public/icons/icon.svg', svg);
fs.writeFileSync('public/favicon.svg', svg);
console.log('SVG icons generated with embedded high-res artwork!');
