import isElectron from "is-electron";
import { connect } from "react-redux";
import { useEffect } from "react";
import { deleteFromDownloadQueue, deleteFromUnzipQueue } from "../../redux/actions/manageDownloading";

let electron;
if ( isElectron() ) {
    electron = window.require( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const ErrorsEventHandler = ( props ) => {

    const sendErrorToAlert = ( data ) => {
        window.alert( data.message + "\n" + data.error + "\n" + data.subject );
    }

    const sendErrorToConsole = ( data ) => {
        console.log ( data.message + "\n" + data.error + "\n" + data.subject );
    }

    const doOnErrorMessageFromMain = ( event, info ) => {
        const data = {
            message: info.message,
            error: info.error,
            subject: "Message from MAIN"
        }
        sendErrorToConsole( data );
    }

    const doOnUnzipError = ( event, data ) => {
        //console.info( "ipcRenderer receives message 'onUnzipError' and error data: ", data );
        data.message = "Error while unzipping a file. Details follow:";
        sendErrorToConsole( data );
    }

    const doOnRenameError = ( event, data ) => {
        data.message = "Rename Error ";
        sendErrorToConsole( data );
    }

    const doOnDownloadError = ( event, data ) => {
        //console.info( "ipcRenderer receives message 'onDownloadError' and downloadError data: ", data );
        sendErrorToConsole ( data );
        if ( props.downloadQueue.filter ( item => item.uuid === data.identifier ).length > 0 ) {
            //console.log( "Error while downloading: ", data.error )
        }
    }

    const doOnDBCreationError = ( data, ) => {
        data.message = "Error while creating DB. Details follow:";
        sendErrorToAlert ( data );
    }

    const doOnMoveError = ( event, moveError ) => {
        const data = {}
        data.message = "Error while moving a visual inside doRename function";
        data.error = moveError.error;
        data.subject = moveError.subject;
        sendErrorToConsole ( data );
    }

    const resetFileForUnzipping = ( event, content ) => {
        props.deleteFromUnzipQueue ( content );
        content.status = 'Not_Installed';
        ipcRenderer.send ( 'updateItemAsNotInstalled', content );
    }

    const doOnItemNotDownloadingProperly = ( event, content ) => {
        props.deleteFromDownloadQueue ( content );
        ipcRenderer.send ( 'downloadCancel', content );
    }


    useEffect ( () => {
        ipcRenderer.on ( 'onDBCreationError', doOnDBCreationError );
        ipcRenderer.on ( 'errorMessageOnMain', doOnErrorMessageFromMain );

        return () => {
            ipcRenderer.off ( 'onDBCreationError', doOnDBCreationError );
            ipcRenderer.off ( 'errorMessageOnMain', doOnErrorMessageFromMain );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    useEffect( () => {
        ipcRenderer.on ( 'onDownloadError', doOnDownloadError );
        ipcRenderer.on ( 'itemNotDownloadingProperly', doOnItemNotDownloadingProperly );
        return () => {
            ipcRenderer.off ( 'onDownloadError', doOnDownloadError );
            ipcRenderer.off ( 'itemNotDownloadingProperly', doOnItemNotDownloadingProperly );

        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.downloadQueue] );

    useEffect( () => {
        ipcRenderer.on ( 'fileNotExtractedYet', resetFileForUnzipping );
        ipcRenderer.on ( 'onUnzipError', doOnUnzipError );
        ipcRenderer.on ( 'onRenameError', doOnRenameError );
        ipcRenderer.on ( "onMoveVisualError", doOnMoveError );
        return () => {
            ipcRenderer.off ( 'fileNotExtractedYet', resetFileForUnzipping );
            ipcRenderer.off ( 'onUnzipError', doOnUnzipError );
            ipcRenderer.off ( 'onRenameError', doOnRenameError );
            ipcRenderer.off ( "onMoveVisualError", doOnMoveError );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    return null
}
const mapStateToProps = ( state ) => ( {
    downloadQueue: state.manageDownloading.downloadQueue,
} )

function mapDispatchToProps ( dispatch ) {
    return {
        deleteFromUnzipQueue: ( doc ) => dispatch ( deleteFromUnzipQueue ( doc ) ),
        deleteFromDownloadQueue: ( doc ) => dispatch ( deleteFromDownloadQueue ( doc ) )
    }
}


export default connect ( mapStateToProps, mapDispatchToProps ) ( ErrorsEventHandler )



