import React from 'react';
import "./HYPEViewer.scss";
import ViewerMenu from "../ViewerMenu/ViewerMenu";
import { useParams } from "react-router-dom";
import isElectron from "is-electron";
import { DocumentsFolder } from "../../../constants/AppData";

const HYPEViewer = ( props ) => {

    const id = useParams ().id.split ( "|" )[0];

    //console.log({useParamsIdArray: useParams().id})

    let electronParam = "";
    if ( isElectron ) {
        electronParam = "?electron=true";
    }

    let documentsUri = "//localhost:9990/";
    if ( window.location.protocol === "file:" ) {
        documentsUri = "file://" + DocumentsFolder;
    }

    return (
        <>
            <ViewerMenu type={ "visuals" }/>
            <div
                id={ "HYPEViewer" }
                className={ "HYPEViewer viewer" }
            >
                <iframe
                    key={ id }
                    id={ id }
                    src={ documentsUri + "/visuals/" + id + "/index.html" + electronParam }
                    width="100%"
                    height="100%"
                />
            </div>
        </>
    );
};

export default HYPEViewer;
