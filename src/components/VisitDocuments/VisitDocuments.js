import React, { useEffect } from 'react';
import ItemsList from "../ItemsList/ItemsList";
import "./VisitDocuments.scss";
import { withRouter } from "react-router-dom";
import { setActiveKey, setSelectedItem } from "../../redux/actions/navigation";
import { connect } from "react-redux";
import isElectron from "is-electron";
import { calculateContent, calculateGroups } from "../../constants/functions";
import { useTranslation } from 'react-i18next';
import { loadDocuments, loadGroups, resetDocuments, resetGroups } from "../../redux/actions/processStartedVisitData";

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const VisitDocuments = ( props ) => {
    const { t } = useTranslation ();
    const origin = "library"
    useEffect ( () => {
        const options = {
            query: "",
            profile: props.userProfile,
            type: "all",
            subtype: props.content,
            status: "Installed",
            uuid: props.visitId
        }
        ipcRenderer.send ( 'getVisitAttachments', options );
        ipcRenderer.on ( 'gotVisitAttachments', processVisitAttachments );
        return () => {
            ipcRenderer.off ( 'gotVisitAttachments', processVisitAttachments );
            props.resetGroups ();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.attachments ] );

    const processVisitAttachments = ( event, searchResults ) => {
        if ( searchResults.length > 0 ) {
            const searchContent = calculateContent ( searchResults, origin );
            const searchContentGroups = calculateGroups ( searchResults );
            props.loadDocuments ( searchContent );
            props.loadGroups ( searchContentGroups );
        } else {
            props.resetGroups ();
        }
    }


    return (
        <div className={ "VisitDocuments" }>
            {

                ( props.dataDocuments.length > 0 ) &&
                <div className="VisitDocuments__Results row">
                    <ItemsList itemsList={ props.dataDocuments }/>
                </div>
            }
            {
                ( props.resultSearchExist === false ) &&
                <div className={ "VisitDocuments__NoResults" }>{ t ( "Search error for results" ) }!</div>
            }
        </div>
    );
};

const mapStateToProps = ( state ) => ( {
    selectedKey: state.navigation.selectedKey,
    userProfile: state.settings.userProfile,
    visitId: state.visitEditor.startedVisitId,
    dataDocuments: state.visitDataProcessor.dataDocuments
} )
const mapDispatchToProps = ( dispatch ) => {
    return {
        setActiveKey: ( activeKey ) => dispatch ( setActiveKey ( activeKey ) ),
        setSelectedItem: ( selectedItem ) => dispatch ( setSelectedItem ( selectedItem ) ),
        loadGroups: ( groups ) => dispatch ( loadGroups ( groups ) ),
        resetGroups: () => dispatch ( resetGroups () ),
        loadDocuments: ( dataDocuments ) => dispatch ( loadDocuments ( dataDocuments ) ),
        resetDocuments: () => dispatch ( resetDocuments () )
    }
}

export default withRouter ( connect ( mapStateToProps, mapDispatchToProps ) ( VisitDocuments ) );
