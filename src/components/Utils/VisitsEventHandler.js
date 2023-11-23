import isElectron from "is-electron";
import { useEffect } from "react";
import { connect } from "react-redux";
import { setAppPhase } from "../../redux/actions/settings";
import {
    removeAllFromAttachments,
    resetStartedVisitId,
    setAttachments,
    setStartedVisitId
} from "../../redux/actions/visitEditor";
import { useHistory } from "react-router-dom";
import { setNavigationItem } from "../../redux/actions/navigation";

let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const VisitEventHandler = ( props ) => {
    const history = useHistory ();
    const doOnStartedVisit = ( event, data ) => {
        //console.log("Visit attachments are ", data.attachments)
        props.setStartedVisitId ( data.uuid );
        props.setAppPhase ( 'visitActive' );
        props.setNavigationItem ( 0 );
        props.setAttachments ( JSON.parse ( data.attachments ) )
        history.push ( "/all" );
        localStorage.setItem ( "activeVisitId", data.uuid );
    }

    const doOnFinishedVisit = ( event, uuid ) => {
        //console.log('finished visit uuid is ', uuid)
        props.resetStartedVisitId ();
        props.removeAllFromAttachments ()
        props.setAppPhase ( "readyToUse" );
        props.setNavigationItem ( 0 );
        history.push ( "/" );
        localStorage.removeItem ( "activeVisitId" );
    }

    useEffect ( () => {
        ipcRenderer.on ( 'startedVisit', doOnStartedVisit );
        ipcRenderer.on ( 'finishedVisit', doOnFinishedVisit );

        return () => {
            ipcRenderer.off ( 'startedVisit', doOnStartedVisit );
            ipcRenderer.off ( 'finishedVisit', doOnFinishedVisit );

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
        setNavigationItem: ( navigationItem ) => dispatch ( setNavigationItem ( navigationItem ) ),
        setAppPhase: ( appPhase ) => dispatch ( setAppPhase ( appPhase ) ),
        setStartedVisitId: ( uuid ) => dispatch ( setStartedVisitId ( uuid ) ),
        resetStartedVisitId: () => dispatch ( resetStartedVisitId () ),
        setAttachments: ( attachments ) => dispatch ( setAttachments ( attachments ) ),
        removeAllFromAttachments: () => dispatch ( removeAllFromAttachments () )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( VisitEventHandler )
