const {remote} = require('electron')
const {dialog} = remote
const ses = remote.session.fromPartition('persist:main')
getMemoryInfo = () =>
{
    var i = process.getProcessMemoryInfo()
    //console.log(`W: ${i.workingSetSize} PW: ${i.peakWorkingSetSize} PB: ${i.privateBytes} SB: ${i.sharedBytes}`);
    ses.getCacheSize((size) => {
        //console.log(`cache size: ${size}`)
    })
    setTimeout(getMemoryInfo, 5000)
}
getMemoryInfo();

const {Menu, MenuItem} = remote;
var link_addr;

var sub_cut = new MenuItem({
  label: 'Cut',
  click: function() {
    document.execCommand("cut");
  }
});
var sub_copy = new MenuItem({
  label: 'Copy',
  click: function() {
    document.execCommand("copy");
  }
});
var sub_paste = new MenuItem({
  label: 'Paste',
  click: function() {
//    var content = require('nw.gui').Clipboard.get().get();
//    document.execCommand("insertHTML", false, content);
    document.execCommand("paste")
  }
});
var sub_delete = new MenuItem({
  label: 'Delete',
  click: function() {
    document.execCommand("delete");
  }
});
var sub_selectall = new MenuItem({
  label: 'Select All',
  click: function() {
    document.execCommand("selectall");
  }
});
var sub_reload = new MenuItem({
  label: 'Reload',
  click: function() {
    document.location.reload();
    //iframe.src = iframe.contentDocument.location.href;
  }
});
var sub_save_img = new MenuItem({
  label: 'Save image as..',
  click: function() {
    // download original resolution image

    var filename;
    var link = link_addr;
    if(link.search('twimg.com/media') != -1)
      link = link.substr(0, link.lastIndexOf(':'));
      
    filename = link.substr(link.lastIndexOf('/') + 1);

    
    if(link.search('twimg.com/media') != -1)
      link = link + ':orig';

    var path = dialog.showSaveDialog({defaultPath: filename 
/*
, title: 'title', buttonLabel: 'buttonLabel',
    filters: [
      {name: 'Images', extensions: ['jpg', 'png', 'gif']},
      {name: 'Movies', extensions: ['mkv', 'avi', 'mp4']},
      {name: 'Custom File Type', extensions: ['as']},
      {name: 'All Files', extensions: ['*']}
    ]*/})
    if (typeof path == 'undefined')
      return;

    console.log('path: ' + path);

    console.log('link: ' + link);
    var https = require('https');
    var fs   = require('fs');

    var file = fs.createWriteStream(path);
    var request = https.get(link_addr, function(response) {
      response.pipe(file);
    });
    //iframe.src = iframe.contentDocument.location.href;
  }
});

var menu = {
  main: new Menu(),
  selection: new Menu(),
  text: new Menu(),
  text_sel: new Menu(),
  image: new Menu()
};
// Add some items with label
menu.main.append(new MenuItem({
  label: 'Item A',
  click: function(){
    alert('You have clicked at "Item A"');
  }
}));
menu.main.append(new MenuItem({ label: 'Item B' }));
menu.main.append(new MenuItem({ type: 'separator' }));
menu.main.append(sub_reload);

// input & textarea menu
menu.text.append(new MenuItem({ label: 'Cut', enabled: false }));
menu.text.append(new MenuItem({ label: 'Copy', enabled: false }));
menu.text.append(sub_paste);
menu.text.append(new MenuItem({ label: 'Delete', enabled: false }));
menu.text.append(new MenuItem({ type: 'separator' }));
menu.text.append(sub_selectall);
menu.text.append(new MenuItem({ type: 'separator' }));
menu.text.append(sub_reload);

// input & textarea menu (selection)
menu.text_sel.append(sub_cut);
menu.text_sel.append(sub_copy);
menu.text_sel.append(sub_paste);
menu.text_sel.append(sub_delete);
menu.text_sel.append(new MenuItem({ type: 'separator' }));
menu.text_sel.append(sub_selectall);
menu.text_sel.append(new MenuItem({ type: 'separator' }));
menu.text_sel.append(sub_reload);

// selection menu
menu.selection.append(sub_copy);
menu.selection.append(new MenuItem({ type: 'separator' }));
menu.selection.append(sub_reload);

// image menu
menu.image.append(sub_save_img);

//menu.append(sub_cut);
window.addEventListener('contextmenu', (e) => {
  e.preventDefault()

  var el = document.activeElement;
  var hover = document.querySelectorAll(":hover");
  //var hover_last = hover[hover.length-1];
  //console.log(hover);
  var is_range = (document.getSelection().type == 'Range');
  if(el && (el.tagName.toLowerCase() == 'input' && el.type == 'text' ||
      el.tagName.toLowerCase() == 'textarea'))
  {
      if(is_range)
        menu.text_sel.popup(e.x, e.y);
      else
        menu.text.popup(e.x, e.y);
  }
  else if (document.querySelector('img:hover'))
  {
      link_addr = document.querySelector('img:hover').src;
      menu.image.popup(e.x, e.y);
  }
  else if (document.querySelector('.js-media-image-link:hover'))
  {
      console.log(document.querySelector('.js-media-image-link:hover'))
      //console.log("TTTTTTTTTTTTTTTTTT");
      link_addr = document.querySelector('.js-media-image-link').style.backgroundImage.slice(5, -2);
      menu.image.popup(e.x, e.y);
  }
  else
      menu.main.popup(e.x, e.y);



//  menu.popup(remote.getCurrentWindow())
}, false)