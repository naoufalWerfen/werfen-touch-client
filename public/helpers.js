const electron = require ( 'electron' );
const normalize = require ( 'normalize-path' );
const appDataPath = normalize ( electron.app.getPath ( 'appData' ) ) + "/werfen-touch-client-prod"
const resourcesPath = appDataPath + "/resources/";
const fs = require ( 'fs-extra' )
const fsp = require ( 'fs' ).promises;
const log = require ( 'electron-log' );
const rimraf = require ( "rimraf" );
const path = require ( 'path' );
const methods = {

    createInitialFolders: function () {
        const folderArray = [
            resourcesPath,
            resourcesPath + "image/",
            resourcesPath + "library/",
            resourcesPath + "dependencies/",
            resourcesPath + "dependencies/installing/",
            resourcesPath + "repo/",
            resourcesPath + "visuals/",
            resourcesPath + "visuals/installing/",
            resourcesPath + "output/",
            resourcesPath + "logs/"
        ]
        folderArray.map( ( folder ) => {
            try {
                //IF the folder doesn't exist we have to create it
                createFolder( folder )
                    .then( () => {
                        return true;
                    } )
                    .catch( ( error ) => {
                        log.error ( error );
                        return error;
                    } );
            } catch ( error ) {
                log.error ( "Error: " + error );
                return error;
            }
        } )
        return true;
    },

    installDependencies: function () {
        const dependencies = [
            {
                uuid: "9c4c8b88-c81d-11ea-87d0-0242ac130003",
                name: "pdfjs",
                sorting_name: "pdfjs",
                classification: "dependencies",
                mimetype: "zip",
                image: "",
                route: 'pdfjs',
                date_created: '',
                version: 0,
                published: false,
                visible: false,
                sendable: false,
                deleted: false,
                cid: -1,
                tid: -1,
                filename: "pdfjs.zip",
                url: "https://github.com/mozilla/pdf.js/releases/download/v2.4.456/pdfjs-2.4.456-dist.zip",
                rename: false,
                profileId: -1,
                //TODO: Add CRC (checksum or uuid for updating dependencies version later on)
                properties: {
                    filename: "pdfjs.zip",
                    url: "https://github.com/mozilla/pdf.js/releases/download/v2.4.456/pdfjs-2.4.456-dist.zip",
                    rename: false,
                    profileId: -1
                }
            }
        ]
        return dependencies;
    },

    fileExists: function ( path ) {
        const fs = require( 'fs' );

        try {
            return fs.existsSync ( path );
        } catch ( error ) {
            log.error ( error );
            return false;
        }
    },

    removeFolder: doRemoveFolder,
    doCreateFolder: createFolder,
    removeFile: doRemoveFile,
    folderExists
};

function mkdirs( dirname ) {
    const path = require( 'path' );
    const fs = require( 'fs-extra' );
    try {
        if ( fs.pathExistsSync( dirname ) ) {
            return true;
        } else {
            const result =  mkdirs( path.dirname( dirname ))
            if ( result.error){
                return result;
            } else {
                fs.ensureDirSync( dirname );
                return true;
            }
        }
    } catch(error) {
        const info = {
            message: "Error on mkdirs ",
            error: error,
            subject: "Message from MAIN"
        }
        return { error, info };
    }
}

function createFolder( folder ) {

    let promisedDatabase = new Promise( function ( resolve, reject ) {
        let workDone = mkdirs( folder );
        if ( workDone === true ) {
            resolve( 'success promise completed' );
        } else {
            reject( 'ERROR, work could not be completed: ', workDone.error );
        }
    } )
    return promisedDatabase;
}
function doRemoveFolder(folder) {

    //TODO: keep working on this promise to make it work as expected, now it's not resolving
    let removedFolder = new Promise(function (resolve, reject) {
        fs.remove ( folder )
            .then ( () => {
                //console.log('Folder has been removed!')
                resolve ( true )
            } )
            .catch ( error => {
                log.error ( "Error while on doRemoveFolder ", error, folder )
                reject ( error )
            } )
    } )
    return removedFolder
}

function folderExists ( dirname ) {
    const fs = require ( "fs-extra" ); // Or `import fs from "fs";` with ESM
    if ( fs.pathExistsSync ( dirname ) ) {
        return true;
    } else {
        return false;
    }
}

async function doRemoveFile ( fileData ) {
    return new Promise ( async ( resolve, reject ) => {
        try {
            if ( methods.fileExists ( fileData.filePath ) ) {
                const ifFileIsVisual = ( ( fileData.classification && fileData.classification === "visuals" ) || fileData.filePath.includes ( '.zip' ) ) ? true : false;
                if ( ifFileIsVisual ) {
                    const newFileNameArray = fileData.filePath.split ( '/' );
                    const renamedVisualName = newFileNameArray[newFileNameArray.length - 1];
                    await fsp.unlink ( path.join ( fileData.dir, renamedVisualName ) )
                        .catch ( ( error ) => {
                            log.error ( 'Error while removing zip file ', renamedVisualName, fileData.filePath, error );
                            reject ( error );
                        } )
                    resolve ( true )
                } else {
                    await fs.remove ( fileData.filePath )
                        .catch ( ( error ) => {
                            log.error ( 'Error while removing PDF or image file ', fileData.filename, fileData.filePath, error );
                            reject ( error )
                        } );
                    resolve ( true )
                }
            } else {
                resolve ( true )
            }
        } catch ( error ) {
            reject ( error );
        }
    } )

}

module.exports = methods;

