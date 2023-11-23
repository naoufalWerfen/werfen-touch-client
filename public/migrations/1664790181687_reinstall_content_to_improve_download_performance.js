const electron = require ( 'electron' );
const log = require ( 'electron-log' );
const window = require ( 'electron' ).BrowserWindow;
const fsHelper = require ( '../helpers' );
const normalize = require ( "normalize-path" );


exports.up = function ( knex, Promise ) {

    const deleteProfilesContents = async () => {
        const deletedPC = await knex ( 'profiles_contents' ).del ()
            .catch ( ( error ) => {
                console.error ( 'Error deleting profiles_contents, migration 1', error )
            } )
        ;
        return deletedPC;
    }

    const deleteCatContents = async () => {
        const deletedCC = await knex ( 'categories_contents' ).del ()
            .catch ( ( error ) => {
                console.error ( 'Error deleting categories_contents, migration 1', error )
            } )
        ;
        return deletedCC;
    }
    const deleteContents = async () => {
        const deletedContents = await knex ( 'contents' ).del ()
            .catch ( ( error ) => {
                console.error ( 'Error deleting contents, migration 1', error )
            } )
        ;
        return deletedContents;
    }

    const deleteDm = async () => {
        const deletedDM = await knex ( 'download_manager' ).del ()
            .catch ( ( error ) => {
                console.error ( 'Error deleting download_manager, migration 1', error )
            } )
        ;
        return deletedDM;
    }

    const updateProfileAndSettingsData = async () => {
        const usersProfilesAllData = await knex ( 'profiles' ).select ()
            .catch ( ( error ) => {
                log.error ( 'Error getting all data from  profiles, migration 1', error )
            } );

        const focusedWindow = window.getFocusedWindow ();
        const appDataPath = electron.app.getPath ( 'appData' ) + "/werfen-touch-client-prod";
        const documentsFolder = normalize ( appDataPath + "/resources" ) + "/";

        if ( usersProfilesAllData.length > 0 ) {
            for ( const userProfileData of usersProfilesAllData ) {

                const random = Math.random ().toString ();
                const updatedHash = random;
                await knex ( 'profiles' ).where ( 'id', '=', userProfileData.id ).update ( { hash: updatedHash } )
                    .catch ( ( error ) => {
                        log.error ( 'Error updating all data in profiles, migration 1', error );
                    } );

                for ( const userProfileData of usersProfilesAllData ) {
                    const visualsFolderForProfile = documentsFolder + "/" + "visuals" + "/" + userProfileData.id;
                    const libraryFolderForProfile = documentsFolder + "/" + "library" + "/" + userProfileData.id;
                    const imageFolderForProfile = documentsFolder + "/" + "image" + "/" + userProfileData.id;
                    const repoFolderForProfile = documentsFolder + "/" + "repo" + "/" + userProfileData.id;
                    log.info ( 'VisualsFolderForProfile path is: ', visualsFolderForProfile );

                    if ( fsHelper.fileExists ( visualsFolderForProfile ) ) {
                        await fsHelper.removeFolder ( visualsFolderForProfile )
                            .catch ( ( error ) => log.error ( "Error while deleting visuals folder for profile", visualsFolderForProfile, error ) );
                    }
                    if ( fsHelper.fileExists ( libraryFolderForProfile ) ) {
                        await fsHelper.removeFolder ( libraryFolderForProfile )
                            .catch ( ( error ) => log.error ( "Error while deleting library folder for profile", libraryFolderForProfile, error ) );
                    }
                    if ( fsHelper.fileExists ( imageFolderForProfile ) ) {
                        await fsHelper.removeFolder ( imageFolderForProfile )
                            .catch ( ( error ) => log.error ( "Error while deleting image folder for profile", imageFolderForProfile, error ) );
                    }
                    if ( fsHelper.fileExists ( repoFolderForProfile ) ) {
                        await fsHelper.removeFolder ( repoFolderForProfile )
                            .catch ( ( error ) => log.error ( "Error while deleting repo folder for profile", repoFolderForProfile, error ) );
                    }
                }
            }

            const firstInstallingSetToTrue = await knex ( 'user_settings' ).where ( 'key', '=', "firstInstalling" ).update ( { value: "true" } )
                .catch ( ( error ) => {
                    log.error ( 'Error while resetting firstInstallation to true from migration ', error );
                } )
            if ( firstInstallingSetToTrue ) {
                focusedWindow.webContents.send ( 'reinstallAfterMigration' );
                log.info ( '1st migrations has been executed, content reinstalling is due.' );
            }
        } else {
            log.info ( '1st migrations has been executed, no reinstalling is needed.' );
        }
    }

    return deleteProfilesContents ()
        .then ( deleteCatContents )
        .then ( deleteContents )
        .then ( deleteDm )
        .then ( updateProfileAndSettingsData )
        .catch ( ( error ) => {
            log.error ( 'Error while migrating, 1st migration', error )
        } )
}

exports.down = function ( knex, Promise ) {
    // return knex.schema.dropTable ( 'others' );
}
