const exec = require('sync-exec');
const fs = require('fs-extra');
const parseArgs = require('minimist');
const packager = require('electron-packager');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');
const intermediateDir = path.join(projectDir, 'build');
const distDir = path.join(projectDir, 'dist');

const prebuild = () => {
  console.log('--- Prebuild Started ---');
  const wd = process.cwd();
  const buildIgnore = require('../.buildignore.js');

  fs.removeSync(intermediateDir);
  fs.removeSync(distDir);
  fs.mkdirSync(intermediateDir);
  fs.mkdirSync(distDir);

  // copy clean project directory
  console.log('Copying clean project directory to build directory...');
  process.chdir(projectDir);
  exec('git --work-tree=./build/ checkout --force');

  process.chdir(intermediateDir);

  // remove unnecessary files from intermediate
  console.log('Removing unnecessary files...');
  for (const ignoredFile of buildIgnore) {
    fs.removeSync(ignoredFile);
  }

  // install production packages
  console.log('Installing production packages...');
  exec('npm install --production');

  console.log('--- Prebuild Done ---');
  process.chdir(wd);
};

const postSingleBuild = appPath => {
  fs.removeSync(path.join(appPath, 'version'));
  fs.removeSync(path.join(appPath, 'LICENSE'));
  fs.copySync(path.join(projectDir, 'LICENSE.md'), path.join(appPath, 'LICENSE.md'));
  fs.copySync(path.join(projectDir, 'README.md'), path.join(appPath, 'README.md'));
  fs.copySync(path.join(projectDir, 'ChangeLog.md'), path.join(appPath, 'ChangeLog.md'));
  fs.copySync(path.join(projectDir, 'Installation.md'), path.join(appPath, 'Installation.md'));
};

const build = () => {
  const options = parseArgs(process.argv.slice(2), {
    string: ['platform', 'arch'],
    boolean: 'all',
    default: {
      all: false,
      platform: process.platform,
      arch: process.arch,
    },
  });
  if (options.all) {
    options.platform = 'all';
    options.arch = 'all';
  }
  const packagerOptions = {
    dir: intermediateDir,
    out: distDir,
    asar: true,
    overwrite: true,
    icon: 'src/tweetdeck',
    platform: options.platform,
    arch: options.arch,
  };

  console.log('--- Build Started ---');

  packager(packagerOptions, (err, appPaths) => {
    if (!!err) {
      console.error(err);
      process.exit(1);
    } else {
      for (const appPath of appPaths) {
        postSingleBuild(appPath);
        console.log(`* ${appPath}`);
      }
      console.log('--- Build Done ---');
    }
  });
};

if (require.main === module) {
  prebuild();
  build();
}
