import isElectron from "is-electron";
import { useEffect, useState } from "react";
import { addAllUpdatesPending, } from "../../redux/actions/manageDownloading";
import { connect } from "react-redux";
import { sendToLogs } from "../../constants/functions";
import { setAppPhase } from "../../redux/actions/settings";

let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;


export const UpdatesEventHandler = ( props ) => {
    const token = localStorage.getItem ( "token" );
    const [ dataHash, setDataHash ] = useState ( [] );
    const [ allProfilesData, setAllProfilesData ] = useState ( [] );
    const [ allProfilesFromDB, setProfilesFromDB ] = useState ( [] );
    const doLogoutOnTokenProfilesError = ( message ) => {
        let error;
        message === "Invalid JWT Token" ? error = "token error" : error = "profile error";
        const logEntry = {
            profileId: localStorage.getItem ( "tokenProfile" ),
            userId: localStorage.getItem ( "userEmail" ),
            category: "login",
            action: "log out on " + error,
            severity: "log",
            visitId: props.startedVisitId,
        }
        sendToLogs ( logEntry, props.networkOnline )
        localStorage.removeItem ( "tokenProfile" );
        localStorage.removeItem ( "token" );
        localStorage.removeItem ( "appInitialized" );
        const userLoggedOut = "true";
        localStorage.setItem ( "loggedOut", userLoggedOut );
        props.setAppPhase ( 'login' );
    }

    const getDataFromApiForUpdates = ( requiredInfo ) => {
        return new Promise ( ( resolve, reject ) => {
            fetch ( requiredInfo.updatesURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'Authorization': `Bearer ${ requiredInfo.token }`,
                    'pragma': 'no-cache',
                    'cache-control': 'no-cache'
                }
            } ).then ( ( response ) => {
                //console.log ( response )
                if ( response.status >= 200 && response.status < 300 ) {
                    return response.json ();
                } else {
                    console.log ( "Error on response", response );
                    if ( ( response.status === 401 ) || ( response.status === 403 ) ) {
                        let message;
                        response.status === 401 ? message = "Invalid JWT Token" : message = "Wrong user profile(s) in the app";
                        doLogoutOnTokenProfilesError ( message );
                    }
                }
            } ).then ( ( data ) => {
                resolve ( data )
            } ).catch ( ( error ) => {
                console.log ( "Error on fetching data from server", error );
                reject ( error );
            } )
        } )
    }
    const getUpdatesForUser = ( data ) => {
        const { token, info } = data;
        let profilesDataAccumulator = [];
        let hashAccumulator = [];
        let newProfile;

        const profilesBeforeUpdatingStore = JSON.parse ( localStorage.getItem ( "profilesBeforeUpdatingStore" ) ) || JSON.parse ( localStorage.getItem ( "availableProfiles" ) ) || [];
        for ( const profileInfo of info ) {
            const profilesBeforeUpdatingStoreIds = profilesBeforeUpdatingStore.map ( ( profileBefore ) => profileBefore.id );
            const userProfile = profileInfo.id;
            const infoRequestedBy = info.infoRequestedBy;
            const requiredInfo = {
                token,
                updatesURL: process.env.REACT_APP_DEV_UPDATES + "/" + userProfile
            }
            getDataFromApiForUpdates ( requiredInfo )
                .then ( ( responseData ) => {
                    if ( responseData ) {
                        //console.log("Updates values: ", updatesValues)
                        let updatesInfo;
                        const responseHash = responseData.data.hash;
                        if ( ( profilesBeforeUpdatingStoreIds.includes ( userProfile ) === true ) ) {
                            newProfile = false;
                        } else {
                            newProfile = true;
                        }
                        if ( newProfile ) {
                            updatesInfo = {
                                profile: userProfile,
                                data: responseData.data,
                                newProfile,
                                infoRequestedBy
                            }
                            const hashData = {
                                name: profileInfo.name,
                                id: profileInfo.id,
                                hash: responseHash,
                                last_verification: Date.now ()
                            }

                            if ( profilesDataAccumulator.length === info.length - 1 ) {
                                setAllProfilesData ( [ ...profilesDataAccumulator, updatesInfo ] );
                                setDataHash ( [ ...hashAccumulator, hashData ] );
                            } else {
                                profilesDataAccumulator = [ ...profilesDataAccumulator, updatesInfo ];
                                hashAccumulator = [ ...hashAccumulator, hashData ];
                            }
                        } else {
                            const storedHash = info.filter ( ( item ) => item.id === userProfile )[0].hash;
                            if ( responseHash !== storedHash ) {

                                updatesInfo = {
                                    profile: userProfile,
                                    data: responseData.data,
                                    newProfile,
                                    infoRequestedBy
                                }

                                const hashData = {
                                    name: profileInfo.name,
                                    id: profileInfo.id,
                                    hash: responseHash,
                                    last_verification: profileInfo.last_verification
                                }
                                if ( profilesDataAccumulator.length === info.length - 1 ) {
                                    setAllProfilesData ( [ ...profilesDataAccumulator, updatesInfo ] );
                                    setDataHash ( [ ...hashAccumulator, hashData ] );
                                } else {
                                    profilesDataAccumulator = [ ...profilesDataAccumulator, updatesInfo ];
                                    hashAccumulator = [ ...hashAccumulator, hashData ];
                                }
                            } else {
                                updatesInfo = {
                                    profile: userProfile,
                                    data: {},
                                    newProfile,
                                    infoRequestedBy
                                }
                                const hashData = {
                                    name: profileInfo.name,
                                    id: profileInfo.id,
                                    hash: profileInfo.hash,
                                    last_verification: profileInfo.last_verification
                                }
                                //console.info ( "Profile with no updates updatesInfo", updatesInfo );
                                if ( profilesDataAccumulator.length === info.length - 1 ) {
                                    setAllProfilesData ( [ ...profilesDataAccumulator, updatesInfo ] );
                                    setDataHash ( [ ...hashAccumulator, hashData ] );

                                } else {
                                    profilesDataAccumulator = [ ...profilesDataAccumulator, updatesInfo ];
                                    hashAccumulator = [ ...hashAccumulator, hashData ];
                                }
                            }
                        }
                    }
                } )
                .catch ( ( error ) => {
                    console.log ( "Error setting data for updates", error );
                } )
        }
    }


    const onRequestUpdates = ( event, info ) => {
        console.log ( "Last installation info", info );
        setProfilesFromDB ( info );
        let token = localStorage.getItem ( "token" );
        const data = {
            token,
            info
        }
        getUpdatesForUser ( data );
    }

    const askForPendingUpdates = () => {
        ipcRenderer.send ( 'doQueryForPendingUpdates' )
    }

    const getAllUpdates = ( event, shouldWait ) => {
        if ( shouldWait === true ) {
            setTimeout ( askForPendingUpdates, 2000 );
        } else {
            setTimeout ( askForPendingUpdates, 500 );
        }
    }

    const doSendUpdatesToRedux = ( event, updates ) => {
        props.addToUpdates ( updates );
    }

    useEffect ( () => {
        ipcRenderer.on ( 'updatesStoredDone', getAllUpdates );
        ipcRenderer.on ( 'gotUpdatesToInstall', doSendUpdatesToRedux );
        if ( token !== null && token.length > 0 ) {
            ipcRenderer.on ( 'lastInstallationDate', onRequestUpdates );
        }
        return () => {
            ipcRenderer.off ( 'lastInstallationDate', onRequestUpdates )
            ipcRenderer.off ( 'updatesStoredDone', getAllUpdates );
            ipcRenderer.off ( 'gotUpdatesToInstall', doSendUpdatesToRedux );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    useEffect ( () => {
        ipcRenderer.on ( 'lastInstallationDate', onRequestUpdates );
        return () => {
            ipcRenderer.off ( 'lastInstallationDate', onRequestUpdates )
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ token, props.updatesRequested === true ] );


    useEffect ( () => {
        if ( ( allProfilesFromDB.length > 0 ) && ( allProfilesData.length === allProfilesFromDB.length ) && ( dataHash.length === allProfilesFromDB.length ) ) {
            const allUpdatesInfo = allProfilesData.map ( ( item ) => Object.assign ( {}, item ) );
            const updatesInfo = allUpdatesInfo.filter ( ( profileData ) => profileData.data.hasOwnProperty ( "packages" ) );
            const noPendingUpdates = allProfilesData.filter ( ( profileData ) => profileData.data.hasOwnProperty ( "packages" ) === false );
            if ( noPendingUpdates.length !== allProfilesData.length ) {
                ipcRenderer.send ( 'gotUpdatesData', updatesInfo );
            } else {
                const profileRemoved = JSON.parse ( localStorage.getItem ( "profileRemoved" ) ) || {};
                if ( profileRemoved && profileRemoved.done ) {
                    ipcRenderer.send ( 'profileRemoved' );
                } else {
                    const infoRequestedBy = allProfilesData[0].infoRequestedBy;
                    ipcRenderer.send ( 'nothingPendingFromServer', infoRequestedBy );
                }

            }
            ipcRenderer.send ( "gotUpdatedHashDataForProfile", dataHash );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ allProfilesData, dataHash ] );
    return null
}

const mapStateToProps = ( state ) => ( {
    userProfile: state.settings.userProfile,
    downloadQueue: state.manageDownloading.downloadQueue,
    unzipQueue: state.manageDownloading.unzipQueue,
    bufferQueue: state.manageDownloading.bufferQueue,
    updatesRequested: state.settings.updatesRequested,
    networkOnline: state.sensors.networkAvailable
} )

function mapDispatchToProps ( dispatch ) {
    return {
        addToUpdates: ( updates ) => dispatch ( addAllUpdatesPending ( updates ) ),
        setAppPhase: ( appPhase ) => dispatch ( setAppPhase ( appPhase ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( UpdatesEventHandler )
