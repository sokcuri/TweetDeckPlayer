const Util = require('./util');
const request = require('request');
const crypto = require('crypto');
const fs = require('fs');
const originalFs = require('original-fs')
const async = require('async');

const REVISION = 2000;
const updateURL = "https://raw.githubusercontent.com/sokcuri/TweetDeckPlayer-dist/master/update.json";
const asarFile = Util.getUserDataPath() + 'main.asar';
const asarDownFile = Util.getUserDataPath() + 'main.asar.download';
const asarHashFile = Util.getUserDataPath() + 'main.asar.hash';

function getHash(fileName)
{
  try
  {
    var shasum = crypto.createHash('sha1');
    var s = originalFs.readFileSync(fileName);
    return shasum.update(s).digest('hex');
  }
  catch (e)
  {
    return -1;
  }
}

var hash_key = "";
var json;
var url;

try {
  hash_key = fs.readFileSync(asarHashFile);
} catch (e) {
  hash_key = "";
}

async.series([
  function(callback){
    request(updateURL,
    function (error, response, body) {
      json = JSON.parse(body);
      callback(null);
    });
  },
  function(callback){
    for(item of json)
    {
      if (REVISION >= item.revision &&
         (getHash(asarFile) != hash_key &&
          getHash(asarDownFile) != hash_key))
      {
        callback(null);
      }
    }
  },
  function(callback){
    request({
      encoding: null,
      url: item.asar}
      , function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var s = originalFs.createWriteStream(asarDownFile);
        s.write(body);
        s.end();
        s.end();
        var s2 = originalFs.createWriteStream(asarHashFile);
        s2.write(item["asar-hash"].toLowerCase());
        s2.end();
        console.log("Downloaded main.asar");
      }
      else {
        console.log(error);
      }
    });
  }
]);

async.series([
  function(callback)
  {
    if (getHash(asarFile) == hash_key)
    {
      console.log('hash key equal. passed');
      callback(null);
    }
    else if (getHash(asarDownFile) == -1)
    {
      callback(null);
    }
    else if (getHash(asarDownFile) == hash_key)
    {
      console.log('rename start');
      originalFs.rename(asarDownFile, asarFile, err => {
      if (!err) console.log('renamed complete');
      try
      {
        originalFs.unlinkSync(asarDownFile);
      }
      catch(e) {}
      callback(null);
      });
    }
    else
    {
      console.log("Hash Mismatch");
      console.log("down: " + getHash(asarDownFile));
      console.log("hash: " + hash_key);
      callback(null);
    }
  },
  function(callback)
  {
    try {
    require(Util.getUserDataPath() + 'main.asar/index.js');
    console.log("Running to main.asar.");
    }
    catch (e) {
      require('./index.js');
      console.log("Running to index.js.");
    } 
  }
]);