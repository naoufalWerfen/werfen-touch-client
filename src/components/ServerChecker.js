import { connect } from 'react-redux';
import isElectron from 'is-electron'
import { SERVER_REACHABLE_INTERVAL, SERVER_REACHABLE_MAX_TRIES } from '../constants/AppData'
import { useEffect } from 'react';
import { fetchWithTimeout } from "../constants/functions";
import { updateNetworkAvailability, updateServerAvailability } from "../redux/actions/sensors";
import { useTranslation } from "react-i18next";

let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" );
}

const ipcRenderer = electron && electron.ipcRenderer;

function ServerChecker ( props ) {
    const { t } = useTranslation ();
    const doOnCurrentServerStatus = ( event, info ) => {
        //console.log("Server is now in reach: ", info)
        switch ( true ) {
            case( ( info === false ) && props.downloadQueue.length > 0 ):
                alert ( t ( "Server unreachable" ) )
                ipcRenderer.send ( 'cancelDownloadQueue' )
                break;
            case( ( ( info === true ) && props.downloadQueue.length > 0 ) ):
                console.info ( "Resetting the download queue" )
                ipcRenderer.send ( 'resetDownloadQueue' )
                break
            default:
                console.log ( "Server status is ", info );
                break
        }
    }
    const setServerAvailable = () => {
        props.updateServerAvailability ( true )
        ipcRenderer.send ( 'serverIsAvailable', true )
    };

    const setServerUnavailable = () => {
        props.updateServerAvailability ( false )
        ipcRenderer.send ( 'serverIsAvailable', false )
    }
    const updateServerAvailability = async ( data ) => {
        const isServerAvailable = await checkServerAvailability ( data );
        //console.log("Server is inside reach: ", isServerAvailable)
        isServerAvailable ? setServerAvailable () : setServerUnavailable ()
    }

    const checkServerAvailability = async ( data ) => {
        if ( isElectron () ) {
            try {
                const response = await fetchWithTimeout ( data, {
                    method: 'HEAD',
                    timeout: 6000
                } );
                let serverResponse = !response ? false : response.status === 200
                return serverResponse;

            } catch ( error ) {
                console.error ( "Error while checking server availability", error );
                return false
            }
        }
    }

    const doCheckServerAvailability = async () => {
        const executionDelay = SERVER_REACHABLE_INTERVAL;
        const maxTries = SERVER_REACHABLE_MAX_TRIES;
        const pingServer = process.env.REACT_APP_PING_CHECK;

        //setIntervalAndExecute ( updateServerAvailability, executionDelay, maxTries, pingServer );
    }

    useEffect ( () => {

        ipcRenderer.on ( 'checkServerAvailabilityAfterLogin', doCheckServerAvailability )
        ipcRenderer.on ( 'checkServerAvailability', doCheckServerAvailability )
        return () => {
            ipcRenderer.off ( 'checkServerAvailabilityAfterLogin', doCheckServerAvailability )
            ipcRenderer.off ( 'checkServerAvailability', doCheckServerAvailability )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] )

    useEffect ( () => {
        //console.log("Server availability unchecked. Checking!");

        ipcRenderer.send ( 'serverIsAvailable', !!props.isServerAvailable )

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.isServerAvailable ] )

    useEffect ( () => {
        ipcRenderer.once ( 'serverIsNowInReach', doOnCurrentServerStatus )
        return () => {
            ipcRenderer.off ( 'serverIsNowInReach', doOnCurrentServerStatus )
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.downloadQueue ] );


    return null;
}


const mapStateToProps = ( state ) => ( {
    networkOnline: state.sensors.networkAvailable,
    isServerAvailable: state.sensors.serverAvailable,
    downloadQueue: state.manageDownloading.downloadQueue
} )

function mapDispatchToProps ( dispatch ) {
    return {
        updateServerAvailability: ( serverAvailable ) => dispatch ( updateServerAvailability ( serverAvailable ) ),
        updateNetworkAvailability: ( networkAvailable ) => dispatch ( updateNetworkAvailability ( networkAvailable ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( ServerChecker );
