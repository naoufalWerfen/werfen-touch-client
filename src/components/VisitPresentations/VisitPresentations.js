import React, { useEffect } from 'react';
import ItemsList from "../ItemsList/ItemsList";
import "./VisitPresentations.scss";
import { withRouter } from "react-router-dom";
import { setActiveKey, setSelectedItem } from "../../redux/actions/navigation";
import { connect } from "react-redux";
import isElectron from "is-electron";
import { calculateContent, calculateGroups } from "../../constants/functions";
import { useTranslation } from 'react-i18next';
import {
    loadGroups,
    loadPresentations,
    resetGroups,
    resetPresentations
} from "../../redux/actions/processStartedVisitData";

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const VisitPresentations = ( props ) => {
    const { t } = useTranslation ();
    const origin = "visuals"

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
            props.loadPresentations ( searchContent );
            props.loadGroups ( searchContentGroups );
        } else {
            props.resetGroups ();
        }
    }

    return (
        <div className={ "VisitPresentations" }>
            {
                ( props.dataPresentations.length > 0 ) &&
                <div className="VisitPresentations__Results row">
                    <ItemsList itemsList={ props.dataPresentations }/>
                </div>
            }
            {
                ( props.dataPresentations.length === 0 ) &&
                <div className={ "VisitPresentations__NoResults" }>{ t ( "Search error for filtering" ) }!</div>
            }
        </div>
    );
};

const mapStateToProps = ( state ) => ( {
    selectedKey: state.navigation.selectedKey,
    userProfile: state.settings.userProfile,
    dataPresentations: state.visitDataProcessor.dataPresentations,
    visitId: state.visitEditor.startedVisitId
} )
const mapDispatchToProps = ( dispatch ) => {
    return {
        setActiveKey: ( activeKey ) => dispatch ( setActiveKey ( activeKey ) ),
        setSelectedItem: ( selectedItem ) => dispatch ( setSelectedItem ( selectedItem ) ),
        loadGroups: ( groups ) => dispatch ( loadGroups ( groups ) ),
        resetGroups: () => dispatch ( resetGroups () ),
        loadPresentations: ( dataPresentations ) => dispatch ( loadPresentations ( dataPresentations ) ),
        resetPresentations: () => dispatch ( resetPresentations () )
    }
}

export default withRouter ( connect ( mapStateToProps, mapDispatchToProps ) ( VisitPresentations ) );
