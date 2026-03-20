const fs = require('fs');
const path = require('path');

// Use png-to-ico
const pngToIco = require('png-to-ico');
const srcPng = 'C:/Users/proba/.gemini/antigravity/brain/57c28773-5ffd-4677-ab42-e706d4adebd5/gamehub_icon_1773964970860.png';

fs.mkdirSync('assets', { recursive: true });

pngToIco(srcPng)
  .then(buf => {
    fs.writeFileSync('assets/icon.ico', buf);
    console.log('ICO_DONE: assets/icon.ico created');
  })
  .catch(err => {
    // fallback: copy png as ico (electron-builder accepts png too)
    console.log('png-to-ico failed, using PNG directly:', err.message);
    fs.copyFileSync(srcPng, 'assets/icon.ico');
    console.log('ICO_DONE: copied png as icon');
  });
