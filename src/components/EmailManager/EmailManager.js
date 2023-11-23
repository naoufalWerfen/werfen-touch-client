import React, { useEffect, useState } from 'react';
import { Col, Row } from "react-bootstrap";
import './EmailManager.scss';
import 'react-bootstrap-table2-filter/dist/react-bootstrap-table2-filter.min.css';
import { connect } from "react-redux";
import isElectron from "is-electron";
import { addToCreatedEmails, setNewEmail, setNewSupportEmail } from "../../redux/actions/emailEditor";
import { useTranslation } from 'react-i18next';
import EmailEditor from "../EmailEditor/EmailEditor";
import Icon from "../Icon/Icon";
import IconEdit from "../../assets/svgsymbols/edit";
import IconPending from "../../assets/svgsymbols/pending";
import IconError from "../../assets/svgsymbols/x-octagon";
import IconEmailSent from "../../assets/svgsymbols/circle-check";
import SupportIcon from "../../assets/svgsymbols/support";
import { sendToLogs } from "../../constants/functions";
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog";

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;


const parseEmailStatus = ( emailStatus ) => {
    let statusLabel;
    let statusClass;
    let isEditable;
    switch ( emailStatus ) {
        case "Error":
            statusClass = "error";
            statusLabel = "Error";
            isEditable = true;
            break;

        case "Dispatched to server":
            statusClass = "not-sent";
            statusLabel = "Not sent";
            isEditable = false;
            break;

        case "Not sent":
            statusClass = "not-sent";
            statusLabel = "Not sent";
            isEditable = false;
            break;

        case "Sent":
            statusClass = "sent";
            statusLabel = "Sent";
            isEditable = false;
            break;

        case "Draft":
            statusClass = "draft";
            statusLabel = "Draft";
            isEditable = true;
            break;

        default:
            statusClass = "not-sent";
            statusLabel = "Not sent";
            isEditable = false;
            break;
    }
    return { statusClass, statusLabel, isEditable }
}

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
                        <option value="">{ t ( "all" ) }</option>
                        { props.selectOptions.map ( ( option, index ) => {
                            return (
                                <option key={ index } value={ option.value }>{ option.label }</option>
                            )
                        } ) }
                    </select>
                </label>
            </div>
            <div className="button">
                <button
                    type="button"
                    className="reset"
                    onClick={ props.resetEmailSearch }
                >
                    { t ( "Clear" ) }
                </button>
            </div>
        </Col>
    );
}

const parseEmailIcon = ( status ) => {
    let statusIcon;
    switch ( status ) {

        case "draft":
            statusIcon = IconEdit
            break

        case "error":
            statusIcon = IconError;
            break

        case "sent":
            statusIcon = IconEmailSent
            break

        case "not-sent":
            statusIcon = IconPending
            break
    }
    return statusIcon
}

const EmailReader = ( props ) => {
    const { t } = useTranslation ();
    const { activeEmail, activeMessage } = props;
    const clientEmailsWithSeparation = JSON.parse ( activeEmail.clientEmails )
        .map ( ( clientEmail ) => clientEmail + "; " )
    const clientEmails = clientEmailsWithSeparation.map ( ( clientEmail, index ) => {
        if ( index === clientEmailsWithSeparation.length - 1 ) {
            clientEmail = clientEmail.replace ( "; ", "" );
        }
        return clientEmail
    } );


    const attachments = JSON.parse ( activeEmail.attachments );
    const emailCreatedOnDate = new Date ( activeEmail.createdOn );
    const emailCreatedOn = emailCreatedOnDate.toLocaleDateString ( "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    } )
    const emailCreatedOnText = emailCreatedOn + ", " + emailCreatedOnDate.toLocaleTimeString ();
    const status = parseEmailStatus ( activeEmail.status );
    const { statusLabel, statusClass, /*isEditable*/ } = status;
    const statusIcon = parseEmailIcon ( statusClass );


    /*
        const handleEdit = ( email ) => {
            const logEntry = {
                profileId : localStorage.getItem("tokenProfile"),
                userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
                category : "email",
                action : "edit",
                value : email.uuid
                severity : "log",
                visitId : props.startedVisitId
            }
            sendToLogs ( logEntry, props.networkOnline )

            //console.log ( "and then we activate editing" )
        }
    */

    return (
        <>
            {
                ( activeEmail && props.newEmail === false ) &&
                <div className="email-body text-left">
                    <div className="details card">
                        {/*<div className="name"><span>{ t ( "Name" ) }: </span>{ activeEmail.clientName }</div>*/ }
                        {/*<div className="entity"><span>{ t ( "Entity" ) }: </span>{ activeEmail.clientEntity }</div>*/ }
                        <div className="to"><span>{ t ( "To" ) }: </span>
                            {
                                clientEmails.map ( email => {
                                    return email;
                                } )
                            }
                        </div>
                        <div className="created"><span>{ t ( "Created on" ) }: </span>
                            { emailCreatedOnText }
                        </div>
                        <div className="attachments row">
                            {
                                activeEmail &&
                                attachments.map ( ( attachment, index ) => {
                                    return (
                                        <Col xs={ 4 } key={ attachment.name + "-" + index }
                                             className="LibraryTile attachment">
                                            <div className="LibraryTile__Item">
                                                <div className="LibraryTile__Meta">
                                                    { attachment.icon && <div
                                                        className={ "LibraryTile__Image text-center " + attachment.icon.toLowerCase () }>
                                                        { attachment.icon }
                                                    </div>
                                                    }
                                                    <div className="LibraryTile__Title">
                                                        { attachment.name }
                                                    </div>
                                                    <div className="LibraryTile__ActionHolder"/>
                                                </div>
                                            </div>
                                        </Col>
                                    )
                                } )
                            }
                        </div>
                        <div className="message">
                            { activeMessage }
                        </div>
                        {/*<div className="actions d-flex justify-content-end mb-5">
                            <div className={ "EmailReader__Buttons--menu " }>
                                <Button
                                    className={ "EmailReader__Edit edit-generic" }
                                    variant={ isEditable ? "primary" : "secondary" }
                                    disabled={ !isEditable }
                                    type="button"
                                    onClick={ () => handleEdit ( activeEmail ) }>
                                    { t ( "Edit" ) }
                                </Button>
                            </div>
                        </div>*/ }
                    </div>
                    <div className={ "status " + statusClass }>
                        <span>{ t ( statusLabel ) }</span>
                        <Icon
                            iconClass={ "icon" }
                            SvgSymbol={ statusIcon }
                            viewBox={ "0 0 24 24" }
                        />
                    </div>
                </div> }
            {
                props.newEmail && <EmailEditor/>
            }
        </>
    )
}

const EmailList = ( props ) => {
    const { t } = useTranslation ();
    const newCreatedOn = new Date ()
    const newCreatedOnShort = newCreatedOn.toLocaleDateString ( "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    } )

    return (
        <div className="list">
            {
                props.newEmail &&
                <div
                    className={ "card draft active" }
                >
                    <div className="name">{ props.clientEmail } &nbsp;</div>
                    {/*<div className="entity">{ props.clientEntity } &nbsp;</div>*/ }
                    <div className="createdOn">{ newCreatedOnShort }</div>
                    <div className="icon status draft">
                        <span>{ t ( "Draft" ) }</span>
                        <Icon
                            iconClass={ "icon" }
                            SvgSymbol={ IconEdit }
                            viewBox={ "0 0 24 24" }
                        />
                    </div>
                </div>
            }
            {
                props.emailListForTable && props.emailListForTable.map ( ( email, index ) => {
                    const status = parseEmailStatus ( email.status );
                    const { statusClass, statusLabel, isEditable } = status;
                    const createdOn = new Date ( email.createdOn )
                    const createdOnShort = createdOn.toLocaleDateString ( "en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                    } )
                    let cardClass = "card "
                    if ( isEditable ) {
                        cardClass += "editable "
                    }
                    if ( props.activeEmailOnList === index && props.newEmail === false ) {
                        cardClass += "active "
                    }

                    return (
                        <div
                            className={ cardClass + statusClass }
                            key={ index }
                            onClick={ () => props.setActiveEmailOnList ( index ) }
                        >
                            <div className="name">{ JSON.parse ( email.clientEmails )[0] }</div>
                            {/*<div className="entity">{ email.clientEntity }</div>*/ }
                            <div className="createdOn">{ createdOnShort }</div>
                            <div className={ "status " + statusClass }>
                                <span>{ t ( statusLabel ) }</span>
                                <Icon
                                    iconClass={ "icon" }
                                    SvgSymbol={ parseEmailIcon ( statusClass ) }
                                    viewBox={ "0 0 24 24" }
                                />
                            </div>
                        </div>
                    )
                } )
            }
        </div>
    )
}

const EmailManager = ( props ) => {
    const [ searchValue, setSearchValue ] = useState ( "" );
    const [ searchQuery, setSearchQuery ] = useState ( "" );
    const [ searchDate, setSearchDate ] = useState ( "" );
    const [ searchStatus, setSearchStatus ] = useState ( "" );
    const [ emailListForTable, setEmailListForTable ] = useState ( [] );
    const [ infoMessage, setInfoMessage ] = useState ( "" );
    const [ activeEmailOnList, setActiveEmailOnList ] = useState ( 0 );
    const [ tOut, setTOut ] = useState ();
    const [ showConfirmDiscard, setShowConfirmDiscard ] = useState ( false );
    const [ timestamp, setTimestamp ] = useState ( Date.now () );
    const [ render, setRender ] = useState ( Date.now () );
    const [ emailCreatedOffline, setEmailCreatedOffline ] = useState ( JSON.parse ( localStorage.getItem ( 'emailCreatedOffline' ) ) );
    const checkerUrl = process.env.REACT_APP_SERVER_PING;
    const [ appOnline, setAppOnline ] = useState ( null );
    /*const checkConnectivity = async () => {
        const online = await checkOnlineStatus ( checkerUrl );
        return online;
    }*/
    const { t } = useTranslation ();
    const title = t ( "Confirm discarding the email" )
    const messageArray = [
        t ( 'Discard email and lost changes' )
    ]


    const activeEmail = emailListForTable[activeEmailOnList];

    const addLineBreak = ( str ) =>
        str.split ( '\n' ).map ( ( subStr ) => {
            return (
                <>
                    { subStr }
                    <br/>
                </>
            );
        } );

    let message = "";
    if ( activeEmail && activeEmail.hasOwnProperty ( "message" ) && activeEmail.message.length > 0 ) {
        message = addLineBreak ( activeEmail.message );
    }

    const selectOptions = [
        {
            key: 'draft',
            value: 'Draft',
            label: t ( 'Draft' ),
            icon: IconEdit
        },
        {
            key: 'not-sent',
            value: 'Not sent',
            label: t ( 'Not sent' ),
            icon: IconPending
        },
        {
            key: 'sent',
            value: 'Sent',
            label: t ( 'Sent' ),
            icon: IconEmailSent
        },
        {
            key: 'error',
            value: 'Error',
            label: t ( 'Error' ),
            icon: IconError
        },
    ]

    let emailIcons = {}
    selectOptions.forEach ( option => {
        emailIcons[option.key] = option.icon;
    } );



    useEffect ( () => {
        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "navigation",
        //     action : "open",
        //     value : "email",
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry, props.networkOnline )

        sendForEmails ();
        ipcRenderer.on ( 'emailStoredDone', sendToRefreshList );
        ipcRenderer.on ( 'gotStoredEmails', processEmailsList );
        ipcRenderer.on ( 'emailMarkedSuccess', sendToRefreshList );
        ipcRenderer.on ( 'emailMarkedError', sendToRefreshList );
        /* checkConnectivity ()
         .then ( ( online ) => setAppOnline ( online ) )
         .catch ( ( error ) => console.log ( "error on checking connectivity", error ) )*/

        return () => {
            ipcRenderer.off ( 'emailStoredDone', sendToRefreshList );
            ipcRenderer.off ( 'gotStoredEmails', processEmailsList );
            ipcRenderer.off ( 'emailMarkedSuccess', sendToRefreshList );
            ipcRenderer.off ( 'emailMarkedError', sendToRefreshList );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    //TODO: When we'll have an endpoint to ping, this should work out jus fine

    /*useEffect ( () => {

        if ( ( emailCreatedOffline === true ) && ( appOnline === true ) ) {
            removeAndReload ( reloadApp )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ emailCreatedOffline, appOnline ] );*/

    const sendForEmails = () => {
        ipcRenderer.send ( 'searchForEmails', "initial" );
    }
    const removeAndReload = ( callback ) => {
        localStorage.removeItem ( 'emailCreatedOffline' );
        callback ();
    }

    const reloadApp = () => {
        window.location.reload ();
    }


    useEffect ( () => {
        // noinspection DuplicatedCode
        if ( searchStatus !== "" || searchDate !== "" || searchQuery !== "" ) {
            let emailQuery = {};
            if ( searchQuery !== "" ) {
                emailQuery.query = searchQuery;
            }
            if ( searchDate !== "" ) {
                emailQuery.date = searchDate;
            }
            if ( searchStatus !== "" ) {
                emailQuery.status = searchStatus;
            }

            const logEntry = {
                profileId: localStorage.getItem ( "tokenProfile" ),
                userId: localStorage.getItem ( "userEmail" ), // TODO: Store user email in localStorage
                category: "email",
                action: "search",
                value: JSON.stringify ( emailQuery ),
                severity: "log",
                visitId: props.startedVisitId
            }
            sendToLogs ( logEntry, props.networkOnline );
        }
        handleEmailSearch ();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ searchStatus, searchDate, searchQuery ] );

    useEffect ( () => {
        if ( props.clientEmail === "" ) {
            setRender ( Date.now () )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.clientEmail ] );


    const processEmailsList = ( event, { result, type } ) => {
        console.log ( { result, type } );
        if ( result.length === 0 ) {
            switch ( type ) {
                case "search":
                    setInfoMessage ( "No search results" )
                    break;

                case "initial":
                default:
                    setInfoMessage ( "No emails created" )
                    break;
            }
        } else {
            setInfoMessage ( "" )
        }
        setEmailListForTable ( result );
        setActiveEmailOnList ( 0 );
        if( type === "refresh" && timestamp ){
            setTimestamp( Date.now() )
        }
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

    const handleEmailSearch = () => {
        const searchData = {
            searchQuery: searchQuery !== "" ? searchQuery : undefined,
            date: searchDate !== "" ? searchDate : undefined,
            status: searchStatus !== "" ? searchStatus : undefined
        }
        ipcRenderer.send ( 'getEmailSearchResult', searchData );
    }

    const sendToRefreshList = () => {
        ipcRenderer.send ( 'searchForEmails', "refresh" );
    }

    const handleKeyDown = ( e ) => {
        if ( [ 'Enter', 'Tab', ',', ' ', ';' ].includes ( e.key ) ) {
            handleEmailSearch ();
        }
    }

    const resetEmailSearch = () => {
        setSearchValue ( "" );
        setSearchQuery ( "" );
        setSearchDate ( "" );
        setSearchStatus ( "" );
        setEmailListForTable ( [] );
        ipcRenderer.send ( 'searchForEmails', 'search' );
        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "email",
        //     action : "clear search",
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry, props.networkOnline )
    }

    const createNewEmail = ( forSupport ) => {
        props.setNewEmail ( true );
        if ( forSupport && forSupport === true ) {
            props.setNewSupportEmail ( true );
        }
        const logEntry = {
            profileId: localStorage.getItem ( "tokenProfile" ),
            userId: localStorage.getItem ( "userEmail" ), // TODO: Store user email in localStorage
            category: "email",
            action: "create",
            severity: "log",
            visitId: props.startedVisitId
        }
        sendToLogs ( logEntry, props.networkOnline )
    }


    const discardNewEmail = () => {
        setShowConfirmDiscard ( true )
    }

    const handleCloseConfirm = () => setShowConfirmDiscard ( false );
    const handleConfirmDiscard = () => {
        props.setNewEmail ( false );
        if ( props.newSupportEmail === true ) {
            props.setNewSupportEmail ( false );
        }
        const logEntry = {
            profileId: localStorage.getItem ( "tokenProfile" ),
            userId: localStorage.getItem ( "userEmail" ), // TODO: Store user email in localStorage
            category: "email",
            action: "discard",
            severity: "log",
            visitId: props.startedVisitId
        }
        sendToLogs ( logEntry, props.networkOnline )
        setShowConfirmDiscard ( false );
    }

    const confirmDiscardDraft = {
        show: showConfirmDiscard,
        onHide: handleCloseConfirm,
        contentClassName: "discard",
        title: title,
        messageArray: messageArray,
        handleOnCancel: handleCloseConfirm,
        handleOnAccept: handleConfirmDiscard,
        labelCancel: t ( "No" ),
        labelAccept: t ( "Yes" )
    }

    const confDialogsArray = [ confirmDiscardDraft ]

    return (
        <div className="EmailManager">
            <div className="support--wrapper">
                {
                    ( props.newEmail === false && props.newSupportEmail === false ) &&
                    <button
                        type="button"
                        disabled={ props.newVisit === true }
                        className={ props.newVisit === true ? "support text-center email-disabled" : "support text-center" }
                        onClick={ () => createNewEmail ( true ) }
                    >
                        <Icon
                            iconClass={ "icon" }
                            SvgSymbol={ SupportIcon }
                            viewBox={ "0 0 24 24" }
                        />
                    </button>
                }
            </div>
            <Row>
                <div className="EmailManager__Header">
                    <span className="EmailManager__Header--title">
                        { t ( "Created emails list" ) }
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
                    resetEmailSearch={ resetEmailSearch }
                />
                <Col xs={ 3 }>
                    <div className="button-wrapper">
                        {
                            props.newEmail === false &&
                            <button
                                type="button"
                                disabled={ props.newVisit === true }
                                className={ props.newVisit === true ? "create text-right email-disabled" : "create text-right" }
                                onClick={ createNewEmail }
                            >
                                { t ( "New email" ) }
                            </button>
                        }
                        {
                            props.newEmail === true &&
                            <button
                                type="button"
                                className="discard text-right"
                                onClick={ discardNewEmail }
                            >
                                { t ( "Discard" ) }
                            </button>
                        }
                    </div>
                </Col>
            </Row>
            {
                ( emailListForTable.length === 0 && props.newEmail === false ) &&
                <Row>
                    <div>
                        <span>{ t ( infoMessage ) }</span>
                    </div>
                </Row>
            }
            {
                activeEmail && emailListForTable.length !== 0 &&
                <Row className="fluid h-100">
                    <Col xs={ 12 } className="EmailManager__Table">
                        <div className="manager h-100">
                            <EmailList
                                emailListForTable={ emailListForTable }
                                activeEmailOnList={ activeEmailOnList }
                                setActiveEmailOnList={ setActiveEmailOnList }
                                newEmail={ props.newEmail }
                                clientName={ props.clientName }
                                clientEmail={ props.clientEmail }
                                clientEntity={ props.clientEntity }
                            />
                            <EmailReader
                                activeEmail={ activeEmail }
                                activeMessage={ message }
                                emailIcons={ emailIcons }
                                newEmail={ props.newEmail }
                            />
                        </div>
                    </Col>
                </Row>
            }
            {
                emailListForTable.length === 0 && props.newEmail &&
                <Row className="fluid h-100">
                    <Col xs={ 12 } className="EmailManager__Table">
                        <div className="manager h-100">
                            <EmailList
                                emailListForTable={ emailListForTable }
                                activeEmailOnList={ activeEmailOnList }
                                setActiveEmailOnList={ setActiveEmailOnList }
                                newEmail={ props.newEmail }
                                clientName={ props.clientName }
                                clientEntity={ props.clientEntity }
                            />
                            <EmailEditor/>
                        </div>
                    </Col>
                </Row>
            }
            { confDialogsArray.map ( ( dialog, index ) =>
                < ConfirmationDialog
                    key={ index }
                    show={ dialog.show }
                    onHide={ dialog.onHide }
                    contentClassName={ dialog.contentClassName }
                    title={ dialog.title }
                    messageArray={ dialog.messageArray }
                    handleOnCancel={ dialog.handleOnCancel }
                    handleOnAccept={ dialog.handleOnAccept }
                    labelCancel={ dialog.labelCancel }
                    labelAccept={ dialog.labelAccept }
                    displayConfirmationInput={ dialog.displayConfirmationInput || false }
                    confirmationInputType={ dialog.confirmationInputType || "" }
                />
            ) }
        </div>
    );
};

const mapStateToProps = ( state ) => ( {
    createdEmails: state.emailEditor.createdEmails,
    newEmail: state.emailEditor.newEmail,
    newSupportEmail: state.emailEditor.newSupportEmail,
    clientName: state.emailEditor.clientName,
    clientEmail: state.emailEditor.clientEmail,
    clientEntity: state.emailEditor.clientEntity,
    userEmail: state.settings.userEmail,
    userProfile: state.settings.userProfile,
    appPhase: state.settings.appPhase,
    newVisit: state.visitEditor.newVisit,
    startedVisitId: state.visitEditor.startedVisitId,
    networkOnline: state.sensors.networkAvailable
} );

const mapDispatchToProps = ( dispatch ) => {
    return {
        addToCreatedEmails: ( email ) => dispatch ( addToCreatedEmails ( email ) ),
        setNewEmail: ( newEmail ) => dispatch ( setNewEmail ( newEmail ) ),
        setNewSupportEmail: ( newSupportEmail ) => dispatch ( setNewSupportEmail ( newSupportEmail ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( EmailManager );
