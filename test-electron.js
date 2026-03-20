// test-electron.js
const e = require('electron');
console.log('Type:', typeof e);
console.log('Is string:', typeof e === 'string');
if (typeof e === 'object') {
  console.log('Keys:', Object.keys(e));
} else {
  console.log('Value:', e);
}
