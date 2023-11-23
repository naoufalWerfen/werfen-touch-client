import React, { useEffect, useState } from 'react';
import Background from "../Background/Background";
import { connect } from "react-redux";
import { setNavigationItem } from "../../redux/actions/navigation";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import './Login.scss';
import { setAppPhase, setAvailableProfiles, setEmail } from "../../redux/actions/settings";
import Icon from "../Icon/Icon";
import UserIcon from "../../assets/svgsymbols/user";
import PasswordIcon from "../../assets/svgsymbols/password";
import newLogo from "../../assets/logos/New_Werfen_logo.jpg"
import { useFormik } from 'formik';
import * as yup from 'yup';
import isElectron from "is-electron";
import { useTranslation } from 'react-i18next';
import { setLoginEndpoint } from "../../redux/actions/sensors";
import ArrowBack from "../../assets/svgsymbols/arrow-back";

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;
const Login = ( props ) => {
    const { t } = useTranslation ();
    const [ loginError, setLoginError ] = useState ( false );
    const [ serverError, setServerError ] = useState ( false )
    const [ networkConnectionError, setNetworkConnectionError ] = useState ( false );
    const [ validation, setValidation ] = useState ( false );
    const [ loginUrl, setLoginUrl ] = useState ( '' );
    const firstInstallation = JSON.parse ( localStorage.getItem ( 'firstInstallation' ) ) || {};
    let usernameRequired = t ( "Please enter your username" );
    let passwordRequired = t ( "Please enter your password" );
    const previousAppPhase = localStorage.getItem ( 'previousAppPhase' ) || "";
    const [ responseUnauthorized, setResponseUnauthorized ] = useState ( false );
    const [ messageUnauthorized, setMessageUnauthorized ] = useState ( '' );
    const formSubmition = ( e ) => {
        e.preventDefault ();
        setValidation ( true );
        return formik.handleSubmit ();
    }


    const handleLoginErrors = ( arg, loginError, serverError ) => {
        arg.json ().then ( data => {
            switch ( true ) {
                case( arg.status === 401 || arg.status === 404 ):
                    if ( arg.status === 401 && data.message !== "" ) {
                        setResponseUnauthorized ( true );
                        setMessageUnauthorized ( data.message );
                    } else {
                        setServerError ( false );
                        setNetworkConnectionError ( false );
                        setLoginError ( true );
                    }
                    break;
                case( arg.status === 500 ):
                    setServerError ( true );
                    setNetworkConnectionError ( false );
                    setLoginError ( false );
                    break;
                case( arg.hasOwnProperty ( 'error' ) && ( loginError === false && serverError === false ) ):
                    setNetworkConnectionError ( true );
                    break;
                case( loginError === true && arg.hasOwnProperty ( 'error' ) ):
                    setLoginError ( false );
                    setNetworkConnectionError ( true );
                    break;
                case( serverError === true && arg.hasOwnProperty ( 'error' ) ):
                    setServerError ( false );
                    setNetworkConnectionError ( true );
                    break;
                default:
                    break;
            }
        } );
    }

    const formik = useFormik ( {
        initialValues: {
            username: "",
            password: ""
        },
        validationSchema: yup.object ( {
            username: yup
                .string ()
                .required ( usernameRequired )
            ,
            password: yup
                .string ()
                .required ( passwordRequired )
        } ),
        validateOnChange: validation,
        onSubmit ( values ) {
            localStorage.removeItem ( "loggedOut" )
            const data = {
                username: values.username.replace ( "@werfen.com", "" ),
                password: values.password
            }
            fetch ( loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify ( data ),
            } )
                .then ( ( response ) => {
                    //console.log ( response )
                    if ( response.ok ) {
                        return response.json ();
                    } else {
                        handleLoginErrors ( response, loginError, serverError )
                    }
                } )
                .then ( ( data ) => {
                    if ( data ) {
                        //console.log( "data: ", data.data )
                        let dataToSend = data
                        handleLoginResponse ( dataToSend )
                            .then ( () => {
                                ipcRenderer.send ( 'getDefaultUserSettings' )
                            } )
                            .catch ( ( error ) => console.log ( "Error handling login response", error ) )
                        ;
                    }
                } )
                .catch ( ( error ) => {
                    let arg = {
                        error
                    }
                    console.log ( error );
                    handleLoginErrors ( arg, loginError, serverError );
                } )
            props.setNavigationItem ( 1 );
        },
    } )
    const setLoginEndpoint = () => {
        setLoginUrl ( process.env.REACT_APP_DEV_LOGIN );
        props.setLoginEndpoint ( process.env.REACT_APP_DEV_LOGIN );
    }

    const setProfilesBeforeUpdatingOnLogin = ( data ) => {
        let profilesBeforeUpdatingStore;
        data.origin ? profilesBeforeUpdatingStore = JSON.parse ( localStorage.getItem ( data.origin ) ) : profilesBeforeUpdatingStore = data.profiles;
        if ( typeof profilesBeforeUpdatingStore !== 'undefined' ) {
            for ( const profile of profilesBeforeUpdatingStore ) {
                profile.last_verification = Date.now ();
            }
            localStorage.setItem ( "profilesBeforeUpdatingStore", JSON.stringify ( profilesBeforeUpdatingStore ) );
        }
    }

    const handleLoginResponse = ( data ) => {
        const { token, mail, profiles, salesOrganization } = data;
        const salesOrganizationId = salesOrganization;
        let userEmailToSend = {
            key: 'userEmail',
            value: mail
        }
        localStorage.setItem ( "token", token );
        const profilesBeforeUpdatingStoreFromStore = JSON.parse ( localStorage.getItem ( 'profilesBeforeUpdatingStore' ) ) || [];
        let dataToSend;

        switch ( true ) {
            case( firstInstallation.usbInstallation === true ):
                dataToSend = {
                    origin: 'profilesFromUSB'
                }
                break;
            case ( firstInstallation.webInstallation === true ):
                console.log ( "firstInstallation.webInstallation === true ", firstInstallation.webInstallation === true )
                dataToSend = {
                    profiles
                }
                break;
            case ( profilesBeforeUpdatingStoreFromStore.length === 0 ):
                dataToSend = {
                    origin: 'availableProfiles'
                }
                break;
            default:
                dataToSend = {
                    origin: 'profilesBeforeUpdatingStore'
                }
                break;
        }
        setProfilesBeforeUpdatingOnLogin ( dataToSend );
        return new Promise ( ( resolve, reject, error ) => {
            localStorage.setItem ( "availableProfiles", JSON.stringify ( profiles ) );
            localStorage.setItem ( "username", mail.split ( "@" )[0] );
            localStorage.setItem ( "userEmail", mail );
            localStorage.setItem ( "salesOrganizationId", salesOrganizationId );
            let userSalesOrganization = {
                key: 'salesOrganizationId',
                value: salesOrganizationId
            }
            ipcRenderer.send ( 'updateUserSettings', userSalesOrganization );

            if ( typeof profiles !== 'undefined' ) {
                const userCurrentProfile = localStorage.getItem ( 'userCurrentProfile' );
                const profileExists = profiles.find ( item => item.id === userCurrentProfile );
                localStorage.setItem ( "tokenProfile", ( userCurrentProfile && profileExists ) ? userCurrentProfile : profiles[0].id );
                props.setUserEmail ( mail );
                ipcRenderer.send ( 'updateUserSettings', userEmailToSend );
                props.processProfiles ( profiles );
                resolve ( true );
                if ( error ) {
                    reject ( error )
                }
            }

        } )
    }

    const handleGoingToInstallLobby = ( event ) => {
        event.preventDefault ();
        localStorage.removeItem ( 'firstInstallation' );
        localStorage.removeItem ( 'previousAppPhase' );
        const firstInstalling = {
            key: 'firstInstalling',
            value: 'true'
        }
        ipcRenderer.send ( 'resetFirstInstallingInSettings', firstInstalling )
    }

    const saveUSBProfilesInStore = ( event, usbProfilesForUser ) => {
        localStorage.setItem ( 'profilesFromUSB', JSON.stringify ( usbProfilesForUser ) );
    }

    useEffect ( () => {
        props.setNavigationItem ( 1 );
        ipcRenderer.send ( 'get-env' );
        setLoginEndpoint ();
        if ( firstInstallation.hasOwnProperty ( "usbInstallation" ) && firstInstallation.usbInstallation ) {
            ipcRenderer.send ( 'getUserProfileOnUSBInstallation' );
        }
        ipcRenderer.on ( 'gotProfilesFromUSB', saveUSBProfilesInStore );
        return () => {
            ipcRenderer.off ( 'get-env-reply', setLoginEndpoint );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] )

    return (
        <div className={ "Login " }>
            <Background/>
            <Container fluid className={ "Login__Container h-100" }>
                <Row className={ "Login__Box h-100" }>
                    <Col xs={ 6 } className={ "Login__SideLogo" }>
                        <div>
                            <img alt="Werfen logo" src={ newLogo }/>
                        </div>
                    </Col>
                    <Col className={ "Login__Main" } xs={ 6 }>
                        <span className={ "Login__Title" }>{ t ( "Login with your account" ) }Zbix</span>
                        <div className={ "Login__Body" }>
                            <Form noValidate onSubmit={ ( e ) => formSubmition ( e ) }>
                                <Form.Group controlId="formUsername"
                                            className={ formik.errors.username ? "Login__Form--error" : "Login__Form--group" }>
                                    {/*<Form.Label className={ "text-left" }><span>Username</span></Form.Label>*/ }
                                    <Icon
                                        SvgSymbol={ UserIcon }
                                        viewBox={ "0 0 24 24" }
                                        className={ formik.errors.username ? "icon-error" : "" }
                                    />
                                    { process.env.NODE_ENV === "development" && <Form.Control
                                        className={ formik.errors.username ? "Login__Input Login__Input--error" : "Login__Input Login__Input--loc" }
                                        name="username"
                                        value={ formik.values.username }
                                        onChange={ formik.handleChange }
                                        onInput={ ( e ) => e.target.value = ( "" + e.target.value ).toLowerCase () }
                                        placeholder={ t ( "Username" ) }
                                        type="text"/> }
                                    { process.env.NODE_ENV === "production" && <Form.Control
                                        className={ formik.errors.username ? "Login__Input Login__Input--error" : "Login__Input Login__Input--build" }
                                        name="username"
                                        value={ formik.values.username }
                                        onChange={ formik.handleChange }
                                        onInput={ ( e ) => e.target.value = ( "" + e.target.value ).toLowerCase () }
                                        placeholder={ t ( "Username" ) }
                                        type="text"/> }
                                    { formik.errors.username && (
                                        <span className={ "Login__Error-input" }>
                                                        { formik.errors.username }
                                                    </span>
                                    ) }

                                </Form.Group>
                                <Form.Group controlId="formPassword"
                                            className={ !!formik.errors.password ? "Login__Form--error" : "Login__Form--group" }>
                                    {/*  <Form.Label className={ "text-left" }><span>Password</span></Form.Label>*/ }
                                    <Icon
                                        SvgSymbol={ PasswordIcon }
                                        viewBox={ "0 0 24 24" }
                                    />
                                    { process.env.NODE_ENV === "development" && <Form.Control
                                        className={ formik.errors.password ? "Login__Input Login__Input--error" : "Login__Input Login__Input--loc" }
                                        name="password"
                                        value={ formik.values.password }
                                        onChange={ formik.handleChange }
                                        placeholder={ t ( "Password" ) }
                                        type="password"/> }
                                    { process.env.NODE_ENV === "production" && <Form.Control
                                        className={ formik.errors.password ? "Login__Input Login__Input--error" : "Login__Input Login__Input--build" }
                                        name="password"
                                        value={ formik.values.password }
                                        onChange={ formik.handleChange }
                                        placeholder={ t ( "Password" ) }
                                        type="password"/> }
                                    { formik.errors.password && (
                                        <span className={ "Login__Error-input" }>
                                                        { formik.errors.password }
                                                    </span>
                                    ) }
                                </Form.Group>
                                <div>
                                    <Button
                                        className={ "Login__Submit submit-generic" }
                                        type="submit">{ t ( "Login" ) }</Button>
                                </div>


                            </Form>
                            { loginError && <span className={ "Login__Error" }>
                                            { t ( "Incorrect credentials" ) }!!</span> }
                            { ( props.networkOnline === false || networkConnectionError ) &&
                                <span className={ "Login__Error" }>
                                            { t ( "Offline error" ) }</span> }
                            { serverError && <span className={ "Login__Error" }>
                                            { t ( "Server error on login" ) }</span> }
                            { responseUnauthorized && <span className={ "Login__Error" }>
                                            { t ( messageUnauthorized ) }</span> }
                        </div>
                    </Col>
                </Row>
                { previousAppPhase === "installLobby" &&
                    <div
                        className="Login__Button-back"
                        onClick={ handleGoingToInstallLobby }
                    >
                        <Icon
                            SvgSymbol={ ArrowBack }/>
                    </div> }
            </Container>
        </div>
    );
};

const mapStateToProps = ( state ) => ( {
    navigationItem: state.navigation.navigationItem,
    webInstallation: state.settings.webInstallation,
    appPhase: state.settings.appPhase,
    networkOnline: state.sensors.networkAvailable
} )

const mapDispatchToProps = ( dispatch ) => {
    return {
        setNavigationItem: ( navigationItem ) => dispatch ( setNavigationItem ( navigationItem ) ),
        setAvailableProfiles: ( availableProfiles ) => dispatch ( setAvailableProfiles ( availableProfiles ) ),
        setUserEmail: ( useEmail ) => dispatch ( setEmail ( useEmail ) ),
        setLoginEndpoint: ( loginUrl ) => dispatch ( setLoginEndpoint ( loginUrl ) ),
        setAppPhase: ( appPhase ) => dispatch ( setAppPhase ( setAppPhase ( appPhase ) ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( Login );
