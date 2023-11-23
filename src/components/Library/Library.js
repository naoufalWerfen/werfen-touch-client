import React, { useEffect } from 'react';
import ItemsList from "../ItemsList/ItemsList";
import "./Library.scss";
import { withRouter } from "react-router-dom";
import { setActiveKey, setSelectedItem } from "../../redux/actions/navigation";
import { connect } from "react-redux";
import isElectron from "is-electron";
import { loadGroups, loadLibrary, resetGroups, resetLibrary } from "../../redux/actions/processData";
import { calculateContent, calculateGroups } from "../../constants/functions";

let electron;

if ( isElectron() ) {
    electron = window.require( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const Library = ( props ) => {
    const origin = "library";
    useEffect( () => {
        const options = {
            type: "library",
            profile: props.userProfile,
        }
        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "navigation",
        //     action : "visit",
        //     value : "library",
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry, props.networkOnline  )

        ipcRenderer.send ( 'getContent', options );
        ipcRenderer.on ( 'resetView', () => {
            ipcRenderer.send ( 'getContent', options );
        } );
        ipcRenderer.on ( 'gotContent', doGetCategoriesAndGroupsForLibrary );
        return () => {
            ipcRenderer.off ( 'resetView', () => {
                ipcRenderer.send ( 'getContent', options );
            } );
            ipcRenderer.off ( 'gotContent', doGetCategoriesAndGroupsForLibrary );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    const doGetCategoriesAndGroupsForLibrary = (event, library) => {
        const data = {
            results: library,
            origin
        }
        const libraryGroups = calculateGroups ( library );
        const libraryContent = calculateContent ( data );
        props.loadLibrary ( libraryContent );
        props.loadGroups ( libraryGroups );
    }

    return (
        <div className={ "Library row h-100" }>
            <ItemsList itemsList={ props.dataLibrary }/>
        </div>
    );
};

const mapStateToProps = ( state ) => ( {
    selectedKey: state.navigation.selectedKey,
    dataLibrary: state.dataProcessor.dataLibrary,
    userEmail: state.settings.userEmail,
    userProfile: state.settings.userProfile,
    networkOnline: state.sensors.networkAvailable
})
const mapDispatchToProps = ( dispatch ) => {
    return {
        setActiveKey: ( activeKey ) => dispatch( setActiveKey( activeKey ) ),
        setSelectedItem: ( selectedItem ) => dispatch( setSelectedItem( selectedItem ) ),
        loadGroups: (groups) => dispatch( loadGroups(groups)),
        loadLibrary: (library) => dispatch (loadLibrary(library)),
        resetGroups: () => dispatch(resetGroups()),
        resetLibrary: () => dispatch(resetLibrary())
    }
}

export default withRouter( connect( mapStateToProps, mapDispatchToProps )( Library ) );
