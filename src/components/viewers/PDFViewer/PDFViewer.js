import React, { useEffect, useRef } from 'react';
import "./PDFViewer.scss";
import { useParams, withRouter } from "react-router-dom";
import ViewerMenu from "../ViewerMenu/ViewerMenu";


const PDFViewer = ( props ) => {
    const viewerRef = useRef( null );
    const backend = new props.backend ();
    const { id } = useParams ();

    useEffect( () => {

        const src = id;
        const element = viewerRef.current;

        backend.init ( src, element )
        return () => {
            // const logEntry = {
            //      profileId : localStorage.getItem("tokenProfile"),
            //      userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
            //     category : "document",
            //     action : "close",
            //     value : props.match.params.id,
            //     severity : "log",
            //     visitId : props.startedVisitId
            // }
            // sendToLogs ( logEntry )
            // window.removeEventListener("hashchange", onHashChanged, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    return (
        <>
            <ViewerMenu type={ "library" }/>
            <div id={ "PDFViewer" }
                 className={ "PDFViewer viewer" }
                 ref={ viewerRef }
                 style={ { width: "100%", height: "100%" } }>
            </div>
        </>
    );
};

export default withRouter( PDFViewer );
