'use strict';
const {app, BrowserWindow, Menu}=require('electron');
const path=require('node:path');
function createWindow(){
  const window=new BrowserWindow({title:'Drift Destroyer',width:1120,height:900,minWidth:380,minHeight:640,backgroundColor:'#080e14',autoHideMenuBar:true,icon:path.join(__dirname,'../assets/irover-sprite.png'),webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',event=>event.preventDefault());
  window.loadFile(path.join(__dirname,'../index.html'));
}
app.whenReady().then(()=>{
 Menu.setApplicationMenu(Menu.buildFromTemplate([
  ...(process.platform==='darwin'?[{label:'Drift Destroyer',submenu:[{role:'about'},{type:'separator'},{role:'quit'}]}]:[]),
  {label:'View',submenu:[{role:'reload'},{role:'togglefullscreen'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'}]},
  {label:'Window',submenu:[{role:'minimize'},{role:'close'}]}
 ]));
 createWindow();
 app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
