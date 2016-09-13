const Util = require('./util');

try {
  require(Util.getUserDataPath() + 'main.asar/index.js');
  console.log("Running to main.asar.");
}
catch (e) {
  require('./index.js');
  console.log("Running to index.js.");
}