const path = require('path');
const rimraf = require('rimraf');

rimraf(path.resolve(__dirname, '../build'), () => {
    console.log('Cleaned');
});

