import isElectron from "is-electron";
import { useEffect } from "react";
import { connect } from "react-redux";
import { setAppPhase } from "../../redux/actions/settings";

let electron;
if ( isElectron() ) {
    electron = window.require( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const FirstInstallationEventHandler = ( props ) => {

    const doOnConfirmInitialSetup = ( event, data ) => {
        //console.info( "ipcRenderer receives message 'onFinishedConfirmInitialSetup' and data: ", data );
        if ( data !== "true" ) {
            props.setAppPhase ( 'login' );
        } else {
            console.info ( "The appPhase is: ", props.appPhase );
        }
    }

    const doOnResetFirstInstalling = ( event, data ) => {
        //console.info( "ipcRenderer receives message 'onResetFirstInstalling' and data: ", data );
        if ( data !== "true" ) {
            props.setAppPhase ( 'login' );
        } else {
            console.info ( "The appPhase on resetting is: ", props.appPhase );
            props.setAppPhase ( 'installLobby' );
        }
    }

    const onCreateDatabaseFinished = () => {
        const type = "afterCreatingDatabase";
        ipcRenderer.send ( 'createResourceFolder', type );
    }

    const onCreateInitialFoldersFinished = () => {
        //console.info( "ipcRenderer receives message 'createInitialFoldersFinished'!" )
        let pathname = window.location.host;
        if ( window.location.protocol === "file:" ) {
            pathname = window.location.pathname.replace ( "index.html", "" )
        }
        pathname = window.location.protocol + "//" + pathname;
        //console.info( "ipcRenderer sends message 'installDependencies' and pathname: ", pathname )
        ipcRenderer.send( "installDependencies", pathname )
    }

    const onInstallDependenciesFinished = () => {
         //console.log( "Install dependencies process has finished" );
    }

    useEffect( () => {
        ipcRenderer.on( 'onFinishedConfirmInitialSetup', doOnConfirmInitialSetup );
        ipcRenderer.on( 'createDatabaseFinished', onCreateDatabaseFinished );
        ipcRenderer.on( 'createInitialFoldersFinished', onCreateInitialFoldersFinished );
        ipcRenderer.on ( "installDependenciesFinished", onInstallDependenciesFinished );
        ipcRenderer.on ( 'onResetFirstInstalling', doOnResetFirstInstalling );

        return () => {
            ipcRenderer.off( 'onFinishedConfirmInitialSetup', doOnConfirmInitialSetup );
            ipcRenderer.off( 'createDatabaseFinished', onCreateDatabaseFinished );
            ipcRenderer.off( 'createInitialFoldersFinished', onCreateInitialFoldersFinished );
            ipcRenderer.off ( "installDependenciesFinished", onInstallDependenciesFinished );
            ipcRenderer.off ( 'onResetFirstInstalling', doOnResetFirstInstalling );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ ] );

    return null

}
const mapStateToProps = ( state ) => ({
    downloadQueue: state.manageDownloading.downloadQueue,
})

function mapDispatchToProps(dispatch) {
    return{
        setAppPhase: (appPhase) => dispatch(setAppPhase(appPhase))
    }
}

export default connect(mapStateToProps, mapDispatchToProps) (FirstInstallationEventHandler)
