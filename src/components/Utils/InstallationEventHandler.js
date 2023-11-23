import isElectron from "is-electron";
import {
    addDownloadQueue,
    addToBufferQueue,
    deleteFromDownloadQueue,
    deleteFromUnzipQueue,
    resetBufferQueue,
    switchQueue
} from "../../redux/actions/manageDownloading";
import { useEffect } from "react";
import { connect } from "react-redux";

let electron;
if ( isElectron() ) {
    electron = window.require( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const InstallationEventHandler = (props) => {

    const doOnSystemAlready = ( event, entry ) => {
        console.info( "ipcRenderer receives message 'onSystemAlready' and entry: ", entry );
        if ( props.downloadQueue.length > 0 ) {
            props.addToBufferQueue ( entry )
            props.deleteFromDownloadQueue ( entry );
        }
    }


    const doOnUnzippedAlready = ( event, entry ) => {
        //console.info( "ipcRenderer receives message 'onUnzippedAlready' and  entry: ", entry );

        if ( props.unzipQueue.length > 0 ) {
            props.deleteFromUnzipQueue ( entry );
            switch ( entry.classification ) {
                case "library":
                case "image":
                case "visuals":
                    ipcRenderer.send ( 'itemInstalledSuccessfully', entry );
                    break;
                default:
                    break;
            }
        }
    }

    const doOnMoveError = ( event, data ) => {
        console.table ( { data } );
    }


    useEffect ( () => {
        ipcRenderer.on ( 'onSystemAlready', doOnSystemAlready );
        ipcRenderer.on ( "onMoveVisualError", doOnMoveError );
        return () => {
            ipcRenderer.off ( 'onSystemAlready', doOnSystemAlready );
            ipcRenderer.off ( "onMoveVisualError", doOnMoveError );

        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.downloadQueue ] );

    useEffect( () => {
        ipcRenderer.on( 'onUnzippedAlready', doOnUnzippedAlready );
        return () => {
            ipcRenderer.off( 'onUnzippedAlready', doOnUnzippedAlready );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.unzipQueue ] );

    return null
}

const mapStateToProps = ( state ) => ({
    downloadQueue: state.manageDownloading.downloadQueue,
    unzipQueue: state.manageDownloading.unzipQueue,
    bufferQueue: state.manageDownloading.bufferQueue,
})

function mapDispatchToProps(dispatch) {
    return{
        addDownloadQueue: ( docArray ) => dispatch( addDownloadQueue( docArray ) ),
        deleteFromDownloadQueue: ( doc ) => dispatch( deleteFromDownloadQueue( doc ) ),
        addToBufferQueue: ( doc ) => dispatch( addToBufferQueue( doc ) ),
        deleteFromUnzipQueue: ( doc ) => dispatch( deleteFromUnzipQueue( doc ) ),
        switchQueue: () => dispatch( switchQueue() ),
        resetBufferQueue: () => dispatch( resetBufferQueue() )
    }
}

export default connect(mapStateToProps, mapDispatchToProps) (InstallationEventHandler)
