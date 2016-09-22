const packager = require('electron-packager');
const path = require('path');
const fs = require('fs');

const projectDir = path.resolve(__dirname, '..');
const outputDir = path.join(projectDir, 'build');
const dataDir = path.join(projectDir, 'src/data');

const copyFile = (source, dest) => {
    fs.createReadStream(source).pipe(fs.createWriteStream(dest));
};

const buildOne = (targetOptions) => {
    const baseOption = {
        dir: projectDir,
        out: outputDir,
        asar: true,
        overwrite: true,
        ignore: [
            dataDir,
            outputDir
        ]
    };
    const option = Object.assign({}, baseOption, targetOptions);
    packager(option, (err, appPaths) => {
        if (!!err) {
            console.error(err);
        } else {
            const appPath = appPaths[0];
            fs.unlink(path.join(appPath, 'version'));
            copyFile(path.join(projectDir, 'LICENSE'), path.join(appPath, 'LICENSE'));
            copyFile(path.join(projectDir, 'README.md'), path.join(appPath, 'README.md'));
            copyFile(path.join(projectDir, 'ChangeLog.md'), path.join(appPath, 'ChangeLog.md'));
        }
    });
};

const presets = [
    {
        platform: 'darwin',
        arch: 'x64',
        icon: 'src/tweetdeck.icns'
    },
    {
        platform: 'win32',
        arch: 'ia32',
        icon: 'src/tweetdeck.ico'
    },
    {
        platform: 'win32',
        arch: 'x64',
        icon: 'src/tweetdeck.ico'
    },
    {
        platform: 'linux',
        arch: 'ia32'
    },
    {
        platform: 'linux',
        arch: 'x64'
    }
];

for (const preset of presets) {
    buildOne(preset);
}
