const electron = require('electron');
const {remote, app, ipcRenderer} = electron;

const HW_ACCEL_ERROR = 'Canvas: Software only, hardware acceleration unavailable';

remote.getCurrentWebContents().on('did-finish-load', () => {
  // timeout
  setTimeout(() => {
    if (tick) {
      ipcRenderer.send('nogpu-relaunch');
    }
  }, 3000);

  document.body.style = 'display: none';
  let tick = true;
  const check = () => {
    if (!document.querySelector('.feature-status-list').childElementCount) {
      setTimeout(check, 100);
    } else {
      tick = false;
      const command = (document.body.innerText.search(HW_ACCEL_ERROR) !== -1)
        ? 'nogpu-relaunch'
        : 'run';
      ipcRenderer.send(command);
    }
  };
  check();
});
