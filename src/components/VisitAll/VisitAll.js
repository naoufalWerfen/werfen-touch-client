import React, { useEffect } from 'react';
import ItemsList from "../ItemsList/ItemsList";
import "./VisitAll.scss";
import { withRouter } from "react-router-dom";
import { setActiveKey, setSelectedItem } from "../../redux/actions/navigation";
import { connect } from "react-redux";
import isElectron from "is-electron";
import { calculateContent, calculateGroups } from "../../constants/functions";
import { useTranslation } from 'react-i18next';
import { loadGroups, loadVisitAll, resetGroups, resetVisitAll } from "../../redux/actions/processStartedVisitData";


let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const VisitAll = ( props ) => {
    const origin = "search"
    const { t } = useTranslation ();

    useEffect ( () => {
        const options = {
            query: "",
            profile: props.userProfile,
            type: "visuals",
            group: "all",
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

    }, [ props.attachments ] );

    const processVisitAttachments = ( event, searchResults ) => {
        if ( searchResults.length > 0 ) {
            const searchContent = calculateContent ( searchResults, origin );
            const searchContentGroups = calculateGroups ( searchResults );
            props.loadVisitAll ( searchContent );
            props.loadGroups ( searchContentGroups );
            setTimeout ( () => props.setActiveKey ( searchContentGroups[0].id ), 250 )
        } else {
            props.resetGroups ();
            props.resetVisitAll ()
        }
    }

    return (
        <div className={ "VisitAll" }>
            {
                ( props.dataVisitAll.length > 0 ) &&
                <div className="VisitAll__Results row">
                    <ItemsList itemsList={ props.dataVisitAll }/>
                </div>
            }
            {
                ( props.dataVisitAll.length === 0 ) &&
                <div className={ "VisitAll__NoResults" }>{ t ( "Search error for results" ) }!</div>
            }
        </div>
    );
};

const mapStateToProps = ( state ) => ( {
    selectedKey: state.navigation.selectedKey,
    userProfile: state.settings.userProfile,
    visitId: state.visitEditor.startedVisitId,
    dataVisitAll: state.visitDataProcessor.dataVisitAll,
    attachments: state.visitEditor.attachments
} )
const mapDispatchToProps = ( dispatch ) => {
    return {
        setActiveKey: ( activeKey ) => dispatch ( setActiveKey ( activeKey ) ),
        setSelectedItem: ( selectedItem ) => dispatch ( setSelectedItem ( selectedItem ) ),
        loadGroups: ( groups ) => dispatch ( loadGroups ( groups ) ),
        resetGroups: () => dispatch ( resetGroups () ),
        loadVisitAll: ( dataVisitAll ) => dispatch ( loadVisitAll ( dataVisitAll ) ),
        resetVisitAll: () => dispatch ( resetVisitAll () ),
    }
}

export default withRouter ( connect ( mapStateToProps, mapDispatchToProps ) ( VisitAll ) );
