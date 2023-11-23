import isElectron from "is-electron";
import { useEffect } from "react";
import { connect } from "react-redux";
import { setAppPhase } from "../../redux/actions/settings";
import { sendToLogs } from "../../constants/functions";

let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;
const UninstallingEventHandler = ( props ) => {
    const doUninstallingProcess = () => {
        sessionStorage.clear ();
        localStorage.clear ()
        props.setAppPhase ( 'uninstallingApp' );
        ipcRenderer.send ( 'deleteResources' );
    }

    const doFinishUninstalling = () => {
        ipcRenderer.send ( 'truncateDatabase' );
        props.setAppPhase ( 'uninstallingAppFinished' );
    }
    const doLogout = () => {
        const type = "afterUninstalling";
        ipcRenderer.send ( 'createResourceFolder', type );
        const logEntry = {
            profileId: localStorage.getItem ( "tokenProfile" ),
            userId: localStorage.getItem ( "userEmail" ),
            category: "login",
            action: "log out after uninstalling",
            severity: "log",
            visitId: props.startedVisitId,
        }
        sendToLogs ( logEntry, props.networkOnline )
        const userLoggedOut = "true";
        const firstInstallation = {
            webInstallation: true
        }
        localStorage.setItem ( "firstInstallation", JSON.stringify ( firstInstallation ) );
        localStorage.setItem ( "loggedOut", userLoggedOut );
        localStorage.removeItem ( "appInitialized" );
        props.setAppPhase ( 'login' );
    }

    const goingBackToInitialSetup = () => {
        window.location.reload ();
    }
    useEffect ( () => {
        ipcRenderer.on ( 'startUninstallingProcess', doUninstallingProcess );
        ipcRenderer.on ( 'resourcesFolderHasBeenRemoved', doFinishUninstalling );
        ipcRenderer.on ( 'logoutForReinstallAll', doLogout );
        ipcRenderer.on ( 'databaseHasBeenRemoved', goingBackToInitialSetup );
        return () => {
            ipcRenderer.off ( 'startUninstallingProcess', doUninstallingProcess );
            ipcRenderer.off ( 'resourcesFolderHasBeenRemoved', doFinishUninstalling );
            ipcRenderer.off ( 'logoutForReinstallAll', doLogout );
            ipcRenderer.off ( 'databaseHasBeenRemoved', goingBackToInitialSetup );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    return null
}

const mapStateToProps = ( state ) => ({
    downloadQueue: state.manageDownloading.downloadQueue,
    appPhase: state.settings.appPhase
})

function mapDispatchToProps(dispatch) {
    return{
        setAppPhase: (appPhase) => dispatch(setAppPhase(appPhase))
    }
}

export default connect(mapStateToProps, mapDispatchToProps) (UninstallingEventHandler)
