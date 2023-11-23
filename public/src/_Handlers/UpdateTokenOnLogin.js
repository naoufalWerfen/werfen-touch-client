const jwtTokenProvider = require ( "../Auth/Application/JwtTokenProvider" );
module.exports = ( ipcMain, mainWindow, log ) => {
    ipcMain.on ( 'onTokenReceived', async ( event, token ) => {
        log.info ( "ipcMain receives message 'onTokenReceived' !", token )
        await jwtTokenProvider.setToken ( token )
        mainWindow.webContents.send ( 'onLoginFinished' )
        log.info ( "ipcMain sends message 'onLoginFinished' !" )
    } )
};