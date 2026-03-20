// Test different require paths
try {
  const e = require('electron/main');
  console.log('electron/main type:', typeof e, e && typeof e.app);
} catch(ex) {
  console.log('electron/main failed:', ex.message.slice(0,80));
}

try {
  const e = require('electron/common');
  console.log('electron/common type:', typeof e);
} catch(ex) {
  console.log('electron/common failed:', ex.message.slice(0,80));
}

// Check what's in resources
const path = require('path');
const fs = require('fs');
const resDir = path.join(path.dirname(process.execPath), 'resources');
console.log('Resources dir:', resDir);
try {
  console.log('Resources contents:', fs.readdirSync(resDir));
} catch(ex) {
  console.log('Resources read failed:', ex.message);
}
