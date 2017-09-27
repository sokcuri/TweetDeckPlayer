const https = require('https');

const initCallback = () => {};

module.exports = (callback = initCallback) => {
  const option = {
    hostname: 'api.github.com',
    path: '/repos/sokcuri/TweetDeckPlayer/releases/latest',
    headers: { 'User-Agent': 'TweetDeckPlayer' },
  };

  https.get(option, (res) => {
    if (res.statusCode !== 200) {
      return callback(new Error('Response returns ' + res.statusCode));
    }

    res.setEncoding('utf8');

    let rawdata = '';
    res.on('data', (chunk) => rawdata += chunk);

    res.on('end', () => {
      try {
        const release = JSON.parse(rawdata);
        const latest = release.tag_name;
        return callback(null, latest);
      } catch (e) {
        return callback(e);
      }
    });

    res.on('error', callback);
  });
};
