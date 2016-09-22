const fs = require('fs-extra');
const path = require('path');

fs.removeSync(path.resolve(__dirname, '../build'));
fs.removeSync(path.resolve(__dirname, '../dist'));
console.log('Cleaned');
