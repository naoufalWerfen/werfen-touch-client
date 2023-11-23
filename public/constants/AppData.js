const normalize = require ( "normalize-path" );
const electron = require ( "electron" );
const appDataPath = normalize ( electron.app.getPath ( 'appData' ) ) + "/werfen-touch-client-prod";

const appData = {
    databasePath: appDataPath + "/databases/content.sqlite"
}

module.exports = appData;
