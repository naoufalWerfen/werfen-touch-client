import isElectron from "is-electron";
import { connect } from "react-redux";
import { useEffect } from "react";

import {
    addDownloadQueue,
    resetBufferQueue,
    setAsBufferQueue,
    switchQueue
} from "../../redux/actions/manageDownloading";

let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const DownloadEventHandler = ( props ) => {
    const doCancelDownload = () => {
        const itemToSend = props.downloadQueue[0];
        //console.log("item to send on cancelDownload is: ", itemToSend)
        props.addDownloadQueue( [] );
        props.switchQueue();
        props.resetBufferQueue();
        ipcRenderer.send( 'downloadCancel', itemToSend );
    }
    const resetDownloadQueue = () => {
        // console.log('Download queue is ', props.downloadQueue);
        let itemToSend = props.downloadQueue[0];
        ipcRenderer.send( 'downloadCancel', itemToSend );
        let newDownloadQueue = props.downloadQueue
        newDownloadQueue.push ( newDownloadQueue.shift () )
        props.addDownloadQueue ( newDownloadQueue );
        ipcRenderer.send ( "onSendToDownloadQueueFinished", newDownloadQueue )
    }
    const doSendPackagesForInstall = ( event, packageList ) => {

        console.info ( "ipcRenderer sends message 'installPackages' and packageList :", packageList )
        ipcRenderer.send ( 'installPackages', packageList )
    }
    const doSendToDownloadQueue = ( event, packages ) => {
        console.info ( { packagesForDownloading: packages } );
        props.addDownloadQueue ( packages );
    }
    const doSendPackagesForInstallingFromFiles = ( event, packageList ) => {
        console.log ( "Package list length: ", packageList.length );
        props.setAsBufferQueue ( packageList );
    }
    useEffect ( () => {
        ipcRenderer.on ( 'sendToDownloadQueue', doSendToDownloadQueue );
        ipcRenderer.on ( "gotPackages", doSendPackagesForInstall );
        ipcRenderer.on ( "gotPackagesForInstallingFromFiles", doSendPackagesForInstallingFromFiles )
        ipcRenderer.on ( 'cancelDownload', doCancelDownload );
        ipcRenderer.on ( 'resetDownload', resetDownloadQueue );
        return () => {
            ipcRenderer.off ( 'sendToDownloadQueue', doSendToDownloadQueue );
            ipcRenderer.off ( "gotPackages", doSendPackagesForInstall );
            ipcRenderer.off ( "gotPackagesForInstallingFromFiles", doSendPackagesForInstallingFromFiles )
            ipcRenderer.off ( 'cancelDownload', doCancelDownload );
            ipcRenderer.off ('resetDownload', resetDownloadQueue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] )


    return null
}
const mapStateToProps = ( state ) => ({
    downloadQueue: state.manageDownloading.downloadQueue,
    unzipQueue: state.manageDownloading.unzipQueue,
    bufferQueue: state.manageDownloading.bufferQueue,
})
function mapDispatchToProps(dispatch) {
    return {
        addDownloadQueue: ( docArray ) => dispatch ( addDownloadQueue ( docArray ) ),
        switchQueue: () => dispatch ( switchQueue () ),
        resetBufferQueue: () => dispatch ( resetBufferQueue () ),
        setAsBufferQueue: ( bufferQueue ) => dispatch ( setAsBufferQueue ( bufferQueue ) )
    }
}
export default connect(mapStateToProps, mapDispatchToProps) (DownloadEventHandler)
