// noinspection JSUnresolvedVariable

const fsHelper = require ( './helpers' );
const dbMethod = require ( './DBmethods' );
const logMethod = require ( './LOGmethods' );
const log = require ( 'electron-log' );
const nodeFs = require('fs')
const fs = require ( 'fs-extra' );
const rimraf = require ( "rimraf" );
const electron = require ( 'electron' );
const chmodr = require ( 'chmodr' );
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const { setup: setupPushReceiver } = require ( 'electron-push-receiver' );
const normalize = require ( 'normalize-path' );
const groupsProfilesAssignations = require ( './constants/GroupProfileAssignations' );
const appDataPath = normalize ( electron.app.getPath ( 'appData' ) + "/werfen-touch-client-prod" );
const databasePath = normalize ( appDataPath + "/databases" );
const documentsFolder = normalize ( appDataPath + "/resources" ) + "/";
const path = require ( 'path' );
const isDev = require ( 'electron-is-dev' );
const { autoUpdater } = require ( "electron-updater" );
const Calculator = require ( "./entities/Calculator" );
const Category = require ( "./entities/Category" );
const Categories_Contents = require ( "./relations/Categories_Contents" );
const Categories_Calculators = require ( "./relations/Categories_Calculators" );
const Content = require ( "./entities/Content" );
const Download_Manager = require ( "./entities/Download_Manager" );
//const Email = require ( "./entities/Email" );
const Group = require ( "./entities/Group" );
//const Image = require ( "./entities/Image" );
const Profile = require ( "./entities/Profile" );
const Profiles_Contents = require ( "./relations/Profiles_Contents" );
const Profiles_Calculators = require ( "./relations/Profiles_Calculators" );
const Sentry = require ( "@sentry/electron" );
const axios = require ( 'axios' );
require('dotenv').config({ path: path.join(__dirname, '.env') });
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// IMPORTS
const fileUrlGenerator = require ( './src/File/Infrastructure/FileUrlGenerator' )


Sentry.init ( { dsn: "https://8fca62c001374c32bffcf42fd83d95e8@o4504638641471488.ingest.sentry.io/4504638963580928" } );

const appTranslations = [
    { key: "English", value: "en-US" },
    { key: "English-GB", value: "en-GB" },
    { key: "Spanish", value: "es-ES" },
    { key: "Polish", value: "pl-PL" },
    { key: "Italian", value: "it-IT" },
    { key: "Portuguese", value: "pt-PT" },
    { key: "Portuguese-BR", value: "pt-BR" }
]

const profilesForLanguage = [
    "uk_marketing", "uk_sales"
]

global.internalNavList = [];

let pathToMigrations = normalize ( electron.app.getAppPath () + "/build/migrations" );
if ( isDev ) {
    pathToMigrations = normalize ( "./public/migrations" );
}

const knex = require ( 'knex' ) ( {
    client: 'better-sqlite3',
    connection: {
        filename: databasePath + "/content.sqlite"
    },
    migrations: {
        directory: pathToMigrations
    }
} );


const osLocale = require ( 'os-locale' );

const setSystemLanguage = async () => {

    let systemLanguage = await osLocale ()
    return systemLanguage
    //=> 'en-US'
};

const DownloadManager = require ( "electron-download-manager" );

DownloadManager.register ( {
    downloadFolder: documentsFolder + "repo/"
} );

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

log.transports.file.resolvePath = () => path.join ( documentsFolder, 'logs/main.log' );

log.info("process.env ::", process.env.API_ENDPOINT)
global.log = log

// TODO: comment out this line before doing built
// const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require( 'electron-devtools-installer' );


let mainWindow = null;
// let hiddenWindow;

const gotTheLock = app.requestSingleInstanceLock ();

if ( !gotTheLock ) {
    app.quit ();
} else {
    app.on ( 'second-instance', ( event, commandLine, workingDirectory ) => {
        if ( mainWindow ) {
            if ( mainWindow.isMinimized () )
                mainWindow.restore ();
            mainWindow.focus ();
        }
    } )
}

function createBothWindows () {
    mainWindow = new BrowserWindow ( {
        width: 1295,
        height: 778,
        minWidth: 1295,
        minHeight: 778,
        webPreferences: {
            nodeIntegration: true,
            nativeWindowOpen: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false
        }
    } );
    mainWindow.maximize ()

    if ( !isDev ) {
        mainWindow.setMenuBarVisibility ( false );
    } else {
        // Open the DevTools.
        //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
        mainWindow.webContents.once ( 'dom-ready', () => {
            mainWindow.webContents.openDevTools ();
        } )
    }

    mainWindow
        .loadURL ( isDev ? 'http://localhost:3000' : `file://${ path.join ( __dirname, '../build/index.html' ) }` )
        .catch ( ( error ) => log.error ( error ) );

    // hiddenWindow = new BrowserWindow ( {
    //     show: false,
    //     width: 1920,
    //     height: 960
    // } );
    // hiddenWindow
    //     .loadURL ( isDev ? 'http://localhost:3000' : `file://${ path.join ( __dirname, '../build/index.html' ) }` )
    //     .catch ( ( error ) => log.error ( error ) );

    setupPushReceiver ( mainWindow.webContents );

    ipcMain.on ( 'resize-me', ( ( event, factor ) => {

        mainWindow.webContents.setZoomFactor ( factor )
    } ) )

    ipcMain.on ( 'closeApp', () => {
        mainWindow = null;
        // hiddenWindow = null
        app.quit ();
    } );

    mainWindow.on ( 'close', () => {
        mainWindow = null;
        // hiddenWindow = null;
        app.quit ();
    } );


    /** Split handler in multiple files **/
    // Dynamically include your event handler scripts
    const handlersFolder = path.join(__dirname, 'src/_Handlers');

    nodeFs.readdirSync(handlersFolder).forEach((file) => {
        if (file.endsWith('.js')) {
            require(path.join(handlersFolder, file))(ipcMain, mainWindow, log);
        }
    });
    /** END  Split handler in multiple files **/

    ipcMain.on ( "downloadAppUpdate", downloadAppUpdateAfterConfirmation );

    ipcMain.on ( 'currentAppVersion', setCurrentAppVersionGlobally )

    // noinspection JSUnresolvedFunction
    autoUpdater.on ( 'checking-for-update', ( _event ) => {
        const toast = {
            toastTitle: "Updates",
            toastMessage: "Checking for Updates for: "
        }
        log.info ( toast.toastMessage, global.appVersion );
    } )

    // noinspection JSUnresolvedFunction
    autoUpdater.on ( 'update-available', ( _event, info ) => {

        const toast = {
            toastTitle: "Updates",
            toastMessage: "An Update is Available."
        }
        log.info ( toast.toastMessage );
    } )

    // noinspection JSUnresolvedFunction
    autoUpdater.on ( 'update-not-available', ( _event ) => {
        const toast = {
            toastTitle: "Updates",
            toastMessage: "You're up to date"
        }
        if ( isDev ) {
            console.info ( toast.toastMessage, global.appVersion );
        }
        log.info ( toast.toastMessage, global.appVersion );
        // mainWindow.webContents.send('showToast', toast );
    } )
    // autoUpdater.on( 'download-progress', ( event, info ) => {
    //     // console.info("Software Update download progress:", info);
    // } )

    // noinspection JSUnresolvedFunction
    autoUpdater.on ( 'update-downloaded', ( _event, updateInfo ) => {
        const toast = {
            toastTitle: "Updates",
            toastMessage: "The new release has been downloaded."
        }
        if ( isDev ) {
            console.info ( toast.toastMessage );
        }
        log.info ( toast.toastMessage );
        const installNow = JSON.stringify ( global.installNow );
        log.info ( 'The download will be installed now ', installNow )
        if ( global.installNow ) {
            autoUpdater.quitAndInstall ( true, true );
        }
        // mainWindow.webContents.send('showToast', toast );
    } )
    // noinspection JSUnresolvedFunction
    autoUpdater.on ( 'error', ( event, info ) => {
        const toast = {
            toastTitle: "Updates",
            toastMessage: "Error while attempting to Download Updates"
        }
        //console.info ( toast.toastMessage );
        log.info ( toast.toastMessage );
        // mainWindow.webContents.send('showToast', toast );
    } )

    ipcMain.on ( 'checkForSoftwareUpdates', checkForSoftwareUpdates );
    ipcMain.on ( 'executeMigrations', executeMigrations )
    ipcMain.on ( 'removeUniqueNameGroupConstraint', removeUniqueNameGroupConstraint )

    mainWindow.on ( 'closed', () => {
        mainWindow = null;
        // hiddenWindow = null;
        app.quit ();
    } );

    /// CREATE RESOURCES FOLDER IF IT DOESN'T EXIST

    ipcMain.on ( 'createResourceFolder', doCreateResources )


    /// DOWNLOAD AND INSTALL DEPENDENCIES

    ipcMain.on ( "installDependencies", ( event, pathname ) => {
        //console.info( "ipcMain receives message 'installDependencies' and pathname: ", pathname )
        const dependencies = fsHelper.installDependencies ( pathname, documentsFolder );
        //console.info( "ipcMain sends message 'sendToDownloadQueue' and dependencies: ", dependencies )
        mainWindow.webContents.send ( 'sendToDownloadQueue', dependencies )
    } )

    // RESET USER SETTINGS FOR FIRST INSTALLING VALUE
    ipcMain.on ( 'resetFirstInstallingInSettings', doResetFirstInstallingInSettings )


    ///DOWNLOAD FROM USB
    ipcMain.on ( 'downloadFromUSB', ( event, info ) => {
        mainWindow.webContents.send ( 'installFromUSBStarted' )
        const sourceFilePath = info.filePath;
        const fileName = info.fileName
        const destJSONPath = databasePath + "/" + fileName;
        global.usbSourceFolderPath = info.folderPath + 'resources/repo'
        // TODO: This workflow is only for installing for the 1st time, it should be
        // modified when the user want's to update content in the app.
        // For this, we'll need a json file with metadata and flags to trigger suitable methods to update only
        // certain part of information/content, and not overwrite it all, as it happens right now

        const filterFunc = ( file ) => {
            const testMACOSX = /^__MACOSX/.test ( file.path );
            const testDS_Store = /\.DS_Store/.test ( file.path );
            const testSymbolicLink = file.type !== "SymbolicLink";

            return !testMACOSX && !testDS_Store && testSymbolicLink;
        }
        fs.copy ( sourceFilePath, destJSONPath, { filter: filterFunc } )
            .then ( async () => {
                const pathFile = require ( 'path' );
                let contentData = fs.readFileSync ( pathFile.resolve ( databasePath, fileName ), );
                let contents = JSON.parse ( contentData );
                return contents;
            } )
            .then ( async ( contents ) => {
                const dataProcessed = await doProcessContentsDataFromJson ( contents )
                    .catch ( ( error ) => {
                        log.error ( "Error while processingContentDataFromJson on USBinstallation", error )
                    } );

                if ( dataProcessed ) {
                    if ( isDev ) {
                        console.info ( 'dataProcessed from USB installation ', dataProcessed )
                    }
                    const data = {
                        resourcesCopied: false,
                        settingsUpdated: false
                    }
                    const updatedSettings = await dbMethod.updateUserSettings ( 'firstInstalling', 'false' )
                        .catch ( ( error ) => {
                            log.error ( "Error while updating user settings on USBinstallation", error )
                        } );
                    //console.info ( { updatedSettingsAfterUSBInstallation: updatedSettings } )
                    data.resourcesCopied = updatedSettings;
                    data.settingsUpdated = true;
                    return data;
                }
            } )
            .catch ( ( error ) => {
                mainWindow.webContents.send ( 'errorMessageOnMain', {
                    message: '"Error on copying resources folder, 1st offline installation',
                    error: error,
                    subject: 'Message from MAIN'
                } );
            } )

    } )

    /// SET INSTALLATION FROM WEB
    ipcMain.on ( 'setInstallingFromWeb', () => {
        //console.info( "ipcMain receives message 'setInstallingFromWeb'!" )
        dbMethod.updateUserSettings ( 'firstInstalling', 'false' )
            .then ( () => {
                if ( isDev ) {
                    console.info ( "firstInstalling flag is updated" )
                }
                mainWindow.webContents.send ( 'setInstallingFromWeb', true );
            } )
            .catch ( ( error ) => {
                log.error ( "Error while updating firstInstalling value", error )
            } );
        //console.info( "ipcMain sends message 'setInstallingFromWeb' and a value:", true );
    } )

    /// DOWNLOAD AND INSTALL PACKAGES

    ipcMain.on ( "installPackages", ( event, packagesList ) => {
        //console.info( "ipcMain receives message 'installPackages' and packageList :", packagesList )
        mainWindow.webContents.send ( 'sendToDownloadQueue', packagesList )
        global.packagesNumber = packagesList.length
        //console.info( "ipcMain sends message 'sendToDownloadQueue' and packageList :", packagesList )
    } )


    /// PROCESS DOWNLOAD QUEUE

    ipcMain.on ( 'onSendToDownloadQueueFinished', ( event, downloadQueue ) => {
        //console.info( "ipcMain receives message 'onSendToDownloadQueueFinished' and queue: ", queue )
        const item = downloadQueue[0];
        const statusesForDownloading = [ "Download_Error", "Pending" ];
        const normalizeDownloadPath = normalize ( documentsFolder + "repo/" + item.route )

        const conditionForDownloadingItemsThatAreNotImages = () => {
            return (
                ( !fsHelper.fileExists ( normalizeDownloadPath ) ) && (
                    ( statusesForDownloading.includes ( item.status ) ) ||
                    ( item.classification === "dependencies" )
                )
            )
        }
        const imageCondition = () => {
            return item.classification === 'image'
        };

        if ( item !== undefined ) {
            if ( conditionForDownloadingItemsThatAreNotImages () || imageCondition () ) {
                if ( item.hasOwnProperty ( "usbInstallation" ) && item.usbInstallation === true ) {
                    doCopyFromUSBSourceFolder ( item )
                } else {
                    setTimeout ( () => {
                        doDownload ( item )
                            .catch ( ( error ) => log.error ( "Error on doDownload function", error ) )
                    }, 500 )
                }

                if ( item.classification !== 'dependencies' ) {
                    if ( item.status !== 'Download_Error' ) {
                        item.status = "Installing";
                    } else {
                        item.status = "Installing_on_Download_Error";
                    }
                    Download_Manager.updateStatus ( item )
                        .then ( ( result ) => {
                            const { id, statusUpdated } = result;
                            if ( isDev ) {
                                console.info ( "Updated status for item: ", id, item.name, item.profile_id, item.category_id, item.classification );
                            }
                            log.info ( "log info:  Updated status for item: ", id, item.name, item.profile_id, item.category_id, item.classification )
                        } )
                        .catch ( ( error ) => {
                            const functionName = "Download_Manager.updateStatus ( item )";
                            const appProcess = "downloading";
                            log.error ( "Error detected for function " + functionName + " and process " + appProcess );
                            log.error ( "Error while updating item status: ", item.name, item.uuid, item.profile_id, item.category_id, item.classification, item.file_uuid );
                            log.error ( "Error while updating item status: ", error, item.name, item.profile_id, item.category_id, item.classification );
                        } )
                } else {
                    //console.info("Nothing to update in downloadManager", item)
                    log.info("Download: nothing to update");
                    mainWindow.webContents.send ( 'errorMessageOnMain', {
                        message: 'Confirmation message onSendToDownloadQueueFinished: ',
                        error: "Item name is: " + item.filename + "and it's classification is:  " + item.classification,
                        subject: 'Message from MAIN'
                    } );
                }
            } else {
                if ( item.classification !== 'dependencies' ) {
                    item.status = "Downloaded";
                    Download_Manager.updateStatus ( item )
                        .then ( ( result ) => {
                            const { id, statusUpdated } = result;
                            if ( isDev ) {
                                console.info ( "Updated status for item: ", id, item.name, item.profile_id, item.category_id, item.classification );
                            }
                            mainWindow.webContents.send ( 'onSystemAlready', item );
                        } )
                        .catch ( ( error ) => {
                            const functionName = "Download_Manager.updateStatus ( item )"
                            const appProcess = "Downloading";
                            log.error ( "Catching Error detected for function " + functionName + " and process " + appProcess );
                            log.error ( "Catching Error while updating item status: ", item.name, item.uuid, item.profile_id, item.category_id, item.classification, item.file_uuid );
                            log.error ( "Error while updating item status: ", error, item.name, item.profile_id, item.category_id, item.classification );
                        } )
                }
            }
        }
    } )

    /// SEND MESSAGE BACK TO RENDERER TO CANCEL THE DOWNLOAD QUEUE
    ipcMain.on ( 'cancelDownloadQueue', () => {
        mainWindow.webContents.send ( 'cancelDownload' )
    } )

    /// SEND MESSAGE BACK TO RENDERER TO RESET THE DOWNLOAD QUEUE
    ipcMain.on ( 'resetDownloadQueue', () => {
        mainWindow.webContents.send ( 'resetDownload' )
    } )

    /// CANCEL DOWNLOADING FOR AN ITEM
    ipcMain.on ( 'downloadCancel', doCancelDownload )

    /// PROCESS INSTALL QUEUE

    ipcMain.on ( 'onSendBufferQueue', ( event, queue ) => {
        //console.info( "ipcMain receives message 'onSendBufferQueue' and queue: ", queue )
        const item = queue[0];
        if ( item !== undefined ) {
            if ( item.status === "Installing" || item.status === "Installing_on_Download_Error" || item.classification === "dependencies" ) {
                switch ( item.classification ) {
                    case( "dependencies" ):
                    case( "visuals" ):
                        doUnzipFiles ( item )
                            .catch ( ( error ) => {
                                if ( isDev ) {
                                    console.info ( "Error while decompressing a visual: ", error );
                                }
                                log.error ( 'Catching error on doUnzipFiles function ', item.uuid, item.name, item.profile_id, item.category_id, item.file_uuid )
                            } );
                        break;
                    case( "library" ):
                    case( "image" ):
                        doSaveFileIntoFolder ( item );
                        break;
                    default:
                        break;
                }
            } else {
                mainWindow.webContents.send ( 'onUnzippedAlready', item );
            }
        } else {
            const undefinedItem = JSON.stringify ( item );
            log.error ( "Downloaded item to be unzipped is set to undefined ", undefinedItem )
        }
    } )


    ipcMain.on ( 'onPinFinished', () => {
        mainWindow.webContents.send ( 'onLoginFinished' )
    } )


    ipcMain.on ( 'processProfilesOnMain', doProcessProfileOnMain )

    /// GET PROFILES FOR USER ON USB INSTALLATION
    ipcMain.on ( 'getUserProfileOnUSBInstallation', doGetUserProfilesOnUSBInstallation )

    /// PROCESS DATA FOR USER

    ipcMain.on ( 'gotDataForUser', doProcessDataForUser );

    /// UPDATE POSTPONED UPDATES STATUS TO PENDING
    ipcMain.on ( "updateStatusToPending", modifyUpdateStatus )

    /// RESTORE POSTPONED UPDATES STATUS TO POSTPONED
    ipcMain.on ( "restoreStatusToPostponed", modifyUpdateStatus )

    /// INSTALL POSTPONED UPDATES
    ipcMain.on ( 'installSelectedUpdates', installPostponedUpdates );

    /// GET STORED UPDATES FOR DOWNLOADMANAGER
    ipcMain.on ( 'doQueryForPendingUpdates', doQueryForPendingUpdates )

    /// GET STORED UPDATES FOR DOWNLOADMANAGER ON COMPONENT RENDER
    ipcMain.on ( 'queryForPackages', doQueryForPackages )

    /// PROCESS SERVER NOTIFICATION PAYLOAD DATA
    ipcMain.on ( 'processServerNotificationPayload', doProcessDataForUser )

    /// PROCESS LANDING FOR PROFILE
    ipcMain.on ( 'getLandingForProfile', onProcessLandingForProfile )

    /// PROCESS CATEGORIES FOR PROFILE
    ipcMain.on ( 'getCategories', onGetCategories );

    /// PROCESS CONTENT FOR PROFILE
    ipcMain.on ( 'getContent', onGetContent );

    /// PROCESS SEARCH RESULTS FOR EMAILS
    ipcMain.on ( 'getEmailSearchResult', onGetSearchEmails )

    /// SAVE PDF GENERATED FROM CALCULATOR AS PDF
    ipcMain.on ( 'saveCalcOutput', saveCalcOutput )

    /// DISCARD AND DELETE PDF GENERATED FROM CALCULATOR
    ipcMain.on ( 'discardCalcOutput', discardCalcOutput )

    /// PROCESS SEARCH RESULTS FOR VISITS
    ipcMain.on ( 'getVisitSearchResult', onGetSearchVisits );

    /// PROCESS SEARCH RESULTS FOR PROFILE
    ipcMain.on ( 'getSearchResult', onGetSearchResult );
    /// GET LAST INSTALLATION DATA
    ipcMain.on ( 'getLastInstallationInfo', onGetLastInstallationInfo )

    /// GET LAST INSTALLATION DATA
    ipcMain.on ( 'processUpdateProfiles', doProcessProfileOnMain )


    /// GET DEFAULT USER SETTINGS
    ipcMain.on ( 'getDefaultUserSettings', onGetDefaultUserSettings )

    /// GET USER SETTINGS TO PRIME REDUX
    ipcMain.on ( 'primeRedux', onGetDefaultUserSettings )

    /// GET APP LANGUAGE ON LOGIN
    ipcMain.on ( 'getAppLanguage', onGetAppLanguage )

    // RESET APP LANGUAGE ON FIRST LOGIN
    ipcMain.on ( 'resetAppLanguage', doOnResetAppLanguage )

    /// CHECK SERVER AVAILABILITY IF REQUESTED FROM RENDERER
    ipcMain.on ( 'doCheckServerAvailability', () => {

        mainWindow.webContents.send ( 'checkServerAvailabilityAfterLogin' )
    } )
    /// SEND SERVER CURRENT STATUS BACK TO RENDERER
    ipcMain.on ( 'serverIsAvailable', ( event, info ) => {
        mainWindow.webContents.send ( 'serverIsNowInReach', info );
    } )

    /// CHECK FOR PENDING TASKS
    ipcMain.on ( 'checkForPendingTasks', doCheckForPendingTasks );

    /// UPDATE DOWNLOADS ERROR STATUS
    ipcMain.on ( 'setDownloadsErrorsAsReported', setDownloadsErrorsAsReported );

    /// UPDATE USER SETTINGS
    ipcMain.on ( 'updateUserSettings', ( event, info ) => {

        dbMethod.updateUserSettings ( info.key, info.value )
            .then ( () => {
                let backInfo = {}
                backInfo.key = info.key;
                backInfo.value = info.value
                mainWindow.webContents.send ( 'updatedUserSettings', backInfo )
            } )
            .catch ( ( error ) => {
                mainWindow.webContents.send ( 'errorMessageOnMain', {
                    message: '"Error while updating userSettings',
                    error: error,
                    subject: 'Message from MAIN'
                } );
            } );
    } )


    /// UPDATE DOWNLOAD MANAGER UPDATES STATUS ON INSTALLATION DONE
    ipcMain.on ( 'itemInstalledSuccessfully', ( event, entry ) => {
        const status = "Installed";
        const installationDate = Date.now ();
        setItemAsInstalled ( entry, status, installationDate )
            .then ( async () => {
                if ( isDev ) {
                    console.info ( 'Item ' + entry.uuid + ' installed!' );
                }
            } )
            .catch ( ( error ) => {
                mainWindow.webContents.send ( 'errorMessageOnMain', {
                    message: '"Error while updating installed item status from pending to installed',
                    error: error,
                    subject: 'Message from MAIN'
                } );
                log.error ( 'Error detected for function setItemAsInstalled and process finishing installation' )
                log.error ( '"Error while updating installed item status to installed for: ', entry.uuid, entry.name, entry.profile_id, entry.category_id, entry.classification, entry.file_uuid );
            } )
    } )

    // UPDATE DOWNLOAD_MANAGER STATUS IF DOWNLOADING WAS UNSUCCESSFUL
    ipcMain.on ( 'updateItemAsNotDownloaded', doSetItemAsNotInstalled )

    // UPDATE DOWNLOAD_MANAGER STATUS IF INSTALLATION WAS UNSUCCESSFUL
    ipcMain.on ( 'updateItemAsNotInstalled', doSetItemAsNotInstalled )

    // CHECK IF ALL CONTENT HAS BEEN INSTALLED SUCCESSFULLY
    ipcMain.on ( 'removeAllFromRepo', clearRepoFolder )

    /// GOT AND RESEND NOTIFICATION DATA
    ipcMain.on ( 'gotNotificationData', ( event, data ) => {
        mainWindow.webContents.send ( 'resentNotificationData', data )
    } )
    /// GOT AND RESEND UPDATES DATA

    ipcMain.on ( 'gotUpdatesData', ( event, data ) => {
        mainWindow.webContents.send ( 'resentUpdatesData', data )
    } )
    /// GOT AND RESEND BACKEND CONFIRMATION THAT THERE'S NO PENDING UPDATES
    ipcMain.on ( 'nothingPendingFromServer', ( event, data ) => {
        mainWindow.webContents.send ( 'resentNoPendingUpdatesData', data )
    } )

    ipcMain.on ( "profileRemoved", () => {
        mainWindow.webContents.send ( 'resentProfileRemoved' )
    } )

    /// CHECK IF REPO EMPTY FOR PROFILE ON FINISHED FIRST INSTALLATION
    ipcMain.on ( 'checkIfRepoEmptyForProfile', doCheckIfRepoEmptyForProfile )

    /// STORE CREATED EMAIL IN EMAIL_MANAGER TABLE
    ipcMain.on ( 'createdEmail', doStoreEmailInEmailManagerTable )

    /// EMAIL SUCCESSFULLY SENT
    ipcMain.on ( 'changeEmailStatus', doChangeEmailStatus )

    /// EMAIL FOR LOGS NOT SENT
    ipcMain.on ( 'deleteEmailWithLogs', doDeleteEmailWithLogs )

    /// GET ALL STORED EMAILS
    ipcMain.on ( 'searchForEmails', doQueryForStoredEmails )

    /// GET ALL STORED VISITS
    ipcMain.on ( 'searchForVisits', doQueryForStoredVisits )

    /// STORE CREATED VISIT IN VISITS_MANAGER TABLE
    ipcMain.on ( 'createdVisit', doStoreVisitInVisitsManagerTable )

    /// START A VISIT SELECTED FROM VISITS LIST
    ipcMain.on ( 'startVisit', doStartVisit )

    /// GET VISIT ATTACHMENTS
    ipcMain.on ( 'getVisitAttachments', getVisitAttachments )

    /// UPDATE VISIT ATTACHMENTS
    ipcMain.on ( 'updateVisitAttachments', updateVisitAttachments )

    /// FINISH STARTED VISIT
    ipcMain.on ( 'finishVisit', doFinishVisit )

    /// UPDATE ONLINE/OFFLINE STATUS
    ipcMain.on ( "online-status-updated", doUpdateConnectionStatus )

    /// UNINSTALL APP
    ipcMain.on ( 'startUninstalling', doSentSignalForUninstalling )

    ///REMOVE RESOURCES FOLDER
    ipcMain.on ( 'deleteResources', doRemoveResources )

    ///REMOVE DATABASE FOLDER
    ipcMain.on ( 'truncateDatabase', doTruncateDatabase )

    ///SEND TO LOGS
    ipcMain.on ( 'sendToLogs', doSendToLogs )

    ///GET THE UUID FOR A CONTENT THAT'S OPENED IN THE VIEWERS
    ipcMain.on ( 'getMyInfo', doGetMyInfo )
    ///GET THE UUID FOR A CONTENT THAT'S OPENED IN THE VIEWERS
    ipcMain.on ( 'getMyAttachmentInfo', doGetMyAttachmentInfo );

    ipcMain.on ( 'resetGlobalVisualSentList', resetGlobalVisualSentList );

    ///GET THE UNSYNCED LOGS TO SEND TO BACKEND
    ipcMain.on ( 'sendPendingLogs', doSendPendingLogs )

    ///MARK THE SYNCED LOGS AFTER BEING SENT SUCCESSFULLY
    ipcMain.on ( 'updateSyncedLogs', doUpdateSyncedLogs )

    ipcMain.on ( 'getFirstCategories', doGetFirstCategories )

    ///UPDATE PROCESS DATA IN BULK ON HASH CHANGED
    ipcMain.on ( 'updateProfilesDataOnHashChange', doUpdateProfilesData )

    ipcMain.on ( 'gotUpdatedHashDataForProfile', doResentUpdatedHashDataForProfiles );

    ipcMain.on ( 'setItemAsNotNew', doSetItemAsNotNew );

    ipcMain.on ( 'triggerResettingView', () => {
        mainWindow.webContents.send ( 'resetView' );
    } )
    ///GET ALL EXISTING CONTENT TYPES FOR A GIVEN PROFILE
    ipcMain.on ( 'getAllDocumentTypesForProfile', getAllDocumentTypesForProfile );

    ///GET ALL EXISTING GROUPS/BUSINESS UNIT FOR A GIVEN PROFILE
    ipcMain.on ( "getAllGroupsForProfile", getAllGroupsForProfile );

    /// RESTART APP TO FINISH REMOVING ITEMS FROM REPO
    ipcMain.on ( 'doRestartApp', doRestartApp );

    /// CONTINUE UNINSTALLATION PROCESS
    ipcMain.on ( 'continueUninstalling', continueUninstallingProcess )
}

const doBeforeMigrations = async () => {
    let dbFilePath = databasePath + '/content.sqlite';
    if ( !fsHelper.fileExists ( dbFilePath ) ) {
        const systemLanguage = await setSystemLanguage ()
            .catch ( ( error ) => {
                mainWindow.webContents.send ( 'errorMessageOnMain', {
                    message: "Error while getting default system user",
                    error: error,
                    subject: "Message from MAIN"
                } )
            } )
        const response = await dbMethod.createDatabase ()
            .catch ( ( error ) => {
                log.error ( "Error on DB creation ", JSON.stringify ( error ) );
            } )
        if ( systemLanguage ) {
            let appLanguage;
            const languageToSend = appTranslations.filter ( item => item.value === systemLanguage )[0];
            if ( languageToSend ) {
                appLanguage = {
                    key: "appLanguage",
                    value: languageToSend.key
                }
            } else {
                appLanguage = {
                    key: "appLanguage",
                    value: "English"
                }
            }
            mainWindow.webContents.send ( 'gotAppLanguage', appLanguage );
        }
        if ( response === true && systemLanguage ) {
            mainWindow.webContents.send ( 'onFinishedConfirmInitialSetup', "true" );
            mainWindow.webContents.send ( 'createDatabaseFinished' );
            log.info ( 'The database has been created inside first migration for the 1st app installation' );
            return response;
        }
    } else {
        const contentsTableExists = await knex.schema.hasTable ( 'contents' )
            .catch ( ( error ) => {
                log.error ( 'Error while checking if the database has table contents ', error )
            } )

        if ( contentsTableExists ) {
            log.info ( 'The database already exists and has table contents, so the migrations can be executed!' );
            await checkIfThisIsFirstInstallation ()
                .catch ( ( error ) => {
                    log.error ( "Error while checking if this is 1st installation of content : " + error )
                } )
            return true;
        }
    }
}
const doCreateResources = ( event, type ) => {
    const result = fsHelper.createInitialFolders ()
    if ( result === true ) {
        //console.info( "ipcMain sends message 'createInitialFoldersFinished'!" )
        if ( type === "afterUninstalling" ) {
            log.transports.file.resolvePath = () => path.join ( documentsFolder, 'logs/main.log' );
            //mainWindow.webContents.send ( 'createInitialFoldersFinished' );
        } else {
            mainWindow.webContents.send ( 'createInitialFoldersFinished' );
        }

    } else {
        mainWindow.webContents.send ( 'errorMessageOnMain', {
            message: "error createResourceFolder",
            error: result,
            subject: "Message from MAIN"
        } )
    }
}

async function executeMigrations () {
    log.info ( "Migrations execution starts." );
    const dbCreated = await doBeforeMigrations ()
        .catch ( ( error ) => {
            log.error ( "Error while creating local database and tables, ", error )
        } )
    if ( dbCreated ) {
        knex.migrate.latest ()
            .then ( () => {
                log.info ( "Migrations are done!", global.appVersion );
                mainWindow.webContents.send ( "migrationExecuted" )
            } ).catch ( ( error ) => {
            log.error ( "Error while trying to execute migrations for version  " + global.appVersion + " " + error );
        } )
    }
}

const checkForSoftwareUpdates = async ( event, version ) => {
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
    autoUpdater.autoDownload = false;
    let output = {};

    const updateCheckerResponse = await autoUpdater.checkForUpdatesAndNotify ()
        .catch ( ( error ) => {
            log.error ( "Error on 'checkForUpdatesAndNotify':", error )
        } )

    if ( updateCheckerResponse ) {
        const updateInfoForLogging = JSON.stringify ( updateCheckerResponse.updateInfo );
        log.info ( "Release info includes the following: ", updateInfoForLogging );
        output.version = updateCheckerResponse.updateInfo.version;
        output.releaseNotes = updateCheckerResponse.updateInfo.releaseNotes;
        if ( mainWindow ) {
            mainWindow.webContents.send ( 'sentUpdateForDownloading', output );
        }
    } else {
        output = {
            value: false,
            message: "The update response was null",
        }
        log.info ( "Output message is :  ", output.message );
    }
}

const downloadAppUpdateAfterConfirmation = async ( event, info ) => {
    const infoReceived = JSON.stringify ( info );
    global.installNow = info.installNow;
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
    log.info ( 'Info received  for  downloadAppUpdateAfterConfirmation:  ', infoReceived );
    const updateDownloaded = await autoUpdater.downloadUpdate ()
        .catch ( ( error ) => {
            log.error ( "Error on 'updateDownloaded':", error );
        } )
    if ( updateDownloaded ) {
        log.info ( "New release has been downloaded. New app version to be installed is: ", info.version )
        log.info ( " The new release should be installed immediately: ", JSON.stringify ( info.installNow ) )
    }
}

app.on ( 'ready', createBothWindows );

app.commandLine.appendSwitch ( 'ignore-certificate-errors' )
app.commandLine.appendSwitch ( 'disable-features', 'OutOfBlinkCors' );
//TODO: comment out those lines of code below before doing built


if ( isDev ) {

    const {
        default: installExtension,
        REACT_DEVELOPER_TOOLS,
        // APOLLO_DEVELOPER_TOOLS,
        REDUX_DEVTOOLS
    } = require ( 'electron-devtools-installer' );

    app.whenReady ().then ( () => {
        installExtension ( REDUX_DEVTOOLS, { forceDownload: true, loadExtensionOptions: { allowFileAccess: true } } )
            .then ( ( name ) => console.info ( `Added Extension:  ${ name }` ) )
            .catch ( ( err ) => log.error ( 'An error occurred "redux_devtools": ', err ) );
        installExtension ( REACT_DEVELOPER_TOOLS )
            .then ( ( name ) => console.info ( `Added Extension:  ${ name }` ) )
            .catch ( ( err ) => log.error ( 'An error occurred "react_devtools": ', err ) );
        // installExtension( APOLLO_DEVELOPER_TOOLS )
        //     .then( ( name ) => console.log( `Added Extension:  ${ name }` ) )
        //     .catch( ( err ) => log.error( 'An error occurred: ', err ) );
    } )
}

app.on ( 'window-all-closed', () => {
    if ( process.platform !== 'darwin' ) {
        app.quit ();
    }
} );

app.on ( 'activate', () => {
    if ( mainWindow === null ) {
        createBothWindows ();
    }
} );

if ( isDev ) {

    const nStatic = require ( 'node-static' );
    const file = new nStatic.Server ( `${ documentsFolder }/`, {
        cache: 0,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    } )

    require ( 'http' ).createServer ( function ( request, response ) {
        request.addListener ( 'end', function () {
            file.serve ( request, response )
        } ).resume ()
    } ).listen ( 9990 )

}

async function doDownload ( info ) {
    log.info('doDownload called with', info)
    let filename;
    switch ( info.classification ) {
        case "dependencies":
            filename = info.filename;
            break;
        case "visuals":
            filename = info.route + ".zip";
            break;
        case "image":
            filename = info.route + ".jpg";
            break;
        default:
            filename = info.route;
            break;
    }



    if ( !info.url ) {
        log.info('doDownload: oneDrive URl requested', info)
        try{
            info.url = await fileUrlGenerator.generate ( info.file_uuid )
            log.info('doDownload: One drive url received', info.url)
        }catch ( error ){
            log.error('doDownload: Error trying to get OneDrive Url', error)
        }
    }

    downloadFile ( info, filename )

}

const downloadFile = ( info, filename ) => {
    log.info('downloadFile: is called', info, filename)

    let url = info.url
    // const path = info.classification === "dependencies" ? "" : info.profile_id + "/";
    /*   const writer = fs.createWriteStream( path )
       let contentLength = 0;*/
    global.onStartedFlag = 0;
    global.slowdownCount = 0;
    global.slowdownList = [];

    try {
        log.info('Download: start for the file', info)
        console.log('Download: start for the file', info)
        DownloadManager.download ( {
            url: url,
            path: "",
            overwrite: true,
            filename: filename,
            onProgress: ( data, item ) => {
                if ( mainWindow ) {
                    log.info('Download Progress ...', info)
                    console.log('Download Progress ...', info)
                    mainWindow.setProgressBar ( data.percentage );
                }
                let downloadProgressInfo = {
                    filesNumber: global.packagesNumber,
                    speed: data.speed,
                    progress: data.progress,
                    percentage: data.percentage,
                    info,
                    format: info.mimetype,
                    received_bytes: data.downloadedBytes,
                    total_bytes: data.totalBytes,
                    remaining_bytes: data.remainingBytes,
                    total: data.total
                }
                if ( mainWindow ) {
                    log.info('Download Progress_EDM ...', info)
                    console.log('downloadProgress_EDM ...')
                    mainWindow.webContents.send ( 'downloadProgress_EDM', downloadProgressInfo );
                } else {
                    log.error ( "Electron main window is null on downloadProgress_EDM" );
                }
                // noinspection JSUnresolvedVariable
                const functionName = "doDownload()";
                const appProcess = "downloading";
                const { filename, uuid, name, profile_id, category_id, classification, file_uuid } = info;
                if ( isNaN ( data.progress ) && ( data.speedBytes === 0 ) && ( data.downloadedBytes === 0 ) ) {
                    //log.error( "Download seems to have been interrupted for file: \n", info.filename )
                    let errorToSend = {
                        message: "Download seems to have been interrupted for file: " + info.filename,
                        error: "Interruption error",
                        filename: info.filename,
                        identifier: info.uuid,
                        subject: 'Message from MAIN'
                    }
                    if ( isDev ) {
                        mainWindow.webContents.send ( 'itemNotDownloadingProperly', info );
                    }
                    const functionName = "doDownload()";
                    const appProcess = "downloading";
                    log.error ( "Error detected for function " + functionName + " and process " + appProcess );
                    log.error ( errorToSend.message, info.uuid, info.name, info.profile_id, info.category_id, info.classification, info.file_uuid );
                    log.error ( 'Downloading data values are: data.progress ' + data.progress + ', data.speedBytes ' + data.speedBytes + ', data.downloadedBytes ' + data.downloadedBytes + ' data.total_bytes ' + data.totalBytes );

                }
                // noinspection JSUnresolvedVariable
                if ( data.progress > 0 && data.speedBytes === 0 && data.progress !== 100 ) {

                    const date = new Date ();
                    const slowDownData = {
                        progress: data.progress,
                        timestamp: Date.now ()
                    }

                    global.slowdownList.push ( slowDownData );

                    let slowdownError = {
                        message: "Slowdown detected on " + date + " for file " + info.filename,
                        error: "Slowdown error",
                        identifier: info.uuid,
                        subject: 'Message from MAIN'
                    }
                    log.error ( "Error detected for function " + functionName + " and process " + appProcess );
                    log.error ( slowdownError.message );
                    log.error ( 'Downloading data values are: data.progress ' + data.progress + ', data.speedBytes ' + data.speedBytes + ', data.downloadedBytes ' + data.downloadedBytes + ' data.total_bytes ' + data.totalBytes );

                    if ( global.slowdownList.length >= 2 ) {
                        let slowDownCount;
                        let number = global.slowdownList.indexOf ( slowDownData );

                        for ( let i = number; i < global.slowdownList.length; i++ ) {

                            if ( global.slowdownList[i].timestamp - global.slowdownList[i - 1].timestamp >= 750 ) {
                                slowDownCount = ++global.slowdownCount;
                            }
                            const slowdownListLength = global.slowdownList.length;
                            if ( ( slowDownCount >= 4 ) && ( global.slowdownList[slowdownListLength - 1].progress === global.slowdownList[slowdownListLength - 3].progress ) ) {
                                log.error ( 'Item will be extracted from the download queue due to the persistent slowdown error!' );
                                log.error ( 'Extracted item data:', info.uuid, info.name, info.profile_id, info.category_id, info.classification, info.file_uuid );
                                if ( isDev ) {
                                    mainWindow.webContents.send ( 'itemNotDownloadingProperly', info );
                                }

                            } else {
                                if ( isDev ) {
                                    console.info ( "App is downloading with some difficulties due to slowdown error" )
                                }
                            }
                        }
                    }
                    if ( ( data.progress === 0 ) && ( data.speedBytes !== 0 ) && ( global.onStartedFlag !== 0 ) ) {
                        let stalledError = {
                            message: "Error: Download seems to have stalled for file: \n" + info.filename + "_" + info.sortng_name,
                            error: "Stalled",
                            identifier: info.uuid,
                            subject: 'Message from MAIN'
                        }
                        log.error ( "Error detected for function " + functionName + " and process " + appProcess );
                        log.error ( stalledError.message );
                        log.error ( 'Downloading data values are: data.progress ' + data.progress + ', data.speedBytes ' + data.speedBytes + ', data.downloadedBytes ' + data.downloadedBytes + ' data.total_bytes ' + data.totalBytes );
                        if ( isDev ) {
                            mainWindow.webContents.send ( 'itemNotDownloadingProperly', info );
                        }
                    }
                }

                if ( ( data.progress === 0 ) && ( global.onStartedFlag === 0 ) ) {
                    global.onStartedFlag = 1;
                    if ( global.itemToCancel && ( global.itemToCancel.uuid === info.uuid ) ) {
                        item.cancel ();
                        global.itemToCancel = {};
                        log.info ( "Cancelling downloading for item " )
                    }
                    log.info ( 'Downloading data values are: data.progress ' + data.progress + ', data.speedBytes ' + data.speedBytes + ', data.downloadedBytes ' + data.downloadedBytes + ' data.total_bytes ' + data.totalBytes );
                    log.info ( "global.onStared set to 1 for " + filename + " " + profile_id + " " + category_id + " " + name + " " + uuid );

                    // Pause, resume and cancel should be declared here: info.pause(), info.cancel(), info.resume() will be the methods to use
                } else if ( data.progress === 100 ) {
                    if ( isDev ) {
                        console.info ( "OnProgress: Download has finished ", info.filename );
                    }
                    log.info ( "OnProgress: Download has finished ", info.filename );
                }
            }
        }, ( error, { url, filePath } ) => {
            if ( error ) {
                const { filename, uuid, name, profile_id, category_id, classification, file_uuid } = info;
                let errorToSend = {
                    message: "Final error while downloading in callback for file: " + filename,
                    error: error,
                    identifier: uuid,
                    subject: 'Message from MAIN'
                }
                if ( isDev ) {
                    mainWindow.webContents.send ( 'itemNotDownloadingProperly', info );
                }
                const functionName = "doDownload()";
                const appProcess = "downloading";
                log.error ( "Error detected for function " + functionName + " and process " + appProcess );
                log.error ( errorToSend.message, uuid, name, profile_id, category_id, classification, file_uuid, url, filePath );

            } else {
                log.info ( "Callback Result: Download has finished for file: ", info.filename )
                if ( mainWindow ) {
                    mainWindow.webContents.send ( 'onSystemAlready', info );

                } else {
                    log.error ( "Electron main window is null when sending onSystemAlready after downloading content", mainWindow );
                }
            }
        } )
    } catch ( error ) {
        const { uuid, name, profile_id, category_id, classification, file_uuid } = info;
        const functionName = "doDownload()";
        const appProcess = "downloading";
        log.error ( "Catching Error detected for function " + functionName + " and process " + appProcess );
        log.error ( " Catching Final Error: ", uuid, name, profile_id, category_id, classification, file_uuid );
    }
}

const doCancelDownload = ( event, entry ) => {
    global.itemToCancel = entry;
    let statusToSend;
    if ( entry.status !== 'Installing_on_Download_Error' ) {
        statusToSend = 'Download_Error';
    } else {
        statusToSend = 'Report_To_Backend';
    }
    doUpdateItemStatus ( entry, statusToSend );

}
const writeDownloadErrorToLogs = async ( failedDownloads ) => {
    return new Promise ( async ( resolve, reject, error ) => {
        const userSettings = await dbMethod.doGetAllItemsFromTable ( 'user_settings' )
            .catch ( ( error ) => log.error ( "Error while dbMethod.doGetAllItemsFromTable('user_settings')", error ) )
        const userEmail = userSettings.filter ( ( item ) => item.key === "userEmail" )[0].value;
        for ( const failedDownload of failedDownloads ) {
            if ( failedDownloads.indexOf ( failedDownload ) === 0 ) {
                log.error ( `The user email : ${ userEmail }` );
                log.error ( 'The following content could not be downloaded and installed properly.' );
                log.error ( '...................' )
            }
            log.error ( `The content that has failed to be downloaded has the following data:` );
            log.error ( `Name: ${ failedDownload.name }` );
            log.error ( `Profile: ${ failedDownload.profile_id }` );
            log.error ( `Category id: ${ failedDownload.category_id }` );
            log.error ( `Classification: ${ failedDownload.classification }` );
            log.error ( `Route: ${ failedDownload.route }` );
            log.info ( ' ---------------------' );
        }
        log.info ( 'END DOWNLOADS ERRORS LIST' );
        if ( error ) {
            reject ( error )
        }
        resolve ( true )
    } )
}


const getFailedDownloads = async () => {
    const status = "Report_To_Backend"
    const failedDownloads = await Download_Manager.findWithStatus ( status )
        .catch ( ( error ) => {
            log.error ( 'Error on Download_Manager.findWithStatus(status) when reporting failed downloads ', error )
        } )
    let failedDownloadData = [];
    if ( ( Array.isArray ( failedDownloads ) ) && ( failedDownloads.length > 0 ) ) {
        const createdDownloadErrorsFile = await writeDownloadErrorToLogs ( failedDownloads )
            .catch ( ( error ) => {
                log.error ( "Error on function writeDownloadErrorToLogs(failedDownloads)", error )
            } )

        if ( createdDownloadErrorsFile ) {
            const logsToSend = fs.readFileSync ( documentsFolder + 'logs/main.log' );
            const stringiedLogs = Buffer.from ( logsToSend ).toString ( 'base64' );
            const failedDownloadDataFull = [
                {
                    b64: stringiedLogs,
                    filename: 'main.log'
                },
            ]
            return failedDownloadDataFull;
        }
        return failedDownloadData;
    } else {
        return failedDownloadData;
    }
}

const doProcessDataForUser = async ( event, profilesData ) => {

    if ( Array.isArray ( profilesData ) && profilesData.length > 0 ) {
        const firstInstallationOrNewProfile = profilesData.filter ( ( profileData ) => profileData.firstInstallation === true || profileData.newProfile === true ).length;
        const normalUpdates = firstInstallationOrNewProfile === 0 ? true : false;
        log.info ( "Started processing content!" );
        mainWindow.webContents.send ( 'startProcessingData', normalUpdates );

        for ( const info of profilesData ) {
            const contents = await processServerNotification ( info )
                .catch ( ( error ) => {
                    log.error ( "error on processServerNotification ", error );
                } );
            if ( isDev ) {
                console.info ( "doProcessDataForUser", { processedContents: contents } );
            }
        }

        const triggerDownloadContentResult = await triggerDownloadContent ( profilesData[0].usbInstallation )
            .catch ( ( error ) => {
                log.error ( "error on triggerDownloadContent ", error );
            } );

        if ( triggerDownloadContentResult ) {
            log.info ( "Finished processing content!" );
            mainWindow.webContents.send ( "finishedProcessingDataForUser", normalUpdates );
        }
    }
}

const doQueryForPendingUpdates = () => {
    dbMethod.getUpdatesList ()
        .then ( ( result ) => {
                if ( result.length > 0 ) {
                    mainWindow.webContents.send ( 'gotUpdatesToInstall', result )
                } else {
                    mainWindow.webContents.send ( 'noUpdatesToInstallDetected', result )
                }
            }
        )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while getting updates list ',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
}

const doQueryForPackages = ( event, currentProfile ) => {
    dbMethod.getPackagesList ( currentProfile )
        .then ( ( result ) => {
                mainWindow.webContents.send ( 'gotPackagesList', result )
            }
        )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while getting packages list ',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
}

const doQueryForStoredEmails = ( event, type ) => {
    dbMethod.doGetAllItemsFromTable ( "emails_manager", " ORDER BY createdOn DESC" )
        .then ( ( result ) => {
                mainWindow.webContents.send ( 'gotStoredEmails', { result, type } )
            }
        )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error on getting all items form table emails_manager',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
}
const doQueryForStoredVisits = ( event, type ) => {
    dbMethod.doGetAllItemsFromTable ( "visits_manager", " ORDER BY createdOn DESC" )
        .then ( ( result ) => {
                if ( isDev ) {
                    console.info ( "Stored visits are ", result )
                }
                mainWindow.webContents.send ( 'gotStoredVisits', { result, type } )
            }
        )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error on getting all items form table visits_manager',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
}
const DecompressZip = require ( 'decompress-zip' );
const { promises: fsp } = require ( "fs" );


const doUnzipFiles = async ( item ) => {

    let ZIP_FILE_PATH = "";
    let installPath = "";
    let DESTINATION_PATH = "";
    let packageInfo;
    let itemSortingName;
    switch ( item.classification ) {
        case "dependencies":
            ZIP_FILE_PATH = normalize ( documentsFolder + "repo/" + item.filename );
            installPath = normalize ( documentsFolder + item.classification + "/" );
            DESTINATION_PATH = normalize ( documentsFolder + item.classification + "/installing/" );
            break;
        case "visuals":
        default:
            ZIP_FILE_PATH = normalize ( documentsFolder + "repo/" + item.route + ".zip" );
            installPath = normalize ( documentsFolder + item.classification );
            DESTINATION_PATH = normalize ( documentsFolder + item.classification + "/installing/" );
            packageInfo = JSON.parse ( item.package );
            itemSortingName = packageInfo.sorting_name;
            break;
    }

    const unzipper = new DecompressZip ( ZIP_FILE_PATH );

    unzipper.on ( 'error', function ( error ) {
        let unzipError = {
            error,
            item
        }
        log.error ( "Error detected for function doUnzipFiles for process Installing " );
        log.error ( "Error while unzipping visuals: ", item.name, item.uuid, item.profile_id, item.category_id, item.file_uuid )
        if ( isDev ) {
            mainWindow.webContents.send ( 'itemWithUnzipErrorToInstallAgain', unzipError )
        }
    } );

    await unzipper.on ( 'extract', function ( ZIP_FILE_PATH ) {
        console.info ( 'Finished all extractions', item.filename );
    } );


    await unzipper.on ( 'progress', function ( fileIndex, fileCount ) {
        if ( isDev ) {
            console.info ( { itemToInstall: item } );
        }
        if ( fileIndex + 1 === fileCount ) {

            const parameters = {
                oldPath: DESTINATION_PATH,
                installPath,
                newPath: normalize ( installPath + "/" + item.route ),
                filename: itemSortingName,
                route: item.route,
                classification: item.classification,
                content: item
            }
            doRename ( parameters )
            if ( item.classification === "dependencies" ) {
                mainWindow.webContents.send ( 'onUnzippedAlready', item )
            }
        }
    } );

    await unzipper.extract ( {
        path: normalize ( DESTINATION_PATH ),
        filter: function ( file ) {
            const testMACOSX = /^__MACOSX/.test ( file.path );
            const testDS_Store = /\.DS_Store/.test ( file.path );
            const testSymbolicLink = file.type !== "SymbolicLink";

            return !testMACOSX && !testDS_Store && testSymbolicLink;
        },
        restrict: false
    } );

}


const doRename = ( parameters ) => {

    if ( parameters.classification === 'visuals' ) {
        const cleanFilename = parameters.filename.replace ( /[^\x00-\x7F]/g, "" );
        const sourcePath = normalize ( parameters.oldPath + '/' + cleanFilename );
        const destinationPath = normalize ( parameters.newPath );
        const content = parameters.content;
        if ( fsHelper.fileExists ( normalize ( sourcePath ) ) ) {
            try {
                fs.move ( sourcePath, destinationPath, { overwrite: true }, error => {
                    if ( error ) {
                        if ( isDev ) {
                            console.info ( "doRename", { sourcePath, destinationPath } );
                        }

                        log.error ( "Error moving visuals!", error, sourcePath, destinationPath );
                        const moveError = {
                            error,
                            route: parameters.route,
                            filename: cleanFilename,
                            subject: sourcePath,
                            destinationPath,
                            content
                        }
                        log.error ( "Error detected for function doRename for process Installing for fs.move() for sourcePath" + sourcePath + ": " + moveError.error );
                        log.error ( "Error while moving visual while installing in " + destinationPath + ": ", content.uuid, content.name, content.profile_id, content.category_id, content.file_uuid, parameters.route, cleanFilename );
                        mainWindow.webContents.send ( 'onMoveVisualError', moveError );
                        mainWindow.webContents.send ( 'fileNotExtractedYet', content );
                    } else {
                        mainWindow.webContents.send ( 'onUnzippedAlready', content );
                    }
                } )
            } catch ( error ) {
                log.error ( "Catching Error moving visuals!", error, sourcePath, destinationPath );
                log.error ( "Catching Error detected for function doRename for process Installing" );
                log.error ( "Catching Error for visual: ", content.uuid, content.name, content.profile_id, content.category_id, content.file_uuid, parameters.route, destinationPath )
                mainWindow.webContents.send ( 'fileNotExtractedYet', content );
            }
        } else {
            log.error ( "Path does not exist: ", sourcePath );
            log.error ( "Error detected for function doRename for process Installing" );
            log.error ( "Error for visual: ", content.uuid, content.name, content.profile_id, content.category_id, content.file_uuid, parameters.route, destinationPath );
            //mainWindow.webContents.send ( 'fileNotExtractedYet', content );
        }

    } else {
        const { oldPath, newPath } = parameters;

        if ( fs.existsSync ( newPath ) ) {
            rimraf.sync ( newPath );
            fs.renameSync ( oldPath, newPath );
            let errorOld = {
                error: "oldPath",
                subject: oldPath
            }

            let errorNew = {
                error: "newPath",
                subject: newPath
            }
            mainWindow.webContents.send ( 'onRenameError', errorOld );
            mainWindow.webContents.send ( 'onRenameError', errorNew );
        } else {
            fs.rename ( oldPath, newPath, () => {
                fs.stat ( newPath, function ( error, stats ) {
                    if ( error ) {
                        let renameError = {
                            error,
                            subject: newPath
                        }
                        mainWindow.webContents.send ( 'onRenameError', renameError );
                        throw error;
                    }
                    if ( isDev ) {
                        console.info ( 'stats: ' + JSON.stringify ( stats ) );
                    }
                } );
            } )
        }
    }
}


const doSaveFileIntoFolder = ( item ) => {
    const fs = require ( 'fs' );

// destination will be created or overwritten by default.
    //TODO: get the relative or absolute path right to coping folder using appData documentFolder etc.
    let fileSrc = normalize ( documentsFolder + "repo/" + item.route );
    const installPath = normalize ( documentsFolder + item.classification );
    let dirDest = normalize ( installPath );
    let fileDest = normalize ( dirDest + "/" + item.route );
    if ( item.classification === 'image' ) {
        fileSrc = fileSrc + ".jpg";
        dirDest = normalize ( installPath + "/" + item.route );
        fileDest = normalize ( dirDest + "/" + "cover.jpg" );
    }
    fsHelper.doCreateFolder ( dirDest )
        .then ( () => {
            fs.copyFile ( fileSrc, fileDest, ( error ) => {
                if ( error ) {
                    log.error ( 'Error detected for function doSaveFileIntoFolder for Copying an image or a pdf' );
                    log.error ( 'Error while copying an image or a pdf: ', item.uuid, item.name, item.classification, item.profile_id, item.category_id, item.file_uuid, fileSrc, fileDest )
                    throw error;
                } else {
                    mainWindow.webContents.send ( 'onUnzippedAlready', item )
                }
            } );
        } )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while creating Folder, saving file into folder ',
                error: error,
                subject: 'Message from MAIN'
            } );
            log.error ( 'Catching Error detected for function doSaveFileIntoFolder for copying an image or a pdf' );
            log.error ( 'Catching Error while copying an image or a pdf: ', item.uuid, item.name, item.classification, item.profile_id, item.category_id, item.file_uuid, fileSrc, fileDest )

        } );
}

const modifyUpdateStatus = ( event, info ) => {
    const infoToSend = {
        uuid: info.value
    }
    doUpdateItemStatus ( infoToSend, info.status )
}

const setInstallingPostponed = async ( postponedUpdates, uninstalledStatuses ) => {
    const pendingContent = await Download_Manager.findWithStatuses ( uninstalledStatuses )
        .catch ( ( error ) => {
            log.error ( "Error while getting postponed or not installed items ", error )
        } )
    mainWindow.webContents.send ( 'gotPackages', pendingContent );
}
const installPostponedUpdates = async ( event, infoPostponed ) => {
    const uninstalledStatuses = [ "Download_Error", "Pending" ];
    const postponedInstalled = await setInstallingPostponed ( infoPostponed, uninstalledStatuses )
        .catch ( ( error ) => {
            log.error ( "Error while triggering installation of postponed updates!", error )
        } );
    if ( postponedInstalled ) {
        log.info ( "Success on triggering installation of postponed updates, packages have been sent!" );
        if ( isDev ) {
            console.info ( "Success on triggering installation of postponed updates, packages have been sent!" );
        }
    }
}

const triggerDownloadContent = ( usbInstallation ) => {
    return new Promise ( async ( resolve, reject, ) => {
        let preparedDownloadQueue;
        log.info ( "Started triggering DownloadContent" );
        const downloadQueueFromDM = await Download_Manager.allPending ()
            .catch ( error => {
                log.error ( error );
                reject ( error )
            } )

        if ( usbInstallation === true && Array.isArray ( downloadQueueFromDM ) ) {
            preparedDownloadQueue = downloadQueueFromDM.map ( ( entry ) => {
                entry.usbInstallation = true;
                return entry;
            } )
        } else {
            preparedDownloadQueue = downloadQueueFromDM;
        }

        const sortedDownloadQueue = preparedDownloadQueue.sort ( ( a, b ) => {
            a.status.localeCompare ( b.status ) || a.category_id.localeCompare ( b.category_id );
        } );
        if ( sortedDownloadQueue.length > 0 ) {
            mainWindow.webContents.send ( 'gotPackages', sortedDownloadQueue );
            log.info ( "Finished triggering DownloadContent, sending sortedDownloadQueue" );
        } else {
            log.info ( "Finished triggering DownloadContent, no items to be downloaded" );
            mainWindow.webContents.send ( 'resetView' );
        }

        resolve ( true )
    } )
}

async function classifyContents ( dataForClassifyingContents ) {
    log.info ( "Start to classify contents!!!" )
    const { userProfile, categories, packageList, firstInstallation, newProfile } = dataForClassifyingContents
    const clonedPackagesList = packageList.map ( ( item ) => Object.assign ( {}, item ) );

    const allDBContentTypesForProfileFullData = await Content.findAllContentTypesForProfile ( userProfile )
        .catch ( ( error ) => {
            log.error ( "Error on Content.findAllContentTypesForProfile(data.profile)", error );
        } )

    const allGroupsForProfileFullData = await Group.findAllGroupsForProfile ( userProfile )
        .catch ( ( error ) => {
            log.error ( "Error on roup.findAllGroupsForProfile(data.profile)", error );
        } )
    const allDBContentTypesForProfile = allDBContentTypesForProfileFullData.map ( ( item ) => item.tid );
    const allGroupsForProfile = allGroupsForProfileFullData.map ( ( item ) => item.id );

    return new Promise ( async ( resolve, reject ) => {
        const listOptions = {
            query: "",
            profile: userProfile,
            type: [ "all" ],
            businessUnit: [ "all" ],
            group: "all",
            visitActive: "false",
            statuses: [ 'Installed' ],
            allDBContentTypes: allDBContentTypesForProfile,
            allDBGroupsForProfile: allGroupsForProfile
        }

        try {
            const packagesWithoutImages = clonedPackagesList.filter ( item => item.classification !== "image" );
            const contentImages = packageList.filter ( item => item.classification === "image" );

            const contentsResult = []
            packagesWithoutImages.forEach ( ( content ) => {
                const contentCategories = [];
                categories.forEach ( ( category ) => {
                    if ( category.contents.includes ( content.uuid ) ) {
                        contentCategories.push ( {
                            category_id: category.id,
                            group_id: category.gid
                        } )
                    }
                } )
                contentCategories.forEach ( category => {
                    let output = {
                        uuid: content.uuid,
                        name: content.name,
                        profile_id: userProfile,
                        group_id: category.group_id,
                        category_id: category.category_id,
                        file_uuid: content.properties.file_uuid,
                        filename: content.properties.filename,
                        url: content.properties.url,
                        should_rename: content.properties["rename"] ? 1 : 0,
                        status: "Undefined",
                        version: content.version ? content.version : Date.now (),
                        classification: content.classification,
                        notification_date: Date.now (),
                        package_date: "",
                        installation_date: "",
                        uninstallation_date: "",
                        properties: content.properties,
                        date_created: content.date_created ? content.date_created : "",
                        deleted: content.deleted ? content.deleted : 0,
                        image: "/" + content.route,
                        mimetype: content.mimetype,
                        published: content.published ? content.published : 0,
                        route: content.properties.file_uuid,
                        sendable: content.sendable ? content.sendable : 0,
                        sorting_name: content.sorting_name,
                        sorting_number: content.sorting_number ? content.sorting_number : -1,
                        tid: content.tid ? content.tid : "",
                        visible: content.visible ? content.visible : 0,
                        isUpdate: false,
                        parent_content_id: content.parent_content_id ? content.parent_content_id : "",
                        business_unit_id: content.business_unit_id ? content.business_unit_id : ""
                        // add all missing necessary properties
                    }
                    output.package = JSON.stringify ( output );
                    contentsResult.push ( output )
                } )
            } )
            const imagesResult = [];
            const visualsToMap = contentsResult.filter ( ( contentResult ) => contentResult.classification === "visuals" );

            visualsToMap.forEach ( ( visual, index ) => {
                const parsingImages = contentImages.filter ( image => image.sorting_name === visual.sorting_name );
                const contentForImage = parsingImages.map ( item => {
                    return { ...item }
                } );
                contentForImage.forEach ( ( image ) => {
                    image.profile_id = visual.profile_id;
                    image.group_id = visual.group_id;
                    image.category_id = visual.category_id;
                    image.file_uuid = image.properties.file_uuid;
                    image.filename = image.sorting_name;
                    image.url = image.properties.url;
                    image.should_rename = image.properties["rename"] ? 1 : 0;
                    image.status = "Undefined";
                    image.version = Date.now ();
                    image.notification_date = Date.now ();
                    image.package_date = "";
                    image.installation_date = "";
                    image.uninstallation_date = "";
                    image.date_created = "";
                    image.deleted = 0;
                    image.image = "/" + visual.route;
                    image.published = 0;
                    image.route = visual.route;
                    image.sendable = 0;
                    image.sorting_number = index;
                    image.tid = "";
                    image.visible = 0;
                    image.isUpdate = false;
                    image.parent_content_id = visual.parent_content_id ? visual.parent_content_id : "";
                    image.business_unit_id = visual.business_unit_id ? visual.business_unit_id : "";
                    image.package = JSON.stringify ( image );
                    imagesResult.push ( image );
                } )
            } )

            const currentContentForProfile = await dbMethod.getSearchedContent ( listOptions )
                .catch ( ( error ) => {
                    log.error ( "Error on getSearchContent ", error );
                } );
            const currentUUIDs = currentContentForProfile.map ( ( item ) => item.uuid );
            const responseContentsInCategoriesForProfile = categories.map ( category => category.contents );
            const responseUUIDs = responseContentsInCategoriesForProfile.flat ( 1 );
            const contentUUIDsForDeleting = currentUUIDs.filter ( item => !responseUUIDs.includes ( item ) );
            if ( contentUUIDsForDeleting.length > 0 ) {
                const ProfileContentRelationDeleted = await Profiles_Contents.deleteByProfileIdAndContentUUID ( userProfile, contentUUIDsForDeleting )
                    .catch ( ( error ) => {
                        log.error ( "Error on Profiles_Contents.deleteByProfileIdAndContentUUID ", error );
                    } )
                if ( ProfileContentRelationDeleted ) {
                    const DMEntryDeleted = await Download_Manager.deleteByProfileIdAndContentUUID ( userProfile, contentUUIDsForDeleting )
                        .catch ( ( error ) => {
                            log.error ( "Error on Download_Manager.deleteByProfileIdAndContentUUID ", error );
                        } )
                    if ( DMEntryDeleted ) {
                        if ( isDev ) {
                            console.info ( DMEntryDeleted )
                        }
                    }
                }
            }
            if ( ( firstInstallation !== true ) && ( newProfile !== true ) ) {
                // DELETE EMPTY IMAGE ENTRIES FROM DOWNLOAD MANAGER
                const classification = "image"
                const imagesFromDM = await Download_Manager.findByClassification ( classification )
                    .catch ( ( error ) => {
                        log.error ( "Error on  Download_Manager.findByClassification", error );
                    } )
                if ( imagesFromDM.length > 0 ) {
                    for ( const imageFromDM of imagesFromDM ) {
                        const clonedImage = Object.assign ( {}, imageFromDM );
                        const pathForImage = documentsFolder + "/image/" + imageFromDM.route;
                        if ( !fsHelper.fileExists ( pathForImage ) ) {
                            const deletedImage = await Download_Manager.deleteByClassificationAndRoute ( imageFromDM )
                                .catch ( ( error ) => {
                                    log.error ( "Error on getting deleteByClassificationAndRoute", error );
                                } )

                            if ( deletedImage === 0 ) {
                                if ( isDev ) {
                                    console.info ( "Image successfully deleted! ", clonedImage.name, clonedImage.uuid, clonedImage.profile_id, clonedImage.route, clonedImage.category_id );
                                }
                            }
                        }
                    }
                }
                // DELETE ITEM FROM DOWNLOAD MANAGER AND/OR CATEGORIES CONTENTS IF REQUIRED
                const responseCategoriesContentsForProfile = categories.map ( category => {
                    const relationObject = {
                        id: category.id,
                        contents: category.contents
                    }
                    return relationObject;
                } )

                const responseCategoriesListForProfile = categories.map ( category => {
                    return category.id;
                } )

                const allDBCatContentsForProfile = await Categories_Contents.allForProfile ( userProfile )
                    .catch ( ( error ) => {
                        log.error ( "Error on Categories_Contents.allForProfile  ", error );
                    } )

                const allCatContentsForUser = await Categories_Contents.all ()
                    .catch ( ( error ) => {
                        log.error ( "Error on Categories_Contents.all  ", error );
                    } )

                const allFromProfilesContents = await Profiles_Contents.all ()
                    .catch ( ( error ) => {
                        log.error ( "Error on Profiles_Contents.all  ", error );
                    } )

                const pcUUIDS = allFromProfilesContents.map ( ( item ) => item.content_UUID );


                //TODO: REVIEW ALL THIS LOGIC, RIGHT NOW, IT'S NOT WORKING AND IT'S PREVENTING THE APP FROM DOWNLOADING AND INSTALLING

                if ( allDBCatContentsForProfile.length > 0 ) {
                    for ( const resCatContentsForProfile of responseCategoriesContentsForProfile ) {
                        for ( const DBCatContent of allDBCatContentsForProfile ) {
                            if ( ( resCatContentsForProfile.id === DBCatContent.cat_Id ) && ( !resCatContentsForProfile.contents.includes ( DBCatContent.content_UUID ) ) ) {
                                const contentsRoutes = await Content.findContentRouteForUuid ( DBCatContent.content_UUID )
                                    .catch ( ( error ) => {
                                        log.error ( "Error on Content.findRouteForUuid(uuid)", error );
                                    } );

                                const deletedFromDownloadManagerForProfileCatRoute = await Download_Manager.deleteByProfileIdCategoryAndContentRoute ( userProfile, resCatContentsForProfile.id, contentsRoutes )
                                    .catch ( ( error ) => {
                                        log.error ( "Error on Download_Manager.deleteByProfileIdAndContentUUID ", error );
                                    } )

                                const catContentsForOtherProfiles = await Profiles_Contents.findByContentUUIDForOtherProfiles ( DBCatContent.content_UUID, userProfile )
                                    .catch ( ( error ) => {
                                        log.error ( "Error on Profiles_Contents.findByContentUUIDForOtherProfiles ( ", error );
                                    } )

                                if ( catContentsForOtherProfiles.length === 0 ) {
                                    const deletedFromCategoriesContents = await Categories_Contents.deleteByContentUUIDAndCatId ( DBCatContent.content_UUID, DBCatContent.cat_Id )
                                        .catch ( ( error ) => {
                                            log.error ( "Error on Categories_Contents.deleteByContentUUIDAndCatId ", error );
                                        } )
                                    if ( deletedFromCategoriesContents === 0 && deletedFromDownloadManagerForProfileCatRoute ) {
                                        if ( isDev ) {
                                            console.info ( "Category content relationship has been removed for content and profile: ", DBCatContent.cat_UUID, userProfile )
                                        }
                                    }
                                }
                            }

                            if ( !responseCategoriesListForProfile.includes ( DBCatContent.cat_Id ) ) {
                                let allCategoriesNotExclusiveForProfile;
                                const allCatContentsNotExclusiveForProfile = await Categories_Contents.allForOtherProfiles ( userProfile )
                                    .catch ( ( error ) => {
                                        log.error ( "Error on Categories_Contents.allForOthersProfiles  ", error );
                                    } )

                                if ( allCatContentsNotExclusiveForProfile.length > 0 ) {
                                    allCategoriesNotExclusiveForProfile = allCatContentsNotExclusiveForProfile.map ( ( item ) => item.cat_Id );
                                }

                                //TODO: Add workflow for deleting
                                const categoriesIds = [ DBCatContent.cat_Id ];
                                const deletedFromDmForProfileAndCategory = await Download_Manager.deleteByProfileIdCategory ( userProfile, categoriesIds )
                                    .catch ( ( error ) => {
                                        log.error ( "Error on Download_Manager.deleteByProfileIdAndContentUUID ", error );
                                    } )

                                if ( ( allCatContentsNotExclusiveForProfile.length === 0 ) || ( !allCategoriesNotExclusiveForProfile.includes ( DBCatContent.cat_Id ) ) ) {
                                    const deletedFromCatContentsByCatId = await Categories_Contents.deleteByCategoryId ( DBCatContent.cat_Id )
                                        .catch ( ( error ) => {
                                            log.error ( "Error on Categories_Contents.deleteByCategoryId ", error );
                                        } )
                                    if ( deletedFromCatContentsByCatId === 0 && deletedFromDmForProfileAndCategory ) {
                                        if ( isDev ) {
                                            console.info ( "Category content relationship has been removed for category and profile: ", DBCatContent.cat_Id, userProfile )
                                        }
                                    }
                                }
                            }

                            const contentInProfilesContents = await Profiles_Contents.findByContentUUID ( DBCatContent.content_UUID )
                                .catch ( ( error ) => {
                                    log.error ( "Error on Profiles_Contents.findByContentUUID( DBCatContent.content_UUID) ", error );
                                } )

                            const contentStillExistsInCatContent = await Categories_Contents.findByContentUUID ( DBCatContent.content_UUID )
                                .catch ( ( error ) => {
                                    log.error ( "Error on Categories_Contents.findByContentUUID ", error );
                                } )

                            if ( ( contentInProfilesContents.length === 0 ) && ( contentStillExistsInCatContent.length === 0 ) ) {
                                await deleteContentsAndItsFiles ( DBCatContent.content_UUID )
                                    .catch ( ( error ) => {
                                        log.error ( "Error in function deleteContentsAndItsFiles() ", error );
                                    } )
                            }
                        }

                        for ( const catContent of allCatContentsForUser ) {
                            if ( ( !responseCategoriesListForProfile.includes ( catContent.cat_Id ) ) && ( !pcUUIDS.includes ( catContent.content_UUID ) ) ) {
                                const deletedFromCategoriesContents = await Categories_Contents.deleteByContentUUIDAndCatId ( catContent.content_UUID, catContent.cat_Id )
                                    .catch ( ( error ) => {
                                        log.error ( "Error on Categories_Contents.deleteByContentUUIDAndCatId ", error );
                                    } )
                                const contentStillExistsInCatContent = await Categories_Contents.findByContentUUID ( catContent.content_UUID )
                                    .catch ( ( error ) => {
                                        log.error ( "Error on Categories_Contents.findByContentUUID ", error );
                                    } )
                                if ( ( deletedFromCategoriesContents === 0 ) && ( contentStillExistsInCatContent.length === 0 ) ) {
                                    await deleteContentsAndItsFiles ( catContent.content_UUID )
                                        .catch ( ( error ) => {
                                            log.error ( "Error in function deleteContentsAndItsFiles() ", error );
                                        } )
                                }
                            }
                        }
                    }
                }

                // DELETE EMPTY CATEGORIES WITH NO CONTENT ASSIGNED FOR ALL USER PROFILES
                const allCategoriesWithContentsIdsFromDB = await Categories_Contents.allCategoriesIds ()
                    .catch ( ( error ) => log.error ( "Error on Categories_Contents.all() ", error ) );
                const allCategoriesWithContentsIds = allCategoriesWithContentsIdsFromDB.map ( ( item ) => item.cat_Id );
                const allCategoriesIds = await Category.allIds ()
                    .catch ( ( error ) => {
                        log.error ( "Error on Category.allIds() ", error );
                    } )

                for ( const categoryId of allCategoriesIds ) {
                    if ( !allCategoriesWithContentsIds.includes ( categoryId.id ) ) {
                        const deletedCategory = await Category.delete ( categoryId.id )
                            .catch ( ( error ) => {
                                log.error ( "Error on Category.delete(id)", error )
                            } )
                        if ( isDev ) {
                            console.info ( "Deleted category id is: ", categoryId.id, deletedCategory );
                        }
                    }
                }

                // DELETE EMPTY GROUPS WITH NO CATEGORIES AND NO CONTENT ASSIGNED FOR ALL USER PROFILES

                const allGroupsIds = await Group.allIds ()
                    .catch ( ( error ) => {
                        log.error ( "Error  on Group.allIds() ", error );
                    } )

                const allGidInCatsFromDB = await Category.allGids ()
                    .catch ( ( error ) => {
                        log.error ( "Error  on Category.allGids() ", error );
                    } )

                const allGidInCats = allGidInCatsFromDB.map ( ( item ) => item.gid );
                for ( const groupId of allGroupsIds ) {
                    if ( !allGidInCats.includes ( groupId.id ) ) {
                        const deletedGroup = await Group.delete ( groupId.id )
                            .catch ( ( error ) => {
                                log.error ( "Error  on Group.delete(id) ", error );
                            } )
                        if ( isDev ) {
                            console.info ( "Deleted group id is: ", groupId.id, deletedGroup );
                        }
                    }
                }
            }

            const preparedPackages = [ ...contentsResult, ...imagesResult ];

            const forInstalling = [];
            const forUpdating = [];
            for ( const preparedPackage of preparedPackages ) {

                const packagesInDm = await Download_Manager.findEntries ( preparedPackage, firstInstallation )
                    .catch ( ( error ) => {
                        log.error ( error );
                    } )

                const uniqueEntryInDm = await Download_Manager.findUniqueEntry ( preparedPackage )
                    .catch ( ( error ) => {
                        log.error ( error );
                    } )

                const uniqueContentByUUID = await Content.find ( preparedPackage.uuid )
                    .catch ( ( error ) => {
                        log.error ( error );
                    } )
                let oldImagesFromDm;
                if ( preparedPackage.classification === "image" ) {
                    oldImagesFromDm = await Download_Manager.findByProfileClassificationAndFilename ( preparedPackage )
                        .catch ( ( error ) => {
                            log.error ( "Error on Download_Manager.findByProfileClassificationAndFilename( preparedPackage )", error );
                        } )
                }

                const entryForProfileCatUUIClassification = await Download_Manager.findEntryForProfileCategoryUUIDStatus ( preparedPackage )
                    .catch ( ( error ) => {
                        log.error ( error );
                    } )
                switch ( true ) {
                    case( packagesInDm.length === 0 ):
                        preparedPackage.status = "Pending";
                        if ( firstInstallation !== true && newProfile !== true ) {
                            const updatedInfo = {
                                date: Date.now (),
                                accessed: 0
                            }
                            preparedPackage.package_date = JSON.stringify ( updatedInfo );
                        }
                        if ( ( uniqueContentByUUID.length === 1 ) && ( uniqueContentByUUID[0].route !== preparedPackage.route ) && ( preparedPackage.classification !== "image" ) ) {

                            const ContentWithUpdatedRoute = await Content.updateRoute ( preparedPackage )
                                .catch ( ( error ) => {
                                    log.error ( error );
                                } )
                            if ( ContentWithUpdatedRoute ) {
                                const { name, uuid, sorting_name, route } = ContentWithUpdatedRoute;
                                log.info ( "Content with updated route is ", name, sorting_name, uuid, route );
                            }

                        }
                        if ( ( entryForProfileCatUUIClassification.length === 1 ) && entryForProfileCatUUIClassification[0].route !== preparedPackage.route ) {
                            const {
                                profile_id,
                                category_id,
                                route,
                                name,
                                uuid
                            } = entryForProfileCatUUIClassification[0];

                            const contentsRoutes = [ route ];
                            const removedDmEntryWithOldRoute = await Download_Manager.deleteByProfileIdCategoryAndContentRoute ( profile_id, category_id, contentsRoutes )
                                .catch ( ( error ) => {
                                    log.error ( error );
                                } )
                            if ( removedDmEntryWithOldRoute ) {
                                log.info ( "Content has been removed from download manager table:  ", name, uuid, route, profile_id, category_id );
                            }
                        }
                        if ( ( preparedPackage.classification === "image" ) && ( oldImagesFromDm && oldImagesFromDm.length > 0 ) ) {
                            for ( const oldImage of oldImagesFromDm ) {
                                const clonedOldImage = Object.assign ( {}, oldImage );
                                const removedOldImage = await Download_Manager.deleteByClassificationAndRoute ( oldImage )
                                    .catch ( ( error ) => {
                                        log.error ( "Error while deleting old image from DM:", error );
                                    } )

                                if ( removedOldImage === 0 ) {
                                    log.info ( "Old image for visual has been removed from download_manager table ", preparedPackage.name, preparedPackage.filename );
                                    const pathForDeletingContent = normalize ( documentsFolder + "/" + clonedOldImage.classification + "/" + clonedOldImage.route );
                                    let fileData = {
                                        filePath: pathForDeletingContent,
                                        fileClassification: clonedOldImage.classification,
                                        filename: clonedOldImage.route,
                                        dir: normalize ( documentsFolder + "/" + clonedOldImage.classification )
                                    }
                                    const removedFileImage = await fsHelper.removeFile ( fileData )
                                        .catch ( ( error ) => {
                                            log.error ( "Error while removing old image file from images folder", error, clonedOldImage.name, clonedOldImage.route, clonedOldImage.uuid )
                                        } )
                                    if ( removedFileImage ) {
                                        if ( isDev ) {
                                            console.info ( "Old image file has been removed successfully ", clonedOldImage.name, clonedOldImage.route, clonedOldImage.uuid )
                                        }
                                    }
                                }
                            }
                        }
                        forInstalling.push ( preparedPackage );
                        break;

                    case( packagesInDm.length > 0 ):
                        if ( ( ( uniqueEntryInDm.length === 1 ) && parseInt ( uniqueEntryInDm[0].version ) !== parseInt ( preparedPackage.version ) ) && ( preparedPackage.classification !== "image" ) ) {

                            preparedPackage.status = "Installed";
                            const updatedInfo = {
                                date: Date.now (),
                                accessed: 0
                            }
                            preparedPackage.package_date = JSON.stringify ( updatedInfo );

                        } else if ( uniqueEntryInDm.length === 0 ) {
                            if ( firstInstallation !== true && newProfile !== true ) {
                                const updatedInfo = {
                                    date: Date.now (),
                                    accessed: 0
                                }
                                preparedPackage.package_date = JSON.stringify ( updatedInfo );
                            }
                        }
                        forUpdating.push ( preparedPackage );
                        break;
                    default:
                }
            }
            if ( isDev ) {
                console.info ( "Contents to be sent ", { forInstalling, forUpdating } );
            }
            log.info ( "The contents classification process has ended!" );
            resolve ( { forInstalling, forUpdating } );
        } catch ( error ) {
            log.error ( "Error on classifyContents: ", error );
            reject ( "Error on classifyContents: ", error );
        }
    } )
}

const defineItemStatus = ( fileUUIDsList, fileUuid ) => {
    let status = "";
    fileUUIDsList.includes ( fileUuid ) ? status = 'Installed' : status = 'Reinstall';
    return status;
}

const defineItemInstallationDate = ( fileUUIDsList, fileUuid ) => {
    let installation_date = "";
    fileUUIDsList.includes ( fileUuid ) ? installation_date = Date.now () : installation_date = "";
    return installation_date;
}

const processServerNotification = ( info ) => {

    const userProfile = info.profile;
    delete info.profile;
    const packageList = info.packages || [];
    const groups = info.groups || [];
    const categories = info.categories || [];
    const firstInstallation = info.firstInstallation || false;
    const newProfile = info.newProfile || false;
    const dataForClassifyingContents = {
        userProfile,
        categories,
        packageList,
        firstInstallation,
        newProfile
    }

    return new Promise ( async ( resolve, reject ) => {

            try {
                if ( info.usbInstallation !== true ) {
                    const profileHashData = {
                        id: userProfile,
                        hash: info.hash
                    }
                    if ( profileHashData.id && profileHashData.hash ) {
                        await Profile.updateHash ( profileHashData )
                            .catch ( ( error ) => log.error ( "Error on Profile.updateHash ", error ) );
                    }
                    if ( profileHashData.id.includes ( "uk_marketing" ) || profileHashData.id.includes ( "uk_sales" ) ) {

                        const info = {
                            key: "appLanguage",
                            value: "English-GB"
                        }
                        const settings = await setDefaultLanguageForProfile ( info )
                            .catch ( ( error ) => {
                                mainWindow.webContents.send ( 'errorMessageOnMain', {
                                    message: '"Error while setting default language for Profile',
                                    error: error,
                                    subject: 'Message from MAIN'
                                } );
                            } )
                        mainWindow.webContents.send ( 'receivedDefaultUserSettings', settings )
                    }
                }


                classifyContents ( dataForClassifyingContents )
                    .then ( async ( contents ) => {
                        if ( contents.forUpdating.length === 0 && contents.forInstalling.length === 0 ) {
                            resolve ( true );
                        }
                        if ( contents.forUpdating.length > 0 ) {
                            log.info ( "Started to update info in the DB for contents for updating" );
                            const clonedContentsForUpdating = contents.forUpdating.map ( item => Object.assign ( {}, item ) );
                            const updatedContents = await Content.updateBulk ( { clonedContentsForUpdating } )
                                .catch ( ( error ) => {
                                    log.error ( "error on Content.updateBulk() ", error );
                                } );
                            if ( updatedContents ) {
                                const clonedContents = clonedContentsForUpdating;
                                const resolvedProfiles_Contents = await Profiles_Contents.create ( {
                                    clonedContents,
                                    userProfile
                                } )
                                    .catch ( ( error ) => {
                                        log.error ( "error on Profiles_Contents.create() ", error );
                                    } );
                                if ( resolvedProfiles_Contents ) {
                                    const resolvedCategoriesContents = await Categories_Contents.create ( categories )
                                        .catch ( ( error ) => {
                                            log.error ( "error on Category.create() ", error );
                                        } );
                                    if ( resolvedCategoriesContents ) {
                                        log.info ( "Finished updating contents relationships with profiles and categories" );
                                        return contents;
                                    }
                                }
                            }
                        } else {
                            return contents;
                        }
                    } )
                    .then ( async ( contents ) => {
                        if ( contents.forUpdating.length > 0 ) {
                            const createdGroups = await Group.all ()
                                .catch ( ( error ) => {
                                    log.error ( "error on Group.all() ", error );
                                } );
                            for ( const group of groups ) {
                                for ( const dBGroup of createdGroups ) {
                                    if ( ( dBGroup.id === group.id ) && ( dBGroup.hash !== group.hash ) ) {
                                        const groupDataForUpdating = {
                                            dBGroup,
                                            group
                                        }
                                        await updateGroupData ( groupDataForUpdating )
                                            .catch ( ( error ) => {
                                                log.error ( "error on updateGroupData(groupDataForUpdating)", error );
                                            } )
                                    }
                                }
                            }
                            // TODO: Check why this and the else condition are returning the same key
                            log.info ( "Finished updating groups info!" );
                            return contents;
                        } else {
                            return contents;
                        }
                    } )
                    .then ( async ( contents ) => {
                            if ( contents.forUpdating.length > 0 ) {
                                const createdCategories = await Category.all ()
                                    .catch ( ( error ) => {
                                        log.error ( "error on Category.all() ", error );
                                    } )
                                for ( const dBCategory of createdCategories ) {
                                    for ( const category of categories ) {
                                        if ( ( dBCategory.id === category.id ) && ( dBCategory.hash !== category.hash ) ) {
                                            const categoryDataForUpdating = {
                                                dBCategory,
                                                category
                                            }
                                            await updateCategoryData ( categoryDataForUpdating )
                                                .catch ( ( error ) => {
                                                    log.error ( "error on updateCategoryData(categoryDataForUpdating)", error );
                                                } )
                                        }
                                    }
                                }
                                // TODO: Check why this and the else condition are returning the same key
                                log.info ( "Finished updating categories info!" );
                                return contents;
                            } else {
                                return contents;
                            }
                        }
                    )
                    .then ( async ( contents ) => {
                        if ( contents.forUpdating.length > 0 ) {

                            const fileUUIDsForProfile = await Download_Manager.findFileUUIDListForProfile ( userProfile )
                                .catch ( ( error ) => {
                                    log.error ( "error on Download_Manager.findFileUUID ", error );
                                } );

                            const fileUUIDsList = fileUUIDsForProfile.map ( ( item ) => item.file_uuid );

                            contents.forUpdating.map ( ( contentForUpdating ) => {
                                contentForUpdating.status = defineItemStatus ( fileUUIDsList, contentForUpdating.file_uuid );
                                contentForUpdating.installation_date = defineItemInstallationDate ( fileUUIDsList, contentForUpdating.file_uuid );
                                return contentForUpdating;
                            } )
                            // TODO: Check why this and the else condition are returning the same key
                            log.info ( "Finished updating contents status and installation date !" );
                            return contents;
                        } else {
                            return contents;
                        }
                    } )
                    .then ( async ( contents ) => {
                        if ( contents.forUpdating.length > 0 ) {
                            let entriesToAdd = [];
                            let entriesToUpdate = [];
                            let contentUpdatedInDM;
                            let contentAddedToDM;
                            for ( const contentForUpdating of contents.forUpdating ) {
                                const uniqueEntryInDm = await Download_Manager.findUniqueEntry ( contentForUpdating )
                                    .catch ( ( error ) => {
                                        log.info ( "Error while trying to do Download_Manager.findUniqueEntry", error, contentForUpdating.sorting_name, contentForUpdating.name, contentForUpdating.profile_id )
                                    } )
                                if ( uniqueEntryInDm.length === 0 ) {
                                    entriesToAdd.push ( contentForUpdating );
                                } else {
                                    entriesToUpdate.push ( contentForUpdating );
                                }
                            }

                            if ( entriesToUpdate.length > 0 ) {
                                contentUpdatedInDM = await Download_Manager.updateInBulk ( entriesToUpdate )
                                    .catch ( ( error ) => {
                                        log.error ( "error on Download_Manager.updateInBulk ", error );
                                    } );
                                log.info ( "Finished updating contents data in Download Manager table !" );
                            }
                            if ( entriesToAdd.length > 0 ) {
                                contentAddedToDM = await Download_Manager.create ( entriesToAdd )
                                    .catch ( ( error ) => {
                                        log.error ( "error on Download_Manager.create for updating content ", error );
                                    } );
                                log.info ( "Finished adding contents data in Download Manager table !" );
                            }
                            if ( Array.isArray ( contentUpdatedInDM ) || Array.isArray ( contentAddedToDM ) ) {
                                return contents;
                            }
                            // TODO: Check why this and the else condition are returning the same key
                            log.info ( "Finished updating content related data !" );
                            return contents;
                        } else {
                            return contents;
                        }
                    } )
                    .then ( ( contents ) => {
                        if ( contents.forInstalling.length === 0 ) {
                            resolve ( true );
                            log.info ( "Content data actualization in the DB is done!" );
                        } else {
                            log.info ( "Started adding data in DB for content to be installed!" );
                            return contents.forInstalling.map ( item => Object.assign ( {}, item ) );
                        }
                    } )
                    .then ( async ( clonedContents ) => {
                        if ( clonedContents && clonedContents.length > 0 ) {
                            const resolvedContent = await Content.create ( { clonedContents, userProfile } )
                                .catch ( ( error ) => {
                                    log.error ( "error on Content.create() ", error );
                                } );
                            if ( resolvedContent ) {
                                log.info ( "Finished adding new contents to contents table in DB !" );
                                return clonedContents;
                            }
                        }
                    } )
                    .then ( async ( clonedContents ) => {
                        if ( clonedContents && clonedContents.length > 0 ) {
                            const resolvedProfiles_Contents = await Profiles_Contents.create ( {
                                clonedContents,
                                userProfile
                            } )
                                .catch ( ( error ) => {
                                    log.error ( "error on Profiles_Contents.create() ", error );
                                } );
                            if ( resolvedProfiles_Contents ) {
                                log.info ( "Finished adding new profile_content relation to profiles_contents table in DB !" );
                                return clonedContents;
                            }
                        }
                    } )
                    .then ( async ( clonedContents ) => {
                        if ( clonedContents && clonedContents.length > 0 ) {
                            const resolvedGroups = await Group.create ( groups )
                                .catch ( ( error ) => {
                                    log.error ( "error on Group.create() ", error );
                                } );
                            if ( resolvedGroups ) {
                                log.info ( "Finished adding new group(s) in groups table in DB !" );
                                return clonedContents;
                            }
                        }
                    } )
                    .then ( async ( clonedContents ) => {
                        if ( clonedContents && clonedContents.length > 0 ) {
                            const resolvedCategories = await Category.create ( categories )
                                .catch ( ( error ) => {
                                    console.info ( "error on Category.create() ", error );
                                } );
                            if ( resolvedCategories ) {
                                log.info ( "Finished adding new category or categories in categories table in DB !" );
                                return clonedContents;
                            }
                        }
                    } )
                    .then ( async ( clonedContents ) => {
                        if ( clonedContents && clonedContents.length > 0 ) {
                            const resolvedCategoriesContents = await Categories_Contents.create ( categories )
                                .catch ( ( error ) => {
                                    log.error ( "error on Category.create() ", error );
                                } );
                            if ( resolvedCategoriesContents ) {
                                log.info ( "Finished adding new category_content relation to categories_contents table in DB !" );
                                return clonedContents;
                            }
                        }
                    } )
                    .then ( async ( clonedContents ) => {
                        if ( clonedContents && clonedContents.length > 0 ) {
                            const resolvedDownload_Manager = await Download_Manager.create ( clonedContents )
                                .catch ( ( error ) => {
                                    log.error ( "error on Download_Manager.create() ", error );
                                } );
                            if ( resolvedDownload_Manager ) {
                                log.info ( "Finished adding new entries into DM table in DB !" );
                                log.info ( "Finished adding data in DB for content to be installed !" );
                                resolve ( true );
                            }
                        } else {
                            log.info ( "Finished adding data in DB for content to be installed !" );
                            resolve ( true );
                        }
                    } )
                    .catch ( ( error ) => {
                        log.error ( "Error on classifyContents ", error );
                        reject ( error );
                    } )
            } catch
                ( error ) {
                log.error ( "Error on processServerNotification: ", error );
                reject ( error );
            }

        }
    )
}

const onProcessLandingForProfile = ( event, data ) => {
    dbMethod.getLandingForProfile ( data )
        .then ( ( result ) => {
                mainWindow.webContents.send ( 'gotLanding', result )
            }
        )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while getting landings ',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
}


const onGetCategories = () => {
    dbMethod.getCategories ()
        .then ( ( result ) => {
                mainWindow.webContents.send ( 'gotCategories', result )
            }
        )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while getting categories ',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
}

const getImageForVisual = async ( content, profile ) => {
    const data = {
        classification: "image",
        filename: content.sorting_name,
        profile_id: profile
    }
    const imagesForVisuals = await Download_Manager.findByProfileClassificationAndFilename ( data )
        .catch ( ( error ) => {
            log.error ( "Error on Download_Manager.findByProfileClassificationAndFilename(data)", error );
        } )
    if ( imagesForVisuals.length > 0 ) {

        content.imageRoute = imagesForVisuals[0].route;
        const imageExistInDestiny = await checkIfItemInstalledInDestiny ( imagesForVisuals[0] )
            .catch ( ( error ) => {
                log.error ( "Error while checking if content exists in destiny folder: ", error );
            } )
        if ( imageExistInDestiny === false ) {
            requeueMissingItemForDownload ( imagesForVisuals[0] )
                .catch ( ( error ) => {
                    log.error ( "Error while requeuing the missing item: ", error, entry.name, entry.profile_id, entry.category, entry.type );
                } )
        }
    }
}


const onGetContent = async ( event, data ) => {
    const { type, profile } = data;
    const publishedContent = await dbMethod.getPublishedContent ( type, profile )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while getting content by classification and profile ',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
    if ( publishedContent && publishedContent.length > 0 ) {
        for ( const content of publishedContent ) {
            if ( type === "visuals" ) {
                await getImageForVisual ( content, profile )
                    .catch ( ( error ) => log.error ( "Error while getting image for visual: ", error ) );
            }
            const itemExistInDestiny = await checkIfItemInstalledInDestiny ( content )
                .catch ( ( error ) => {
                    log.error ( "Error while checking if content exists in destiny folder: ", error );
                } )
            content.properlyInstalled = itemExistInDestiny;
            if ( content.properlyInstalled === false ) {
                requeueMissingItemForDownload ( content )
                    .catch ( ( error ) => {
                        log.error ( "Error while requeuing the missing item: ", error, entry.name, entry.profile_id, entry.category, entry.type );
                    } )
            }
        }
        const publishedContentToSend = publishedContent.filter ( ( content ) => content.properlyInstalled === true );
        mainWindow.webContents.send ( 'gotContent', publishedContentToSend );
    }
}

const onGetSearchResult = async ( event, data ) => {
    const { profile } = data;
    data.statuses = [ "Installed" ];
    const allDBContentTypesForProfileFullData = await Content.findAllContentTypesForProfile ( profile )
        .catch ( ( error ) => {
            log.error ( "Error on Content.findAllContentTypesForProfile(data.profile)", error );
        } )

    const allGroupsForProfileFullData = await Group.findAllGroupsForProfile ( profile )
        .catch ( ( error ) => {
            log.error ( "Error on roup.findAllGroupsForProfile(data.profile)", error );
        } )
    const allDBContentTypesForProfile = allDBContentTypesForProfileFullData.map ( ( item ) => item.tid );
    const allGroupsForProfile = allGroupsForProfileFullData.map ( ( item ) => item.id );

    data.allDBContentTypes = allDBContentTypesForProfile;
    data.allDBGroupsForProfile = allGroupsForProfile;
    const searchedContent = await dbMethod.getSearchedContent ( data )
        .catch ( error => {
            mainWindow.webContents.send ( 'gotSearchResult', { error: error } )
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while getting search result for profile ',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
    for ( const content of searchedContent ) {
        const { type } = content;
        if ( type === "visuals" ) {
            await getImageForVisual ( content, profile )
                .catch ( ( error ) => log.error ( "Error while getting image for visual: ", error ) );
        }
        const itemExistInDestiny = await checkIfItemInstalledInDestiny ( content )
            .catch ( ( error ) => {
                log.error ( "Error while checking if content exists in destiny folder: ", error );
            } )
        content.installedProperly = itemExistInDestiny;
        if ( content.installedProperly === false ) {
            requeueMissingItemForDownload ( content )
                .catch ( ( error ) => {
                    log.error ( "Error while requeuing the missing item: ", error, entry.name, entry.profile_id, entry.category, entry.type );
                } )
        }
    }
    const searchResult = searchedContent.filter ( ( content ) => content.installedProperly === true );
    mainWindow.webContents.send ( 'gotSearchResult', { searchResults: searchResult } );

}

const onGetSearchVisits = ( event, data ) => {
    const { searchQuery, date, status } = data
    dbMethod.getSearchedVisits ( searchQuery, date, status )
        .then ( ( response ) => {
                mainWindow.webContents.send ( 'gotStoredVisits', response )
            }
        )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while getting search result for visits ',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
}
const onGetSearchEmails = ( event, data ) => {
    const { searchQuery, date, status } = data
    dbMethod.getSearchedEmails ( searchQuery, date, status )
        .then ( ( response ) => {
                mainWindow.webContents.send ( 'gotStoredEmails', response )
            }
        )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while getting search result for emails ',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
}


const doUpdateItemStatus = ( value, status ) => {
    if ( value ) {
        let objectToSend = {
            status: status,
            uuid: value.uuid
        }

        if ( value.classification === "image" ) {
            objectToSend.category_id = value.category_id;
            objectToSend.profile_id = value.profile_id;
            objectToSend.classification = value.classification;
        }

        dbMethod.updateItemStatusInDm ( objectToSend )
            .then ( () => {
                let shouldWait = false;
                mainWindow.webContents.send ( 'updatesStoredDone', shouldWait )
            } )
            .catch ( error => {
                mainWindow.webContents.send ( 'errorMessageOnMain', {
                    message: '"Error while updating image status',
                    error: error,
                    subject: 'Message from MAIN'
                } );
            } );
    }
}

const checkIfItemInstalledInDestiny = ( entry ) => {
    const classification = entry.classification || entry.type;
    return new Promise ( ( resolve, reject ) => {
        const directory = documentsFolder + classification + "/" + entry.route;
        let path = "";
        try {
            switch ( classification ) {
                case "library":
                    path = directory;
                    break;
                case "image":
                    path = directory + "/" + "cover.jpg";
                    break;
                case "visuals":
                default:
                    path = directory + "/" + "index.html";
                    break
            }
            const itemInstalled = fsHelper.fileExists ( path );
            resolve ( itemInstalled );

        } catch ( error ) {
            reject ( error );
        }
    } )
}

const changeItemNameInRepo = ( entry ) => {
    const classification = entry.classification || entry.type;
    return new Promise ( ( resolve, reject ) => {
        const directory = documentsFolder + "repo" + "/" + entry.route;
        let path = "";
        let newPath = ""
        try {
            switch ( classification ) {
                case "library":
                    path = directory;
                    newPath = directory + "_" + Date.now ();
                case "image":
                    path = directory + ".jpg";
                    newPath = directory + "_" + Date.now () + ".jpg";
                    break;
                case "visuals":
                    path = directory + ".zip";
                    newPath = directory + "_" + Date.now () + ".zip";
                    break;
                default:
                    log.info ( 'Unknown classification kind for item', classification, entry )
            }
            let itemRenamed = false;
            if ( fsHelper.fileExists ( path ) ) {
                fs.renameSync ( path, newPath );
                resolve ( true )
            } else {
                resolve ( true )
            }
        } catch ( error ) {
            reject ( error );
        }
    } )
}

const requeueMissingItemForDownload = async ( entry ) => {
    entry.status = "Download_Error";
    const itemRenamedInRepo = await changeItemNameInRepo ( entry )
        .catch ( ( error ) => {
            log.error ( "Error while changing item name in repo: ", error, entry.name, entry.profile_id, entry.category, entry.classification );
        } )
    if ( entry.cid && entry.cid.length > 0 ) {
        entry.category_id = entry.cid;
    }
    const itemStatusUpdatedForRedownloading = await Download_Manager.updateStatus ( entry )
        .catch ( ( error ) => {
            log.error ( "Error while updating status: ", error, entry.name, entry.profile_id, entry.category_id, entry.classification );
        } )

    if ( itemRenamedInRepo && itemStatusUpdatedForRedownloading.statusUpdated ) {
        mainWindow.webContents.send ( 'updateDMView', entry.uuid );
    }
}

const setItemAsInstalled = async ( entry, status, installationDate ) => {
    entry.status = status;
    entry.installation_date = installationDate;

    const itemInstalledInDestiny = await checkIfItemInstalledInDestiny ( entry )
        .catch ( ( error ) => {
            log.error ( "Error while checking if item has been installed in destiny: ", error, entry.name, entry.profile_id, entry.category, entry.classification );
        } )

    const itemSetAsInstalled = await Download_Manager.setItemAsInstalled ( entry )
        .catch ( ( error ) => {
            log.error ( "Error while updating item installation date: ", error, entry.name, entry.profile_id, entry.category, entry.classification );
        } )

    if ( itemInstalledInDestiny && itemSetAsInstalled.installed ) {
        mainWindow.webContents.send ( 'updateDMView', entry.uuid );
    } else {
        requeueMissingItemForDownload ( entry )
            .catch ( ( error ) => {
                log.error ( "Error while requeuing the missing item: ", error, entry.name, entry.profile_id, entry.category, entry.classification );
            } )
    }
}

const doStoreEmailInEmailManagerTable = ( event, emailObject ) => {
    delete emailObject.id;
    const createdEmail = {
        clientEmails: JSON.stringify ( emailObject.clientEmails ),
        uuid: emailObject.uuid,
        clientName: emailObject.clientName,
        clientEntity: emailObject.clientEntity,
        attachments: JSON.stringify ( emailObject.mailAttachments ),
        createdOn: emailObject.createdOn.toLocaleString (),
        sentOn: emailObject.sentOn,
        status: emailObject.status,
        message: emailObject.message
        //visitId: emailObject.visitId
    }

    dbMethod.insertIntoDatabase ( "emails_manager", createdEmail )
        .then ( () => {
            mainWindow.webContents.send ( 'emailStoredDone' );
        } )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while storing emails',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
}

const doChangeEmailStatus = ( event, object ) => {
    dbMethod.updateEmailStatus ( object.uuid, object.status )
        .then ( ( response ) => {
            if ( response ) {
                mainWindow.webContents.send ( 'emailMarkedSuccess', null );
            }
        } )
        .catch ( error => {
            mainWindow.webContents.send ( 'emailMarkedError', null );
            log.error ( "Error setting email as Sent: ", error );
        } );
}

const doDeleteEmailWithLogs = async ( event, object ) => {
    const deletedEmailWithLogs = await dbMethod.doDeleteItemWithUuid ( object )
        .catch ( ( error ) => {
            log.error ( "Error on doDeleteEmailWithLogs", error );
        } )
    log.info ( "Email with logs has not been sent and has been deleted from DB:", deletedEmailWithLogs, object.uuid )
}

const doStoreVisitInVisitsManagerTable = ( event, visitObject ) => {
    delete visitObject.id;
    const createdVisit = {
        clientEmails: JSON.stringify ( visitObject.clientEmails ),
        uuid: visitObject.uuid,
        clientName: visitObject.clientName,
        clientEntity: visitObject.clientEntity,
        attachments: JSON.stringify ( visitObject.attachments ),
        createdOn: visitObject.createdOn.toLocaleString (),
        dueOn: visitObject.dueOn.toLocaleString (),
        updatedOn: visitObject.updatedOn.toLocaleString (),
        status: visitObject.status,
        notes: visitObject.notes
    }

    dbMethod.insertIntoDatabase ( "visits_manager", createdVisit )
        .then ( () => {
            mainWindow.webContents.send ( 'visitStoredDone', createdVisit.uuid );
        } )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while storing visits',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
}

const doStartVisit = ( event, uuid ) => {
    const today = new Date ();
    const todayParsed = Date.parse ( today );
    let objectToSend = {
        status: "Started",
        updatedOn: todayParsed.toString (),
        uuid
    }
    dbMethod.doUpdateIntoDB ( "visits_manager", objectToSend )
        .then ( () => {
            dbMethod.getItemFromTable ( 'visits_manager', 'uuid', uuid )
                .then ( ( result ) => {
                    mainWindow.webContents.send ( 'startedVisit', result[0] );
                } )
                .catch ( ( error ) => {
                    mainWindow.webContents.send ( 'errorMessageOnMain', {
                        message: '"Error while starting selected visit',
                        error: error,
                        subject: 'Message from MAIN'
                    } );
                } )
        } )
        .catch ( ( error ) => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while updating visit to be started',
                error: error,
                subject: 'Message from MAIN'
            } );
        } )
}

const getVisitAttachments = ( event, options ) => {

    dbMethod.getItemFromTable ( "visits_manager", 'uuid', options.uuid )
        .then ( ( result ) => {
            let visitAttachmentsFromDB = result[0].attachments;
            let visitAttachments = JSON.parse ( visitAttachmentsFromDB )
            let attachmentsIds = visitAttachments.map ( item => item.uuid )
            delete options.uuid
            options.attachmentsIds = attachmentsIds
            return options;
        } )
        .then ( ( options ) => {
            dbMethod.getSearchedContent ( options )
                .then ( ( content ) => {
                    let attachmentToSent = content
                    mainWindow.webContents.send ( 'gotVisitAttachments', attachmentToSent );
                } )
        } )
        .catch ( ( error ) => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while getting visit content by uuid',
                error: error,
                subject: 'Message from MAIN'
            } );
        } )
}

const updateVisitAttachments = ( event, data ) => {
    const today = new Date ();
    const todayParsed = Date.parse ( today );
    let objectToSend = {
        attachments: JSON.stringify ( data.attachments ),
        updatedOn: todayParsed.toString (),
        uuid: data.uuid
    }
    dbMethod.doUpdateIntoDB ( "visits_manager", objectToSend )
        .then ( () => {
            mainWindow.webContents.send ( 'attachmentsUpdated' )
        } )
        .catch ( ( error ) => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while updating started visit attachments',
                error: error,
                subject: 'Message from MAIN'
            } );
        } )
}

const doFinishVisit = ( event, uuid ) => {

    let objectToSend = {
        status: "Made",
        uuid
    }
    dbMethod.doUpdateIntoDB ( "visits_manager", objectToSend ).then ( () => {
        mainWindow.webContents.send ( 'finishedVisit', uuid );
    } )
        .catch ( ( error ) => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while finishing started visit',
                error: error,
                subject: 'Message from MAIN'
            } );
        } )
}


const doProcessContentsDataFromJson = ( infoList ) => {

    //TODO: ADD a loop or map to iterate on infoArray so it can process data for each object (representing different profile) stored in JSON file
    return new Promise ( async ( resolve, reject ) => {
        for ( let info of infoList ) {

            try {
                const infoToProcess = {
                    profile: info.profile.id,
                    packages: info.data.packages,
                    categories: info.data.categories,
                    groups: info.data.groups,
                    usbInstallation: true,
                    firstInstallation: true,
                    newProfile: true
                }
                const profileInfo = info.profile;
                profileInfo.hash = info.data.hash;
                const profilesData = [].concat ( infoToProcess );
                const profileToProcess = [].concat ( profileInfo );
                const ProfileCreated = await Profile.create ( profileToProcess )
                    .catch ( ( error ) => log.error ( "error creating Profiles in DB on USb Installation ", error ) );
                if ( ProfileCreated ) {
                    const dataProcessed = await doProcessDataForUser ( null, profilesData )
                        .catch ( ( error ) => log.error ( "error processing data for user on USB Installation", error ) );
                    if ( dataProcessed )

                        if ( profileInfo.id.includes ( "uk_marketing" ) || profileInfo.id.includes ( "uk_sales" ) ) {
                            const info = {
                                key: "appLanguage",
                                value: "English-GB"
                            }
                            const settings = await setDefaultLanguageForProfile ( info )
                                .catch ( ( error ) => {
                                    mainWindow.webContents.send ( 'errorMessageOnMain', {
                                        message: '"Error while setting default language for Profile',
                                        error: error,
                                        subject: 'Message from MAIN'
                                    } );
                                } )
                            mainWindow.webContents.send ( 'receivedDefaultUserSettings', settings )
                        }
                    resolve ( true );
                }
            } catch ( error ) {
                log.error ( "Error on doProcessContentsDataFromJson: ", error );
                reject ( error );
            }

        }
        if ( isDev ) {
            console.info ( "doProcessContentsDataFromJson has finished successfully" );
        }
    } )
}

const doCopyFromUSBSourceFolder = ( item ) => {

    let fileSrc = normalize ( global.usbSourceFolderPath + "/" + item.profile_id + "/" + item.filename );
    const dirDest = normalize ( documentsFolder + "repo/" );
    let fileDest = normalize ( dirDest + "/" + item.route );
    if ( item.classification === 'visuals' ) {
        fileDest = normalize ( fileDest + ".zip" );
    }
    if ( item.classification === 'image' ) {
        fileDest = normalize ( fileDest + ".jpg" );
    }

    fs.copyFile ( fileSrc, fileDest, ( error ) => {
        if ( error ) {
            log.error ( 'Error detected for function doCopyFromUSBSourceFolder for copying a content from USB content folder to repo' );
            log.error ( 'Error while copying a content from USB content folder to repo: ', item.uuid, item.name, item.classification, item.profile_id, item.category_id, item.file_uuid, fileSrc, fileDest, item.route )
            throw error;
        } else {
            log.info ( "Copying from USB Folder has finished for file: ", item.filename, item.route )
            mainWindow.webContents.send ( 'onSystemAlready', item );
        }
    } );
}

const doUpdateConnectionStatus = ( event, isNetworkOn ) => {
    global.onlineStatus = isNetworkOn;
    if ( isDev ) {
        console.info ( global.onlineStatus ? "App is Online" : "App is Offline" );
    }
    global.onlineStatus ? mainWindow.webContents.send ( 'appIsOnline', global.onlineStatus ) : mainWindow.webContents.send ( 'appOffline', global.onlineStatus )
}

const doSentSignalForUninstalling = () => {
    mainWindow.webContents.send ( 'notifyUserAboutRestarting' );
}

const continueUninstallingProcess = ( event, lang ) => {
    mainWindow.webContents.send ( 'setUninstallingLang', lang );
    mainWindow.webContents.send ( 'startUninstallingProcess' );
}


const doRemoveResources = async () => {
    const repoFolder = normalize ( documentsFolder + "repo/" );
    let success;
    fs.readdir ( repoFolder, async ( err, files ) => {
        if ( files.length > 0 ) {
            for ( const file of files ) {
                if ( file !== "pdfjs.zip" ) {
                    let filePath = repoFolder + "/" + file;
                    const newFileNameArray = filePath.split ( '/' );
                    let renamedFileName = newFileNameArray[newFileNameArray.length - 1];
                    await fsp.unlink ( path.join ( repoFolder, renamedFileName ) )
                        .catch ( ( error ) => {
                            log.error ( 'Error while removing zip file ', renamedFileName, filePath, error );
                            mainWindow.webContents.send ( 'errorMessageOnMain', {
                                message: 'Error while removing zip file',
                                error: error,
                                subject: 'Message from MAIN'
                            } );
                            success = false;
                        } )
                    success = true;
                } else {
                    await fsp.unlink ( path.join ( repoFolder, file ) )
                        .catch ( ( error ) => {
                            log.error ( 'Error while removing zip file ', repoFolder, file, error );
                            mainWindow.webContents.send ( 'errorMessageOnMain', {
                                message: 'Error while removing zip file',
                                error: error,
                                subject: 'Message from MAIN'
                            } );
                            success = false;
                        } )
                    success = true;
                }
            }
        } else {
            success = true;
        }
        if ( success && success === true ) {
            chmodr ( documentsFolder, 0o777, async ( err ) => {
                if ( err ) {
                    log.error ( 'Failed to execute chmod', err );
                } else {
                    const resourcesRemoved = await fsHelper.removeFolder ( documentsFolder )
                        .catch ( ( error ) => {
                            log.error ( { error } );
                            mainWindow.webContents.send ( 'errorMessageOnMain', {
                                message: '"Error deleting resources folder on app uninstalling',
                                error: error,
                                subject: 'Message from MAIN'
                            } );
                        } )
                    if ( resourcesRemoved ) {
                        mainWindow.webContents.send ( 'resourcesFolderHasBeenRemoved' );
                    }
                }
            } );
        }
    } )
}

const doTruncateDatabase = async () => {

    //TRUNCATE ALL TABLES EXCEPT USERS_SETTINGS AND EMAILS_MANAGER
    await knex ( 'download_manager' ).truncate ()
        .catch ( ( error ) => {
            log.error ( "Error on download_manager truncate", error );
        } )

    await knex ( 'profiles_contents' ).truncate ()
        .catch ( ( error ) => {
            log.error ( "Error on profiles_contents truncate", error );
        } )
    await knex ( 'categories_contents' ).truncate ()
        .catch ( ( error ) => {
            log.error ( "Error on categories_contents truncate", error );
        } )
    await knex ( 'profiles' ).truncate ()
        .catch ( ( error ) => {
            log.error ( "Error on profiles truncate", error );
        } )
    await knex ( 'contents' ).truncate ()
        .catch ( ( error ) => {
            log.error ( "Error on contents truncate", error );
        } )
    await knex ( 'categories' ).truncate ()
        .catch ( ( error ) => {
            log.error ( "Error on categories truncate", error );
        } )

    await knex ( 'groups' ).truncate ()
        .catch ( ( error ) => {
            log.error ( "Error on groups truncate", error );
        } )
    await knex ( 'user_settings' ).where ( 'key', '=', "firstInstalling" ).update ( { value: "true" } )
        .catch ( ( error ) => {
            log.error ( "Error on updating user_setting first Installing value from false to true", error );
        } );
    await knex ( 'user_settings' ).where ( 'key', '=', "userProfile" ).update ( { value: '0' } )
        .catch ( ( error ) => {
            log.error ( "Error on updating user_setting userProfile value from previous one to 0", error );
        } )
    await knex ( 'user_settings' ).where ( 'key', '=', "userEmail" ).update ( { value: 'some@mail.com' } )
        .catch ( ( error ) => {
            log.error ( "Error on updating user_setting userEmail value from previous one to a fake one", error );
        } )
    mainWindow.webContents.send ( 'logoutForReinstallAll' );
}

const onGetLastInstallationInfo = async ( event, infoRequestedBy ) => {

    const pendingDownloads = await getPendingDownloads ()
        .catch ( ( error ) => {
            log.error ( "Error on getting pending downloads ", error )
        } )
    if ( Array.isArray ( pendingDownloads ) && pendingDownloads.length > 0 ) {
        const allProfiles = await Profile.all ()
            .catch ( ( error ) => {
                log.error ( "Error on Profile.find() ", error )
            } )
        for ( const profile of allProfiles ) {
            const pendingDownloadsForProfile = pendingDownloads.filter ( ( item ) => item.profile_id === profile.id )
            if ( pendingDownloadsForProfile.length > 0 ) {
                await alterProfileHash ( profile.id )
                    .catch ( ( error ) => log.error ( "Error on alterProfileHash method: ", error, profile.id ) )
            }
        }
        for ( const pendingDownload of pendingDownloads ) {
            await removeAllItemDataFromDb ( pendingDownload )
                .catch ( ( error ) => log.error (
                    "Error while removing all item data from DB: ", error
                ) )
        }
    }

    const lastInstallationInfo = await Profile.all ()
        .catch ( ( error ) => {
            log.error ( "Error on Profile.find() ", error )
        } )

    lastInstallationInfo.infoRequestedBy = infoRequestedBy;
    mainWindow.webContents.send ( 'lastInstallationDate', lastInstallationInfo );
}

const alterProfileHash = async ( profileId ) => {
    const profileHashData = {
        id: profileId,
        hash: "hash" + Date.now ()
    }
    await Profile.updateHash ( profileHashData )
        .catch ( ( error ) => {
            log.error ( "Error while altering Profile hash for profile: ", profileId, error );
        } )
}

const removeAllItemDataFromDb = async ( item ) => {
    await Profiles_Contents.deleteByProfileIdAndContentUUID ( item.profile_id, item.uuid )
        .catch (
            ( error ) => log.error (
                "Error on removing pending download item relantioship with profile", error, item.name, item.uuid, item.profile_id )
        )

    await Categories_Contents.deleteByContentUUIDAndCatId ( item.uuid, item.category_id )
        .catch (
            ( error ) => log.error (
                "Error on removing pending download item relantioship with categories", error, item.name, item.uuid, item.category_id )
        )
    if ( item.classification !== "image" ) {
        await Content.delete ( item.uuid )
            .catch (
                ( error ) => log.error (
                    "Error on removing pending download item from contents table", error, item.name, item.uuid, item.category_id )
            )
    }
    Download_Manager.deleteByProfileIdCategoryAndContentUUID ( item.profile_id, item.category_id, item.uuid )
        .catch ( ( error ) => log.error (
            "Error on removing pending download item from DM table", error, item.name, item.uuid, item.category_id )
        )
}

const onGetDefaultUserSettings = () => {
    dbMethod.doGetAllItemsFromTable ( 'user_settings' )
        .then ( ( response ) => {
            mainWindow.webContents.send ( 'receivedDefaultUserSettings', response )
        } )
        .catch ( ( error ) => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: 'Error on getting all items from user_settings',
                error: error,
                subject: 'Message from MAIN'
            } );
        } )
}

const onGetAppLanguage = () => {
    dbMethod.doGetAllItemsFromTable ( 'user_settings' )
        .then ( ( response ) => {
            let appLanguage = response
                .filter ( item => item.key === "appLanguage" )[0]
            mainWindow.webContents.send ( 'gotAppLanguage', appLanguage )
        } )
        .catch ( ( error ) => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: 'Error on getting app language from users settings',
                error: error,
                subject: 'Message from MAIN'
            } );
        } )
}

const doOnResetAppLanguage = ( event, langReady ) => {
    mainWindow.webContents.send ( 'appLanguageReset', langReady )
}

const setDefaultLanguageForProfile = async ( info ) => {
    const settingForLanguageUpdated = await dbMethod.updateUserSettings ()
        .catch ( ( error ) => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while updating userSettings',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
    if ( settingForLanguageUpdated ) {
        const settings = await dbMethod.doGetAllItemsFromTable ( 'user_settings' )
            .catch ( ( error ) => {
                mainWindow.webContents.send ( 'errorMessageOnMain', {
                    message: '"Error while receiving default userSettings',
                    error: error,
                    subject: 'Message from MAIN'
                } );

            } )
        return settings;
    }
}

function getOnlineStatus () {
    return new Promise ( ( resolve, reject ) => {

        if ( global.onlineStatus !== undefined ) {
            resolve ( global.onlineStatus )
        } else {
            reject ( "Error: Online Status not set" );
        }
    } )
}

const doCheckForPendingTasks = async () => {
    const result = await getPendingTasks ()
        .catch ( error => {
            log.error ( error );
        } )
    if ( result ) {
        let pendingTasksKeys = Object.keys ( result );
        if ( pendingTasksKeys.length > 0 ) {
            mainWindow.webContents.send ( 'gotPendingTaskList', result );
        } else {
            if ( isDev ) {
                console.info ( "No pending tasks " );
            }
        }
    }
}

const getPendingTasks = async function () {
    const failedDownloadsFromDB = await getFailedDownloads ()
        .catch ( ( error ) => {
            log.error ( "Error while failed downloads sent for pending tasks ", error );
        } )
    const pendingEmails = await getEmailsNotSent ()
        .catch ( ( error ) => {
            log.error ( "Error while getting email not sent for pending tasks ", error );
        } )

    const tasksPending = [];
    const failedDownloads = {
        key: "failedDownloads",
        value: failedDownloadsFromDB
    }
    const pendingMails = {
        key: "emails",
        value: pendingEmails,
    }

    if ( failedDownloads ) {
        tasksPending.push ( failedDownloads );
    }
    if ( pendingEmails ) {
        tasksPending.push ( pendingMails );
    }
    return tasksPending;
}


const getPendingDownloads = async () => {
    const uninstalledStatuses = [ "Download_Error", "Pending" ];
    const pendingDownloads = await Download_Manager.findWithStatuses ( uninstalledStatuses )
        .catch ( error => {
            mainWindow.webContents.send ( 'errorMessageOnMain', {
                message: '"Error while getting pending downloads list',
                error: error,
                subject: 'Message from MAIN'
            } );
        } );
    if ( pendingDownloads ) {
        return pendingDownloads;
    }
}

const getEmailsNotSent = async () => {
    const properties = `WHERE status = 'Not sent'`
    const pendingEmails = await dbMethod.doGetAllItemsFromTable ( "emails_manager", properties )
        .catch ( error => {
            log.error ( "Error while getting emails not sent from emails_manager table ", error );
        } );
    if ( pendingEmails ) {
        return pendingEmails;
    }
}

const setDownloadsErrorsAsReported = async () => {

    const itemsToBeSetAsReported = await Download_Manager.findWithStatus ( "Report_To_Backend" )
        .catch ( ( error ) => {
            log.error ( "Error on Download_Manager.findWithStatus(Report_To_Backend): ", error );
        } )

    for ( const item of itemsToBeSetAsReported ) {
        if ( item.status === "Report_To_Backend" ) {
            item.status = "Reported_To_Backend"
        }
        const itemUpdated = await Download_Manager.updateStatus ( item )
            .catch ( ( error ) => {
                log.error ( "Error on Download_Manager.updateStatus(item) for items with status Report_To_Backend: ", error );
            } )
        const { id, statusUpdated } = itemUpdated;
        log.info ( "Item status updated to Report_To_Backend: ", statusUpdated, id, item.uuid, item.name, item.sorting_name );
    }

}

const doSendToLogs = async ( event, data ) => {
    await logMethod.insert ( data )
        .catch ( ( error ) => {
            log.error ( "Error on logMethod.insert(data)", error );
        } )
    mainWindow.webContents.send ( 'sentToLogs', data );
}

const resetGlobalVisualSentList = () => {
    global.internalNavList = [];
}

const handleSendingInfoToRendererForVisualsNotCalc = ( info ) => {
    const globalInternalNavListLength = global.internalNavList.length;
    const lastItemInGINLIndex = globalInternalNavListLength - 1;
    switch ( true ) {
        case( global.internalNavList.length === 0 ):
        case( ( global.internalNavList.length > 0 ) && ( global.internalNavList[lastItemInGINLIndex].uuid === info.uuid )
            && ( global.internalNavList[lastItemInGINLIndex].scene !== info.scene ) ):
        case( ( global.internalNavList.length > 0 ) && ( global.internalNavList[lastItemInGINLIndex].uuid !== info.uuid ) ):
            if ( ( global.internalNavList.length > 0 ) && ( global.internalNavList[lastItemInGINLIndex].uuid !== info.uuid ) ) {
                info.value = "ACCESS";
            }
            mainWindow.webContents.send ( 'foundInfo', info );
            global.internalNavList.push ( info );
            break;
        default:
            if ( isDev ) {
                log.info ( "Another casuistic while sending visuals info to renderer for logs for info,  global.internalNavList: ",
                    info, global.internalNavList );
            }
            break;
    }
}

const getInfoType = ( type, contentInfo ) => {
    let typeToReturn = "";
    if ( ( type === "hypeviewer" ) || ( type === "pdfviewer" ) ) {
        typeToReturn = type;
    } else {
        if ( contentInfo.classification === "visuals" ) {
            typeToReturn = "hypeviewer";
        } else {
            typeToReturn = "pdfviewer";
        }
    }
    return typeToReturn;
}

const doGetMyInfo = async ( event, data ) => {
    if ( data ) {
        const { type, profile, group, scene, navigation, pdfType } = data;
        const contentInfoList = await Content.findMyInfo ( data )
            .catch ( ( error ) => {
                log.error ( "Error on Content.findMyInfo(data) ", error );
            } )

        const contentInfo = contentInfoList[0];
        if ( contentInfo ) {
            const typeToSend = getInfoType ( type, contentInfo );
            const info = {
                uuid: contentInfo.uuid,
                type: typeToSend,
                profile,
                group,
                category: contentInfo.id,
                id: contentInfo.route,
                scene: scene ? scene : "HOME",
                name: contentInfo.name,
                parentContentId: contentInfo.parent_content_id ? contentInfo.parent_content_id : "",
                businessUnitId: contentInfo.business_unit_id ? contentInfo.business_unit_id : "",
                navigation,
                pdfType
            }

            switch ( true ) {
                case ( contentInfo.tid === "calculators" ):
                    if ( global.internalNavList.length > 0 ) {
                        global.internalNavList.push ( info );
                    }
                    info.value = "ACCESS";
                    mainWindow.webContents.send ( 'calcTypeFound', contentInfo.uuid );
                    mainWindow.webContents.send ( 'foundInfo', info );
                    break;
                case  ( contentInfo.classification === "library" ):
                    if ( global.internalNavList.length > 0 ) {
                        global.internalNavList.push ( info );
                    }
                    info.value = "ACCESS";
                    mainWindow.webContents.send ( 'foundInfo', info );
                    break;
                default:
                    handleSendingInfoToRendererForVisualsNotCalc ( info );
                    break;
            }
        }
    }
}

const doGetMyAttachmentInfo = ( event, data ) => {
    Content.findMyAttachmentInfo ( data )
        .then ( ( result ) => {
            const resultPath = result[0].route
            const info = {
                uuid: result[0].uuid,
                name: result[0].name,
                id: result[0].route,
                icon: result[0].icon.toUpperCase (),
                type: result[0].tid,
                path: resultPath
            }
            mainWindow.webContents.send ( 'foundAttachmentInfo', info );
        } )
        .catch ( ( error ) => {
            log.error ( 'Error while searching for myAttachmentInfo', error )
        } )
        .catch ( ( error ) => {
            log.error ( error )
        } )

}

const doSendPendingLogs = () => {
    logMethod.sendToSync ()
        .then ( data => {
            mainWindow.webContents.send ( 'gotPendingLogs', data )
        } )
        .catch ( ( error ) => {
            log.error ( "Error sending pending logs ", error )
        } )
}

const doUpdateSyncedLogs = ( event, ids ) => {
    logMethod.updateSyncedLogs ( ids )
        .catch ( ( error ) => {
            log.error ( error );
        } )
}

const saveCalcOutput = ( event, info ) => {
    const { filename, calcOutput, pid, group, category, id, uuid } = info;
    const path = documentsFolder + "output/" + uuid + "/" + filename;
    const image = "/" + id;
    const dirDest = documentsFolder + "output/" + uuid + "/";
    fsHelper.doCreateFolder ( dirDest )
        .then ( () => {
            let buff = new Buffer ( calcOutput, 'base64' );
            fs.writeFileSync ( path, buff );
        } )
        .then ( async () => {
            const clonedContents = [
                {
                    uuid,
                    name: filename,
                    sorting_name: id,
                    classification: "output",
                    mimetype: "PDF",
                    image: image,
                    route: id,
                    date_created: new Date ().toLocaleString (),
                    version: 0,
                    published: 0,
                    visible: 0,
                    sendable: 1,
                    deleted: 0,
                    sorting_number: -1,
                    tid: "calculator"
                }
            ]
            let resolvedOutput = await Calculator.create ( { clonedContents } )
                .catch ( ( error ) => {
                    log.error ( "Error on inserting output data into contents ", error );
                } )
            if ( resolvedOutput ) {
                return uuid;
            }
        } )
        .then ( async ( uuid ) => {
            const userProfile = pid;
            //TODO CHECK this when we use Calculator entity
            const clonedContents = [
                {
                    uuid
                }
            ]
            let resolvedOutputProfile = await Profiles_Calculators.create ( { clonedContents, userProfile } )
                .catch ( ( error ) => {
                    log.error ( "Error on inserting output relationship into profiles_contents ", error );
                } )
            if ( resolvedOutputProfile ) {
                return uuid;
            }
        } )
        .then ( async ( uuid ) => {
            const categoriesData = [
                {
                    id: category,
                    contents: [ uuid ]
                }
            ]
            let resolvedCategoriesOutput = await Categories_Calculators.create ( categoriesData )
                .catch ( ( error ) => {
                    log.error ( "Error on inserting output relationship into categories_contents ", error );
                } )
            let contentOutput = await Content.find ( uuid )
                .catch ( ( error ) => {
                    log.error ( "Error on retrieving created output from contents", error );
                } )
            if ( resolvedCategoriesOutput && contentOutput ) {
                let itemToAttach = {};
                itemToAttach.uuid = uuid;
                itemToAttach.name = filename;
                itemToAttach.id = contentOutput[0].id;
                itemToAttach.icon = 'CALC';
                itemToAttach.type = 'calculator';
                itemToAttach.path = path;
                itemToAttach.sorting_name = id;
                itemToAttach.pid = pid;
                itemToAttach.group = group;
                itemToAttach.category = category;
                itemToAttach.b64 = calcOutput;
                //itemToAttach.dataURL = "data:application/pdf;base64," + calcOutput;
                return itemToAttach;
            }
        } )
        .then ( ( itemToAttach ) => {
            mainWindow.webContents.send ( 'calcOutputStoredInDB', itemToAttach )
        } )
        .catch ( ( error ) => {
            log.error ( "Error while creating destination directory for output attachment", error )
        } )
}

const discardCalcOutput = ( event, data ) => {
    const { uuid, name } = data;
    const path = documentsFolder + "output/" + uuid + "/" + name;
    const dirDest = documentsFolder + "output/" + uuid + "/";

    Calculator.delete ( uuid )
        .then ( () => {
            fs.removeSync ( path )
            if ( dirDest !== undefined ) {
                fs.rmdir ( dirDest, function ( err ) {
                    if ( err ) {
                        throw err;
                    } else {
                        if ( isDev ) {
                            console.info ( "Successfully removed the empty directory: ", dirDest );
                        }
                    }
                } )
            }
            return uuid;
        } )
        .catch ( ( error ) => {
            log.error ( 'Error while deleting item with content_id ' + content_UUID + ' from profiles_contents table! ', error );
        } )

}

const doGetFirstCategories = async ( event, profile ) => {
    let result = await dbMethod.getFirstCategories ( profile )
        .catch ( ( error ) => {
            log.error ( "Error while getting first categories for Home page ", error );
        } );
    const groupsProfilesAssignationsList = groupsProfilesAssignations.list;

    const groupsForProfile = groupsProfilesAssignationsList
        .filter ( ( el ) => el.profileId === profile )
        .map ( ( item ) => item.groupId );

    const resultToReturn = result.filter ( ( item ) => groupsForProfile.includes ( item.groups_id ) );
    mainWindow.webContents.send ( 'gotFirstCategories', resultToReturn );
}

const doResetFirstInstallingInSettings = async ( event, info ) => {
    const firstInstallingReset = await dbMethod.updateUserSettings ( info.key, info.value )
        .catch ( ( error ) => {
            log.error ( 'Error on dbMethod.updateUserSettings(info.key, info.value) for function doResetFirstInstallingInSettings', error, info.key, info.value )
        } )
    if ( firstInstallingReset ) {
        const data = "true";
        mainWindow.webContents.send ( 'onResetFirstInstalling', data )
    }
}


const doProcessProfileOnMain = async ( event, data ) => {

    const { profiles, infoRequestedBy } = data;
    let profilesToSend;
    const profilesFromDB = await Profile.all ()
        .catch ( ( error ) => {
            log.error ( " Error on Profile.all()", error );
        } )
    const profilesFromBackendIds = ( profiles && ( Array.isArray ( profiles ) ) && ( profiles.length > 0 ) ) ? profiles.map ( ( profile ) => profile.id ) : [];
    const profilesFromDBIds = ( profilesFromDB && ( Array.isArray ( profilesFromDB ) ) && ( profilesFromDB.length > 0 ) ) ? profilesFromDB.map ( ( DBprofile ) => DBprofile.id ) : [];
    if ( profilesFromDB.length === 0 ) {
        await Profile.create ( profiles )
            .catch ( ( error ) => {
                log.error ( " Error on Profile.create()", error );
            } );
        profilesToSend = await Profile.all ()
            .catch ( ( error ) => {
                log.error ( " Error on Profile.all()", error );
            } )
    } else {

        //I. DELETING PROFILE, ITS RELATIONS, CONTENTS AND FILES
        let deletedProfilesDataFromDB = [];
        let profileIDForDeleting = "";

        for ( const profileFromDB of profilesFromDB ) {
            if ( !profilesFromBackendIds.includes ( profileFromDB.id ) ) {
                profileIDForDeleting = profileFromDB.id;
                //1. DELETE all entries for this profile from download_manager table

                const deletedEntriesFromDMForProfile = await Download_Manager.deleteByProfileId ( profileFromDB.id )
                    .catch ( ( error ) => {
                        log.error ( 'Error on Download_Manager.deleteByProfileId(profileId) ', error );
                    } );

                //2. DELETE all entries for this profile from profiles_contents table

                const contentsUUIdsForProfile = await Profiles_Contents.findByProfileId ( profileFromDB.id )
                    .catch ( ( error ) => {
                        log.error ( 'Error on Profiles_Contents.findByProfileId(profileFromDB.id ) ', error );
                    } );

                const deletedEntriesFromProfilesContents = await Profiles_Contents.deleteByProfileId ( profileFromDB.id )
                    .catch ( ( error ) => {
                        log.error ( 'Error on Profiles_Contents.deleteByProfileId(profileFromDB.id) ', error );
                    } );

                //3. Delete all contents from categories contents and contents table if required

                for ( const item of contentsUUIdsForProfile ) {
                    const contentInContentsProfiles = await Profiles_Contents.findByContentUUID ( item.content_UUID )
                        .catch ( ( error ) => {
                            log.error ( 'Error on Profiles_Contents.findByContentUUID(item.content_UUID) ', error );
                        } )

                    if ( contentInContentsProfiles.length === 0 ) {
                        const contentDeletedFromCatContents = await Categories_Contents.deleteByContentUUID ( item.content_UUID )
                            .catch ( ( error ) => {
                                log.error ( 'Error on  Categories_Contents.deleteByContentUUID(item.content_UUID) ', error );
                            } )
                        //4. Delete all contents files if the contents no longer exists for any other profile
                        if ( contentDeletedFromCatContents.removed ) {
                            await deleteContentsAndItsFiles ( item.content_UUID )
                                .catch ( ( error ) => {
                                    log.error ( "Error in function deleteContentsAndItsFiles() ", error );
                                } )
                        }
                    }
                }

                //5. Delete the profile from profile table
                const deletedProfile = await Profile.delete ( profileFromDB.id )
                    .catch ( ( error ) => {
                        log.error ( 'Error on Profile.delete(profileFromDB.id) ', error );
                    } )
                deletedProfile.id = profileFromDB.id;
                deletedProfilesDataFromDB.push ( deletedEntriesFromDMForProfile, deletedEntriesFromProfilesContents, deletedProfile );
                mainWindow.webContents.send ( 'updateProfilesBeforeUpdating', profileFromDB.id );
            }
        }

        //II. Inserting a newly added profile when there is already at least one profile installed
        if ( profiles && ( Array.isArray ( profiles ) ) && ( profiles.length > 0 ) ) {
            for ( const profileFromBack of profiles ) {
                if ( !profilesFromDBIds.includes ( profileFromBack.id ) ) {
                    await Profile.create ( [ profileFromBack ] )
                        .catch ( ( error ) => {
                            log.error ( " Error on Profile.create()", error );
                        } );
                }
            }
        }

        profilesToSend = await Profile.all ()
            .catch ( ( error ) => {
                log.error ( " Error on Profile.all()", error );
            } )
    }

    // Check if profilesToSend is an Array, then, send the processed profiles back to Renderer
    if ( Array.isArray ( profilesToSend ) ) {
        const dataProfiles = {
            profiles: profilesToSend,
            infoRequestedBy
        }
        mainWindow.webContents.send ( 'gotProcessedProfiles', dataProfiles );
    }
}

const doUpdateProfilesData = async ( event, data ) => {

    const updatedProfiles = await Profile.updateInBulk ( data )
        .catch ( ( error ) => {
            log.error ( " Error on Profile.updateInBulk()", error );
        } )
    if ( updatedProfiles ) {
        if ( isDev ) {
            console.info ( "Profiles updated", updatedProfiles );
        }
    }
}

const doSetItemAsNotInstalled = async ( event, data ) => {
    let process = data.status === 'Download_Error' ? "Downloading" : "Installing";
    const setItemAsNotInstalled = await Download_Manager.updateStatus ( data )
        .catch ( ( error ) => {
            log.error ( "Error for static method Download_Manager.updateStatus(data) on setting item status as Not_Installed on failed installation", error );
            log.error ( "Error on updating items status on failed " + process + " for: ", data.uuid, data.name, data.profile_id, data.category_id, data.classification, data.file_uuid );
        } )
    const { id, statusUpdated } = setItemAsNotInstalled;
    if ( statusUpdated ) {
        log.info ( 'Item ' + data.uuid + " " + data.name + " " + data.profile_id + " " + data.category_id + " " + data.classification + "set as " + data.status + "on failed " + process );
    }
}

const clearRepoFolder = async () => {
    const repoFolder = normalize ( documentsFolder + "repo/" );

    fs.readdir ( repoFolder, async ( err, files ) => {

        for ( const file of files ) {
            if ( file !== 'pdfjs.zip' ) {
                const fileToRemove = {
                    filePath: documentsFolder + "repo/" + file,
                    filename: file,
                    dir: documentsFolder + "repo/"
                }
                const { filePath } = fileToRemove;
                await fsHelper.removeFile ( fileToRemove )
                    .catch ( ( error ) => {
                        log.error ( "Error removing file with path", filePath, error );
                        log.error ( "Error removing file with path", filePath, error );
                    } )
            }
        }
        return true;
    } );
}

const doRestartApp = () => {
    app.relaunch ();
    app.exit ();
}

const doCheckIfRepoEmptyForProfile = async ( event, profile ) => {
    const pathToCheck = normalize ( documentsFolder + "repo/" )
    const emptyRepoForProfile = await fs.emptyDir ( pathToCheck )
        .catch ( ( error ) => {
            log.error ( "Error while trying to remove files from repo for profile: ", profile, error );
        } );
    if ( emptyRepoForProfile ) {
        log.info ( "Success removing files that haven't been deleted from repo for profile " + profile + " after 1st installation" );
    }
}

const checkIfThisIsFirstInstallation = async () => {
    const firstInstallationFromSettings = await dbMethod.getFirstInstallationValue ()
        .catch ( ( error ) => {
            log.error ( error );
        } )
    const contentFromDM = await Download_Manager.all ()
        .catch ( ( error ) => {
            log.error ( error );
        } )
    const profilesInstalled = await Profile.all ()
        .catch ( ( error ) => {
            log.error ( error );
        } )

    switch ( true ) {
        case ( ( firstInstallationFromSettings === "true" ) && ( contentFromDM.length === 0 ) && ( profilesInstalled.length === 0 ) ):
            mainWindow.webContents.send ( 'isFirstInstallation' );
            log.info ( "This is the first installation, the user does not have profiles or contents" );
            break;
        case ( ( firstInstallationFromSettings === "false" ) && ( contentFromDM.length > 0 ) && ( profilesInstalled.length > 0 ) ):
            log.info ( "This is not first installation, the user has profiles, reinstalling after migrations could be due" )
            break;
        case( firstInstallationFromSettings === "true" && ( contentFromDM.length > 0 ) && ( profilesInstalled.length > 0 ) ) :
            const updatedSettings = await dbMethod.updateUserSettings ( 'firstInstalling', 'false' )
                .catch ( ( error ) => {
                    log.error ( "Error while updating user settings for firstInstalling after checking that it's not the 1st installation", error )
                } );
            log.info ( "updatedSettingsFor1stInstalling: are", updatedSettings )
            mainWindow.webContents.send ( 'onFinishedConfirmInitialSetup', updatedSettings );
            break;
        default:
            log.info ( "Another case for  checkIfThisIsFirstInstallation function ! " )
            log.info ( "firstInstallationFromSettings, contentFromDM and profilesInstalled length are: ", firstInstallationFromSettings, contentFromDM.length, profilesInstalled.length )
            break;
    }
}

const doResentUpdatedHashDataForProfiles = async ( event, hashData ) => {
    if ( mainWindow ) {
        mainWindow.webContents.send ( 'resentUpdatedHashDataForProfile', hashData );
    } else {
        log.error ( "Electron main window is null on doResentUpdatedHashDataForProfiles" );
    }
}

const doGetUserProfilesOnUSBInstallation = async () => {
    const usbProfilesForUser = await Profile.all ()
        .catch ( ( error ) => {
            log.error ( "Error while getting profiles for user on USBinstallation", error )
        } );
    if ( isDev ) {
        console.info ( { usbProfilesForUser } );
    }
    mainWindow.webContents.send ( 'gotProfilesFromUSB', usbProfilesForUser );

}

const doSetItemAsNotNew = async ( event, data ) => {
    const itemSetAsNotNew = await Download_Manager.updateItemPackageDate ( data )
        .catch ( ( error ) => {
            log.error ( "Error on Download_Manager.updateItemPackageDate (data)", error )
        } )
    if ( itemSetAsNotNew.successful ) {

        mainWindow.webContents.send ( 'resetView' );
    }
}


const getAllDocumentTypesForProfile = async ( event, profile ) => {
    const allDBContentTypesForProfileFullData = await Content.findAllContentTypesForProfile ( profile )
        .catch ( ( error ) => {
            log.error ( "Error on Content.findAllContentTypesForProfile(data.profile)", error );
        } )

    mainWindow.webContents.send ( 'gotAllDocumentTypesForProfile', allDBContentTypesForProfileFullData );
}

const getAllGroupsForProfile = async ( event, profile ) => {
    const allGroupsForProfile = await Group.findAllGroupsForProfile ( profile )
        .catch ( ( error ) => {
            log.error ( "Error on Content.findAllContentTypesForProfile(data.profile)", error );
        } )
    if ( isDev ) {
        console.info ( { allGroupsForProfile } )
    }

    mainWindow.webContents.send ( 'gotAllGroupsForProfile', allGroupsForProfile );
}

const setCurrentAppVersionGlobally = async ( event, version ) => {
    global.appVersion = version;
}

const deleteFileForDeletedContent = async ( fileForDeleting ) => {
    const pathForDeletingContent = normalize ( documentsFolder + "/" + fileForDeleting[0].classification + "/" + fileForDeleting[0].route );
    let fileData = {
        filePath: pathForDeletingContent,
        fileClassification: fileForDeleting[0].classification,
        filename: fileForDeleting[0].route,
        dir: normalize ( documentsFolder + "/" + fileForDeleting[0].classification )
    }
    if ( fileForDeleting[0].classification === "visuals" ) {

        const pathForDeletingImage = documentsFolder + "/image/" + fileForDeleting[0].route;
        const deletedVisualContent = await fsHelper.removeFile ( fileData )
            .catch ( ( error ) => {
                log.error ( "Error while removing visual folder)", error )
            } )

        if ( deletedVisualContent ) {
            fileData.filePath = pathForDeletingImage;
            fileData.fileClassification = "image"
            const deletedImage = await fsHelper.removeFile ( fileData )
                .catch ( ( error ) => {
                    log.error ( "Error while removing image for deleted visual)", error )
                } )
            return deletedImage;
        }
    } else {
        const deletedLibraryContent = await fsHelper.removeFile ( fileData )
            .catch ( ( error ) => {
                log.error ( "Error while removing visual folder)", error )
            } )
        return deletedLibraryContent;
    }
}

const updateGroupData = async ( groupDataForUpdating ) => {
    const { group } = groupDataForUpdating;

    const updatedGroup = await Group.update ( group )
        .catch ( ( error ) => {
            log.error ( "error on Group.update(group) ", error );
        } )
    return updatedGroup === 0;
}

const updateCategoryData = async ( categoryDataForUpdating ) => {
    const { category } = categoryDataForUpdating;
    const updatedCategory = await Category.update ( category )
        .catch ( ( error ) => {
            log.error ( "error on Group.updateGroupSortingNumber(dbGroup) ", error );
        } );
    return updatedCategory === 0;
}

const deleteContentsAndItsFiles = async ( uuid ) => {
    let deletedContent;
    const fileForDeleting = await Content.find ( uuid )
        .catch ( ( error ) => {
            log.error ( "Error while getting all contents to be deleted by Contents.find(catContent.content_UUID)", error );
        } )
    if ( ( fileForDeleting && fileForDeleting.length === 1 ) &&
        ( fileForDeleting[0].classification && fileForDeleting[0].route ) ) {
        deletedContent = await Content.delete ( fileForDeleting[0].uuid )
            .catch ( ( error ) => {
                log.error ( "Error while deleting all contents by Contents.delete(catContent.content_UUID)", error );
            } )
    }

    if ( deletedContent === 0 ) {
        const deletedFileForContent = await deleteFileForDeletedContent ( fileForDeleting )
            .catch ( ( error ) => {
                log.error ( "Error while deleting file for deleted content", error );
            } )
        if ( isDev ) {
            console.info ( { deletedFileForContent } );
        }
    }
}

const removeUniqueNameGroupConstraint = async () => {
    const uniqueNameGroupRemoved = await dbMethod.removeGroupsUniqueName ()
        .catch ( ( error ) => {
            log.error ( "Error while executing dbMethod.removeGroupsUniqueName()", error );
        } )
    log.info ( {
        uniqueNameGroupRemoved
    } )
}
