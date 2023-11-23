import React, { useEffect, useState } from 'react';
import ItemsList from "../ItemsList/ItemsList";
import "./VisitSearch.scss";
import { withRouter } from "react-router-dom";
import { setActiveKey, setSelectedItem } from "../../redux/actions/navigation";
import { connect } from "react-redux";
import isElectron from "is-electron";
import {
    loadAllSearchContent,
    loadGroups,
    loadSearch,
    resetAllSearchContent,
    resetGroups,
    resetSearch,
    setContentGroup,
    setContentType,
    setResultSearch,
    setSearchValue
} from "../../redux/actions/processStartedVisitData";
import { Button, Form, FormGroup } from "react-bootstrap";
import { calculateContent, calculateGroups, sendToLogs } from "../../constants/functions";
import { useTranslation } from 'react-i18next';

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const VisitSearch = ( props ) => {
    const [ searchValue, setSearchValue ] = useState ( props.searchValue );
    const [ tOut, setTOut ] = useState ();
    const { t } = useTranslation ();
    const [ itemToSelect, setItemToSelect ] = useState ( "" );
    const origin = "search";


    const contentTypes = [
        { key: "all", value: t ( "all" ) },
        { key: "visuals", value: t ( "visuals" ) },
        { key: "library", value: t ( "library" ) }
    ];

    const contentGroups = [
        { key: "all", value: t ( "all" ) },
        { key: "0", value: t ( "Overview" ) },
        { key: "1", value: t ( "Hemostasis" ) },
        { key: "2", value: t ( "Acute Care" ) },
        { key: "3", value: t ( "Autoimmunity" ) }
    ];

    const updateVisitAttachments = () => {
        let attachments = props.attachments.map ( ( item ) => {
            return {
                icon: item.icon,
                type: item.type,
                uuid: item.uuid,
                name: item.name,
                gid: item.gid
            }
        } );
        let updatedAttachments = {
            uuid: props.visitId,
            attachments: attachments
        }
        ipcRenderer.send ( 'updateVisitAttachments', updatedAttachments )
    }

    useEffect ( () => {
        const options = {
            query: props.searchValue,
            profile: props.userProfile,
            type: "visuals",
            group: props.contentGroup,
            visitActive: true
        }
        if ( props.selectedItem !== "" ) {
            setItemToSelect ( props.selectedItem );
        }

        ipcRenderer.send ( 'getSearchResult', options )
        ipcRenderer.on ( 'gotSearchResult', processSearchResults );
        return () => {
            ipcRenderer.off ( 'gotSearchResult', processSearchResults );
            props.resetGroups ();
        };
        //console.log ( props.attachments )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    useEffect ( () => {
        if ( props.searchValue !== "" || props.contentType !== "all" ) {
            const { searchValue, contentType } = props;
            let searchQuery = {};
            if ( searchValue !== "" ) {
                searchQuery.query = searchValue;
            }
            searchQuery.type = contentType;

            const logEntry = {
                profileId : localStorage.getItem("tokenProfile"),
                userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
                category: "search",
                action: "search",
                value: searchQuery,
                severity: "log",
                visitId: props.startedVisitId
            }
            sendToLogs ( logEntry, props.networkOnline );

        } else {
            if ( props.dataGroups.length > 0 ) {
                props.setActiveKey ( props.dataGroups[0].id );
                let cid = props.dataGroups[0].categories.map ( item => item.cid )
                let itemToSelect = "ItemsList-" + props.dataGroups[0].id + "-" + cid[0];
                props.setSelectedItem ( itemToSelect );
            }
        }
        submitSearchQuery ( null );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.contentType, props.searchValue, props.contentGroup ] );

    useEffect ( () => {
        props.setSelectedItem ( itemToSelect );
    }, [ itemToSelect ] );

    useEffect ( () => {
        updateVisitAttachments ()
    }, [ props.attachments.length ] );
    const setSideBarNavigationValues = ( data ) => {
        let cid = data[0].categories.map ( item => item.cid )
        let itemToSelect = "ItemsList-" + data[0].id + "-" + cid[0];
        setItemToSelect ( itemToSelect );
        //console.log ( { selectedItem: props.selectedItem, itemToSelect } )
        props.setActiveKey ( data[0].id );
    }

    const processSearchResults = ( event, searchResults ) => {
        props.loadAllSearchContent ( searchResults );
        if ( searchResults.length > 0 ) {
            const searchContent = calculateContent ( searchResults, origin );
            const searchContentGroups = calculateGroups ( searchResults );
            props.loadSearch ( searchContent );
            props.loadGroups ( searchContentGroups );
            props.setResultSearch ( true );
            if ( searchContentGroups.length > 0 ) {
                setSideBarNavigationValues ( searchContentGroups );
            }
        } else {
            props.resetGroups ();
            props.resetSearch ();
            props.setContentType ( "visuals" );
            props.setContentGroup ( "all" );
            props.setResultSearch ( false );
        }

    }

    const debounceSearchQuery = ( value ) => {
        clearTimeout ( tOut )
        setTOut ( setTimeout ( () => {
            props.resetSearch ();
            props.setSearchValue ( value )
        }, 350 ) );
    }

    const handleSearchQueryChange = ( event ) => {
        const { value, name } = event.target;
        switch ( name ) {
            case "searchType":
                props.resetGroups ();
                props.resetSearch ();
                props.setContentType ( value );
                break;
            case "searchGroup":
                props.resetGroups ();
                props.resetSearch ();
                props.setContentGroup ( value )
                break;
            case "searchQuery":
            default:
                debounceSearchQuery ( value );
                setSearchValue ( value );
                break;
        }
    }

    const submitSearchQuery = ( event ) => {
        if ( event ) {
            event.preventDefault ();
        }

        const options = {
            query: props.searchValue,
            profile: props.userProfile,
            type: "visuals",
            group: props.contentGroup,
            visitActive: true
        }
        ipcRenderer.send ( 'getSearchResult', options )
    }

    const handleKeyDown = ( event ) => {
        if ( ( [ 'Enter' ] ).includes ( event.key ) ) {
            event.preventDefault ();
            submitSearchQuery ( null )
        }
    }

    const handleClearSearch = ( event ) => {
        event.preventDefault ();
        props.setSearchValue ( "" );
        setSearchValue ( "" );
        props.setContentType ( "visuals" );
        props.setContentGroup ( "all" );
        props.setActiveKey ( 0 );
        props.setSelectedItem ( "ItemsList-0-0" );

        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "search",
        //     action : "clear",
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry, props.networkOnline )
    }

    return (
        <div className={ "VisitSearch" }>
            <div className="Search__form">
                <FormGroup controlId="formReceiverName">
                    <div className={ "filter text-filter search-field" }>
                        <Form.Label className="text-muted">
                            { t ( "Search title" ) }
                            <Form.Control
                                type="text"
                                name="searchQuery"
                                value={ searchValue }
                                className="text-primary search-text"
                                onChange={ handleSearchQueryChange }
                                placeholder={ t ( "Search placeholder" ) }
                                onKeyDown={ handleKeyDown }
                            />
                        </Form.Label>
                    </div>
                    <div className="filter type-filter type-select">
                        { props.visitActive === false && <Form.Label className="text-muted">
                            <span>{ t ( "Filter content" ) }</span>
                            <Form.Control
                                as="select"
                                name="searchType"
                                onChange={ handleSearchQueryChange }
                                value={ props.contentType }
                            >
                                {
                                    contentTypes.map ( ( contentType, index ) => {
                                        return (
                                            <option key={ index } value={ contentType.key }
                                            >
                                                { contentType.value }
                                            </option>
                                        )
                                    } )
                                }
                            </Form.Control>
                        </Form.Label> }
                        <Form.Label className="text-muted">
                            <span>{ t ( "Filter content" ) }</span>
                            <Form.Control
                                as="select"
                                name="searchGroup"
                                onChange={ handleSearchQueryChange }
                                value={ props.contentGroup }
                            >
                                {
                                    contentGroups.map ( ( contentGroup, index ) => {
                                        return (
                                            <option key={ index } value={ contentGroup.key }
                                            >
                                                { contentGroup.value }
                                            </option>
                                        )
                                    } )
                                }
                            </Form.Control>
                        </Form.Label>
                    </div>
                    <div className="Search__Buttons action-buttons">
                        <Button onClick={ handleClearSearch }
                                className="Search__Clear">{ t ( "Clear" ) }</Button>
                    </div>
                </FormGroup>
            </div>
            {
                ( props.resultSearchExist === true && props.allSearchContent.length > 0 ) &&
                <div className="Search__Results row">
                    <ItemsList itemsList={ props.dataSearch }/>
                </div>
            }
            {
                ( props.resultSearchExist === true && props.allSearchContent.length === 0 ) &&
                <div className={ "Search__NoResults" }>{ t ( "Search error for filtering" ) }!</div>
            }
            {
                ( props.resultSearchExist === false ) &&
                <div className={ "Search__NoResults" }>{ t ( "Search error for results" ) }!</div>
            }
        </div>
    );
};

const mapStateToProps = ( state ) => ( {
    selectedKey: state.navigation.selectedKey,
    dataSearch: state.visitDataProcessor.dataSearch,
    dataGroups: state.visitDataProcessor.dataGroups,
    userProfile: state.settings.userProfile,
    allSearchContent: state.visitDataProcessor.dataSearchContent,
    resultSearchExist: state.visitDataProcessor.resultSearchExist,
    searchValue: state.visitDataProcessor.searchValue,
    contentType: state.visitDataProcessor.contentType,
    attachments: state.visitEditor.attachments,
    visitId: state.visitEditor.startedVisitId,
    contentGroup: state.visitDataProcessor.contentGroup,
    networkOnline: state.sensors.networkAvailable
} )
const mapDispatchToProps = ( dispatch ) => {
    return {
        setActiveKey: ( activeKey ) => dispatch ( setActiveKey ( activeKey ) ),
        setSelectedItem: ( selectedItem ) => dispatch ( setSelectedItem ( selectedItem ) ),
        loadGroups: ( groups ) => dispatch ( loadGroups ( groups ) ),
        loadSearch: ( content ) => dispatch ( loadSearch ( content ) ),
        resetGroups: () => dispatch ( resetGroups () ),
        resetSearch: () => dispatch ( resetSearch () ),
        resetAllSearchContent: () => dispatch ( resetAllSearchContent () ),
        loadAllSearchContent: ( searchContent ) => dispatch ( loadAllSearchContent ( searchContent ) ),
        setContentType: ( contentType ) => dispatch ( setContentType ( contentType ) ),
        setResultSearch: ( resultSearch ) => dispatch ( setResultSearch ( resultSearch ) ),
        setSearchValue: ( searchValue ) => dispatch ( setSearchValue ( searchValue ) ),
        setContentGroup: ( contentGroup ) => dispatch ( setContentGroup ( contentGroup ) )
    }
}

export default withRouter ( connect ( mapStateToProps, mapDispatchToProps ) ( VisitSearch ) );
