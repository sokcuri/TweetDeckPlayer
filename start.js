const Util = require('./util');
const request = require('request');
const crypto = require('crypto');
const fs = require('original-fs')
const async = require('async');

const REVISION = 2001;
const updateURL = "https://github.com/sokcuri/TweetDeckPlayer-dist/raw/master/update.json";
const asarFile = Util.getUserDataPath() + 'main.asar';
const asarDownFile = Util.getUserDataPath() + 'main.asar.download';
const asarHashFile = Util.getUserDataPath() + 'main.asar.hash';

// bypass main.asar
const forceIndex = true;

function getHash(fileName)
{
  try {
    var shasum = crypto.createHash('sha1');
    var s = fs.readFileSync(fileName, 'binary');
    return shasum.update(s).digest('hex');
  }
  catch (e)
  {
    return -1;
  }
}

function readFileContext(fileName)
{
  var context;
  try {
    context = fs.readFileSync(asarHashFile);
  } catch (e) {
    context = "";
  }
  return context;
}

function deleteFile(fileName)
{
  try {
    fs.unlinkSync(fileName);
  }
  catch(e) {}
}

function writeFile(fileName, context)
{
  try {
    var s = fs.createWriteStream(fileName);
    s.write(context);
    s.end();
  }
  catch(e) { }
}

function downAsarFile(url)
{
  request({
    encoding: null,
    url: url + '?' + new Date().getTime()}
    , function (error, response, body) {
      if (!error && response.statusCode == 200) {
        writeFile(asarDownFile, body);
        writeFile(asarHashFile, item["asar-hash"].toLowerCase());
        console.log("Downloaded main.asar");
      } else {
        console.log(error);
      }
  });
}

function getUpdateInfo()
{
  var json;
  async.series([
  function(callback) {
    request(updateURL + '?' + new Date().getTime(),
    function (error, response, body) {
      try {
        json = JSON.parse(body);
        console.log('getUpdateInfo success');
        callback(null);
      }
      catch (e) {}
    });
  },
  function(callback) {
    for(item of json)
    {
      if (REVISION >= item.revision &&
         (getHash(asarFile) != item["asar-hash"] &&
          getHash(asarDownFile) != item["asar-hash"]))
      {
        console.log('asarHash: ' + getHash(asarFile));
        console.log('asarDownHash: ' + getHash(asarDownFile));
        console.log('asar-hash: ' + item["asar-hash"]);
        callback(null);
      }
    }
  },
  function(callback) {
    downAsarFile(item.asar);
  }]);
}

function execUpdate()
{
  var hash_key = readFileContext(asarHashFile);
  async.series([
    function(callback) {
      if (getHash(asarDownFile) != -1 && getHash(asarDownFile) == hash_key)
      {
        fs.rename(asarDownFile, asarFile, err => {
          console.log('update success');
          deleteFile(asarDownFile);
          callback(null);
        });
      }
      else
      {
        deleteFile(asarDownFile);
        callback(null);
      }
    },
    function(callback) {
      run();
    }
  ]);
}

function run()
{
  try {
    if (forceIndex) throw 0;
    var dataPath = Util.getUserDataPath();
    var fullPath = (dataPath[dataPath.length-1] == '/' ?
      dataPath + 'main.asar/index.js' :
      dataPath + 'main.asar\\index.js');
    require(fullPath);
    console.log("Running to main.asar.");
  }
  catch (e) {
    require('./index.js');
    console.log("Running to index.js.");
  } 
}

if (forceIndex)
  run();
else
{
  getUpdateInfo();
  execUpdate();
}