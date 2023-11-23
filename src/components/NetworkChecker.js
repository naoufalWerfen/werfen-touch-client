import { useEffect, useState } from 'react';
import { updateNetworkAvailability } from "../redux/actions/sensors";
import isElectron from "is-electron";
import { connect } from 'react-redux';
import { useTranslation } from "react-i18next";
// import { sendToLogs } from "../constants/functions";

let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" );
}

const ipcRenderer = electron && electron.ipcRenderer;
const NetworkChecker = ( props ) => {
    const { t } = useTranslation ();
    // const [isNetworkOn, setNetworkOn] = useState(window.navigator.onLine)
    // TODO: Where would we mount analytics for connectivity with user and profile access on redux.
    const [ connectionStatus, setConnectionStatus ] = useState ( null );

    const setOnline = () => {
        if ( isElectron () ) {
            // setNetworkOn(true);
            props.updateNetworkAvailability ( true );
            ipcRenderer.send ( "online-status-updated", true )
            // const logEntry = {
            //     profileId : localStorage.getItem("tokenProfile"),
            //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
            //     category : "network",
            //     action : "connect",
            //     severity : "system",
            //     visitId : props.startedVisitId
            // }
            // sendToLogs ( logEntry,  props.networkOnline )
        }
    }
    const setOffline = () => {
        if ( isElectron () ) {
            // setNetworkOn(false);
            props.updateNetworkAvailability ( false );
            ipcRenderer.send ( "online-status-updated", false )
            // const logEntry = {
            //     profileId : localStorage.getItem("tokenProfile"),
            //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
            //     category : "network",
            //     action : "disconnect",
            //     severity : "system",
            //     visitId : props.startedVisitId
            // }
            // sendToLogs ( logEntry,  props.networkOnline )
        }
    }
    useEffect ( () => {
        return () => {
            if ( connectionStatus === "App offline" ) {
                alert ( t ( "App offline" ) );
            } else if ( connectionStatus === "App online" ) {
                alert ( t ( "App online" ) );
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ connectionStatus ] );

    const doAppOffline = ( event, info ) => {
        let appWentOffline = "true"
        localStorage.setItem ( "appWentOffline", appWentOffline )
        if ( info === false && props.downloadQueue.length > 0 ) {
            setConnectionStatus ( "App offline" );
            ipcRenderer.send ( 'cancelDownloadQueue' )
        }
    }

    const doAppOnline = ( event, info ) => {

        let appWentOffline = localStorage.getItem ( 'appWentOffline' ) || '',
            firstTimeLogin = localStorage.getItem ( 'firstTimeLogin' ) || '',
            firstInstallationDone = localStorage.getItem ( '' ) || '',
            token = localStorage.getItem ( 'token' ) || "",
            tokenProfile = localStorage.getItem ( 'tokenProfile' ) || "",
            loggedOut = localStorage.getItem ( 'token' ) || "";

        switch ( true ) {
            case( token !== null && appWentOffline === "true" ):
                // alert ( t ( "App is online" ) );
                setConnectionStatus ( "App online" )
                localStorage.removeItem ( "appWentOffline" )
                ipcRenderer.send ( 'checkForPendingTasks' );
                break;
            case( loggedOut === "true" && appWentOffline === "true" ):
                alert ( t ( "App is online on loggedOut" ) );
                localStorage.removeItem ( "appWentOffline" )
                ipcRenderer.send ( 'checkForPendingTasks' );
                break;
            case( firstTimeLogin === "true" && firstInstallationDone === "true" && appWentOffline === "true" && tokenProfile === undefined ):
                alert ( t ( "App is back online on installing content for 1stTime" ) );
                localStorage.removeItem ( "appWentOffline" )
                ipcRenderer.send ( 'checkForPendingTasks' );
                break;
            default:
                //console.log ( "App is online ", info );
                break
        }
    }


    useEffect ( () => {
        window.navigator.onLine ? setOnline () : setOffline ();
        ipcRenderer.on ( "appOffline", doAppOffline );
        ipcRenderer.on ( "appIsOnline", doAppOnline );
        return () => {
            ipcRenderer.off ( "appOffline", doAppOffline );
            ipcRenderer.off ( "appIsOnline", doAppOnline );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.downloadQueue ] );


    return null
}
const mapStateToProps = ( state ) => ( {
    networkOnline: state.sensors.networkAvailable,
    downloadQueue: state.manageDownloading.downloadQueue,
    userProfile: state.settings.userProfile,
    userEmail: state.settings.userEmail,
} )

function mapDispatchToProps ( dispatch ) {
    return {
        updateNetworkAvailability: ( networkAvailable ) => dispatch ( updateNetworkAvailability ( networkAvailable ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( NetworkChecker );
