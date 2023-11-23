import React, { useEffect, useState } from "react";
import { Button, Col, Form, FormGroup } from "react-bootstrap";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";

import {
    addClientEntity,
    addClientName,
    addDueOn,
    addToEmailsList,
    addVisitNotes,
    cleanEmailsList,
    removeAllFromAttachments,
    removeClientEntity,
    removeClientName,
    removeFromAttachments,
    removeFromEmailsList,
    resetDueOn,
    resetVisitNotes,
    setNewVisit,
} from "../../redux/actions/visitEditor";
import { connect } from "react-redux";
import isElectron from "is-electron";
import { useTranslation } from "react-i18next";
import './VisitEditor.scss';
import { v4 as uuidv4 } from 'uuid';
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog";

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;


const VisitEditor = ( props ) => {
    const { t } = useTranslation ()
    /*  const initialMessage = t ( "Email greetings placeholder" ) + "\n" +
          "\n" +
          t ( "Email body placeholder" ) + "\n" +
          "\n" +
          t ( "Email regards placeholder" )*/
    const [ valueNotes, setValueNotes ] = useState ( "" );
    const [ valueName, setValueName ] = useState ( "" );
    const [ valueEntity, setValueEntity ] = useState ( "" );
    const [ valueReceiverEmail, setReceiverEmail ] = useState ( "" );
    const [ valueReceiverEmails, setReceiverEmails ] = useState ( [] );
    const [ error, setError ] = useState ( "" );
    const [ valueStatus, setValueStatus ] = useState ( "Draft" );
    const [ startDate, setStartDate ] = useState ( new Date () );

    const [ showConfirmClean, setShowConfirmClean ] = useState ( false );
    const [ showConfirmCleanAttachments, setShowConfirmCleanAttachments ] = useState ( false );

    const titleClean = t ( "Confirm discarding the changes" )
    const messageArrayClean = [
        t ( 'Discard all changes and lost changes' )
    ]

    const titleCleanAttachments = t ( "Confirm discarding the attachments" );
    const messageArrayCleanAttachments = [
        t ( 'Discard all attachments' )
    ]
    const { attachments } = props;
    let createdVisit = {}

    const handleSubmit = ( event, callback ) => {
        if ( props.networkOnline === false ) {
            alert ( t ( "App email offline" ) )
        }
        event.preventDefault ();
        let recipientsEmails = valueReceiverEmails;
        // if ( props.sendCopyToUser === "Yes" ) {
        //     recipientsEmails = [ ...recipientsEmails, props.userEmail ]
        // }
        let attachedInfo = props.attachments.map ( ( item ) => {
            return {
                icon: item.icon,
                type: item.type,
                uuid: item.uuid,
                name: item.name,
                gid: item.gid
            }
        } );
        let receiverEmails = recipientsEmails.map ( item => item + "\n\n" );
        createdVisit.id = props.createdVisits.length;
        createdVisit.uuid = uuidv4 ();
        createdVisit.clientEmails = receiverEmails;
        createdVisit.clientName = valueName;
        createdVisit.clientEntity = valueEntity;
        createdVisit.attachments = attachedInfo;
        const today = new Date ();
        const todayParsed = Date.parse ( today );
        createdVisit.createdOn = todayParsed.toString ();
        const dueParsed = Date.parse ( startDate );
        createdVisit.dueOn = dueParsed.toString ();
        createdVisit.updatedOn = todayParsed.toString ();
        createdVisit.notes = valueNotes;
        createdVisit.status = "Pending";
        //console.log ( "Created visit", createdVisit );
        props.setNewVisit ( false );
        callback ( createdVisit );
    }

    const sendToCreatedVisits = ( visitObject ) => {
        ipcRenderer.send ( "createdVisit", visitObject );
    }

    const handleDeleteItem = ( e, uuid ) => {
        e.preventDefault ();
        props.removeFromAttachments ( uuid )
    }

    const evaluateEmail = ( email ) => {
        let requiredError = "";
        switch ( true ) {
            case( email && isValid ( email ) && email !== "" ):
                setReceiverEmails ( [ ...valueReceiverEmails, email ] );
                props.addToEmails ( email );
                setReceiverEmail ( "" );
                break;
            case( email === "" && valueReceiverEmails.length === 0 ):
                requiredError = t ( "Email address required" );
                setError ( requiredError );
                break;
            case( email === "" && valueReceiverEmails.length > 0 ):
                requiredError = `"${ email }" ${ t ( "Invalid email address error" ) }`;
                setError ( requiredError );
                break;
            default:
                break;
        }
    }

    const handleKeyDown = ( e ) => {
        if ( [ 'Enter', 'Tab', ',', ' ', ';' ].includes ( e.key ) ) {
            e.preventDefault ();
            let email = valueReceiverEmail.trim ();
            evaluateEmail ( email );
        }
    }

    const handleDeleteEmail = ( toBeRemoved ) => {
        props.removeFromEmails ( toBeRemoved );
        let filteredEmails = valueReceiverEmails.filter ( email => email !== toBeRemoved );
        setReceiverEmails ( filteredEmails );
    };


    const handleClean = ( e ) => {

        setValueName ( "" );
        setValueEntity ( "" );
        setValueNotes ( "" );
        setReceiverEmails ( [] );
        setStartDate ( new Date () )
        props.removeAllFromAttachments ();
        props.cleanEmails ();
        props.removeClientName ();
        props.removeClientEntity ();
        props.resetVisitNotes ();
        props.resetDueOn ();
        if ( showConfirmClean ) {
            setShowConfirmClean ( false );
        }
    }

    const handleCleanAll = ( event ) => {
        event.preventDefault ();
        props.removeAllFromAttachments ();
        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "visit",
        //     action : "clear attachments",
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry,  props.networkOnline )
        if ( showConfirmCleanAttachments ) {
            setShowConfirmCleanAttachments ( false );
        }
    }

    const handleDateChange = ( date ) => {
        setStartDate ( date );
        props.addDueOn ( date );
    }

    const isEmail = ( email ) => {
        // noinspection RegExpRedundantEscape
        return /[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/.test ( email ); // eslint-disable-line
    }

    const isInList = ( email ) => {
        return valueReceiverEmails.includes ( email );
    }

    const isValid = ( email ) => {
        let error = ""
        if ( !isEmail ( email ) ) {
            error = `"${ email }" ${ t ( "Invalid email address error" ) }`;
        }

        if ( isInList ( email ) ) {
            error = `"${ email }" ${ t ( "Email address added error" ) }`;
        }

        if ( error !== "" ) {
            setError ( error );
            return false;
        }
        return true;
    }

    const handleVisitStoreDone = ( event, uuid ) => {
        // TODO: Call the operation that sends stuff to BE
        setValueStatus ( "Visit has been successfully added." );
        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "visit",
        //     action : "save",
        //     value : uuid,
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry,  props.networkOnline )
        setTimeout ( () => {
            setValueStatus ( "" );
            setValueName ( "" );
            setValueEntity ( "" );
            handleClean ( null );
        }, 1500 );
    }

    const clearVisitData = ( e ) => {
        e.preventDefault ();
        setShowConfirmClean ( true );
    }

    const clearVisitAttachments = ( e ) => {
        e.preventDefault ();
        setShowConfirmCleanAttachments ( true );
    }

    const handleCloseConfirmClean = () => {
        setShowConfirmClean ( false );
    }

    const handleCloseConfirmCleanAttachments = () => {
        setShowConfirmCleanAttachments ( false );
    }

    const confirmClean = {
        show: showConfirmClean,
        onHide: handleCloseConfirmClean,
        contentClassName: "Settings__Modal",
        title: titleClean,
        messageArray: messageArrayClean,
        handleOnCancel: handleCloseConfirmClean,
        handleOnAccept: handleClean,
        labelCancel: t ( "No" ),
        labelAccept: t ( "Yes" ),
    }

    const confirmCleanAttachments = {
        show: showConfirmCleanAttachments,
        onHide: handleCloseConfirmCleanAttachments,
        contentClassName: "Settings__Modal",
        title: titleCleanAttachments,
        messageArray: messageArrayCleanAttachments,
        handleOnCancel: handleCloseConfirmCleanAttachments,
        handleOnAccept: handleCleanAll,
        labelCancel: t ( "No" ),
        labelAccept: t ( "Yes" ),
    }

    const confDialogsArray = [ confirmClean, confirmCleanAttachments ]

    useEffect ( () => {
        ipcRenderer.on ( "visitStoredDone", handleVisitStoreDone );
        return () => {
            ipcRenderer.off ( "visitStoredDone", handleVisitStoreDone );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    /*   useEffect ( () => {
           setValueNotes ( t ( "Email greetings placeholder" ) + "\n" +
               "\n" +
               t ( "Email body placeholder" ) + "\n" +
               "\n" +
               t ( "Email regards placeholder" ) )
           // eslint-disable-next-line react-hooks/exhaustive-deps
       }, [ props.contentLanguage ] );*/


    useEffect ( () => {
        //TODO: make the code below flexible enough to allow making corrections in every form field
        if ( props.clientName !== "" ) {
            setValueName ( props.clientName );
        }
        if ( props.clientEntity !== "" ) {
            setValueEntity ( props.clientEntity );
        }
        if ( props.clientEmails.length > 0 ) {
            setReceiverEmails ( props.clientEmails );
        }
        if ( props.visitNotes !== "" ) {
            setValueNotes ( props.visitNotes );
        }
        if ( props.dueOn !== "" ) {
            let newDueOn = new Date ( props.dueOn );
            setStartDate ( newDueOn )
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        props.clientEntity,
        props.clientName,
        props.clientEmails.length,
        props.clientEmails,
        props.dueOn,
        props.visitNotes
    ] )

    return (
        <>
            <Form className={ "VisitEditor" } onSubmit={ () => handleSubmit.bind }>
                <FormGroup controlId="formBasicVisit"
                           className="VisitEditor__Form"
                >
                    <div className="visit-body text-left">
                        {
                            <>
                                <div className="details card">
                                    <div className="name"><span>{ t ( "Name" ) }: </span>
                                        <Form.Control
                                            controlId={ "name" }
                                            type="text"
                                            name="Name"
                                            value={ valueName }
                                            className="text-primary"
                                            onChange={ ( e ) => {
                                                setValueName ( e.target.value )
                                                props.addClientName ( e.target.value )
                                            } }
                                            placeholder={ t ( "Name placeholder" ) }
                                        />
                                    </div>
                                    <div className="entity">
                                        <span>{ t ( "Entity" ) }: </span>
                                        <Form.Control
                                            controlId={ "entity" }
                                            type="text"
                                            name="Entity"
                                            value={ valueEntity }
                                            className="text-primary"
                                            onChange={ ( e ) => {
                                                setValueEntity ( e.target.value )
                                                props.addClientEntity ( e.target.value )
                                            } }
                                            //onBlur={ ( e ) => props.addClientEntity( e.target.value ) }
                                            placeholder={ t ( "Entity" ) }
                                        />
                                    </div>
                                    <div className="to">
                                        <span>{ t ( "To" ) }: </span>
                                        <div className="VisitEditor__Recipients">
                                            { props.clientEmails.map ( email => {
                                                return (
                                                    <div key={ email }
                                                         className="VisitEditor__Recipients--item">
                                                        <div>{ email }</div>
                                                        <button
                                                            type="button"
                                                            onClick={ () => handleDeleteEmail ( email ) }
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                )
                                            } ) }
                                            <div className={ "VisitEditor__Recipients--wrapper" }>
                                                <Form.Control
                                                    controlId={ "email" }
                                                    type="email"
                                                    name="Receiver"
                                                    value={ valueReceiverEmail }
                                                    className={ "text-primary VisitEditor__Recipients--input" }
                                                    onChange={ ( e ) => {
                                                        setReceiverEmail ( e.target.value );
                                                        setError ( "" )
                                                    } }
                                                    placeholder={ t ( "Email input placeholder" ) }
                                                    onKeyDown={ handleKeyDown }
                                                />
                                                { error &&
                                                <span className={ "VisitEditor__Recipients--error" }>{ error }</span> }
                                            </div>
                                        </div>
                                    </div>
                                    <div className="due">
                                        <span>{ t ( "Due on" ) }: </span>
                                        <div className="filter date-filter ">
                                            <label className="filter-label"
                                                   htmlFor="date-filter-comparator-sentOn">
                                                <span className="sr-only">{ t ( "Date" ) }</span>
                                                <div>
                                                    <DatePicker
                                                        selected={ startDate }
                                                        onChange={ handleDateChange }
                                                        showTimeSelect
                                                        timeIntervals={ 10 }
                                                        dateFormat="Pp"
                                                        className={ "filter" }
                                                    />
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="attachments row">
                                        {
                                            attachments.map ( ( attachment, index ) => {
                                                return (
                                                    <Col xs={ 4 } key={ index }
                                                         className="SearchTile attachment">
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
                                                                    <div
                                                                        className="actionButton actionButton--delete remove-attachment"
                                                                        onClick={ event => {
                                                                            handleDeleteItem ( event, attachment.uuid )
                                                                            event.preventDefault ();
                                                                            /* console.log ( "clicked on :", attachment.uuid )*/
                                                                        } }
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <g id="path">
                                                                                <circle cx="12" cy="12"
                                                                                        r="10"/>
                                                                                <line x1="15" y1="9" x2="9"
                                                                                      y2="15"/>
                                                                                <line x1="9" y1="9" x2="15"
                                                                                      y2="15"/>
                                                                            </g>
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                )
                                            } )
                                        }

                                    </div>
                                    <div className="attachments row justify-content-end">
                                        {
                                            attachments.length > 0 &&
                                            <div
                                                className="discard"
                                                onClick={ clearVisitAttachments }
                                            >
                                                { t ( "Clear attached" ) }
                                            </div>
                                        }
                                    </div>
                                    <div className="message">
                                        <Form.Control
                                            controlId={ "message" }
                                            as="textarea"
                                            rows="10"
                                            name="message"
                                            className="text-primary"
                                            value={ valueNotes }
                                            onChange={ ( e ) => setValueNotes ( e.target.value ) }
                                            onBlur={ ( e ) => props.addVisitNotes ( e.target.value ) }
                                        />
                                    </div>
                                    <div className="actions justify-content-end">
                                        <div className={ "VisitEditor__Buttons--menu " }>
                                            <Button
                                                className={ "VisitEditor__Send send-generic" }
                                                disabled={ error !== "" || valueReceiverEmails.length < 1 }
                                                type="submit"
                                                onClick={ ( e ) => handleSubmit ( e, sendToCreatedVisits ) }>
                                                { t ( "Submit" ) }
                                            </Button>
                                            <Button className={ "VisitEditor__Cancel reset" }
                                                    onClick={ ( e ) => clearVisitData ( e ) }>
                                                { t ( "Clear" ) }
                                            </Button>
                                        </div>
                                        {/*  <Button
                                                        className={ error ? "visitEditor__List email-list_error" : "visitEditor__List email-list" }
                                                        onClick={ goToEmailsList }
                                                    >
                                                        { t( "Emails list" ) }
                                                    </Button>*/ }
                                    </div>
                                </div>
                                <span
                                    className={ "status draft" }
                                >
                                    { t ( valueStatus ) }
                                    </span>
                            </>
                        }
                    </div>
                </FormGroup>
            </Form>
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
                />
            ) }
        </>
    )
}

const mapStateToProps = ( state ) => ( {
    attachments: state.visitEditor.attachments,
    clientEmails: state.visitEditor.customerEmails,
    clientName: state.visitEditor.clientName,
    clientEntity: state.visitEditor.clientEntity,
    notes: state.visitEditor.notes,
    createdVisits: state.visitEditor.createdVisits,
    dueOn: state.visitEditor.dueOn,
    contentLanguage: state.settings.contentLanguage,
    sendCopyToUser: state.settings.sendCopy,
    networkOnline: state.sensors.networkAvailable,
    newEmail: state.visitEditor.newEmail,
    userEmail: state.settings.userEmail,
    userProfile: state.settings.userProfile,
    appPhase: state.settings.appPhase,
} )

const mapDispatchToProps = ( dispatch ) => {
    return {
        removeFromAttachments: ( id ) => dispatch ( removeFromAttachments ( id ) ),
        removeAllFromAttachments: () => dispatch ( removeAllFromAttachments () ),
        addToEmails: ( email ) => dispatch ( addToEmailsList ( email ) ),
        removeFromEmails: ( email ) => dispatch ( removeFromEmailsList ( email ) ),
        cleanEmails: () => dispatch ( cleanEmailsList () ),
        addClientName: ( name ) => dispatch ( addClientName ( name ) ),
        removeClientName: () => dispatch ( removeClientName () ),
        addClientEntity: ( entity ) => dispatch ( addClientEntity ( entity ) ),
        removeClientEntity: () => dispatch ( removeClientEntity () ),
        addVisitNotes: ( notes ) => dispatch ( addVisitNotes ( notes ) ),
        resetVisitNotes: () => dispatch ( resetVisitNotes () ),
        addDueOn: ( dueDate ) => dispatch ( addDueOn ( dueDate ) ),
        resetDueOn: () => dispatch ( resetDueOn () ),
        setNewVisit: ( newVisit ) => dispatch ( setNewVisit ( newVisit ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( VisitEditor );
