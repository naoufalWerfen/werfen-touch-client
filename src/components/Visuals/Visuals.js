import React, { useEffect } from 'react';
import ItemsList from "../ItemsList/ItemsList";
import "./Visuals.scss";
import { withRouter } from "react-router-dom";
import { setActiveKey, setSelectedItem } from "../../redux/actions/navigation";
import { connect } from "react-redux";
import isElectron from "is-electron";
import { loadGroups, loadVisuals, resetGroups } from "../../redux/actions/processData";
import { calculateContent, calculateGroups } from "../../constants/functions";

let electron;

if ( isElectron() ) {
    electron = window.require( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const Visuals = ( props ) => {
    const origin = "visuals";

    useEffect ( () => {
        const options = {
            type: "visuals",
            profile: props.userProfile
        }
        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "navigation",
        //     action : "visit",
        //     value : "documents",
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry,  props.networkOnline )

        ipcRenderer.send ( 'getContent', options );
        ipcRenderer.on ( 'resetView', doResetView );
        ipcRenderer.on ( 'gotContent', doGetCategoriesAndGroupsForVisuals );
        return () => {
            ipcRenderer.off ( 'resetView', doResetView );
            ipcRenderer.off ( 'gotContent', doGetCategoriesAndGroupsForVisuals );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    const updateAppView = () => {
        window.location.reload ();
    }

    const doResetView = () => {
        const options = {
            type: "visuals",
            profile: props.userProfile
        }
        ipcRenderer.send ( 'getContent', options );
        updateAppView ();
    }

    const doGetCategoriesAndGroupsForVisuals = ( event, visuals ) => {
        let visualGroups = calculateGroups ( visuals );

        const data = {
            results: visuals,
            origin,
        }
        let visualsContent = calculateContent ( data );

        props.loadVisuals ( visualsContent );
        props.loadGroups ( visualGroups );
    }

    return (
        <div className={ "Visuals row h-100" }>
            <ItemsList itemsList={ props.dataVisuals }/>
        </div>
    );
};

const mapStateToProps = ( state ) => ( {
    dataGroups: state.dataProcessor.dataGroups,
    dataVisuals: state.dataProcessor.dataVisuals,
    selectedKey: state.navigation.selectedKey,
    selectedItem: state.navigation.selectedItem,
    userEmail: state.settings.userEmail,
    userProfile: state.settings.userProfile,
    networkOnline: state.sensors.networkAvailable,
})
const mapDispatchToProps = ( dispatch ) => {
    return {
        setActiveKey: ( activeKey ) => dispatch( setActiveKey( activeKey ) ),
        setSelectedItem: ( selectedItem ) => dispatch( setSelectedItem( selectedItem ) ),
        loadGroups: (groups) => dispatch( loadGroups(groups)),
        loadVisuals: (visuals) => dispatch( loadVisuals(visuals)),
        resetGroups: () => dispatch(resetGroups()),
        //resetVisuals: () => dispatch(resetVisuals()),
    }
}

export default withRouter( connect( mapStateToProps, mapDispatchToProps )( Visuals ) );

