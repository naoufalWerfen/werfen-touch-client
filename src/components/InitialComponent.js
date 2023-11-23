// noinspection JSUnresolvedVariable

import React, { useEffect, useState } from 'react';
import isElectron from "is-electron";
import { connect } from "react-redux";
import {
    getDataFromAPI,
    logoutOnUpdateProfilesError,
    sendToLogs,
    setIntervalAndExecute,
    updateProfiles
} from "../constants/functions";
import {
    addAllUpdatesPending,
    addDownloadQueue,
    addToBufferQueue,
    deleteFromDownloadQueue,
    deleteFromUnzipQueue,
    resetBufferQueue,
    switchQueue
} from "../redux/actions/manageDownloading";
import Stage from "./Stage";
import UpdateScreen from "./UpdateScreen/UpdateScreen";
import Login from "./Login/Login";
import Pin from "./Pin/Pin";
import {
    setAppLangReady,
    setAppPhase,
    setAvailableProfiles,
    setProfile,
    setWebInstallation
} from "../redux/actions/settings";
import InitialSettings from "./InitialSettings/InitialSettings";
import { setNavigationItem } from "../redux/actions/navigation";
import { useHistory, withRouter } from "react-router-dom";
import USBScreen from "./USBScreen/USBScreen";
import UninstallingScreen from "./UninstallingScreen/UninstallingScreen";
import { setNotificationData } from "../redux/actions/notifications";
import { setShow } from "../redux/actions/modals";
import { useTranslation } from "react-i18next";
import VisitStage from "./VisitStage";
import { setNewVisit, setStartedVisitId } from "../redux/actions/visitEditor";
import { addToMailAttachments, removeFromMailAttachments, setNewEmail } from "../redux/actions/emailEditor";
import EmailEditor from "./EmailEditor/EmailEditor";
import { SOFTWARE_CHECK_UPDATE_INTERVAL } from '../constants/AppData';
import pkg from "../../package.json"
import useWindowSize from "../hooks/useWindowSize";
import useZoomFactor from "../hooks/useZoomFactor";
import { setAllContentTypesForProfile, setAllGroupsForProfile } from "../redux/actions/processData";
import ConfirmationDialog from "./ConfirmationDialog/ConfirmationDialog";
import { alert } from "react-custom-alert";


//import { saveAs } from "file-saver";

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;
const {
    START_NOTIFICATION_SERVICE,
} = require ( 'electron-push-receiver/src/constants' )

const InitialComponent = ( props ) => {
    const { t } = useTranslation ();
    const [ firstDownloadRunFlag, setFirstDownloadRunFlag ] = useState ( true );
    const [ firstUnzipRunFlag, setFirstUnzipRunFlag ] = useState ( true );
    const [ installing, setInstalling ] = useState ( false );
    const [ preparingData, setPreparingData ] = useState ( false );
    const [ userLoggedOut, setLoggedOut ] = useState ( false );
    // const [ tokenExists, setTokenExists ] = useState( false );
    const [ availableProfiles, setAvailableProfilesForUser ] = useState ( [] );
    const [ downloadData, setDownloadData ] = useState ( {} );
    const [ dataForInstallation, setDataForInstallation ] = useState ( [] );
    const [ updateNotificationRead, setNotificationRead ] = useState ( false );
    const [ hashData, setHashData ] = useState ( [] );
    const [ profilesLength, setProfilesLength ] = useState ( 0 );
    const [ solo, setSolo ] = useState ( false );
    const [ showPopUp, setShowPopUp ] = useState ( false );
    const [ installAppUpgradeLater, setInstallAppUpgradeLater ] = useState ( false )
    const [ newReleaseInfo, setReleaseInfo ] = useState ( {} );
    const [ notAfterLogin, setNotAfterLogin ] = useState ( true );
    const token = localStorage.getItem ( "token" );
    const tokenProfile = localStorage.getItem ( "tokenProfile" );
    const loggedOut = localStorage.getItem ( "loggedOut" );
    const activeVisitId = localStorage.getItem ( "activeVisitId" ) || "";
    let firstInstallation = JSON.parse ( localStorage.getItem ( 'firstInstallation' ) ) || {};

    const { width, height } = useWindowSize ();
    const { zoomFactor } = useZoomFactor ();
    const history = useHistory ();
    let userProfiles = [];
    const pkgVersionToCompare = pkg.version.split ( '-' )[0];
    const titleNotification = t ( "Important update notification" )
    const messageArrayNotification = [
        installAppUpgradeLater === false ? t ( "Important update has been published" ) : t ( "New app version published" ),
        installAppUpgradeLater === false ? t ( "Info about update duration" ) : t ( "Actualization downloads after click on button" ),
        installAppUpgradeLater === false ? t ( "Update connection recommendation info" ) : t ( "Actualizations installs after restart" ),
        installAppUpgradeLater === false ? t ( "Update process warnings" ) : t ( "Actualization installs automatically" )
    ]

    const displayAlert = ( data ) => alert ( { message: data.message, type: data.type } );
    const conditionForDisplayingProfileName = ( props.appPhase === "readyToUse" ) &&
        ( props.availableProfiles && props.availableProfiles.length > 1 ) &&
        ( !window.location.href.includes ( "hypeviewer" ) ) &&
        ( !window.location.href.includes ( "pdfviewer" ) ) &&
        ( !window.location.href.includes ( "settings" ) ) &&
        ( props.navigationItem !== 3 )

    const logEntry = {
        profileId: localStorage.getItem ( "tokenProfile" ),
        userId: localStorage.getItem ( "userEmail" ),
        severity: "log",
        visitId: props.startedVisitId ? props.startedVisitId : "",
    }

    useEffect ( () => {
        initialize ()
            .catch ( ( error ) => {
                console.error ( "Error on function initialize()", error );
            } );


        ipcRenderer.on ( 'sentUpdateForDownloading', showAppActualizationPopUp );
        ipcRenderer.once ( 'isFirstInstallation', () => {
            props.setAppPhase ( 'installLobby' );
        } );
        ipcRenderer.on ( 'reinstallAfterMigration', doReinstallAfterMigration );
        ipcRenderer.on ( 'removeUniqueNameGroupConstraint', () => {
            ipcRenderer.send ( 'removeUniqueNameGroupConstraint' )
        } )

        ipcRenderer.on ( 'migrationExecuted', onMigrationExecuted );
        ipcRenderer.on ( 'setInstallingFromWeb', onSetInstallingFromWeb );
        ipcRenderer.on ( 'foundInfo', onFoundInfo );
        ipcRenderer.on ( 'calcTypeFound', setCalcUuid );
        ipcRenderer.on ( 'calcOutputStoredInDB', setEmailDraft );
        ipcRenderer.on ( 'updateProfilesBeforeUpdating', doUpdateProfilesBeforeUpdating );
        ipcRenderer.on ( 'startProcessingData', onStartProcessingData )
        ipcRenderer.on ( 'gotProcessedProfiles', onProfilesProcessed );
        ipcRenderer.on ( 'finishedProcessingDataForUser', onFinishedProcessingDataForUser );
        window.addEventListener ( 'createNewEmailDraft', createNewDraft, false );
        window.addEventListener ( 'createNewVisitDraft', createNewVisitDraft, false );
        ipcRenderer.on ( "downloadProgress_EDM", onDownloadProgress_EDM );
        ipcRenderer.on ( 'onLoginFinished', doOnLoginFinished );
        ipcRenderer.on ( 'itemWithUnzipErrorToInstallAgain', putFailedItemAsLastInUzipQueue );
        ipcRenderer.on ( 'gotAllDocumentTypesForProfile', setAllDocTypesForProfile );
        ipcRenderer.on ( 'gotAllGroupsForProfile', setAllGroupsForProfile );

        return () => {
            ipcRenderer.off ( 'sentUpdateForDownloading', showAppActualizationPopUp );
            ipcRenderer.off ( 'isFirstInstallation', () => {
                props.setAppPhase ( 'installLobby' );
            } );
            ipcRenderer.off ( 'reinstallAfterMigration', doReinstallAfterMigration );
            ipcRenderer.off ( 'removeUniqueNameGroupConstraint', () => {
                ipcRenderer.send ( 'removeUniqueNameGroupConstraint' )
            } )
            ipcRenderer.off ( 'migrationExecuted', onMigrationExecuted );
            ipcRenderer.off ( 'setInstallingFromWeb', onSetInstallingFromWeb );
            ipcRenderer.off ( 'foundInfo', onFoundInfo );
            ipcRenderer.off ( 'calcTypeFound', setCalcUuid );
            ipcRenderer.off ( 'calcOutputStoredInDB', setEmailDraft );
            ipcRenderer.off ( 'updateProfilesBeforeUpdating', doUpdateProfilesBeforeUpdating );
            ipcRenderer.off ( 'startProcessingData', onStartProcessingData )
            ipcRenderer.off ( 'gotProcessedProfiles', onProfilesProcessed );
            ipcRenderer.off ( 'finishedProcessingDataForUser', onFinishedProcessingDataForUser );
            window.removeEventListener ( 'createNewEmailDraft', createNewDraft, false );
            window.removeEventListener ( 'createNewVisitDraft', createNewVisitDraft, false );
            ipcRenderer.off ( 'downloadProgress_EDM', onDownloadProgress_EDM )
            ipcRenderer.off ( 'onLoginFinished', doOnLoginFinished );
            ipcRenderer.off ( 'itemWithUnzipErrorToInstallAgain', putFailedItemAsLastInUzipQueue );
            ipcRenderer.off ( 'gotAllDocumentTypesForProfile', setAllDocTypesForProfile );
            ipcRenderer.off ( 'gotAllGroupsForProfile', setAllGroupsForProfile );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    useEffect ( () => {

        if ( ( props.appPhase === "readyToUse" ) && notAfterLogin ) {
            const infoRequestedBy = "requestedByApp";
            updateProfiles ( infoRequestedBy )
                .catch ( ( error ) => {
                    if ( ( error === "Invalid JWT Token" ) || ( error === "Wrong user profile(s) in the app" ) ) {
                        const alertData = {
                            message: ( error === "Invalid JWT Token" ) ? t ( "Session expired" ) : t ( "Wrong user profiles" ),
                            type: "error"
                        }
                        const setAppToLogin = () => props.setAppPhase ( 'login' );
                        const info = {
                            alertData,
                            error,
                            displayAlert,
                            isOnline: props.networkOnline,
                            setAppToLogin
                        }
                        logoutOnUpdateProfilesError ( info );
                    }
                    console.error ( { error } );
                } );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.appPhase, notAfterLogin ] );


    useEffect ( () => {

        /// PROCESS DOWNLOAD QUEUE

        const { downloadQueue } = props;

        /// SEND DOWNLOAD QUEUE TO BUFFER UNTIL LAST ITEM
        if ( downloadQueue.length > 0 ) {
            setInstalling ( true );
            //console.info( "Downloading is: ", downloading )
            //console.info( "ipcRenderer sends message 'onSendToDownloadQueueFinished' and downloadQueue: ", downloadQueue )
            ipcRenderer.send ( 'onSendToDownloadQueueFinished', downloadQueue )
        } else {
            //setDownloading( false );
        }

        /// STOP DOWNLOAD & SEND BUFFER TO UNZIP QUEUE
        if ( downloadQueue.length === 0 && firstDownloadRunFlag === false ) {
            props.switchQueue ();
            setInstalling ( true );
        } else {
            setFirstDownloadRunFlag ( false );
        }

        /// UPDATE WHEN THIS UPDATES
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.downloadQueue ] );

    useEffect ( () => {
        /// PROCESS UNZIP QUEUE
        const { unzipQueue } = props;
        let firstInstallationDone = localStorage.getItem ( 'firstInstallationDone' ) || ""
        if ( ( props.appPhase === "login" && firstInstallationDone !== "true" && firstInstallation.usbInstallation === false ) || ( props.appPhase === "usbInstallation" && firstInstallation.usbInstallation === true ) ) {
            props.setAppPhase ( 'firstContentInstallation' )
        } else if ( props.appPhase === "login" && firstInstallationDone === "true" ) {
            setAppToReady ();
        }
        const failedItems = JSON.parse ( localStorage.getItem ( 'failedItems' ) ) || [];
        /// SEND UNZIP QUEUE UNTIL LAST ITEM
        if ( unzipQueue.length > 0 ) {
            if ( failedItems.length === 0 ) {
                ipcRenderer.send ( 'onSendBufferQueue', unzipQueue )
            } else {
                //console.log("failedItems ", failedItems)
                for ( let failedItem of failedItems ) {
                    props.deleteFromUnzipQueue ( failedItem )
                }
            }
        }

        /// STOP UNZIP & AND RESET BUFFER
        if ( unzipQueue && unzipQueue.length === 0 && firstUnzipRunFlag === false ) {
            props.resetBufferQueue ();
            setInstalling ( false );
            const firstInstallation = JSON.parse ( localStorage.getItem ( 'firstInstallation' ) ) || {};
            goBackToStartingPage ();
            switch ( props.appPhase ) {
                case "initialSetup":
                    props.setAppPhase ( "installLobby" );
                    break;
                case "firstContentInstallation":
                    console.log ( "Installing first content" );
                    break;
                case "login":
                    ( firstInstallation.hasOwnProperty ( "webInstallation" ) && firstInstallation.webInstallation === true ) ? props.setAppPhase ( 'firstContentInstallation' ) : console.log ( "In Login" )
                    break;
                default:
                    ipcRenderer.send ( ' removeAllFromRepo' );
                    setAppToReady ();
                    break;
            }

        } else {
            setFirstUnzipRunFlag ( false );
        }

        if ( unzipQueue && unzipQueue.length === 1 && firstInstallation.webInstallation === true ) {
            setTimeout ( () => {
                finishFirstInstallation ();
                setAppToReady ();
            }, 1000 )
        }
        if ( unzipQueue && unzipQueue.length === 1 && firstInstallation.usbInstallation === true ) {
            localStorage.removeItem ( 'previousAppPhase' );
            setTimeout ( () => {

                goToLogin ( null, false );
            }, 1000 );
        }
        if ( unzipQueue && unzipQueue.length === 1 && props.appPhase === "readyToUse" ) {
            setTimeout ( () => {
                ipcRenderer.send ( 'triggerResettingView' );
            }, 1000 );
        }
        if ( tokenProfile !== null && tokenProfile !== "" ) {

            props.selectUserProfile ( tokenProfile );
            userProfiles = JSON.parse ( localStorage.getItem ( 'availableProfiles' ) );

            setAvailableProfilesForUser ( userProfiles );
            props.setAvailableProfiles ( userProfiles );
            ipcRenderer.send ( 'getAllDocumentTypesForProfile', tokenProfile );
            ipcRenderer.send ( "getAllGroupsForProfile", tokenProfile );
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        props.unzipQueue,
        props.userProfile
    ] );

    useEffect ( () => {
        //GET BACK TO HOME SCREEN ON NORMAL UPDATES WHEN ONLY THE APP DATA HAS BEEN UPDATED
        if ( ( props.navigationItem === 8 ) && ( props.appPhase === "readyToUse" ) && ( preparingData === false ) && ( installing === false ) ) {
            goBackToStartingPage ();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ preparingData, installing ] );

    // Check by HEIGHT
    if ( height < 721 && zoomFactor >= 100 ) {
        ipcRenderer.send ( "resize-me", height / 721 );
    } else if ( height > 721 && zoomFactor < 100 ) {
        ipcRenderer.send ( "resize-me", 1 )
    }

    // // Check by WIDTH
    // if ( width < 1281 && zoomFactor >= 100 ) {
    //     ipcRenderer.send ( "resize-me", width / 1281);
    // } else if ( width > 1281 && zoomFactor < 100 ) {
    //     ipcRenderer.send ( "resize-me", 1 )
    // }

    const doReinstallAfterMigration = () => {
        localStorage.setItem ( 'reinstallAfterMigration', "true" );
    }

    const showAppActualizationPopUp = ( event, info ) => {
        console.log ( { info } );
        const releaseVersionToMatch = info.version.split ( '-' )[0];
        if ( isNewerVersion ( pkgVersionToCompare, releaseVersionToMatch ) ) {
            if ( info.releaseNotes.includes ( "reinstall" ) ) {
                info.installNow = true;
            } else {
                info.installNow = false;
                setInstallAppUpgradeLater ( true );
            }
            setReleaseInfo ( info );
            setShowPopUp ( true );
        }
    }

    const goBackToStartingPage = () => {
        if ( ( props.navigationItem === 8 ) && ( props.appPhase === "readyToUse" ) ) {
            const lastAppPage = Number ( localStorage.getItem ( "lastAppPage" ) ) || 5;
            props.setNavigationItem ( lastAppPage );
        }
    }


    const setAppToReady = () => {
        const firstTimeLogin = localStorage.getItem ( "firstTimeLogin" ) || "";
        const userProfile = localStorage.getItem ( 'userCurrentProfile' );
        const availableProfiles = JSON.parse ( localStorage.getItem ( 'availableProfiles' ) );
        props.setAppPhase ( "readyToUse" );
        props.selectUserProfile ( userProfile );
        props.setAvailableProfiles ( availableProfiles );
        goBackToStartingPage ();
        if ( firstTimeLogin === "true" ) {
            ipcRenderer.send ( 'resetAppLanguage', props.langReady )
        }
    }

    const finishFirstInstallation = () => {
        let firstInstallationDone = localStorage.getItem ( "firstInstallationDone" ) || "";
        if ( firstInstallationDone === "" ) {
            localStorage.removeItem ( firstInstallation );
            const firstInstallationFinished = {
                webInstallation: false,
                usbInstallation: false
            }
            localStorage.setItem ( "firstInstallation", JSON.stringify ( firstInstallationFinished ) );
            let firstInstallationDone = "true";
            localStorage.setItem ( "firstInstallationDone", firstInstallationDone );
            ipcRenderer.send ( ' removeAllFromRepo' );
            ipcRenderer.send ( "checkForPendingTasks" );
        }
    }

    const setAllDocTypesForProfile = ( event, data ) => {
        props.setAllContentTypesForProfile ( data );
        const allContentsTypesForProfile = data.map ( ( contentType ) => contentType.tid );
        localStorage.setItem ( 'allContentTypesForProfile', JSON.stringify ( allContentsTypesForProfile ) )
    }

    const setAllGroupsForProfile = ( event, data ) => {
        props.setAllGroupsForProfile ( data );
        const allGroupsForProfile = data.map ( ( group ) => group.id ).sort ( ( a, b ) => a.localeCompare ( b ) );
        localStorage.setItem ( 'allGroupsForProfile', JSON.stringify ( allGroupsForProfile ) )
    }


    const initialize = async () => {
        ipcRenderer.send('currentAppVersion', pkg.version);
        ipcRenderer.send('executeMigrations');
        if (token === null || token === "") {
            if (loggedOut === "true") {
                setLoggedOut ( true );
                ipcRenderer.send ( 'getAppLanguage' );
                props.setAppPhase ( 'login' );
            } else {
                const previousAppPhase = localStorage.getItem('previousAppPhase') || "";
                if (previousAppPhase === 'installLobby') {
                    props.setAppPhase ( 'login' );
                } else {
                    props.setAppPhase ( "initialSetup" );
                }
            }
        } else {
            // Send the jwt token to electron
            ipcRenderer.send ( "onTokenReceived", token );
            const conditionUserIdExistAndIsValid = ( logEntry.userId !== null && logEntry.userId !== "" );
            logEntry.userId = conditionUserIdExistAndIsValid ? logEntry.userId : localStorage.getItem ( 'userEmail' )
            logEntry.category = "open";
            logEntry.action = "open app";
            localStorage.setItem ( "appInitialized", "true" );
            sendToLogs ( logEntry, props.networkOnline );
            if ( activeVisitId === "" ) {
                const uninstallationInCourse = localStorage.getItem ( "uninstallationInCourse" ) || "";
                if ( uninstallationInCourse === "true" ) {
                    localStorage.removeItem ( uninstallationInCourse );
                    ipcRenderer.send ( "continueUninstalling", props.appLanguage );
                } else {
                    props.setAppPhase ( "readyToUse" );
                    ipcRenderer.send ( 'checkForPendingTasks' );
                    ipcRenderer.send ( 'getAppLanguage' );
                    ipcRenderer.send ( 'removeAllFromRepo' );
                }
            } else {
                props.setAppPhase("visitActive");
                props.setStartedVisitId(activeVisitId);
            }
            // ipcRenderer.send ( 'primeRedux' )
            const previousAppPhase = localStorage.getItem('previousAppPhase') || "";
            if (previousAppPhase === 'installLobby') {
                localStorage.removeItem('previousAppPhase');
            }
        }

        // Start service
        const senderId = '896298606052' // <-- replace with FCM sender ID from FCM web admin under Settings->Cloud Messaging
        //console.log('starting service and registering a client')
        ipcRenderer.send(START_NOTIFICATION_SERVICE, senderId);
        setIntervalAndExecute(checkForSoftwareUpdates, SOFTWARE_CHECK_UPDATE_INTERVAL);
    }

    //Update profiles:

    const isNewerVersion = ( oldVer, newVer ) => {
        const oldParts = oldVer.split ( '.' )
        const newParts = newVer.split ( '.' )
        for ( let i = 0; i < newParts.length; i++ ) {
            const a = ~~newParts[i] // parse int
            const b = ~~oldParts[i] // parse int
            if ( a > b ) return true;
            if ( a < b ) return false;
        }
        return false;
    }

    const checkForSoftwareUpdates = () => {
        ipcRenderer.send ( "checkForSoftwareUpdates", pkg.version )
    }

    const onDownloadProgress_EDM = ( event, data ) => {
        //onDownloadProgress_EDM( event, data, setDownloadData )
        setDownloadData ( data );
    }

    const setCalcUuid = ( event, data ) => {
        if ( data !== undefined ) {
            let calcUuid = data;
            localStorage.setItem ( 'calcUuid', calcUuid )
        }
    }

    const onMigrationExecuted = async () => {
        console.info ( "Migrations are done!" );
    }

    const setEmailDraft = ( event, data ) => {
        //console.log ( { emailAttachments: data } )
        props.setNewEmail ( true );
        localStorage.setItem ( 'calcAttachmentUuid', data.uuid )
        localStorage.setItem ( 'calcAttachmentData', JSON.stringify ( data ) )
        props.addToMailAttachments ( data );
        setSolo ( true );
    }

    const logThis = ( data, contentType, eventType ) => {

        logEntry.contentId = data.uuid;
        logEntry.contentName = data.name;
        logEntry.contentType = contentType;
        logEntry.category = eventType;
        logEntry.action = "view";
        logEntry.parentContentId = data.parentContentId;
        logEntry.businessUnitId = data.businessUnitId;
        if ( contentType === 'presentation' ) {
            logEntry.value = data.scene;
        } else if ( data.value === "ACCESS" ) {
            logEntry.value = data.value;
            logEntry.category = "content";
        }
        sendToLogs ( logEntry, props.networkOnline );
    }

    const onFoundInfo = ( event, data ) => {
        const eventType = data.scene ? "scene" : "content";
        const contentType = data.type === "hypeviewer" ? "presentation" : "document";

        logThis ( data, contentType, eventType );
        if ( data.navigation ) {
            const pdfType = data.pdfType;
            localStorage.setItem ( 'lastValidRoute', data.id );
            localStorage.setItem ( 'pdfType', pdfType );
            history.push ( "/" + data.type + "/" + data.id );
        }
    }

    const onSetInstallingFromWeb = ( event, info ) => {
        //console.info( "ipcRenderer receives message 'setInstallingFromWeb' and a info:", info );
        return info;
    }


    const doOnLoginFinished = () => {
        const tokenProfile = localStorage.getItem ( 'tokenProfile' ) || "";
        const userCurrentProfile = localStorage.getItem ( 'userCurrentProfile' ) || "";
        const userEmail = localStorage.getItem ( "userEmail" )
        let firstInstallation = JSON.parse ( localStorage.getItem ( 'firstInstallation' ) ) || {};
        if ( firstInstallation !== undefined && firstInstallation.webInstallation === true ) {
            //console.log("1 doOnLoginFinished on finished 1st web installation", firstInstallation.webInstallation)
            localStorage.removeItem ( 'previousAppPhase' );
            props.setAppPhase ( 'firstContentInstallation' )
        } else if ( firstInstallation !== undefined && firstInstallation.usbInstallation === true ) {
            //console.log("2 doOnLoginFinished on finished 1st usb installation", firstInstallation.usbInstallation)
            finishFirstInstallation ();
            props.setAppPhase ( "readyToUse" );
            if ( tokenProfile.length > 0 && userCurrentProfile !== tokenProfile ) {
                localStorage.setItem ( 'userCurrentProfile', tokenProfile );
                props.selectUserProfile ( tokenProfile );
            }
        } else if ( firstInstallation !== undefined && firstInstallation.usbInstallation === false ) {
            if ( tokenProfile.length > 0 && userCurrentProfile !== tokenProfile ) {
                localStorage.setItem ( 'userCurrentProfile', tokenProfile );
                props.selectUserProfile ( tokenProfile );
            }
            localStorage.removeItem ( 'profilesFromUSB' );
            props.setAppPhase ( "readyToUse" );

        } else {
            if ( tokenProfile.length > 0 && userCurrentProfile !== tokenProfile ) {
                localStorage.setItem ( 'userCurrentProfile', tokenProfile );
                props.selectUserProfile ( tokenProfile );
            }
            props.setAppPhase ( "readyToUse" );
        }
        const appInitialized = localStorage.getItem ( "appInitialized" );
        if ( appInitialized === null ) {
            logEntry.category = "login";
            logEntry.action = "log in";
            logEntry.profileId = ( tokenProfile === null ) ? localStorage.getItem ( "tokenProfile" ) || "" : tokenProfile;
            logEntry.userId = ( userEmail === null ) ? localStorage.getItem ( "userEmail" ) || "" : userEmail;
            sendToLogs ( logEntry, props.networkOnline )
        }
        setNotAfterLogin ( false );
    }


    const goToLogin = ( event, flag ) => {
        if ( flag ) {
            ipcRenderer.send ( 'setInstallingFromWeb' );
            const firstInstallation = {
                webInstallation: flag
            }
            localStorage.setItem ( "firstInstallation", JSON.stringify ( firstInstallation ) );
            props.setAppPhase ( 'login' );
        } else {
            let webInstallation = true;
            props.setWebInstallation ( webInstallation );
            props.setAppPhase ( 'login' );
        }
        ipcRenderer.send ( 'getAppLanguage' );
    }

    const goToUSB = () => {
        props.setAppPhase ( 'usbInstallation' );
        ipcRenderer.send ( 'getAppLanguage' );
    }

    const putFailedItemAsLastInUzipQueue = ( event, info ) => {
        const itemToReset = info.item;
        const failedItems = JSON.parse ( localStorage.getItem ( "failedItems" ) ) || [];
        failedItems.push ( itemToReset );
        localStorage.setItem ( "failedItems", JSON.stringify ( "failedItems" ) );
    };

    useEffect ( () => {
        if ( ( availableProfiles.length > 0 ) && ( dataForInstallation.length === availableProfiles.length ) ) {
            ipcRenderer.send ( "gotDataForUser", dataForInstallation );
            setDataForInstallation ( [] );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ availableProfiles, dataForInstallation ] );

    useEffect ( () => {
        if ( updateNotificationRead ) {
            setNotificationRead ( false );
        }
    }, [ updateNotificationRead ] )


    useEffect ( () => {
        if ( tokenProfile && ( tokenProfile.length > 0 ) && ( hashData.length === profilesLength ) ) {
            ipcRenderer.send ( "updateProfilesDataOnHashChange", hashData );
            setProfilesLength ( 0 );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ hashData ] );

    const handleInstallAppNow = () => {
        ipcRenderer.send ( 'downloadAppUpdate', newReleaseInfo );
        setShowPopUp ( false );
        setReleaseInfo ( {} );
    }

    const handleClosePopUp = () => {
        setShowPopUp ( false );
        setReleaseInfo ( {} );
        setNotificationRead ( true );
    }

    const confirmInstallingNewAppVersion = {
        show: showPopUp,
        onHide: installAppUpgradeLater === false ? handleClosePopUp : handleInstallAppNow,
        contentClassName: installAppUpgradeLater === false ? "warning" : "actualization",
        title: titleNotification + " for version " + newReleaseInfo.version,
        messageArray: messageArrayNotification,
        handleOnAccept: handleInstallAppNow,
        handleOnCancel: installAppUpgradeLater === false ? handleClosePopUp : {},
        labelCancel: installAppUpgradeLater === false ? t ( "Upgrade app later" ) : "",
        labelAccept: installAppUpgradeLater === false ? t ( "Upgrade app now" ) : t ( "Upgrade after restarting" ),
        key: "handleReinstallingUpdateNotification",
        displayConfirmationInput: installAppUpgradeLater === false ? true : false,
        confirmationInputType: installAppUpgradeLater === false ? "reinstall" : ""
    }

    const confDialogsArray = [ confirmInstallingNewAppVersion ];
    const getDownloadingDataForProfile = ( data ) => {
        const { username, token, profiles } = data;
        let arrayAccumulator = [];
        let hashAccumulator = [];
        setProfilesLength ( profiles.length );
        profiles.forEach ( ( profile ) => {
            const url = process.env.REACT_APP_DEV_UPDATES + "/" + profile.id;
            const hashData = {
                name: profile.name,
                id: profile.id,
                hash: profile.hash,
                last_verification: profile.last_verification
            }
            const requiredData = {
                username,
                url,
                token,
                profile
            }
            getDataFromAPI ( requiredData )
                .then ( ( responseFromApi ) => {
                    responseFromApi.data.profile = profile.id;
                    responseFromApi.data.postpone = false;
                    responseFromApi.data.firstInstallation = true;
                    responseFromApi.data.newProfile = true;
                    return responseFromApi.data;
                } )
                .then ( ( responseData ) => {
                    hashData.hash = responseData.hash;
                    if ( arrayAccumulator.length < profiles.length - 1 ) {
                        hashAccumulator = [ ...hashAccumulator, hashData ];
                        arrayAccumulator = [ ...arrayAccumulator, responseData ];
                    } else {
                        setHashData ( [ ...hashAccumulator, hashData ] );
                        setDataForInstallation ( [ ...arrayAccumulator, responseData ] );
                    }
                } ).catch ( ( error ) => {
                console.log ( error )
            } )
        } )
    }

    const doUpdateProfilesBeforeUpdating = ( event, profileId ) => {
        const profilesToUpdate = JSON.parse ( localStorage.getItem ( 'profilesBeforeUpdatingStore' ) ) || [];
        if ( profilesToUpdate.length > 0 ) {
            const profilesUpdated = profilesToUpdate.filter ( ( item ) => item.id !== profileId );
            localStorage.setItem ( 'profilesBeforeUpdatingStore', JSON.stringify ( profilesUpdated ) );
        }
        const profileRemoved = JSON.parse ( localStorage.getItem ( "profileRemoved" ) ) || {};
        if ( profileRemoved && ( profileRemoved.done === true ) ) {

        } else {
            const profileRemoved = {
                done: true
            }
            localStorage.setItem ( "profileRemoved", JSON.stringify ( profileRemoved ) );
        }
    }

    const onStartProcessingData = ( event, normalUpdates ) => {
        normalUpdates ? setPreparingData ( true ) : console.info ( "Not normal updates" );
    }

    const onProfilesProcessed = ( event, dataProfiles ) => {
        const { profiles, infoRequestedBy } = dataProfiles;

        localStorage.setItem ( "availableProfiles", JSON.stringify ( profiles ) );
        if ( profiles && Array.isArray ( profiles ) && profiles.length === 0 ) {
            const data = {
                message: t ( "User without profiles. Please contact with the Administration." ),
                type: "warning"
            }
            displayAlert ( data );
        }

        const firstInstallationDone = localStorage.getItem ( "firstInstallationDone" ) || "";
        const firstInstallation = JSON.parse ( localStorage.getItem ( 'firstInstallation' ) ) || {};

        const username = localStorage.getItem ( "username" );
        const token = localStorage.getItem ( "token" );
        //console.log ( { firstInstallationDone } );
        if ( firstInstallationDone === "" && firstInstallation.webInstallation ) {
            const requiredInfo = {
                username,
                token,
                profiles,
            }
            getDownloadingDataForProfile ( requiredInfo )
        } else if ( ( firstInstallationDone === "" && firstInstallation.usbInstallation ) || ( firstInstallationDone === "true" ) ) {
            ipcRenderer.send ( 'getLastInstallationInfo', infoRequestedBy );
        }
        if ( token !== null ) {
            ipcRenderer.send ( "onTokenReceived", token );
        }
    }

    const processProfiles = ( profiles ) => {

        const profilesData = {
            profiles,
            infoRequestedBy: "RequestedByApp"
        }
        ipcRenderer.send ( 'processProfilesOnMain', profilesData );
    }

    const changeSubphase = () => {
        setPreparingData ( false );
        setInstalling ( true );
    }

    const onFinishedProcessingDataForUser = ( event, normalUpdates ) => {
        const profile = localStorage.getItem ( "tokenProfile" );
        localStorage.setItem ( "userCurrentProfile", profile );
        if ( normalUpdates === true ) {
            setTimeout (
                changeSubphase, 500
            )
        }
    }
    const handleFinishVisit = ( e ) => {
        e.preventDefault ()
        ipcRenderer.send ( 'finishVisit', props.startedVisitId );
    }

    const createNewDraft = () => {
        //console.log("Email attachments ", props.mailAttachments)
        createNewEmail ()
    }

    const createNewVisitDraft = () => {
        props.setNewVisit ( true );
    }


    const createNewEmail = () => {
        props.setNewEmail ( true );
        logEntry.category = "email";
        logEntry.action = "create";
        sendToLogs ( logEntry, props.networkOnline )
    }

    return (

        <div className="InitialComponent">
            { (props.appPhase === "initialSetup" || props.appPhase === "firstContentInstallation") &&
                <UpdateScreen
                    phase={ props.appPhase }
                    /*   userLoggedOut={ userLoggedOut }*/
                    downloadData={ downloadData }
                /> }
            { props.appPhase === "login" &&
                <>
                    <Login
                        processProfiles={ processProfiles }
                        onSetInstallingFromWeb={ onSetInstallingFromWeb }
                        userLoggedOut={ userLoggedOut }
                    />
                </>
            }
            { props.appPhase === "installLobby" && <InitialSettings goToLogin={ goToLogin } goToUSB={ goToUSB }/> }
            { props.appPhase === "usbInstallation" && <USBScreen goToLogin={ goToLogin }/> }
            { props.appPhase === "uninstallingApp" &&
                <UninstallingScreen phase={ props.appPhase }/> }
            { props.appPhase === "uninstallingAppFinished" &&
                <UninstallingScreen phase={ props.appPhase }/> }
            { props.appPhase === "readyToUse" && <>
                { preparingData && <div className="notification">
                    <UpdateScreen
                        phase={ props.appPhase }
                        subphase={ "preparingData" }
                        downloadData={ downloadData }
                    />
                </div>
                }
                { installing && props.downloadQueue.length > 0 && downloadData.hasOwnProperty ( 'filesNumber' ) &&
                    <div className="notification">
                        <UpdateScreen
                            phase={ props.appPhase }
                            subphase={ "installing" }
                            downloadData={ downloadData }
                        />
                    </div> }
                { installing && props.unzipQueue.length > 0 && <div className="notification">
                    <UpdateScreen
                        phase={ props.appPhase }
                        subphase={ "installing" }
                        downloadData={ downloadData }
                    />
                </div>
                }
                <Stage new={ props.newEmail }/>
                { confDialogsArray.length > 0 && confDialogsArray.map ( ( dialog, index ) =>
                    < ConfirmationDialog
                        key={ index }
                        show={ dialog.show }
                        onHide={ dialog.onHide }
                        contentClassName={ dialog.contentClassName }
                        title={ dialog.title }
                        messageArray={ dialog.messageArray }
                        handleOnCancel={ dialog.handleOnCancel }
                        handleOnAccept={ dialog.handleOnAccept || {} }
                        labelCancel={ dialog.labelCancel || "" }
                        labelAccept={ dialog.labelAccept || "" }
                        displayConfirmationInput={ dialog.displayConfirmationInput || false }
                        confirmationInputType={ dialog.confirmationInputType || "" }
                    />
                ) }

            </> }
            {
                conditionForDisplayingProfileName &&
                <div
                    className={ "users_profiles" }>
                    <p>{ availableProfiles.filter ( ( profile ) => profile.id === props.userProfile )[0].name }</p>
                </div>
            }
            { props.appPhase === "visitActive" && <VisitStage handleFinishVisit={ handleFinishVisit }/> }
            { props.appPhase === "lockedScreen" && <Pin/> }
            { ( props.newEmail && solo ) && <EmailEditor
                solo={ solo }
                setSolo={ setSolo }
            /> }
        </div>
    );
}
const mapStateToProps = ( state ) => ( {
    downloadQueue: state.manageDownloading.downloadQueue,
    unzipQueue: state.manageDownloading.unzipQueue,
    bufferQueue: state.manageDownloading.bufferQueue,
    userProfile: state.settings.userProfile,
    userEmail: state.settings.userEmail,
    webInstallation: state.settings.webInstallation,
    profiles: state.settings.availableProfiles,
    networkOnline: state.sensors.networkAvailable,
    serverAvailable: state.sensors.serverAvailable,
    notificationData: state.notificationsReducer.notificationData,
    show: state.modalsReducer.show,
    langReady: state.settings.langReady,
    appPhase: state.settings.appPhase,
    availableProfiles: state.settings.availableProfiles,
    startedVisitId: state.visitEditor.startedVisitId,
    newEmail: state.emailEditor.newEmail,
    mailAttachments: state.emailEditor.attachments,
    navigationItem: state.navigation.navigationItem,
} )

function mapDispatchToProps ( dispatch ) {
    return {
        addDownloadQueue: ( docArray ) => dispatch ( addDownloadQueue ( docArray ) ),
        deleteFromDownloadQueue: ( doc ) => dispatch ( deleteFromDownloadQueue ( doc ) ),
        addToBufferQueue: ( doc ) => dispatch ( addToBufferQueue ( doc ) ),
        deleteFromUnzipQueue: ( doc ) => dispatch ( deleteFromUnzipQueue ( doc ) ),
        switchQueue: () => dispatch ( switchQueue () ),
        resetBufferQueue: () => dispatch ( resetBufferQueue () ),
        addToUpdates: ( updates ) => dispatch ( addAllUpdatesPending ( updates ) ),
        selectUserProfile: ( profile ) => dispatch ( setProfile ( profile ) ),
        setNavigationItem: ( navigationItem ) => dispatch ( setNavigationItem ( navigationItem ) ),
        setWebInstallation: ( webInstallation ) => dispatch ( setWebInstallation ( webInstallation ) ),
        setAvailableProfiles: ( availableProfiles ) => dispatch ( setAvailableProfiles ( availableProfiles ) ),
        setNotificationData: ( notificationData ) => dispatch ( setNotificationData ( notificationData ) ),
        setShow: ( show ) => dispatch ( setShow ( show ) ),
        setAppLangReady: ( langReady ) => dispatch ( setAppLangReady ( langReady ) ),
        setAppPhase: ( appPhase ) => dispatch ( setAppPhase ( appPhase ) ),
        setStartedVisitId: ( uuid ) => dispatch ( setStartedVisitId ( uuid ) ),
        setNewEmail: ( newEmail ) => dispatch ( setNewEmail ( newEmail ) ),
        addToMailAttachments: ( doc ) => dispatch ( addToMailAttachments ( doc ) ),
        removeFromMailAttachments: ( uuid ) => dispatch ( removeFromMailAttachments ( uuid ) ),
        setNewVisit: ( newVisit ) => dispatch ( setNewVisit ( newVisit ) ),
        setAllContentTypesForProfile: ( allContentTypes ) => dispatch ( setAllContentTypesForProfile ( allContentTypes ) ),
        setAllGroupsForProfile: ( allGroups ) => dispatch ( setAllGroupsForProfile ( allGroups ) )
    }
}

export default withRouter ( connect ( mapStateToProps, mapDispatchToProps ) ( InitialComponent ) );
