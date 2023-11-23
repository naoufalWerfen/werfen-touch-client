import React, { useEffect, useState } from 'react';
import { Col, Row } from "react-bootstrap";
import './VisitManager.scss';
import 'react-bootstrap-table2-filter/dist/react-bootstrap-table2-filter.min.css';
import { connect } from "react-redux";
import isElectron from "is-electron";
import { useTranslation } from 'react-i18next';
import VisitEditor from "../VisitEditor/VisitEditor";
import { addToCreatedVisits, setNewVisit } from "../../redux/actions/visitEditor";
import Icon from "../Icon/Icon";
import Clock from "../../assets/svgsymbols/clock";
import { sendToLogs } from "../../constants/functions";
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog";

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" );
}
const ipcRenderer = electron && electron.ipcRenderer;

const Filters = ( props ) => {
    const { t } = useTranslation ();
    return (
        <Col xs={ 9 } className="filters">
            <div className="filter text-filter">
                <label>
                    <span className="sr-only">{ t ( "Search" ) }:</span>
                    <input
                        type="text"
                        name="searchQuery"
                        placeholder={ t ( "Email search placeholder" ) }
                        aria-label={ t ( "Email search placeholder" ) }
                        className="form-control"
                        value={ props.searchValue }
                        onChange={ event => props.handleSearchQueryChange ( event ) }
                        onKeyDown={ event => props.handleKeyDown ( event ) }
                    />
                </label>
            </div>
            <div className="filter date-filter ">
                <label className="filter-label"
                       htmlFor="date-filter-comparator-sentOn">
                    <span className="sr-only">{ t ( "Date" ) }</span>
                    <input
                        id="date"
                        name="searchDate"
                        className="filter form-control"
                        type="date"
                        placeholder={ t ( "Date search placeholder" ) }
                        aria-label={ t ( "Date search placeholder" ) }
                        value={ props.searchDate }
                        onChange={ event => props.handleSearchQueryChange ( event ) }
                        onKeyDown={ event => props.handleKeyDown ( event ) }
                    />
                </label>
            </div>
            <div className="filter status-filter">
                <label
                    className="filter-label"
                    htmlFor="select-filter-column-status"
                >
                    <span className="sr-only">{ t ( "Status" ) }</span>
                    <select
                        id="select-filter-column-status"
                        name="searchStatus"
                        defaultValue=""
                        className="filter select-filter form-control placeholder-selected"
                        placeholder={ t ( "Select Status" ) }
                        aria-label={ t ( "Select Status" ) }
                        onChange={ event => props.handleSearchQueryChange ( event ) }
                    >
                        <option value="">{ t ( "Email status placeholder" ) }</option>
                        { props.selectOptions.map ( ( option, index ) => {
                            return (
                                <option key={ index } value={ option.value }>{ option.label }</option>
                            )
                        } ) }
                    </select>
                </label>
            </div>
            <div className="filter sort-filter">
                <select
                    id="select-filter-column-status"
                    name="searchStatus"
                    defaultValue=""
                    className="filter select-filter form-control placeholder-selected"
                    placeholder={ t ( "Select date" ) }
                    aria-label={ t ( "Select date" ) }
                    onChange={ e => props.handleSortByDate ( e ) }
                >
                    <option value="">{ t ( 'Sort by date' ) }</option>
                    { props.dates.map ( ( option, index ) => {
                        return (
                            <option key={ index } value={ option.value }>{ option.label }</option>
                        )
                    } ) }
                </select>
            </div>
            <div className="button">
                <button
                    type="button"
                    className="reset"
                    onClick={ props.resetVisitSearch }
                >
                    { t ( "Clear" ) }
                </button>
            </div>
        </Col>
    );
}

const VisitReader = ( props ) => {
    const { t } = useTranslation ();
    const { activeVisit, visitIcons } = props;
    const clientEmails = JSON.parse ( activeVisit.clientEmails );
    const attachments = JSON.parse ( activeVisit.attachments );
    const visitDueOnDate = new Date ( activeVisit.dueOn );
    const visitDueOn = visitDueOnDate.toLocaleDateString ( "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "numeric"
    } )
    const visitUpdatedOnDate = new Date ( activeVisit.updatedOn );
    const visitUpdatedOn = visitUpdatedOnDate.toLocaleDateString ( "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "numeric"
    } )
    const visitDueOnText = visitDueOn + ", " + visitDueOnDate.toLocaleTimeString ();
    const visitUpdatedOnText = visitUpdatedOn + ", " + visitDueOnDate.toLocaleTimeString ();
    const visitStatusLabel = activeVisit.status.toLowerCase ().split ( " " ).join ( "-" );


    return (
        <>
            {
                ( activeVisit && props.newVisit === false ) &&
                <div className="visit-body text-left">
                    <div className="details card">
                        <div className="name"><span>{ t ( "Name" ) }: </span>{ activeVisit.clientName }</div>
                        <div className="entity"><span>{ t ( "Entity" ) }: </span>{ activeVisit.clientEntity }
                        </div>
                        <div className="to"><span>{ t ( "To" ) }: </span>{ clientEmails.map ( email => {
                            return email;
                        } ) }
                        </div>
                        { ( activeVisit.status === "Pending" || activeVisit.status === "Postponed" ) &&
                            <div className="due">
                                <span>{ t ( "Due on" ) }: </span>{ visitDueOnText }
                            </div> }
                        { ( activeVisit.status === "Made" || activeVisit.status === "Canceled" ) &&
                            <div className="due">
                                <span>{ t ( "Updated on" ) }: </span>{ visitUpdatedOnText }
                            </div> }
                        <div className="attachments row">
                            {
                                activeVisit && attachments.map ( ( attachment, index ) => {
                                    return (
                                        <Col xs={ 4 } key={ index } className="SearchTile attachment">
                                            <div className="SearchTile__Item">
                                                <div className="SearchTile__Meta">
                                                    <div
                                                        className={ "SearchTile__Image text-center " + attachment.icon.toLowerCase () }>
                                                        { attachment.icon }
                                                    </div>
                                                    <div className="SearchTile__Title">
                                                        { attachment.name }
                                                    </div>
                                                    <div className="SearchTile__ActionHolder">
                                                        {/*<div*/ }
                                                        {/*    className="actionButton actionButton--delete remove-attachment"*/ }
                                                        {/*    onClick={ event => {*/ }
                                                        {/*        event.preventDefault ();*/ }
                                                        {/*        console.log ( "clicked on :", attachment.uuid )*/ }
                                                        {/*    } }*/ }
                                                        {/*>*/ }
                                                        {/*    <svg*/ }
                                                        {/*        xmlns="http://www.w3.org/2000/svg"*/ }
                                                        {/*        viewBox="0 0 24 24"*/ }
                                                        {/*    >*/ }
                                                        {/*        <g id="path">*/ }
                                                        {/*            <circle cx="12" cy="12" r="10"/>*/ }
                                                        {/*            <line x1="15" y1="9" x2="9"*/ }
                                                        {/*                  y2="15"/>*/ }
                                                        {/*            <line x1="9" y1="9" x2="15"*/ }
                                                        {/*                  y2="15"/>*/ }
                                                        {/*        </g>*/ }
                                                        {/*    </svg>*/ }
                                                        {/*</div>*/ }
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    )
                                } )
                            }
                        </div>
                        <div className="message">
                            { activeVisit.notes }
                        </div>
                    </div>
                    { ( activeVisit.status === "Pending" || activeVisit.status === "Postponed" ) && <div
                        className="start"
                        onClick={ ( e ) => props.handleStartVisit ( e, activeVisit.uuid ) }
                    >
                        Start visit
                    </div> }
                    { ( activeVisit.status === "Made" ) && <div
                        className="start"
                        onClick={ ( e ) => props.handleStartVisit ( e, activeVisit.uuid ) }
                    >
                        Restart visit
                    </div> }
                    <span
                        className={ "status " + visitStatusLabel }
                    >
                                    { t ( activeVisit.status ) + " " + visitIcons[visitStatusLabel] }
                                    </span>
                </div> }
            {
                props.newVisit && <VisitEditor/>
            }
        </>
    )
}

const VisitsList = ( props ) => {
    const { t } = useTranslation ();
    const [ dueOn, setDueOn ] = useState ( "" )
    const [ dueOnShort, setDueOnShort ] = useState ( "" )
    let newDueOn,
        newDueOnShort;
    const getVisitDueOn = ( dueOn ) => {
        newDueOn = new Date ( dueOn );
        newDueOnShort = newDueOn.toLocaleDateString ( "en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "numeric"
        } )
        return newDueOnShort
    }
    const clock = {
        name: "Clock",
        className: "Clock",
        icon: Clock
    }

    useEffect ( () => {
        setDueOn ( props.dueOn )
    }, [ props.dueOn ] );


    useEffect ( () => {
        newDueOn = new Date ( dueOn );
        newDueOnShort = newDueOn.toLocaleDateString ( "en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "numeric"
        } )
        setDueOnShort ( newDueOnShort );

    }, [ dueOn, setDueOn, dueOnShort ] );

    return (
        <div className="list">
            {
                props.newVisit && <>
                    <div
                        className={ "card  active" }
                    >
                        <div className="name">{ props.clientName } &nbsp;</div>
                        <div className="entity">{ props.clientEntity } &nbsp;</div>
                        { dueOnShort !== "Invalid Date" && <div className="dueOn">{ dueOnShort }</div> }
                        <div className="status">{ t ( "Draft" ) }</div>
                    </div>
                </>
            }
            {
                props.visitListForTable && props.visitListForTable.map ( ( visit, index ) => {
                    const statusClass = visit.status ? visit.status.toLowerCase ().split ( " " ).join ( "-" ) : ""
                    const parsed = JSON.parse ( visit.attachments );
                    const attachmentsGid = Object.values ( parsed.map ( item => item.gid ) );
                    const groups = [ ...new Set ( attachmentsGid ) ]
                    return (
                        <div
                            className={ "card" + ( ( props.activeVisitOnList === index && props.newVisit === false ) ? " active " : " " ) + statusClass }
                            key={ index }
                            onClick={ () => props.setActiveVisitOnList ( index ) }
                        >
                            <div className="name">{ visit.clientName }</div>
                            <div className="entity">{ visit.clientEntity }</div>
                            {
                                ( visit.status === "Pending" || visit.status === "Postponed" ) &&
                                <div className="dueOn">
                                    <Icon
                                        iconClass={ clock.className + "__Icon" }
                                        SvgSymbol={ clock.icon }
                                        viewBox={ "0 0 24 24" }
                                    />
                                    <span>{ getVisitDueOn ( visit.dueOn ) }</span>
                                </div> }
                            {
                                groups.length > 0 &&
                                <div className={ "attachment-groups" }>
                                    {
                                        groups.map ( ( gid, index ) => {
                                            return ( <div key={ index }
                                                          className={ "attachment-group attachment-group-" + gid }>
                                            </div> )
                                        } ) }
                                </div>
                            }
                            <div className="status">{ t ( visit.status ) }</div>
                        </div>
                    )
                } )
            }
        </div>
    )
}

const VisitManager = ( props ) => {
    const [ searchValue, setSearchValue ] = useState ( "" );
    const [ searchQuery, setSearchQuery ] = useState ( "" );
    const [ searchDate, setSearchDate ] = useState ( "" );
    const [ searchStatus, setSearchStatus ] = useState ( "" );
    const [ visitListForTable, setVisitListForTable ] = useState ( [] );
    const [ infoMessage, setInfoMessage ] = useState ( "" );
    const [ activeVisitOnList, setActiveVisitOnList ] = useState ( 0 );
    const [ tOut, setTOut ] = useState ();
    const [ sortedDate, setSortedDate ] = useState ( "" );
    const { t } = useTranslation ();
    const [ showConfirmDiscard, setShowConfirmDiscard ] = useState ( false );

    const title = t ( "Confirm discarding the visit" )
    const messageArray = [
        t ( 'Discard visit and lost changes' )
    ]

    const activeVisit = visitListForTable[activeVisitOnList];


    const selectOptions = [
        {
            key: 'pending',
            value: 'Pending',
            label: t ( 'Pending' ),
            icon: "✗"
        },
        {
            key: 'made',
            value: 'Made',
            label: t ( 'Made' ),
            icon: "✓✓"
        },
        {
            key: 'postponed',
            value: 'Postponed',
            label: t ( 'Postponed' ),
            icon: ".."
        },
        {
            key: 'canceled',
            value: 'Canceled',
            label: t ( 'Canceled' ),
            icon: "!!"
        },
    ]

    const dates = [
        {
            key: 'createdOn',
            value: 'createdOn',
            label: t ( 'Created on' ),
        },
        {
            key: 'dueOn',
            value: 'dueOn',
            label: t ( 'Due on' ),
        },
        {
            key: 'updatedOn',
            value: 'updatedOn',
            label: t ( 'Updated on' ),
        }

    ]

    let visitIcons = {}
    selectOptions.forEach ( option => {
        visitIcons[option.key] = option.icon;
    } );

    useEffect ( () => {
        ipcRenderer.send ( 'searchForVisits', "initial" );
        ipcRenderer.on ( "visitStoredDone", handleVisitStoreDone );
        ipcRenderer.on ( 'gotStoredVisits', processVisitsList );
        return () => {
            ipcRenderer.off ( "visitStoredDone", handleVisitStoreDone );
            ipcRenderer.off ( 'gotStoredVisits', processVisitsList );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    useEffect ( () => {
        // noinspection DuplicatedCode
        if ( searchStatus !== "" || searchDate !== "" || searchQuery !== "" ) {
            let visitQuery = {};
            if ( searchQuery !== "" ) {
                visitQuery.query = searchQuery;
            }
            if ( searchDate !== "" ) {
                visitQuery.date = searchDate;
            }
            if ( searchStatus !== "" ) {
                visitQuery.status = searchStatus;
            }

            // const logEntry = {
            //     profileId : localStorage.getItem("tokenProfile"),
            //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
            //     category : "search",
            //     action : "search",
            //     value : visitQuery,
            //     severity : "log",
            //     visitId : props.startedVisitId
            // }
            // sendToLogs ( logEntry, props.networkOnline )

        }
        handleVisitSearch ();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ searchStatus, searchDate, searchQuery ] );

    useEffect ( () => {

    }, [ sortedDate ] )

    const processVisitsList = ( event, { result, type } ) => {
        if ( result.length === 0 ) {
            switch ( type ) {
                case "search":
                    setInfoMessage ( "No search results" )
                    break;

                case "initial":
                default:
                    setInfoMessage ( "No visits created" )
                    break;
            }
        } else {
            setInfoMessage ( "" )
        }
        setVisitListForTable ( result );
        setActiveVisitOnList ( 0 )
    }

    const debounceSearchQuery = ( value ) => {
        clearTimeout ( tOut )
        setTOut ( setTimeout ( () =>
            setSearchQuery ( value ), 350 ) );
    }

    const handleSearchQueryChange = ( event ) => {
        const { value, name } = event.target;

        switch ( name ) {
            case "searchStatus":
                setSearchStatus ( value );
                break;

            case "searchDate":
                setSearchDate ( value );
                break;

            case "searchQuery":
            default:
                debounceSearchQuery ( value )
                setSearchValue ( value );
                break;
        }
    }

    const handleVisitSearch = () => {
        const searchData = {
            searchQuery: searchQuery !== "" ? searchQuery : undefined,
            date: searchDate !== "" ? searchDate : undefined,
            status: searchStatus !== "" ? searchStatus : undefined
        }
        ipcRenderer.send ( 'getVisitSearchResult', searchData );
    }

    const handleVisitStoreDone = () => {
        ipcRenderer.send ( 'searchForVisits', "refresh" );
    }

    const handleKeyDown = ( e ) => {
        if ( [ 'Enter', 'Tab', ',', ' ', ';' ].includes ( e.key ) ) {
            handleVisitSearch ();
        }
    }

    const resetVisitSearch = () => {
        setSearchValue ( "" );
        setSearchQuery ( "" );
        setSearchDate ( "" );
        setSearchStatus ( "" );
        setVisitListForTable ( [] );
        ipcRenderer.send ( 'searchForVisits', 'search' );
        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "visit",
        //     action : "clear search",
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry, props.networkOnline )
    }

    const createNewVisit = () => {
        props.setNewVisit ( true );
        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "visit",
        //     action : "create",
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry, props.networkOnline )
    }

    const discardNewVisit = () => {
        setShowConfirmDiscard ( true );
    }

    const handleSortByDate = ( e ) => {
        e.preventDefault ()
        let sortedList = visitListForTable.sort ( function ( a, b ) {
            return new Date ( a[e.target.value] ) - new Date ( b[e.target.value] );
        } );
        setSortedDate ( e.target.value )
        setVisitListForTable ( sortedList )
    }

    const handleStartVisit = ( e, uuid ) => {
        e.preventDefault ();
        //console.log('Starting visit', uuid)
        ipcRenderer.send ( 'startVisit', uuid )
    }

    const handleCloseConfirm = () => setShowConfirmDiscard ( false );
    const handleConfirmDiscard = () => {
        props.setNewVisit ( false );
        const logEntry = {
            profileId : localStorage.getItem("tokenProfile"),
            userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
            category: "email",
            action: "discard",
            severity: "log",
            visitId: props.startedVisitId
        }
        sendToLogs ( logEntry, props.networkOnline )
        setShowConfirmDiscard ( false );
    }

    const confirmDiscardVisit = {
        show: showConfirmDiscard,
        onHide: handleCloseConfirm,
        contentClassName: "Settings__Modal",
        title: title,
        messageArray: messageArray,
        handleOnCancel: handleCloseConfirm,
        handleOnAccept: handleConfirmDiscard,
        labelCancel: t ( "No" ),
        labelAccept: t ( "Yes" )
    }

    const confDialogsArray = [ confirmDiscardVisit ]
    return (
        <div className="VisitManager">
            <Row>
                <div className="VisitManager__Header">
                    <span className="VisitManager__Header--title">
                        { t ( "Created visits list" ) }
                    </span>
                </div>
            </Row>
            <Row
                className="fluid"
            >
                <Filters
                    searchValue={ searchValue }
                    searchDate={ searchDate }
                    searchStatus={ searchStatus }
                    handleSearchQueryChange={ handleSearchQueryChange }
                    handleKeyDown={ handleKeyDown }
                    selectOptions={ selectOptions }
                    resetVisitSearch={ resetVisitSearch }
                    handleSortByDate={ handleSortByDate }
                    dates={ dates }
                />
                <Col xs={ 3 }>
                    <div className="button-wrapper">
                        {
                            props.newVisit === false &&
                            <button
                                type="button"
                                className={ props.newEmail === true ? "create text-right visit-disabled" : "create text-right" }
                                disabled={ props.newEmail === true }
                                onClick={ createNewVisit }
                            >
                                { t ( "New visit" ) }
                            </button>
                        }
                        {
                            props.newVisit === true &&
                            <button
                                type="button"
                                className="discard text-right"
                                onClick={ discardNewVisit }
                            >
                                { t ( "Discard" ) }
                            </button>
                        }
                    </div>
                </Col>
            </Row>
            {
                ( visitListForTable.length === 0 && props.newVisit === false ) &&
                <Row>
                    <div>
                        <span>{ t ( infoMessage ) }</span>
                    </div>
                </Row>
            }
            {
                activeVisit && visitListForTable.length !== 0 &&
                <Row className="fluid">
                    <Col xs={ 12 } className="VisitManager__Table">
                        <div className="manager">
                            <VisitsList
                                visitListForTable={ visitListForTable }
                                activeVisitOnList={ activeVisitOnList }
                                setActiveVisitOnList={ setActiveVisitOnList }
                                newVisit={ props.newVisit }
                                clientName={ props.clientName }
                                clientEntity={ props.clientEntity }
                                dueOn={ props.dueOn }
                            />
                            <VisitReader
                                activeVisit={ activeVisit }
                                visitIcons={ visitIcons }
                                newVisit={ props.newVisit }
                                handleStartVisit={ handleStartVisit }
                            />
                        </div>
                    </Col>
                </Row>
            }
            {
                visitListForTable.length === 0 && props.newVisit && <Row className="fluid">
                    <Col xs={ 12 } className="VisitManager__Table">
                        <div className="manager">
                            <VisitsList
                                visitListForTable={ visitListForTable }
                                activeVisitOnList={ activeVisitOnList }
                                setActiveVisitOnList={ setActiveVisitOnList }
                                newVisit={ props.newVisit }
                                clientName={ props.clientName }
                                clientEntity={ props.clientEntity }
                                dueOn={ props.dueOn }
                            />
                            <VisitEditor/>
                        </div>
                    </Col>
                </Row>
            }
            { confDialogsArray.map ( ( dialog, index ) =>
                < ConfirmationDialog
                    show={ dialog.show }
                    onHide={ dialog.onHide }
                    contentClassName={ dialog.contentClassName }
                    title={ dialog.title }
                    messageArray={ dialog.messageArray }
                    handleOnCancel={ dialog.handleOnCancel }
                    handleOnAccept={ dialog.handleOnAccept }
                    labelCancel={ dialog.labelCancel }
                    labelAccept={ dialog.labelAccept }
                    key={ index }
                />
            ) }
        </div>
    );
};

const mapStateToProps = ( state ) => ( {
    createdVisits: state.visitEditor.createdVisits,
    dueOn: state.visitEditor.dueOn,
    newVisit: state.visitEditor.newVisit,
    clientName: state.visitEditor.clientName,
    clientEntity: state.visitEditor.clientEntity,
    userEmail: state.settings.userEmail,
    userProfile: state.settings.userProfile,
    appPhase: state.settings.appPhase,
    newEmail: state.emailEditor.newEmail,
    networkOnline: state.sensors.networkAvailable
} );

const mapDispatchToProps = ( dispatch ) => {
    return {
        addToCreatedVisits: ( visit ) => dispatch ( addToCreatedVisits ( visit ) ),
        setNewVisit: ( newVisit ) => dispatch ( setNewVisit ( newVisit ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( VisitManager );
