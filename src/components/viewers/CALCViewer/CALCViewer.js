import React, { useRef, useEffect } from 'react';
import "./CALCViewer.scss";

const CALCViewer = ( props ) => {
    const viewerRef = useRef( null );
    const backend = new props.backend();

    useEffect( () => {
        const { src } = props;
        const element = viewerRef.current;

        backend.init( src, element )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div id={ "CALCViewer" }
             className={ "CALCViewer viewer" }
             ref={ viewerRef }
             style={ { width: "100%", height: "100%" } }>
        </div>
    );
};

export default CALCViewer;
