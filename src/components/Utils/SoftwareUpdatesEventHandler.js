import isElectron from "is-electron";
import { useEffect } from "react";

let electron;
if ( isElectron() ) {
    electron = window.require( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

export const SoftwareUpdatesEventHandler = (props) => {

    const processCheckForSoftwareUpdateResponse = ( event, output ) => {
        /* if (window.confirm(output.message + confirmYouWantToDownload)){
             ipcRenderer.send('downloadAppUpdate', output.value.updateInfo.version )
         } else {
             console.info("Downloading the new updated app version has been postponed for now!")
         }*/
    }

    useEffect ( () => {
        ipcRenderer.on ( 'finishedCheckForSoftwareUpdates', processCheckForSoftwareUpdateResponse )
        return () => {
            ipcRenderer.off ( 'finishedCheckForSoftwareUpdates', processCheckForSoftwareUpdateResponse )
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    return null
}
