import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Row } from "react-bootstrap";
import { withRouter } from 'react-router-dom';
import './Settings.scss';
import {
    requestUpdates,
    setAppLanguage,
    setAppPhase,
    setContentLanguage,
    setInstallationMethod,
    setProfile,
    setSendingCopyToUser
} from "../../redux/actions/settings";
import { connect } from "react-redux";
import { useForm } from '../../constants/CustomHooks'
import isElectron from "is-electron";
import { useTranslation } from 'react-i18next';
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog";
import ModalScreen from "../ModalScreen/ModalScreen";
import DownloadManager from "../DownloadManager/DownloadManager";
import pkg from "../../../package.json"
import Loader from "../Loader/Loader";
import { logoutOnUpdateProfilesError, sendToLogs, updateProfiles } from "../../constants/functions";
import { alert } from "react-custom-alert";
import { setNewEmail, setNewSupportEmail } from "../../redux/actions/emailEditor";
import EmailEditor from "../EmailEditor/EmailEditor";
import { setNavigationItem } from "../../redux/actions/navigation";

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const Settings = ( props ) => {
    const { t, i18n } = useTranslation ();
    const { values, handleChange } = useForm ( {
        appLanguage: props.appLanguage,
        contentLanguage: props.contentLanguage,
        userProfile: props.userProfile.toString (),
        sendCopyToUser: props.sendCopy,
        appInstallMethod: props.installationMethod
    } );
    const displayAlert = ( data ) => alert ( { message: data.message, type: data.type } );

    const appLanguages = [ "English", "English-GB", "Spanish", "Polish", "Italian", "Portuguese", "Portuguese-BR" ];
    const appTranslations = [
        { key: "English", value: "en-US" },
        { key: "English-GB", value: "en-GB" },
        { key: "Spanish", value: "es-ES" },
        { key: "Polish", value: "pl-PL" },
        { key: "Italian", value: "it-IT" },
        { key: "Portuguese", value: "pt-PT" },
        { key: "Portuguese-BR", value: "pt-BR" }
    ]
    let userProfilesFromStore = JSON.parse ( localStorage.getItem ( "availableProfiles" ) )
    const userProfiles = userProfilesFromStore.map ( item => item.id );
    const userProfilesValues = userProfilesFromStore.map ( item => item.name);
    const [ show, setShow ] = useState ( false );
    const [ visibleDownloads, setVisibleDownloads ] = useState ( false );
    const [ showUninstall, setShowUninstall ] = useState ( false );
    const [ solo, setSolo ] = useState ( false );
    const [ showConfirmDiscard, setShowConfirmDiscard ] = useState ( false );

    const currentProfileValue = localStorage.getItem ( "tokenProfile" );
    const currentProfile = userProfilesFromStore.filter ( item => item.id === currentProfileValue )[0];
    const [ loading, setLoading ] = useState ( null );

    const titleUninstall = t ( "Confirm uninstalling the app" )
    const messageArrayUninstall = [
        t ( "App uninstalling confirmation" )
    ]

    const titleFilesInstallation = t ( "Confirm installing from files" );
    const messageArrayFilesInstallation = [
        t ( "Do you want to install content from files" )
    ]
    const title = t ( "Confirm discarding the email" )
    const messageArray = [
        t ( 'Discard previous draft and lost changes' )
    ]

    const handleClose = () => setShow ( false );
    const handleCloseDownloads = () => setVisibleDownloads ( false );
    const handleCloseUninstall = () => setShowUninstall ( false );

    const handleModal = ( e ) => {
        e.preventDefault ();
        setShow ( true )
    }
    const setEmailDraft = ( event ) => {
        if ( props.newEmail === true ) {
            discardNewEmail ()
        } else {
            props.setNavigationItem ( 3 );
            props.history.push ( "/emailmanager" );
            props.setNewEmail ( true );
            props.setNewSupportEmail ( true );
        }
    }
    const discardNewEmail = () => {
        setShowConfirmDiscard ( true )
    }

    const handleCloseConfirm = () => setShowConfirmDiscard ( false );
    const handleConfirmDiscard = () => {
        props.setNavigationItem ( 4 );
        props.history.push ( "/emailmanager" );
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
        key: "confirmDiscardDraft"
    }
    const handleLogout = ( e ) => {
        e.preventDefault ();
        const logEntry = {
            profileId: localStorage.getItem ( "tokenProfile" ),
            userId: localStorage.getItem ( "userEmail" ),
            category: "login",
            action: "log out",
            severity: "log",
            visitId: props.startedVisitId,
        }
        sendToLogs ( logEntry, props.networkOnline )
        localStorage.removeItem ( "tokenProfile" );
        localStorage.removeItem ( "token" );
        localStorage.removeItem ( "appInitialized" );
        const userLoggedOut = "true"
        localStorage.setItem ( "loggedOut", userLoggedOut )
        props.setAppPhase ( 'login' );
    }

    const handleSendToUsb = () => {
        setShow ( false );
        props.history.push ( "/usbmanager" );
    }

    const handleUninstall = ( e ) => {
        e.preventDefault ();
        ipcRenderer.send ( 'startUninstalling' );
    }

    const sendValueChange = ( e ) => {
        let updateInfo = {}
        updateInfo.key = e.target.name;
        updateInfo.value = e.target.value
        e.preventDefault ()
        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "settings",
        //     action : "update",
        //     value : e.target.name,
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry,  props.networkOnline )

        //console.log ( "Update info when updating settings ", updateInfo )
        ipcRenderer.send ( 'updateUserSettings', updateInfo );
    }

    const confirmUninstall = {
        show: showUninstall,
        onHide: handleCloseUninstall,
        contentClassName: "warning",
        title: titleUninstall,
        messageArray: messageArrayUninstall,
        handleOnCancel: handleCloseUninstall,
        handleOnAccept: handleUninstall,
        labelCancel: t ( "No" ),
        labelAccept: t ( "Yes" ),
        key: "confirmUninstall",
        displayConfirmationInput: true,
        confirmationInputType: "unistallContent"
    }

    const confirmFilesInstallation = {
        show: show,
        onHide: handleClose,
        contentClassName: "Settings__Modal",
        title: titleFilesInstallation,
        messageArray: messageArrayFilesInstallation,
        handleOnCancel: handleClose,
        handleOnAccept: handleSendToUsb,
        labelCancel: t ( "No" ),
        labelAccept: t ( "Yes" ),
        key: "confirmFilesInstallation"
    }

    const confDialogsArray = [ confirmUninstall, confirmFilesInstallation, confirmDiscardDraft ];

    useEffect ( () => {
        ipcRenderer.on ( 'updatedUserSettings', doSendUserSettingsToProps )
        return () => {
            ipcRenderer.off ( 'updatedUserSettings', doSendUserSettingsToProps )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        props.appLanguage,
        props.contentLanguage,
        props.installationMethod,
        props.sendCopy,
        props.userProfile
    ] )

    useEffect ( () => {
        const tokenProfile = values.userProfile;
        localStorage.setItem ( "tokenProfile", tokenProfile );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        props.appLanguage,
        values.appLanguage,
        props.contentLanguage,
        values.contentLanguage,
        props.installationMethod,
        values.appInstallMethod,
        values.sendCopyToUser,
        props.sendCopy,
        values.userProfile,
        props.userProfile
    ] )

    const showDownloads = () => {
        setVisibleDownloads ( true );
    }

    const reloadOnFirstRequest = () => {
        window.location.reload ();
    }
    const handleUninstallModal = ( e ) => {
        e.preventDefault ();
        setShowUninstall ( true )
    }

    const handleRequestUpdates = ( e ) => {
        e.preventDefault ();
        setLoading ( true );
        //props.requestUpdates ( true );
        const infoRequestedBy = "requestedByUser";
        updateProfiles ( infoRequestedBy )
            .then ( () => {
                delayLoaded ( 2000 );
            } )
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
            } );
        ipcRenderer.send ( 'removeAllFromRepo' );
    }
    const delayLoaded = ( time ) => {
        setTimeout ( () => {
            setLoading ( false )
        }, time )
    }

    const doSendUserSettingsToProps = ( event, info ) => {
        //console.log("Sent back userSettings", info);
        switch ( info.key ) {
            case 'appLanguage':
                props.setAppLanguage ( info.value );
                let transLanguage = appTranslations.filter ( item => item.key === info.value )[0]
                i18n.changeLanguage ( transLanguage.value )
                    .then ( () => ( console.log ( "Success changing the language!", transLanguage ) ) )
                break;
            case 'contentLanguage':
                props.setContentLanguage ( info.value );
                break;
            case 'userProfile':
                props.setUserProfile ( info.value );
                const tokenProfile = info.value;
                localStorage.setItem ( "tokenProfile", tokenProfile );
                localStorage.setItem ( "userCurrentProfile", tokenProfile );
                ipcRenderer.send ( 'getAllDocumentTypesForProfile', tokenProfile );
                ipcRenderer.send ( "getAllGroupsForProfile", tokenProfile );
                delayLoaded ( 500 );
                break;
            case 'sendCopyToUser':
                props.sendCopyToUser ( info.value );
                break;
            case 'appInstallMethod':
                props.setInstallationMethod ( info.value );
                break;
            default:
                break;
        }
    }

    return (
        <div className='Settings container-fluid'>
            <Row className="Settings__Menu">

                <Col xs={ 12 } className="Settings__Header text-left">
                    <span className="Settings__Title">{ t ( "Basic user's settings" ) }</span>
                </Col>

                <Col xs={ 12 }>
                    <Form className="Settings__Form row">
                        <Col xs={ 3 } className={ "text-left" }>
                            <Form.Group controlId="appLanguage">
                                <Form.Label
                                    className={ "Settings__Form--label" }>{ t ( 'App language' ) }</Form.Label>
                                <Form.Control as="select"
                                              name="appLanguage"
                                              value={ props.appLanguage }
                                              onChange={ ( e ) => {
                                                  handleChange ( e )
                                                  sendValueChange ( e )
                                              }
                                                  }
                                    >
                                        { appLanguages.map ( ( appLanguage, index ) => {
                                            return <option
                                                key={ index }
                                                value={ appLanguage }
                                                selected={ appLanguage === props.appLanguage }
                                            >
                                                { t ( appLanguage ) }
                                            </option>
                                        } ) }
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col xs={ 6 } className={ "text-left" }>
                            <Form.Group controlId="userProfile">
                                <Form.Label
                                    className={ "Settings__Form--label" }>{ t ( "User profile" ) }</Form.Label>
                                { userProfiles.length > 0 ? <Form.Control
                                    as="select"
                                    name="userProfile"
                                    value={ props.userProfile }
                                    onChange={ ( e ) => {
                                        handleChange ( e )
                                        sendValueChange ( e )
                                            setLoading ( true );
                                        } }
                                    >
                                        { userProfiles.map ( ( userProfile, index ) => (
                                            <option key={ index } value={ userProfile }>
                                                { userProfilesValues[index].toUpperCase () }
                                            </option>
                                        ) ) }
                                    </Form.Control> : <Form.Control
                                    as="select"
                                    name="userProfile"
                                    value={ "withoutProfile" }
                                    disabled={ true }
                                >
                                    <option value={ "withoutProfile" }>
                                        { "Without profile" }
                                    </option>
                                </Form.Control> }
                            </Form.Group>
                        </Col>
                    </Form>
                </Col>
            </Row>
            {
                loading &&
                    <div className="Loader__Wrapper">
                        <Loader/>
                    </div>
            }
            <Row className="Settings__Menu">
                <Col xs={ 12 } className="Settings__Header text-left">
                    <span className="Settings__Title">{ t ( "Actions" ) }</span>
                </Col>
                <div className={ "Settings__Buttons" }>
                    <div className="Settings__Button text-right">
                        <Button onClick={ showDownloads }
                                className={ "Settings__Option Download_Access__button" }>
                            { t ( "Open Download Log" ) }
                        </Button>
                    </div>
                    <div className="Settings__Button">
                        <Button onClick={ ( e ) => handleLogout ( e ) }
                                className={ "Settings__Option Logout-generic" }>
                            { t ( "Logout" ) }
                        </Button>
                    </div>
                </div>
            </Row>
            <Row className="Settings__Menu">
                <Col xs={ 12 } className="Settings__Header text-left">
                    <span className="Settings__Title">{ t ( "Support and Maintenance" ) }</span>
                </Col>
                <div className={ "Settings__Buttons" }>
                    {
                        process.env.REACT_APP_CAN_INSTALL_FROM_USB === "0" &&
                        <div className="Settings__Button">
                            <Button onClick={ handleModal }
                                    className={ "Settings__Option Logout-generic disabled" }>
                                { t ( "Install content from files" ) }
                            </Button>
                        </div>
                    }
                    {
                        process.env.REACT_APP_CAN_REQUEST_UPDATES === "1" &&
                        <div className="Settings__Button">
                            <Button onClick={ ( e ) => handleRequestUpdates ( e ) }
                                    className={ "Settings__Option Request" }>
                                { t ( "Update contents" ) }
                            </Button>
                        </div>
                    }

                    { process.env.REACT_APP_CAN_UNINSTALL === "0" &&
                        <div className="Settings__Button">
                            <Button onClick={ handleUninstallModal }
                                    className={ "Settings__Option Uninstall" }>
                                { t ( "Remove contents" ) }
                            </Button>
                        </div> }

                    <div className="Settings__Button">
                        <Button onClick={ ( e ) => setEmailDraft ( e ) }
                                className={ "Settings__Option Support" }>
                            { t ( "Contact support" ) }
                        </Button>
                    </div>

                </div>
            </Row>
            <div className={ "Settings__Build" }>
                <span>App build { pkg.version }</span>
            </div>
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
            {
                currentProfile &&
                < ModalScreen
                    show={ visibleDownloads }
                    onHide={ handleCloseDownloads }
                    profileId={ currentProfile.id }
                    profileName={ currentProfile.name }
                    componentToShow={ <DownloadManager/> }
                    dismissButtonLabel={ "Dismiss" }
                />
            }
            { ( props.newEmail && solo ) && <EmailEditor
                solo={ solo }
                setSolo={ setSolo }
            /> }

        </div> );
};

const mapStateToProps = ( state ) => ( {
    newEmail: state.emailEditor.newEmail,
    availableProfiles: state.settings.availableProfiles,
    userProfile: state.settings.userProfile,
    userEmail: state.settings.userEmail,
    appLanguage: state.settings.appLanguage,
    contentLanguage: state.settings.contentLanguage,
    sendCopy: state.settings.sendCopy,
    installationMethod: state.settings.installationMethod,
    appPhase: state.settings.appPhase,
    networkOnline: state.sensors.networkAvailable,
} )

const mapDispatchToProps = ( dispatch ) => {
    return {
        setUserProfile: ( profile ) => dispatch ( setProfile ( profile ) ),
        sendCopyToUser: ( sendCopy ) => dispatch ( setSendingCopyToUser ( sendCopy ) ),
        setInstallationMethod: ( instMethod ) => dispatch ( setInstallationMethod ( instMethod ) ),
        setContentLanguage: ( contentLanguage ) => dispatch ( setContentLanguage ( contentLanguage ) ),
        setAppLanguage: ( appLanguage ) => dispatch ( setAppLanguage ( appLanguage ) ),
        setAppPhase: ( appPhase ) => dispatch ( setAppPhase ( appPhase ) ),
        requestUpdates: ( updatesRequested ) => dispatch ( requestUpdates ( updatesRequested ) ),
        setNewEmail: ( newEmail ) => dispatch ( setNewEmail ( newEmail ) ),
        setNewSupportEmail: ( newSupportEmail ) => dispatch ( setNewSupportEmail ( newSupportEmail ) ),
        setNavigationItem: ( selectedItem ) => dispatch ( setNavigationItem ( selectedItem ) )
    }
}

export default withRouter ( connect ( mapStateToProps, mapDispatchToProps ) ( Settings ) );
