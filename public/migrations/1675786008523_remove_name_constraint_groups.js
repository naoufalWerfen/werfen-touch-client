
const log = require ( 'electron-log' );
const window = require ( 'electron' ).BrowserWindow;

exports.up = async function () {
    let focusedWindow = window.getFocusedWindow ();
    if ( !!focusedWindow ) {
        focusedWindow = window.getAllWindows ()[0];
    }
    log.info ( "Creating second migration!" );
    focusedWindow.webContents.send ( 'removeUniqueNameGroupConstraint' );
}

exports.down = function ( knex, Promise ) {
// return knex.schema.dropTable ( 'others' );
}
