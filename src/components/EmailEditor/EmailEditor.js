import React, { useEffect, useState } from "react";
import { Button, Col, Form, FormGroup, InputGroup, Modal } from "react-bootstrap";
import {
    addClientEmail,
    addClientEnity,
    addClientName,
    addEmailMessage,
    addToEmailsList,
    addToMailAttachments,
    cleanEmailsList,
    removeAllFromMailAttachments,
    removeClientEntity,
    removeClientName,
    removeFromEmailList,
    removeFromMailAttachments,
    resetEmailMessage,
    setNewEmail,
    setNewSupportEmail
} from "../../redux/actions/emailEditor";
import { connect } from "react-redux";
import isElectron from "is-electron";
import { useTranslation } from "react-i18next";
import './EmailEditor.scss';
import { v4 as uuidv4 } from 'uuid';
import Icon from "../Icon/Icon";
import IconEdit from "../../assets/svgsymbols/edit"
import { logoutOnUpdateProfilesError, prepareEmailToSend, sendEmailsToBackend } from "../../constants/functions";
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog";
import { alert } from "react-custom-alert";
import 'react-custom-alert/dist/index.css';
import { setAppPhase } from "../../redux/actions/settings"; // import css file from root.

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const EmailEditor = ( props ) => {
    const { t } = useTranslation ();
    const checkerUrl = process.env.REACT_APP_SERVER_PING;
    const separator = props.appLanguage === "English" ? " " : "\n";
    const initialMessage = t ( "Email greetings placeholder" ) + separator +
        separator +
        t ( "Email body placeholder" ) + "\n" +
        "\n" +
        t ( "Email regards placeholder" )
    const supportMessage = "Dear Werfen Touch 3.0 Team: " + "\n" +
        "\n" +
        "I contact you regarding the following issue with the application: " + "\n" +
        "\n" +
        t ( "Email regards placeholder" )
    const [ valueMessage, setValueMessage ] = useState ( "" );
    const [ valueName, setValueName ] = useState ( "" );
    const [ valueEmail, setValueEmail ] = useState ( "" );
    const [ valueEntity, setValueEntity ] = useState ( "" );
    const [ valueReceiverEmail, setReceiverEmail ] = useState ( "" );
    const [ valueReceiverEmails, setReceiverEmails ] = useState ( [] );
    const [ error, setError ] = useState ( "" );
    const [ emailStatus, setEmailStatus ] = useState ( "Draft" );
    const [ showConfirmDiscard, setShowConfirmDiscard ] = useState ( false );
    const [ showConfirmClean, setShowConfirmClean ] = useState ( false );
    const [ showConfirmCleanAttachments, setShowConfirmCleanAttachments ] = useState ( false );
    const [ show, setShow ] = useState ( false );
    const [ privacyChecked, setPrivacyChecked ] = useState ( false );
    const title = t ( "Confirm discarding the email" )
    const messageArray = [
        t ( 'Discard email and lost changes' )
    ]
    const titleClean = t ( "Confirm discarding the changes" )
    const messageArrayClean = [
        t ( 'Discard all changes and lost changes' )
    ]

    const titleCleanAttachments = t ( "Confirm discarding attachments" );
    const messageArrayCleanAttachments = [
        t ( 'Discard all attachments' )
    ]

    const displayPrivatePolicy = () => {
        setShow ( true )
    }

    const handleClosePrivacyPolicy = ( e ) => {
        setShow ( false )
    }


    const { mailAttachments } = props;

    const emailCreatedOnDate = new Date ();
    const emailCreatedOn = emailCreatedOnDate.toLocaleDateString ( "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    } )
    const emailCreatedOnText = emailCreatedOn + ", " + emailCreatedOnDate.toLocaleTimeString ();

    let createdEmail = {};
    const alertEmailSent = ( data ) => alert ( { message: data.message, type: data.type } );
    const displayAlert = ( data ) => alert ( { message: data.message, type: data.type } );

    async function getBase64 ( file ) {
        return new Promise ( ( resolve, reject ) => {
            const reader = new FileReader ()
            reader.readAsDataURL ( file )
            reader.onload = () => {
                resolve ( reader.result.replace ( /^.+?;base64,/, '' ) )
            }
            reader.onerror = reject
        } )
    }

    const addFilesAsAttachments = ( e ) => {
        const selectedFiles = [ ...e.target.files ];
        if ( Array.isArray ( selectedFiles ) ) {
            selectedFiles.forEach ( async ( selectedFile ) => {
                let b64 = await getBase64 ( selectedFile )
                    .catch ( err => console.log ( err ) );
                const doc = {
                    b64,
                    name: selectedFile.name,
                    icon: "LOG",
                    type: "logger",
                    uuid: uuidv4 ()
                }
                props.addToMailAttachments ( doc );
            } )
        }
    }

    const handleSubmit = async ( event, callback ) => {
        if ( props.networkOnline === false ) {
            const emailCreatedOffline = true;
            localStorage.setItem ( 'emailCreatedOffline', JSON.stringify ( emailCreatedOffline ) );
            const data = {
                message: t ( "Offline email pending" ),
                type: "warning"
            }
            alertEmailSent ( data );
        }
        event.preventDefault ();
        let recipientsEmails = valueReceiverEmails;
        let extraFiles = [];

        const mailAttachmentsWithBlob = props.mailAttachments.filter ( ( item ) => item.hasOwnProperty ( 'b64' ) )
        if ( mailAttachmentsWithBlob.length > 0 ) {
            mailAttachmentsWithBlob.forEach ( ( attachmentWithBlob ) => {
                const fileData = {
                    b64: attachmentWithBlob.b64,
                    filename: attachmentWithBlob.name
                }
                extraFiles.push ( fileData );
            } )

        }
        const attachedInfo = props.mailAttachments.map ( ( item ) => {

                return {
                    icon: item.icon,
                    name: item.name,
                    type: item.type,
                    uuid: item.uuid
                }
            } )
        ;

        createdEmail.extraFiles = extraFiles;

        const filteredAttachedInfo = attachedInfo;
        createdEmail.id = props.createdEmails.length;
        createdEmail.uuid = uuidv4 ();
        createdEmail.clientEmails = recipientsEmails;
        createdEmail.clientName = valueName;
        createdEmail.clientEntity = valueEntity;
        createdEmail.mailAttachments = filteredAttachedInfo || []
        const today = new Date ();
        const todayParsed = Date.parse ( today );
        createdEmail.createdOn = todayParsed.toString ();
        createdEmail.sentOn = "";
        createdEmail.message = valueMessage;
        createdEmail.status = "Not sent";
        createdEmail.cc = [ localStorage.getItem ( "userEmail" ) ]
        //createdEmail.visitId = "None";
        props.setNewEmail ( false );
        if ( props.solo !== undefined && props.solo === true ) {
            props.setSolo ( false );
        }
        if ( props.newSupportEmail && props.newSupportEmail === true ) {
            props.setNewSupportEmail ( false )
        }
        callback ( createdEmail );
    }

    const alertMessages = [
        {
            id: "confirmation-message",
            text: t ( "Email sent" )
        },
        {
            id: "error-message",
            text: t ( "Error sending email" )
        }
    ]

    const sendToCreatedEmails = async ( emailObject ) => {
        let emailData = Object.assign ( {}, emailObject );
        ipcRenderer.send ( "createdEmail", emailObject );
        const emailsInfo = {
            emailsToPrepare: [ emailData ],
            createdEmail: emailData,
            origin: "emailEditor",
        }
        if ( props.networkOnline ) {
            const dataToSend = prepareEmailToSend ( emailsInfo );
            dataToSend.alertMessages = alertMessages;
            dataToSend.alertEmailSent = alertEmailSent;
            await sendEmailsToBackend ( dataToSend )
                .catch ( ( error ) => {
                    if ( ( error === "Invalid JWT Token" ) || ( error === "Wrong user profile(s) in the app" ) ) {
                        const alertData = {
                            message: ( error === "Invalid JWT Token" ) ? t ( "Session expired" ) : t ( "Wrong user profiles" ),
                            type: "error"
                        }
                        const setAppToLogin = () => props.setAppPhase ( 'login' );
                        const info = {
                            alertData,
                            error,
                            displayAlert,
                            isOnline: props.networkOnline,
                            setAppToLogin
                        }
                        logoutOnUpdateProfilesError ( info );
                    }
                    console.error ( "Error on sendEmailsToBackend", error )
                } );
        }
    }

    const handleDeleteItem = ( e, uuid ) => {
        e.preventDefault ();
        props.removeFromAttachments ( uuid );
    }

    const evaluateEmail = ( email ) => {
        let requiredError = "";
        switch ( true ) {
            case( email === "" ):
                break;
            case( email && isValid ( email ) ):
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

    const handleBlur = ( e ) => {
        e.preventDefault ();
        let email = valueReceiverEmail.trim ();
        evaluateEmail ( email );
    }

    const handleDeleteEmail = ( toBeRemoved ) => {
        props.removeFromEmails ( toBeRemoved );
        let filteredEmails = valueReceiverEmails.filter ( email => email !== toBeRemoved );
        setReceiverEmails ( filteredEmails );
    };

    const handleClean = ( e ) => {
        if ( e !== null ) {
            e.preventDefault ();
            // const logEntry = {
            //      profileId : localStorage.getItem("tokenProfile"),
            //      userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
            //     category : "email",
            //     action : "clear",
            //     severity : "log",
            //     visitId : props.startedVisitId
            // }
            // sendToLogs ( logEntry, props.networkOnline )
        }
            setValueName ( "" );
        setValueEntity ( "" );
        setValueMessage ( "" );
        setReceiverEmails ( [] );
        props.resetEmailMessage ();
        props.removeAllFromMailAttachments ();
        props.cleanEmails ();
        props.removeClientName ();
        props.removeClientEntity ();
        if ( props.solo === true ) {
            props.setSolo ( false );
        }
        if ( showConfirmClean ) {
            setShowConfirmClean ( false );
        }
    }

    const handleCleanAll = ( event ) => {
        event.preventDefault ();
        props.removeAllFromMailAttachments ();
        if ( props.solo !== undefined && props.solo === true ) {
            const calcOutputData = JSON.parse ( localStorage.getItem ( 'calcAttachmentData' ) );
            localStorage.removeItem ( 'calcAttachmentData' )
            ipcRenderer.send ( 'discardCalcOutput', calcOutputData );
        }
        // const logEntry = {
        //      profileId : localStorage.getItem("tokenProfile"),
        //      userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "email",
        //     action : "discard all attachments",
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry, props.networkOnline )

        if ( showConfirmCleanAttachments ) {
            setShowConfirmCleanAttachments ( false );
        }
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

    const handleDraftDiscard = (event )=> {
        event.preventDefault ()
        const calcOutputData = JSON.parse ( localStorage.getItem ( 'calcAttachmentData' ) );
        localStorage.removeItem ( 'calcAttachmentData' )
        ipcRenderer.send ( 'discardCalcOutput', calcOutputData );
        setTimeout ( () => {
            handleClean ( null )
        }, 500 )
        setShowConfirmDiscard ( false )
        if ( props.solo ) {
            props.setSolo ( false );
        }
        if ( props.newSupportEmail ) {
            props.setNewSupportEmail ( false );
        }
    }
    const setPlaceholder = () => {
        props.newSupportEmail ? setValueMessage ( supportMessage ) : setValueMessage ( initialMessage );
    }

    const discardNewEmail = ( e ) => {
        e.preventDefault ();
        setShowConfirmDiscard ( true );
    }
    const cleanEmailDraft = ( e ) => {
        e.preventDefault ();
        setShowConfirmClean ( true );
    }

    const cleanEmailAttachments = ( e ) => {
        e.preventDefault ();
        setShowConfirmCleanAttachments ( true );
    }

    const handleCloseConfirm = () => {
        setShowConfirmDiscard ( false );
    }
    const handleCloseConfirmClean = ( callback ) => {
        props.resetEmailMessage ();
        setShowConfirmClean ( false );
        callback ();
    }

    const handleCloseConfirmCleanAttachments = () => {
        setShowConfirmCleanAttachments ( false );
    }


    const confirmDiscard = {
        show: showConfirmDiscard,
        onHide: handleCloseConfirm,
        contentClassName: "discard",
        title: title,
        messageArray: messageArray,
        handleOnCancel: handleCloseConfirm,
        handleOnAccept: handleDraftDiscard,
        labelCancel: t ( "No" ),
        labelAccept: t ( "Yes" )
    }
    const confirmClean = {
        show: showConfirmClean,
        onHide: handleCloseConfirmClean,
        contentClassName: "discard",
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
        contentClassName: "discard",
        title: titleCleanAttachments,
        messageArray: messageArrayCleanAttachments,
        handleOnCancel: handleCloseConfirmCleanAttachments,
        handleOnAccept: handleCleanAll,
        labelCancel: t ( "No" ),
        labelAccept: t ( "Yes" ),
    }

    const confDialogsArray = [ confirmDiscard, confirmClean, confirmCleanAttachments ]

    useEffect ( () => {
        setPlaceholder ();
        if ( props.newSupportEmail && props.clientEmails.length === 1 ) {
            const userEmail = localStorage.getItem ( 'userEmail' );
            props.addToEmails ( userEmail );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.contentLanguage ] );


    useEffect ( () => {
        //TODO: make the code below flexible enough to allow making corrections in every form field
        if ( props.clientName !== "" ) {
            setValueName ( props.clientName );
        }
        if ( props.clientEmail !== "" ) {
            setValueEmail ( props.clientEmail );
        }
        if ( props.clientEntity !== "" ) {
            setValueEntity ( props.clientEntity );
        }
        if ( props.clientEmails.length > 0 ) {
            setReceiverEmails ( props.clientEmails );
        }
        if ( props.emailMessage !== "" ) {
            setValueMessage ( props.emailMessage );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        props.clientEntity,
        props.clientName,
        props.clientEmail,
        props.clientEmails.length,
        props.clientEmails,
        props.emailMessage
    ] )

    useEffect ( () => {
        if ( valueReceiverEmails.length >= 1 ) {
            props.addClientEmail ( valueReceiverEmails[0] );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ valueReceiverEmail ] );

    useEffect ( () => {
        console.log ( valueReceiverEmails )
        if ( valueReceiverEmails.length === 0 ) {
            props.addClientEmail ( "" )
        } else {
            props.addClientEmail ( valueReceiverEmails[0] );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ valueReceiverEmails ] );


    return (
        <>
            <Form className={ props.solo ? "EmailEditorSolo" : "EmailEditor" } onSubmit={ () => handleSubmit.bind }>
                { props.solo &&
                    <div
                        className={ 'EmailEditorSolo__Discard' } onClick={ discardNewEmail }>x</div>
                }
                <FormGroup id="formBasicEmail"
                           className="EmailEditor__Form"
                >
                    <div className="email-body text-left">
                        {
                            <>
                                <div className="details card">
                                    {/*<div className="name"><span>{ t ( "Name" ) }: </span>*/ }
                                    {/*    <Form.Control*/ }
                                    {/*        id={ "name" }*/ }
                                    {/*        type="text"*/ }
                                    {/*        name="Name"*/ }
                                    {/*        value={ valueName }*/ }
                                    {/*        className="text-primary"*/ }
                                    {/*        onChange={ ( e ) => {*/ }
                                    {/*            setValueName ( e.target.value )*/ }
                                    {/*            props.addClientName ( e.target.value )*/ }
                                    {/*        } }*/ }
                                    {/*        placeholder={ t ( "Name placeholder" ) }*/ }
                                    {/*    />*/ }
                                    {/*</div>*/ }
                                    {/*<div className="entity">*/ }
                                    {/*    <span>{ t ( "Entity" ) }: </span>*/ }
                                    {/*    <Form.Control*/ }
                                    {/*        id={ "entity" }*/ }
                                    {/*        type="text"*/ }
                                    {/*        name="Entity"*/ }
                                    {/*        value={ valueEntity }*/ }
                                    {/*        className="text-primary"*/ }
                                    {/*        onChange={ ( e ) => {*/ }
                                    {/*            setValueEntity ( e.target.value )*/ }
                                    {/*            props.addClientEntity ( e.target.value )*/ }
                                    {/*        } }*/ }
                                    {/*        //onBlur={ ( e ) => props.addClientEntity( e.target.value ) }*/ }
                                    {/*        placeholder={ t ( "Entity" ) }*/ }
                                    {/*    />*/ }
                                    {/*</div>*/ }
                                    { props.newSupportEmail === false && <div className="to">
                                        <span>{ t ( "To" ) }: </span>
                                        <div className="EmailEditor__Recipients">
                                            { props.clientEmails.map ( email => {
                                                return (
                                                    <div key={ email }
                                                         className="EmailEditor__Recipients--item">
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
                                            <div className={ "EmailEditor__Recipients--wrapper" }>
                                                <Form.Control
                                                    id={ "email" }
                                                    type="email"
                                                    name="Receiver"
                                                    value={ valueReceiverEmail }
                                                    className={ "text-primary EmailEditor__Recipients--input" }
                                                    onChange={ ( e ) => {
                                                        setReceiverEmail ( e.target.value );
                                                        // if (valueReceiverEmails.length === 1 ) {
                                                        //     props.addClientEmail ( valueReceiverEmails[0])
                                                        // }
                                                        // else
                                                        if ( valueReceiverEmails.length === 0 ) {
                                                            props.addClientEmail ( e.target.value );
                                                        }
                                                        setError ( "" )
                                                    } }
                                                    placeholder={ t ( "Email input placeholder" ) }
                                                    onKeyDown={ handleKeyDown }
                                                    onBlur={ handleBlur }
                                                />
                                                {
                                                    error &&
                                                    <span
                                                        className={ "EmailEditor__Recipients--error" }>{ error }</span>
                                                }
                                            </div>
                                        </div>
                                    </div> }
                                    { props.newSupportEmail === true && <div className="attach-file">
                                        <Form.Group controlId="formFileMultiple" className="mb-3">
                                            <Form.Label className="custom-file-upload">
                                                <Form.Control
                                                    className="button-upload"
                                                    type="file"
                                                    onChange={ addFilesAsAttachments }
                                                    multiple/>
                                                { t ( "Attach evidence" ) }
                                            </Form.Label>
                                            <div className="attachments row">
                                                {
                                                    mailAttachments.map ( ( attachment, index ) => {
                                                        return (
                                                            <Col xs={ 4 } key={ index }
                                                                 className="LibraryTile attachment">
                                                                <div className="LibraryTile__Item">
                                                                    <div className="LibraryTile__Meta">
                                                                        <div
                                                                            className={ "LibraryTile__Image text-center " + attachment.icon.toLowerCase () }>
                                                                            { attachment.icon }
                                                                        </div>
                                                                        <div className="LibraryTile__Title">
                                                                            { attachment.name }
                                                                        </div>
                                                                        { props.solo !== true &&
                                                                            <div className="LibraryTile__ActionHolder">
                                                                                <div
                                                                                    className="actionButton actionButton--delete remove-attachment"
                                                                                    onClick={ event => {
                                                                                        handleDeleteItem ( event, attachment.uuid )
                                                                                        event.preventDefault ();
                                                                                        // console.log ( "clicked on :", attachment.uuid )
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
                                                                            </div> }
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                        )
                                                    } )
                                                }
                                            </div>
                                        </Form.Group>
                                    </div>
                                    }

                                    <div className="created">
                                        <span>{ t ( "Created on" ) }: </span>{ emailCreatedOnText }
                                    </div>
                                    { props.newSupportEmail === false && <div className="attachments row">
                                        {
                                            mailAttachments.map ( ( attachment, index ) => {
                                                return (
                                                    <Col xs={ 4 } key={ index }
                                                         className="LibraryTile attachment">
                                                        <div className="LibraryTile__Item">
                                                            <div className="LibraryTile__Meta">
                                                                <div
                                                                    className={ "LibraryTile__Image text-center " + attachment.icon.toLowerCase () }>
                                                                    { attachment.icon }
                                                                </div>
                                                                <div className="LibraryTile__Title">
                                                                    { attachment.name }
                                                                </div>
                                                                {props.solo !== true && <div className="LibraryTile__ActionHolder">
                                                                    <div
                                                                        className="actionButton actionButton--delete remove-attachment"
                                                                        onClick={ event => {
                                                                            handleDeleteItem ( event, attachment.uuid )
                                                                            event.preventDefault ();
                                                                            // console.log ( "clicked on :", attachment.uuid )
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
                                                                </div> }
                                                            </div>
                                                        </div>
                                                    </Col>
                                                )
                                            } )
                                        }
                                    </div> }
                                    <div className="attachments row justify-content-end">
                                        {
                                            (mailAttachments.length > 0 && props.solo !== true) &&
                                            <div
                                                className="discard"
                                                onClick={ cleanEmailAttachments }
                                            >
                                                { t ( "Clear attached" ) }
                                            </div>
                                        }
                                    </div>
                                    <div className="message">
                                        <Form.Control
                                            id={ "message" }
                                            as="textarea"
                                            rows="10"
                                            name="message"
                                            className="text-primary"
                                            value={ valueMessage }
                                            onChange={ ( e ) => setValueMessage ( e.target.value ) }
                                            onBlur={ ( e ) => props.addEmailMessage ( e.target.value ) }
                                        />
                                    </div>
                                    <div className="actions justify-content-end">
                                        <div className={ "EmailEditor__Buttons--menu " }>
                                            { props.userProfile === "italia_vendite" && <InputGroup className="mb-3">
                                                <InputGroup.Checkbox checked={ privacyChecked }
                                                                     onChange={ ( e ) => setPrivacyChecked ( e.target.checked ) }
                                                                     aria-label="Checkbox for following text input"/>
                                                <InputGroup.Text>Ho letto e accetto la
                                                    <Button
                                                        className={ 'EmailEditor__Privacy-link' }
                                                        onClick={ ( e ) => displayPrivatePolicy ( e ) }>Private
                                                        Policy</Button>
                                                </InputGroup.Text>

                                            </InputGroup> }
                                            <Button
                                                className={ ( error !== "" || valueReceiverEmails.length < 1 || ( props.userProfile === "italia_vendite" && privacyChecked === false ) ) ? "EmailEditor__Send send-disabled" : "EmailEditor__Send send-generic" }
                                                disabled={ error !== "" || valueReceiverEmails.length < 1 || ( props.userProfile === "italia_vendite" && privacyChecked === false ) }
                                                type="submit"
                                                onClick={ ( e ) => handleSubmit ( e, sendToCreatedEmails ) }>
                                                { t ( "Submit" ) }
                                            </Button>
                                            { props.solo !== true && <Button className={ "EmailEditor__Cancel reset" }
                                                                             onClick={ ( e ) => cleanEmailDraft ( e ) }>
                                                { t ( "Clear" ) }
                                            </Button> }
                                            { props.solo === true && <Button className={ "EmailEditor__Cancel reset" }
                                                                             onClick={ ( e ) => discardNewEmail ( e ) }>
                                                { t ( "Discard" ) }
                                            </Button> }
                                        </div>
                                    </div>
                                </div>
                                <div className={ "status draft" }>
                                    <span>{ t ( emailStatus ) }</span>
                                    <Icon
                                        iconClass={ "icon" }
                                        SvgSymbol={ IconEdit }
                                        viewBox={ "0 0 24 24" }
                                    />
                                </div>
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
                    displayConfirmationInput={ dialog.displayConfirmationInput || false }
                    confirmationInputType={ dialog.confirmationInputType || "" }
                />
            ) }
            <Modal className={ "EmailEditor__Privacy" } show={ show } onHide={ handleClosePrivacyPolicy }>
                <Modal.Header closeButton>
                    <Modal.Title>TERMS</Modal.Title>
                </Modal.Header>
                <Modal.Body className={ "EmailEditor__Privacy-body" }>
                    <div>
                        <div className="row">
                            <div className="col-md-12 col-lg-12 col-middle">
                                <div className={ "row EmailEditor__Privacy-wrapper" }>
                                    <p><b>INFORMATIVA RESA AI CLIENTI PER IL TRATTAMENTO DEI DATI PERSONALI ai sensi e
                                        per gli effetti dell’art. 13
                                        del <em>“Regolamento (Ue) 2016/679 del Parlamento Europeo e del Consiglio del 27
                                            aprile 2016 relativo alla
                                            protezione delle persone fisiche, con riguardo al trattamento dei dati
                                            personali, nonché della libera
                                            circolazione di tali dati e che abroga la direttiva 95/46/CE (regolamento
                                            generale sulla protezione dei
                                            dati”)</em> (di seguito solo il “Regolamento”).</b></p>

                                    <p>Ai sensi dell’art. 13 del Regolamento, la società “Instrumentation Laboratory
                                        Spa” (di seguito la “Società” o
                                        il “Titolare”), con sede legale in Milano Viale Monza 338, in persona del
                                        proprio legale rappresentante
                                        pro–tempore, con la presente Le fornisce le seguenti informazioni con
                                        riferimento ai dati da Lei forniti.
                                        Il trattamento dei suddetti dati avverrà in osservanza di quanto previsto dal
                                        Regolamento Ue 2016/679, dal D.
                                        Lgs. 196/2003 così come modificato ed integrato dal D. Lgs. 101/2018.</p>
                                    <table className="table table-bordered">
                                        <tbody>
                                        <tr>
                                            <td><b>1. Identità e dati di contatto del Titolare del trattamento</b></td>
                                            <td>Instrumentation Laboratory Spa – sede Milano Viale Monza 338 – Telefono
                                                02 2522746 sito web
                                                www.werfen.com/it e-mail di riferimento werfenitalia@werfen.com
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><b>2. Dati di contatto del Responsabile della protezione dei dati</b>
                                            </td>
                                            <td>DPO@werfen.com</td>
                                        </tr>
                                        <tr>
                                            <td><b>3. Categorie di dati trattati</b></td>
                                            <td>Dati personali (quali ad esempio: nome, cognome, indirizzo, e-mail,
                                                recapiti telefonici)
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><b>4. Finalità del trattamento cui sono destinati i dati, nonché base
                                                giuridica del trattamento</b></td>
                                            <td>Per l’invio di materiale promozionale, anche personalizzato (tramite
                                                e-mail, sms, posta tradizionale,
                                                chiamate tramite operatore), relativo a prodotti, servizi, offerte ed
                                                iniziative promosse dalla Società.

                                                Base giuridica del trattamento è il consenso al trattamento dei dati
                                                da Lei eventualmente reso, posto in
                                                calce alla presente informativa.
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><b>5. Eventuali destinatari o eventuali categorie di destinatari dei
                                                dati personali</b></td>
                                            <td>­ i responsabili del trattamento designati dalla Società per le attività
                                                di Marketing e Vendita;
                                                ­ i soggetti che operano sotto l’Autorità del Titolare o del
                                                Responsabile del trattamento.

                                                L’elenco aggiornato di tali soggetti è disponibile su richiesta al
                                                Titolare del trattamento come sopra
                                                indicato.
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><b>6. Intenzione del titolare del trattamento di trasferire i dati
                                                personali a un paese terzo o a
                                                un’organizzazione internazionale e l’esistenza di una decisione di
                                                adeguatezza della Commissione, o il
                                                riferimento alle garanzie appropriate o opportune e i mezzi per ottenere
                                                una copia delle stesse o il luogo
                                                ove sono state rese disponibili.</b></td>
                                            <td>I Suoi Dati Personali non saranno trasferiti verso paesi extra Ue.</td>
                                        </tr>
                                        <tr>
                                            <td><b>7. Periodo di conservazione dei dati, oppure i criteri utilizzati per
                                                determinare il periodo </b></td>
                                            <td>I Suoi Dati Personali verranno trattati per tutta la durata dei rapporti
                                                con Lei instaurati, e saranno
                                                conservati per le finalità di cui al punto 4) un periodo di 5 anni;
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><b>8. Diritti dell’interessato: accesso ai dati personali - rettifica o
                                                cancellazione degli stessi o
                                                limitazione del trattamento - opposizione al trattamento, portabilità
                                                dei dati.</b></td>
                                            <td>In qualità di interessato, Lei ha il diritto di ottenere dalla Società,
                                                nei casi ed entro i limiti
                                                previsti dalle norme, l’accesso ai dati personali e la rettifica o la
                                                cancellazione degli stessi o la
                                                portabilità, o la limitazione del trattamento che li riguarda o di
                                                opporsi al trattamento. Previa verifica
                                                della legittimità della richiesta, la Sua richiesta di accesso sarà
                                                evasa entro un mese dalla ricezione.
                                                Detti diritti potranno essere azionabili rivolgendosi a: Edoardo
                                                Magnaghi – DTL Italia- e-mail di contatto
                                                DPO-italy@werfen.com
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><b>9. Diritto di proporre reclamo a un’autorità di controllo</b></td>
                                            <td>Nel caso in cui in qualità di interessato, Lei ritenga che il
                                                trattamento dei Suoi dati avvenga in
                                                violazione di quanto previsto dal Regolamento e dal D. Lgs. 196/2003
                                                modificato ed integrato dal D. Lgs.
                                                101/218 ha il diritto di proporre reclami ovvero segnalazioni, al
                                                Garante per la protezione dei dati
                                                personali (Garante per la protezione dei dati personali Piazza Venezia
                                                11, 00187 Roma - sito web:
                                                www.garanteprivacy.it – mail: garante@gpdp.it)
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><b>10. Comunicazione dei dati personali </b></td>
                                            <td>La comunicazione dei Suoi dati non è un obbligo contrattuale o legale
                                                per le finalità indicate al punto
                                                4); in caso di eventuale Suo rifiuto, il Titolare non potrà procedere
                                                come indicato.
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><b>11. Revoca del consenso</b></td>
                                            <td>Potrà revocare in qualsiasi momento il consenso da Lei eventualmente
                                                reso, scrivendo a
                                                DPO-italy@werfen.com
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><b>12. Ulteriori informazioni in relazione al trattamento dei Suoi
                                                dati </b></td>
                                            <td>Per ulteriori informazioni o quesiti in relazione al trattamento dei
                                                Suoi dati, potrà rivolgersi a
                                                DPO-italy@werfen.com
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>

                                    <p>
                                        <b>Modalità di trattamento dei dati </b>
                                        Il trattamento dei Suoi Dati potrà effettuarsi con o senza l’ausilio di
                                        strumenti elettronici o comunque
                                        automatizzati, informatici o telematici, con logiche strettamente correlate alle
                                        finalità indicate.
                                    </p>

                                    <p>Confermo la presa in visione dell’informativa sopra riportata, resa da
                                        Instrumentation Laboratory Spa ai sensi
                                        e per gli effetti dell’art. 13 del Regolamento, in relazione al trattamento dei
                                        miei Dati Personali per le
                                        finalità di cui al punto 4) dell’informativa: finalità promozionali, anche
                                        personalizzate (tramite e-mail, sms,
                                        posta tradizionale, chiamate tramite operatore di cui all’art. 130 del D. Lgs.
                                        n.196/2003 così come modificato e
                                        integrato dal D. Lgs. n.101/20018,), relative a prodotti, servizi, offerte ed
                                        iniziative promosse dalla
                                        Società,</p>
                                    <p className="text-align:center">ai sensi dell’art. 6 del Regolamento</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                </Modal.Footer>
            </Modal>
        </>
    )
}

const mapStateToProps = ( state ) => ( {
    mailAttachments: state.emailEditor.attachments,
    clientEmails: state.emailEditor.customerEmails,
    clientName: state.emailEditor.clientName,
    clientEmail: state.emailEditor.clientEmail,
    clientEntity: state.emailEditor.clientEntity,
    emailMessage: state.emailEditor.emailMessage,
    createdEmails: state.emailEditor.createdEmails,
    userEmail: state.settings.userEmail,
    userProfile: state.settings.userProfile,
    contentLanguage: state.settings.contentLanguage,
    sendCopyToUser: state.settings.sendCopy,
    networkOnline: state.sensors.networkAvailable,
    newEmail: state.emailEditor.newEmail,
    newSupportEmail: state.emailEditor.newSupportEmail,
    appPhase: state.settings.appPhase,
    startedVisitId: state.visitEditor.startedVisitId,
    appLanguage: state.settings.appLanguage,
} )

const mapDispatchToProps = ( dispatch ) => {
    return {
        removeFromAttachments: ( id ) => dispatch ( removeFromMailAttachments ( id ) ),
        removeAllFromMailAttachments: () => dispatch ( removeAllFromMailAttachments () ),
        addToEmails: ( email ) => dispatch ( addToEmailsList ( email ) ),
        removeFromEmails: ( email ) => dispatch ( removeFromEmailList ( email ) ),
        cleanEmails: () => dispatch ( cleanEmailsList () ),
        addClientName: ( name ) => dispatch ( addClientName ( name ) ),
        addClientEmail: ( email ) => dispatch ( addClientEmail ( email ) ),
        removeClientName: () => dispatch ( removeClientName () ),
        addClientEntity: ( entity ) => dispatch ( addClientEnity ( entity ) ),
        removeClientEntity: () => dispatch ( removeClientEntity () ),
        addEmailMessage: ( message ) => dispatch ( addEmailMessage ( message ) ),
        resetEmailMessage: () => dispatch ( resetEmailMessage () ),
        setNewEmail: ( newEmail ) => dispatch ( setNewEmail ( newEmail ) ),
        setNewSupportEmail: ( newSupportEmail ) => dispatch ( setNewSupportEmail ( newSupportEmail ) ),
        setAppPhase: ( appPhase ) => dispatch ( setAppPhase ( appPhase ) ),
        addToMailAttachments: ( doc ) => dispatch ( addToMailAttachments ( doc ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( EmailEditor );
