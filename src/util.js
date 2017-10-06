const path = require('path');
module.exports = {
  twimg_media: 'twimg.com/media',
  twimg_profile: 'twimg.com/profile_images',

  // 트위터 이미지의 원본 크기를 가리키는 링크를 반환
  getOrigPath (url) {
    return (url.includes('pbs.twimg.com')) ? url.replace(/:small$/, ':orig')
      : (url.includes('ton/data/dm')) ? url.replace(/:small$/, ':large')
      : url;
  },

  // 주어진 링크의 파일 이름을 반환
  getFileName (_href) {
    const href = _href.substr(_href.lastIndexOf('/') + 1);
    return (href.search(':') !== -1)
      ? href.substr(0, href.search(':'))
      : href;
  },

  // 파일의 확장자를 반환
  getFileExtension (_href) {
    // 파일 경로에서 파일 이름을 가져옴
    const filename = this.getFileName(_href);
     // 확장자가 없는 경우 공백 반환
    return (filename.lastIndexOf('.') === -1)
      ? ''
      : filename.substr(filename.lastIndexOf('.') + 1); 
  },
  // 유저 데이터 폴더를 리턴함
  // 일반적인 환경 : __dirname/data/
  // MacOS 패키징 : __dirname/<package-name> (ex. /TweetDeckPlayer.app -> /TweetDeckPlayer)
  getUserDataPath () {
    const x = __dirname.lastIndexOf('.asar');
    const y = __dirname.lastIndexOf('.app/Contents/Resources/app');
    const z = (x === -1 ? __dirname : __dirname.substring(0, __dirname.lastIndexOf('.asar')));
    return (y !== -1) ? path.join(__dirname.substr(0, y), '..') + '/data/'
      : path.join(z, '..', 'data');
  },
  getWritableRootPath () {
    const x = __dirname.lastIndexOf('.asar');
    const y = __dirname.lastIndexOf('.app/Contents/Resources/app');
    const z = (x === -1 ? __dirname : __dirname.substring(0, __dirname.lastIndexOf('.asar')));
    return (y !== -1) ? path.join(__dirname.substr(0, y), '..') + '/'
        : path.join(z, '..');
  },
};
