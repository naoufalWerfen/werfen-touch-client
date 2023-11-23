import isElectron from 'is-electron';


//Offline files
/*const dayInMilliseconds = 86400000;	//This is one day.
const daysToExpire = 3;*/
//export const daysToExpireInMilliseconds = dayInMilliseconds * daysToExpire;

// URLS
//export const BackendURL = process.env.REACT_APP_BACKEND_MACHINE;
/*export const LoginURL = BackendURL + "/user/login?_format=json";
export const LogoutURL = BackendURL + "/user/logout";*/

// PUSH NOTIFICATIONS
export const senderId = '896298606052' // Firebase Cloud Messaging sender Id

// SOFTWARE CHECK UPDATE INTERVAL

export const SOFTWARE_CHECK_UPDATE_INTERVAL = 86400000; // 1 DAY in milliseconds

// FOLDERS

export const DataFolder = () => {
    if ( isElectron () ) {
        try {
            const electron = window.require ( 'electron' );
            return electron.remote.app.getPath ( 'appData' )
        } catch ( error ) {
            console.error ( "Error getting the Data Folder: " + error );
            return null;
        }
    }
    return null;
}
// ACTIONS

const populateAppFolder = ( dataFolder ) => {
    if ( dataFolder ) {
        return dataFolder + "/werfen-touch-client-prod/"
    }
}

const populateDocumentsFolder = ( appFolder ) => {
    if ( appFolder ) {
        return appFolder + "resources/"
    }
    return null;
}
/*
const populateDBFolder = ( appFolder ) => {
    if ( appFolder ) {
        return appFolder + "databases/"
    }
}
const populateDBPath = ( DBFolder, DBName ) => {
    if ( DBFolder && DBName ) {
        return DBFolder + DBName
    }
}*/
export const appFolder = populateAppFolder ( DataFolder () );
export const DocumentsFolder = populateDocumentsFolder ( appFolder );
//export const DBFolder = populateDBFolder( appFolder );
//export const DBName = "appData.sqlite";
//export const DBPath = populateDBPath( DBFolder, DBName );

// ACTIONS

// SERVER REACHABILITY
export const SERVER_REACHABLE_INTERVAL = 7000
export const SERVER_REACHABLE_MAX_TRIES = 3
