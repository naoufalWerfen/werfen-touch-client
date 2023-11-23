import React, { useEffect, useState } from 'react';
import ItemsList from "../ItemsList/ItemsList";
import "./Search.scss";
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
    setBusinessUnit,
    setContentType,
    setResultSearch,
    setSearchValue
} from "../../redux/actions/processData";
import { Button, Form, FormGroup } from "react-bootstrap";
import { calculateAllOptions, calculateContent, calculateGroups, sendToLogs } from "../../constants/functions";
import { useTranslation } from 'react-i18next';
import Loader from "../Loader/Loader";
import { CheckboxDropdown } from "../MultiSelect/CheckboxDropdown";

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const Search = ( props ) => {
    const [ searchValue, setSearchValue ] = useState ( props.searchValue );
    const [ tOut, setTOut ] = useState ();
    const { t } = useTranslation ();
    const [ itemToSelect, setItemToSelect ] = useState ( "" );
    const [ loading, setLoading ] = useState ( null );
    const [ error, setError ] = useState ( null );
    const [ allContentTypes, setAllContentTypes ] = useState ( [] );
    const [ allBusinessUnits, setAllBusinessUnit ] = useState ( [] );
    const [ clearAll, setClearAll ] = useState ( false );
    const origin = "search";

    const businessUnitsFromDB = props.dataGroups.map ( ( dataGroup ) => {
        const businessUnitFromDB = {
            key: dataGroup.color,
            value: t ( dataGroup.groupTitle )
        };
        return businessUnitFromDB;
    } )

    // TODO: This list should preferably come from results with only "all" being the hardcoded value.
    const defaultBusinessUnits = [
        { key: "all", value: t ( "All groups" ) },
    ];

    const businessUnits = defaultBusinessUnits.concat ( businessUnitsFromDB );

    const contentTypesFromDB = props.allSearchContent.map ( ( searchContent ) => {
        const contentTypeFromDB = {
            key: searchContent.ct_id,
            value: searchContent.ct_name
        }
        return contentTypeFromDB;
    } );
    const uniqueContentTypes = contentTypesFromDB.filter ( ( v, i, a ) => a.findIndex ( v2 => [ 'key', 'value' ].every ( k => v2[k] === v[k] ) ) === i );

    const defaultContentTypes = [
        { key: "all", value: t ( "All documents types" ) },
    ];
    const contentTypes = defaultContentTypes.concat ( uniqueContentTypes );

    useEffect ( () => {

        const options = {
            query: props.searchValue,
            profile: props.userProfile,
            type: props.contentTypes,
            businessUnit: props.businessUnits,
            group: "all",
            visitActive: false
        }
        if ( props.selectedItem !== "" ) {
            setItemToSelect ( props.selectedItem );
        }
        setLoading ( true );
        ipcRenderer.send ( 'getSearchResult', options );

        ipcRenderer.on ( 'resetView', () => {
            ipcRenderer.send ( 'getSearchResult', options )
        } );
        ipcRenderer.on ( 'gotSearchResult', processSearchResults );

        return () => {
            ipcRenderer.off ( 'gotSearchResult', processSearchResults );
            ipcRenderer.off ( 'resetView', () => {
                ipcRenderer.send ( 'getSearchResult', options )
            } );

            props.resetGroups ();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    useEffect ( () => {

        if ( props.searchValue !== "" || !props.contentTypes.includes ( "all" ) || !props.businessUnits.includes ( "all" ) ) {
            const { searchValue, contentType, businessUnit } = props;
            let searchQuery = {};
            if ( searchValue !== "" ) {
                searchQuery.query = searchValue;
            }
            searchQuery.type = contentType;
            searchQuery.businessUnit = businessUnit;

            const logEntry = {
                profileId: localStorage.getItem ( "tokenProfile" ),
                userId: localStorage.getItem ( "userEmail" ),
                category: "search",
                action: "search",
                value: JSON.stringify ( searchQuery ),
                severity: "log",
                visitId: props.startedVisitId
            }
            sendToLogs ( logEntry, props.networkOnline );

        } else {
            if ( props.dataGroups.length > 0 ) {
                props.setActiveKey ( props.dataGroups[0].id );
                let cid = props.dataGroups[0].categories.map ( item => item.cid );
                let itemToSelect = "ItemsList-" + props.dataGroups[0].id + "-" + cid[0];
                props.setSelectedItem ( itemToSelect );
            }

        }
        submitSearchQuery ( null );
        if ( clearAll ) {
            setClearAll ( false );
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.contentTypes, props.searchValue, props.businessUnits ] );

    useEffect ( () => {
        props.setSelectedItem ( itemToSelect );
    }, [ itemToSelect ] );


    useEffect ( () => {
        if ( props.allGroupsForProfile.length > 0 ) {
            calculateAllGroupsForProfile ( props.allGroupsForProfile );
        }
    }, [ props.allGroupsForProfile ] );

    useEffect ( () => {
        if ( props.allContentTypesForProfile.length > 0 ) {
            calculateAllDocTypesForProfile ( props.allContentTypesForProfile );
        }
    }, [ props.allContentTypesForProfile ] );


    const setSideBarNavigationValues = ( data ) => {
        let cid = data[0].categories.map ( item => item.cid )
        let itemToSelect = "ItemsList-" + data[0].id + "-" + cid[0];
        setItemToSelect ( itemToSelect );
        props.setActiveKey ( data[0].id );
    }

    const processSearchResults = ( event, response ) => {

        const { searchResults, error } = response;

        if ( searchResults ) {
            props.loadAllSearchContent ( searchResults );

            if ( searchResults.length > 0 ) {
                const searchContentGroups = calculateGroups ( searchResults );
                const data = {
                    results: searchResults,
                    origin
                }
                const searchContent = calculateContent ( data );
                const firstGroupCid = searchContentGroups[0].categories[0].cid;
                const searchGroupId = searchContentGroups[0].id;
                localStorage.setItem ( 'firstGroupCid', firstGroupCid )
                localStorage.setItem ( 'searchGroupId', searchGroupId );
                props.loadSearch ( searchContent );
                props.loadGroups ( searchContentGroups );
                props.setResultSearch ( true );
                if ( searchContentGroups.length > 0 ) {
                    setSideBarNavigationValues ( searchContentGroups );
                }
            } else {
                props.loadSearch ( [] );
                props.loadGroups ( [] );

            }
        } else if ( error ) {
            setError ( true )
        }
        setLoading ( false )
    }

    const debounceSearchQuery = ( value ) => {
        clearTimeout ( tOut )
        setTOut ( setTimeout ( () => {
            props.resetSearch ();
            props.setSearchValue ( value )
        }, 350 ) );
    }

    const handleSearchQueryChange = ( event ) => {

        const { value, name, checked } = event.target;
        //console.log({value, name, checked});
        switch ( name ) {
            case "searchType":
                props.resetGroups ();
                props.resetSearch ();
                props.setContentType ( value );
                break;
            case "searchUnit":
                props.resetSearch ();
                props.resetGroups ();
                props.setBusinessUnit ( value );
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

        setLoading ( true );

        const options = {
            query: props.searchValue,
            profile: props.userProfile,
            type: props.contentTypes,
            businessUnit: props.businessUnits,
            group: "all",
            visitActive: false
        }
        ipcRenderer.send ( 'getSearchResult', options )
    }

    const handleKeyDown = ( event ) => {
        if ( ( [ 'Enter' ] ).includes ( event.key ) ) {
            event.preventDefault ();
            submitSearchQuery ( null )
        }
    }

    const calculateAllDocTypesForProfile = ( data ) => {
        const info = {
            data,
            origin: "contentType",
            defaultValue: t ( "All documents types" )
        }
        calculateAllOptions ( info, setAllContentTypes )
    }

    const calculateAllGroupsForProfile = ( data ) => {
        const info = {
            data,
            origin: "businessUnit",
            defaultValue: t ( "All business units" )
        }
        calculateAllOptions ( info, setAllBusinessUnit )
    }


    const handleClearSearch = ( event ) => {

        event.preventDefault ();
        const firstGroupCid = localStorage.getItem ( 'firstGroupCid' );
        const searchGroupId = localStorage.getItem ( 'searchGroupId' );
        setClearAll ( true );
        props.setSearchValue ( "" );
        setSearchValue ( "" );
        props.setContentType ( "all" );
        props.setBusinessUnit ( "all" );
        props.setActiveKey ( 0 );
        let cidList = [];
        let itemToSelect = "";
        if ( ( props.dataGroups.length > 0 ) && props.dataGroups.hasOwnProperty ( 'categories' ) && props.dataGroups[0].categories.length > 0 ) {
            cidList = props.dataGroups[0].categories.map ( item => item.cid )
        } else {
            cidList = [ firstGroupCid ];
        }

        if ( ( props.dataGroups.length > 0 ) && props.dataGroups[0].hasOwnProperty ( 'id' ) && props.dataGroups[0].id ) {
            itemToSelect = "ItemsList-" + props.dataGroups[0].id + "-" + cidList[0];
        } else {
            itemToSelect = "ItemsList-" + searchGroupId + "-" + cidList[0];
        }

        props.setSelectedItem ( itemToSelect );
        setLoading ( false );

        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail")
        //     category : "search",
        //     action : "clear",
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry, props.networkOnline )
    }

    return (
        <div className={ "Search h-100" }>
            <div className="Search__form">
                <FormGroup id="formSearchValue">
                    <div className={ "filter text-filter search-field" }>
                        <Form.Label className="text-muted">
                            {/*   { t ( "Search title" ) }*/ }
                            <Form.Control
                                type="text"
                                name="searchQuery"
                                value={ searchValue }
                                className="text-primary search-text"
                                onChange={ handleSearchQueryChange }
                                placeholder={ t ( "Search title" ) }
                                onKeyDown={ handleKeyDown }
                            />
                        </Form.Label>
                    </div>
                    <div className="filter type-filter unit-select">
                        <Form.Label className="text-muted">
                            <CheckboxDropdown
                                name="searchUnit"
                                items={ allBusinessUnits }
                                value={ props.businessUnits }
                                onChange={ handleSearchQueryChange }
                                title={ t ( "Business unit" ) }
                                callback={ props.setBusinessUnit }
                                id={ "business-unit-dropdown" }
                                clearAll={ clearAll }
                            />
                            {/*    <Dropdown>
                                <Dropdown.Toggle variant="light" id="dropdown-group" className="uniform-select">
                                    <Icon
                                        SvgSymbol={ Filter }/>
                                    <span className={ "filter-header" }>{ t ( "Filter group" ) }</span>

                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Form.Control
                                        as="select"
                                        name="searchUnit"
                                        onChange={ handleSearchQueryChange }
                                        multiple
                                        htmlSize={ 4 }
                                        value={ props.businessUnits }
                                    >

                                        {
                                            allBusinessUnits.length > 0 && allBusinessUnits.map ( ( businessUnit, index ) => {
                                                return (
                                                    <option key={ index } value={ businessUnit.key }
                                                    >
                                                        { businessUnit.value }
                                                    </option>
                                                )
                                            } )
                                        }
                                    </Form.Control>
                                </Dropdown.Menu>
                            </Dropdown>*/ }
                        </Form.Label>
                    </div>
                    <div className="filter type-filter type-select">
                        <Form.Label className="text-muted">
                            <CheckboxDropdown
                                name="searchType"
                                items={ allContentTypes }
                                value={ props.contentTypes }
                                onChange={ handleSearchQueryChange }
                                title={ t ( "Document" ) }
                                callback={ props.setContentType }
                                id={ "document-dropdown" }
                                clearAll={ clearAll }
                            />
                            {/*  <Dropdown>
                                <Dropdown.Toggle variant="light" id="dropdown-content" className="uniform-select">
                                    <Icon
                                        SvgSymbol={ Filter }/>
                                    <span className={ "filter-header" }>{ t ( "Filter content" ) }</span>

                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Form.Control
                                        as="select"
                                        name="searchType"
                                        onChange={ handleSearchQueryChange }
                                        multiple
                                        value={ props.contentTypes }
                                        htmlSize={ 4 }
                                    >
                                        {
                                            allContentTypes.length > 0 && allContentTypes.map ( ( contentType, index ) => {
                                                return (
                                                    <option key={ index } value={ contentType.key }
                                                    >
                                                        { contentType.value }
                                                    </option>
                                                )
                                            } )
                                        }
                                    </Form.Control>
                                </Dropdown.Menu>
                            </Dropdown>*/ }
                        </Form.Label>
                    </div>
                    <div className="Search__Buttons action-buttons">
                        <Button onClick={ handleClearSearch }
                                className="Search__Clear">{ t ( "Clear" ) }</Button>
                    </div>
                </FormGroup>
            </div>
            {
                loading &&
                !error &&
                <div className="Search__Results row">
                    <div className="Loader__Wrapper">
                        <Loader/>
                    </div>
                </div>
            }
            {
                !loading &&
                !error &&
                props.dataSearch && props.dataSearch.length > 0 &&
                <div className="Search__Results row">
                    <ItemsList itemsList={ props.dataSearch }/>
                </div>
            }
            {
                !loading &&
                !error &&
                ( !props.dataSearch || props.dataSearch.length === 0 ) &&
                <div className={ "Search__NoResults" }>
                    { t ( "Search error for results" ) }!
                </div>
            }
            {
                !loading &&
                error &&
                <div className={ "Search__NoResults" }>
                    { t ( "An error occurred while searching." ) }!
                </div>
            }

        </div>
    );
};

const mapStateToProps = ( state ) => ( {
    selectedKey: state.navigation.selectedKey,
    selectedItem: state.navigation.selectedItem,
    dataSearch: state.dataProcessor.dataSearch,
    allSearchContent: state.dataProcessor.dataSearchContent,
    resultSearchExist: state.dataProcessor.resultSearchExist,
    searchValue: state.dataProcessor.searchValue,
    contentTypes: state.dataProcessor.contentTypes,
    dataGroups: state.dataProcessor.dataGroups,
    businessUnits: state.dataProcessor.businessUnits,
    allGroupsForProfile: state.dataProcessor.allGroupsForProfile,
    allContentTypesForProfile: state.dataProcessor.allContentTypesForProfile,
    userEmail: state.settings.userEmail,
    userProfile: state.settings.userProfile,
    appPhase: state.settings.appPhase,
    startedVisitId: state.visitEditor.startedVisitId,
    networkOnline: state.sensors.networkAvailable
} )
const mapDispatchToProps = ( dispatch ) => {
    return {
        setActiveKey: ( activeKey ) => dispatch ( setActiveKey ( activeKey ) ),
        setSelectedItem: ( selectedItem ) => dispatch ( setSelectedItem ( selectedItem ) ),
        loadGroups: ( groups ) => dispatch ( loadGroups ( groups ) ),
        loadSearch: ( dataSearch ) => dispatch ( loadSearch ( dataSearch ) ),
        resetGroups: () => dispatch ( resetGroups () ),
        resetSearch: () => dispatch ( resetSearch () ),
        resetAllSearchContent: () => dispatch ( resetAllSearchContent () ),
        loadAllSearchContent: ( searchContent ) => dispatch ( loadAllSearchContent ( searchContent ) ),
        setContentType: ( contentType ) => dispatch ( setContentType ( contentType ) ),
        setBusinessUnit: ( businessUnit ) => dispatch ( setBusinessUnit ( businessUnit ) ),
        setResultSearch: ( resultSearch ) => dispatch ( setResultSearch ( resultSearch ) ),
        setSearchValue: ( searchValue ) => dispatch ( setSearchValue ( searchValue ) ),
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( Search );
