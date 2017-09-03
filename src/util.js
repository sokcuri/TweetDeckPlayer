const path = require('path');
module.exports = {
  twimg_media: 'twimg.com/media',
  twimg_profile: 'twimg.com/profile_images',

  // 트위터 이미지의 원본 크기를 가리키는 링크를 반환
  getOrigPath (url) {
    let result = url;
    if (url.includes('pbs.twimg.com')) {
      result = url.replace(/:small$/, ':orig');
    } else if (url.includes('ton/data/dm')) {
      result = url.replace(/:small$/, ':large');
    }
    return result;
  },

  // 주어진 링크의 파일 이름을 반환
  getFileName (_href) {
    var href = _href;
    href = href.substr(_href.lastIndexOf('/') + 1);
    if (href.search(':') !== -1) {
      href = href.substr(0, href.search(':'));
    }
    return href;
  },

  // 파일의 확장자를 반환
  getFileExtension (_href) {
    // 파일 경로에서 파일 이름을 가져옴
    var filename = this.getFileName(_href);

    return (filename.lastIndexOf('.') === -1)
      // 확장자가 없는 경우 공백 반환
      ? ''
      // 확장자를 반환
      : filename.substr(filename.lastIndexOf('.') + 1);
  },

  // 유저 데이터 폴더를 리턴함
  // 일반적인 환경 : __dirname/data/
  // MacOS 패키징 : __dirname/<package-name> (ex. /TweetDeckPlayer.app -> /TweetDeckPlayer)
  getUserDataPath () {
    var a = __dirname.substr(0, __dirname.lastIndexOf('/'));
    var b = __dirname.substr(0, __dirname.lastIndexOf('\\'));
    var c = __dirname.lastIndexOf('.asar');
    var d = __dirname.lastIndexOf('.app/Contents/Resources/app');
    if (d !== -1) {
      return __dirname.substr(0, d) + '/data/';
    } else if (c !== -1) {
      if (a.length > b.length) {
        return a.substr(0, a.lastIndexOf('/')) + '/data/';
      } else {
        return b.substr(0, b.lastIndexOf('\\')) + '\\data\\';
      }
    } else {
      return path.join(__dirname, '../data');
    }
  },
  getWritableRootPath () {
    var a = __dirname.substr(0, __dirname.lastIndexOf('/'));
    var b = __dirname.substr(0, __dirname.lastIndexOf('\\'));
    var c = __dirname.lastIndexOf('.asar');
    var d = __dirname.lastIndexOf('.app/Contents/Resources/app');
    if (d !== -1) {
      return __dirname.substr(0, d) + '/';
    } else if (c !== -1) {
      if (a.length > b.length) {
        return a.substr(0, a.lastIndexOf('/'));
      } else {
        return b.substr(0, b.lastIndexOf('\\'));
      }
    } else {
      return path.join(__dirname, '..');
    }
  },
};
