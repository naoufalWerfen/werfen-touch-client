import React, { useEffect, useState } from 'react';
import "./ViewerMenu.scss";
import MenuIcon from "../../../assets/icons/more-horizontal.svg";
import BackIcon from "../../../assets/icons/arrow-back.svg";
import AttachmentIcon from "../../../assets/icons/paperclip_white.svg"
import MailIcon from "../../../assets/icons/mail-hat.svg"
import HomeIcon from "../../../assets/icons/home-alt.svg";
import FolderIcon from "../../../assets/icons/book_white.svg";
import SearchIcon from "../../../assets/icons/search_white.svg";
import VisualsIcon from "../../../assets/icons/layout_white.svg";
import AllIcon from "../../../assets/icons/case_white.svg";
import SupportIcon from "../../../assets/icons/question-circle.svg";
import { useHistory, useParams } from "react-router-dom";
import isElectron from "is-electron";
import { useTranslation } from 'react-i18next';
import {
    addToMailAttachments,
    removeFromMailAttachments,
    setNewEmail,
    setNewSupportEmail,
} from "../../../redux/actions/emailEditor";
import { connect } from "react-redux";
import { DocumentsFolder } from "../../../constants/AppData";
import { setActiveKey, setInsideViewer, setNavigationItem, setSelectedItem } from "../../../redux/actions/navigation";
import { v4 as uuidv4 } from "uuid";
import { prepareEmailToSend, sendEmailsToBackend, sendToLogs } from "../../../constants/functions";
import { alert } from 'react-custom-alert';
import 'react-custom-alert/dist/index.css';
import ConfirmationDialog from "../../ConfirmationDialog/ConfirmationDialog"; // import css file from root.
// import { sendToLogs } from "../../../constants/functions";
let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" )
}

const ipcRenderer = electron && electron.ipcRenderer;
/*
const {
    START_NOTIFICATION_SERVICE,
} = require( 'electron-push-receiver/src/constants' )
*/

const ViewerMenu = ( props ) => {
    const history = useHistory ();
    const listVisuals = "/visuals";
    const listLibrary = "/library";
    const listAll = "/all";
    const listMail = "/mail"
    const listSearch = props.appPhase === "readyToUse" ? "/search" : "/visitsearch";
    const { id } = useParams ();
    const profile = localStorage.getItem ( 'userCurrentProfile' );
    const group = localStorage.getItem ( 'currentTileGroup' );
    const category = localStorage.getItem ( 'currentTileCategory' );
    const [ menuOpen, setMenuOpen ] = useState ( false );
    const [ attachmentNotification, setAttachmentNotification ] = useState ( false );
    const [ emailDraft, setEmailDraft ] = useState ( false );
    const { t } = useTranslation ();
    const [ itemOrigin, setItemOrigin ] = useState ( "" );
    const [ itemInfo, setItemInfo ] = useState ( {} );
    const alertEmailSent = ( data ) => alert ( { message: data.message, type: data.type } );
    const [ showConfirmDiscard, setShowConfirmDiscard ] = useState ( false );

    const getNavArray = () => {
        const navHistory = JSON.parse ( localStorage.getItem ( "iframeNavList" ) ) || [];
        return navHistory;
    }
    const title = t ( "Confirm discarding the email" )
    const messageArray = [
        t ( 'Discard previous draft and lost changes' )
    ]
    const logEntry = {
        profileId: localStorage.getItem ( "userCurrentProfile" ),
        userId: localStorage.getItem ( "userEmail" ),
        category: "content",
        action: "view",
        value: "EXIT",
        severity: "log",
        visitId: props.startedVisitId ? props.startedVisitId : "",
    }

    useEffect ( () => {
        let itemOrigin = localStorage.getItem ( "appOriginPathname" ).split ( "#" )[0];
        setItemOrigin ( itemOrigin );

        if ( props.type === "library" ) {
            getViewedDocId ();
        }
        ipcRenderer.on ( 'foundAttachmentInfo', onFoundAttachmentInfo );
        window.addEventListener ( "message", receiveMessage, false );
        return () => {

            ipcRenderer.off ( 'foundAttachmentInfo', onFoundAttachmentInfo );
            window.removeEventListener ( "message", receiveMessage, false );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] )

    useEffect ( () => {
        if ( attachmentNotification ) {
            let data = {},
                message = "",
                type = ""
            if ( props.mailAttachments && props.mailAttachments.some ( element => element.uuid === itemInfo.uuid ) ) {
                message = t ( "Document removed from attachments" );
                type = "warning";
            } else {
                emailDraft ? message = t ( "New email draft with document attached" ) : message = t ( "Document attached to email draft" );
                emailDraft ? type = "success" : type = "info";
            }
            data.message = message;
            data.type = type;
            alertPDFAttached ( data );
            setEmailDraft ( false );
            setAttachmentNotification ( false );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ attachmentNotification ] );


//TODO: Figure out how to store mailAttachments in localStorage for library type and how to update the props.mailAttachments if they're reset to 0


    const getViewedDocId = () => {
        const content = {
            id,
            group,
            type: "pdfviewer",
            profile,
        };
        ipcRenderer.send ( 'getMyAttachmentInfo', content );
    }

    const alertPDFAttached = ( data ) => alert ( { message: data.message, type: data.type } );

    const onFoundAttachmentInfo = ( event, data ) => {
        setItemInfo ( data )
    }

    const _toggleMenu = ( event ) => {
        event.preventDefault ();
        setMenuOpen ( !menuOpen );
    }

    const _handleBack = ( event ) => {
        event.preventDefault ();
        let itemBefore = "",
            sceneBefore = "",
            pdfType = "";
        const navHistory = getNavArray ();
        const checkNavHistory = navHistory.length > 0;
        if ( checkNavHistory ) {
            const id = navHistory[navHistory.length - 1].id;
            itemBefore = id;
            sceneBefore = navHistory[navHistory.length - 1].scene;
            pdfType = localStorage.getItem ( 'pdfType' );
        }
        navHistory.pop ();
        localStorage.setItem ( 'iframeNavList', JSON.stringify ( navHistory ) );
        localStorage.removeItem ( 'presentationScene' );
        if ( checkNavHistory && pdfType !== "direct" ) {
            history.push ( "/hypeviewer" + "/" + itemBefore );
            localStorage.setItem ( 'presentationScene', sceneBefore );
        } else {
            goHomeList ();
            props.setInsideViewer ( false );
            localStorage.removeItem ( "contentScene" );
        }
        sendToLogs ( logEntry, props.networkOnline );
    }
    const navigateTo = ( values, selector, navigationItem, docOriginToGo ) => {
        props.setActiveKey ( parseInt ( values[1] ) );
        props.setSelectedItem ( selector );
        props.setNavigationItem ( navigationItem );
        history.push ( docOriginToGo );
    }

    const goHomeList = () => {
        let docOrigin = localStorage.getItem ( "appOriginPathname" );
        let docOriginToGo = "/" + docOrigin;
        let docOriginPathname = docOrigin.split ( "#" )[0];
        let selector = docOrigin.split ( "#" )[1];
        let values = selector.split ( "-" );
        let navigationValue;
        ipcRenderer.send ( 'resetGlobalVisualSentList' );

        switch ( docOriginPathname ) {
            case "all":
                navigationValue = 0;
                break;
            case "visitsearch":
                navigationValue = 1;
                break;
            case "visuals":
                navigationValue = 1;
                break;
            case "library":
                navigationValue = 2;
                break;
            case "email":
                navigationValue = 3;
                break;
            case "search":
                navigationValue = 4;
                break;
            default:
                break;
        }

        navigateTo ( values, selector, navigationValue, docOriginToGo );
    }
    const handleGoingAppHome = ( event ) => {
        event.preventDefault ();
        props.setNavigationItem ( 0 );
        history.push ( '/' );
        const navHistory = []
        localStorage.setItem ( 'iframeNavList', JSON.stringify ( navHistory ) );
        localStorage.removeItem ( "presentationScene" );
        localStorage.removeItem ( 'contentScene' );
    }

    const _handleSend = ( event ) => {
        event.preventDefault ();
        let itemToAttach = {};
        itemToAttach.uuid = itemInfo.uuid;
        itemToAttach.name = itemInfo.name;
        itemToAttach.id = itemInfo.id;
        itemToAttach.icon = itemInfo.icon;
        itemToAttach.type = itemInfo.type;
        itemToAttach.path = DocumentsFolder + window.location.hash.split ( "/" )[1] + "/" + itemInfo.route;
        checkIfSelected ( itemToAttach, itemToAttach.uuid )
    }

    const checkIfSelected = ( item ) => {
        if ( props.mailAttachments.some ( element => element.uuid === item.uuid ) ) {
            handleDeleteItem ( item.uuid )
        } else {
            if ( props.newEmail === false ) {
                const createNewEmail = new Event ( 'createNewEmailDraft' );
                window.dispatchEvent ( createNewEmail );
                setEmailDraft ( true );
            }
            props.addToMailAttachments ( item );

        }
        setAttachmentNotification ( true );
    }

    const handleDeleteItem = ( uuid ) => {
        props.removeFromMailAttachments ( uuid )
    }

    const _handleGoingSelectedList = ( event, list, item, support ) => {

        const navHistory = []
        localStorage.setItem ( 'iframeNavList', JSON.stringify ( navHistory ) );
        localStorage.removeItem ( "presentationScene" );
        localStorage.removeItem ( 'contentScene' );
        sendToLogs ( logEntry, props.networkOnline );

        if ( list.includes ( itemOrigin ) ) {
            goHomeList ()
        } else {
            if ( support && support === true ) {
                if ( props.newEmail === true ) {
                    discardNewEmail ()
                } else {
                    props.setNewEmail ( true );
                    props.setNewSupportEmail ( true );
                    props.setNavigationItem ( 3 );
                    history.push ( '/mail' );
                }
            } else {
                props.setNavigationItem ( item );
                history.push ( list );
            }
        }
        props.setInsideViewer ( false );
    }
    const sendEmailInBackground = ( data ) => {
        let userEmail = localStorage.getItem ( "userEmail" );
        let createdEmail = {};
        createdEmail.extraFiles = [];
        createdEmail.id = props.createdEmails.length + 1;
        createdEmail.uuid = uuidv4 ();
        createdEmail.clientEmails = data.receivers.split ( ";" );
        createdEmail.clientName = "";
        createdEmail.clientEntity = "";
        createdEmail.mailAttachments = [];
        const today = new Date ();
        const todayParsed = Date.parse ( today );
        createdEmail.createdOn = todayParsed.toString ();
        createdEmail.sentOn = "";
        createdEmail.message = data.message.join ( '\n' );
        createdEmail.status = "Not sent";
        createdEmail.cc = [ userEmail ]
        //createdEmail.visitId = "None";
        sendToCreatedEmails ( createdEmail );
    }
    const sendToCreatedEmails = ( emailObject ) => {
        let emailData = Object.assign ( {}, emailObject )
        ipcRenderer.send ( "createdEmail", emailObject );
        const emailsInfo = {
            emailsToPrepare: [ emailData ],
            createdEmail: emailData,
            origin: "background",
        }
        if ( props.networkOnline ) {
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
            const dataToSend = prepareEmailToSend ( emailsInfo );
            dataToSend.alertEmailSent = alertEmailSent;
            dataToSend.alertMessages = alertMessages;
            sendEmailsToBackend ( dataToSend )
                .catch ( ( error ) => {
                    console.error ( "Error on sendEmailsToBackend ", error );
                } );
        }
    }

    const processEmailToSend = ( emailData ) => {
        sendEmailInBackground ( emailData )
    }
    const processCalcOutput = ( event ) => {
        const calcOutput = event.data.calcOutput;
        const outputTitle = event.data.outputTitle;
        const pdfName = outputTitle + '.pdf';
        const calcUuid = localStorage.getItem ( 'calcUuid' )
        const outputUuid = uuidv4 ();
        const outputData = {
            uuid: outputUuid,
            filename: pdfName,
            calcOutput: calcOutput,
            parentUuid: calcUuid,
            pid: profile,
            group,
            category,
            id
        }

        if ( outputData.hasOwnProperty ( 'calcOutput' ) ) {
            ipcRenderer.send ( 'saveCalcOutput', outputData )
        }
    }

    const processNavigationRequest = ( event ) => {
        let visualId;
        const idToSendArray = window.location.href.split ( "/" );
        let navigationLevel;
        if ( event.data.id ) {

            if ( event.origin === "file://" && event.data.id.includes ( '/' ) ) {
                visualId = idToSendArray[idToSendArray.length - 1];
            } else {
                visualId = event.data.id;
            }
            navigationLevel = "second";

        } else {
            visualId = idToSendArray[idToSendArray.length - 1];
            navigationLevel = "first";
        }
        if ( visualId ) {
            let visualIdToSend = visualId.split ( '|' )[0];

            const content = {
                id: visualIdToSend,
                navigationLevel,
                type: event.data.type,
                profile,
                group,
                navigation: true,
                pdfType: event.data.pdfType ? event.data.pdfType : event.data.type === "pdfviewer" ? "normal" : 'notPDF'
            };
            if ( event.data.subtype === "scene" ) {
                content.scene = event.data.currentScene;
                content.navigation = false;
            }
            if ( visualId !== null ) {
                ipcRenderer.send ( 'getMyInfo', content );
            }
        }
    }

    function setInternalNavigation ( event ) {
        if ( event.data.subtype === undefined && event.data.calcOutput === undefined ) {
            if ( event.origin === "http://localhost:9990" || event.origin === "file://" ) {

                let navHistory = JSON.parse ( localStorage.getItem ( "iframeNavList" ) ) || [];

                const sceneToSend = localStorage.getItem ( 'contentScene' ) || "home";

                let backRoute = {
                    id: localStorage.getItem ( 'lastValidRoute' ) || id,
                    scene: sceneToSend
                }

                sendToLogs ( logEntry, props.networkOnline );

                navHistory.push ( backRoute );

                localStorage.setItem ( 'iframeNavList', JSON.stringify ( navHistory ) );
                const sceneId = event.data.id.split ( "|" )[1];
                localStorage.setItem ( 'presentationScene', sceneId );
                processNavigationRequest ( event );
            }

        }
    }

    const setSceneNavigation = ( event ) => {
        if ( event.data.subtype === "loaded" ) {
            const currentSceneName = event.data.currentSceneName;
            const sceneId = localStorage.getItem ( 'presentationScene' );
            if ( sceneId !== undefined && currentSceneName && ( sceneId !== currentSceneName ) ) {
                let contentWindowHype = document.getElementsByTagName ( "iframe" )[0].contentWindow.myhypedocument;
                if ( contentWindowHype !== undefined ) {
                    document.getElementsByTagName ( "iframe" )[0].contentWindow.myhypedocument.showSceneNamed ( sceneId );
                } else {
                    const documentToShow = document.getElementsByTagName ( "iframe" )[0].contentWindow;
                    if ( documentToShow.hasOwnProperty ( 'hDocument' ) ) {
                        documentToShow.hDocument.showSceneNamed ( sceneId );
                    }
                    //document.getElementsByTagName ( "iframe" )[0].contentWindow.hDocument.showSceneNamed ( sceneId );
                }
            }
        }
        if ( event.data.subtype === "scene" ) {
            let contentScene = event.data.currentScene;
            localStorage.setItem ( "contentScene", contentScene );
        }
        processNavigationRequest ( event );
    }

    const receiveMessage = ( event ) => {
        if ( event.data.hasOwnProperty ( 'calcOutput' ) ) {
            processCalcOutput ( event );
        } else if ( event.data.hasOwnProperty ( 'emailToSend' ) ) {
            const emailData = {
                receivers: event.data.receivers,
                message: event.data.emailMessage
            }
            processEmailToSend ( emailData );
        } else {
            switch ( event.data.type ) {
                case "hypeviewer":
                    switch ( event.data.subtype ) {
                        case "scene":
                            setSceneNavigation ( event );
                            break;
                        case "loaded":
                        default:
                            setInternalNavigation ( event );
                            setSceneNavigation ( event );
                            break;
                    }
                    break;
                case "pdfviewer":
                default:
                    setInternalNavigation ( event )
                    break;
            }
        }
    }
    const discardNewEmail = () => {
        setShowConfirmDiscard ( true )
    }

    const handleCloseConfirm = () => setShowConfirmDiscard ( false );
    const handleConfirmDiscard = () => {
        props.setNavigationItem ( 4 );
        history.push ( "/mail" );
        props.setNewEmail ( true );
        props.setNewSupportEmail ( true );
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
        labelAccept: t ( "Yes" ),
        key: "showConfirmDiscard"
    }
    const confDialogsArray = [ confirmDiscardDraft ];
    const type = props.type;
    // const innerNavHistory = getNavArray();
    return (
        <>
            <div className={ ( menuOpen ? "open" : "" ) + " menuTrigger" }
                 onClick={ ( event ) => _toggleMenu ( event ) }>
                <img src={ MenuIcon } alt=""/>
            </div>
            { menuOpen && <div className={ "ViewerMenu " + type }>
                { ( type === 'library' && props.newVisit === false ) &&
                    <span className={ "ViewerMenu__Item" } onClick={ ( event ) =>
                        _handleSend ( event ) }>
               { props.mailAttachments && props.mailAttachments.some ( element => element.uuid === itemInfo.uuid ) ?
                   <img src={ AttachmentIcon } className="ViewerMenu__Mail-checked" alt=""
                        title={ t ( "Add to email" ) }/> :
                   <img src={ AttachmentIcon } className="ViewerMenu__Mail-unchecked" alt=""
                        title={ t ( "Add to email" ) }/> }
                </span> }
                {/*   <span className={ "ViewerMenu__Item" } onClick={ ( event ) => _handleCheckOnClick ( event ) }>
                    { checkSelected ? <img src={ CheckIcon } alt="" title={ t ( "Add to visit" ) }/> :
                        <img src={ CircleIcon } alt="" title={ t ( "Add to visit" ) }/> }
                </span>*/ }
                { /*innerNavHistory.length > 0 &&*/
                    <span className={ "ViewerMenu__Item" } onClick={ ( event ) => _handleBack ( event ) }>
                    <img src={ BackIcon } alt="Go Back" title={ t ( "Go back" ) }/>
                </span> }
                <span className="ViewerMenu__Separation"/>
                { props.appPhase === "readyToUse" &&
                <span className={ "ViewerMenu__Item" } onClick={ ( event ) => handleGoingAppHome ( event ) }>
                    <img src={ HomeIcon } alt="Go Home" title={ t ( "Go to " ) + t ( "Home" ) }/>
                </span> }
                { props.appPhase === "readyToUse" &&
                    <span
                        className={ listVisuals.includes ( itemOrigin ) ? "ViewerMenu__Item-origin" : "ViewerMenu__Item" }
                        onClick={ ( event ) => _handleGoingSelectedList ( event, listVisuals, 1 ) }>
                    <img src={ VisualsIcon } alt="Go Home" title={ t ( "Go to " ) + t ( "visuals" ) }/>
                </span> }
                { props.appPhase === "readyToUse" &&
                    <span
                        className={ listLibrary.includes ( itemOrigin ) ? "ViewerMenu__Item-origin" : "ViewerMenu__Item" }
                        onClick={ ( event ) => _handleGoingSelectedList ( event, listLibrary, 2 ) }>
                    <img src={ FolderIcon } alt="Go to Library" title={ t ( "Go to " ) + t ( "library" ) }/>
                </span> }
                { props.appPhase === "readyToUse" &&
                    <span
                        className={ listMail.includes ( itemOrigin ) ? "ViewerMenu__Item-origin" : "ViewerMenu__Item" }
                        onClick={ ( event ) => _handleGoingSelectedList ( event, listMail, 3 ) }>
                    <img src={ MailIcon } alt="Go Mail" title={ t ( "Go to " ) + t ( "mail" ) }/>
                </span> }
                { props.appPhase === "readyToUse" &&
                    <span
                        className={ listMail.includes ( itemOrigin ) ? "ViewerMenu__Item-origin" : "ViewerMenu__Item" }
                        onClick={ ( event ) => _handleGoingSelectedList ( event, listMail, 3, true ) }>
                    <img src={ SupportIcon } alt="Contact Support" title={ t ( "Contact support" ) }/>
                </span> }
                { props.appPhase === "readyToUse" &&
                    <span
                        className={ listSearch.includes ( itemOrigin ) ? "ViewerMenu__Item-origin" : "ViewerMenu__Item" }
                        onClick={ ( event ) => _handleGoingSelectedList ( event, listSearch, 4 ) }>
                    <img src={ SearchIcon } alt="Go Home" title={ t ( "Go to " ) + t ( "search" ) }/>
                </span> }

                { props.appPhase === "visitActive" &&
                    <span className={ listAll.includes ( itemOrigin ) ? "ViewerMenu__Item-origin" : "ViewerMenu__Item" }
                          onClick={ ( event ) => _handleGoingSelectedList ( event, listAll, 0 ) }>
                    <img src={ AllIcon } alt="Go to All" title={ t ( "Go to " ) + t ( "all" ) }/>
                </span> }
                { props.appPhase === "visitActive" &&
                    <span
                        className={ listSearch.includes ( itemOrigin ) ? "ViewerMenu__Item-origin" : "ViewerMenu__Item" }
                        onClick={ ( event ) => _handleGoingSelectedList ( event, listSearch, 1 ) }>
                    <img src={ SearchIcon } alt="Go Home" title={ t ( "Go to " ) + t ( "search" ) }/>
                </span> }

            </div> }
            { confDialogsArray.map ( ( dialog ) =>
                < ConfirmationDialog
                    key={ dialog.key }
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
        </>
    );
}

const mapStateToProps = ( state ) => ( {
    mailAttachments: state.emailEditor.attachments,
    unzipQueue: state.manageDownloading.unzipQueue,
    userEmail: state.settings.userEmail,
    userProfile: state.settings.userProfile,
    appPhase: state.settings.appPhase,
    newEmail: state.emailEditor.newEmail,
    newVisit: state.visitEditor.newVisit,
    createdEmails: state.emailEditor.createdEmails,
    networkOnline: state.sensors.networkAvailable
} )
const mapDispatchToProps = ( dispatch ) => {
    return {
        addToMailAttachments: ( doc ) => dispatch ( addToMailAttachments ( doc ) ),
        removeFromMailAttachments: ( uuid ) => dispatch ( removeFromMailAttachments ( uuid ) ),
        setNavigationItem: ( selectedItem ) => dispatch ( setNavigationItem ( selectedItem ) ),
        setNewEmail: ( newEmail ) => dispatch ( setNewEmail ( newEmail ) ),
        setNewSupportEmail: ( newSupportEmail ) => dispatch ( setNewSupportEmail ( newSupportEmail ) ),
        setSelectedItem: ( selectedItem ) => dispatch ( setSelectedItem ( selectedItem ) ),
        setActiveKey: ( activeKey ) => dispatch ( setActiveKey ( activeKey ) ),
        // setMailAttachments: ( attachments ) => dispatch ( setMailAttachments ( attachments ) )
        setInsideViewer: ( insideViewer ) => dispatch ( setInsideViewer ( insideViewer ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( ViewerMenu );
