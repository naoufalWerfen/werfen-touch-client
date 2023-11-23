import React, { useEffect } from 'react';
import Background from "../Background/Background";
import './ReinstallScreen.scss';
import { Button, Col, Container, Row } from "react-bootstrap";
import { setNavigationItem } from "../../redux/actions/navigation";
import { connect } from "react-redux";
import { useTranslation } from 'react-i18next';
import isElectron from "is-electron";
import newLogo from "../../assets/logos/New_Werfen_logo.jpg";
import { sendToLogs } from "../../constants/functions";
import { setAppPhase } from "../../redux/actions/settings";

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const ReinstallScreen = ( props ) => {
    const { t, i18n } = useTranslation ();
    const appTranslations = [
        { key: "English", value: "en-US" },
        { key: "English-GB", value: "en-GB" },
        { key: "Spanish", value: "es-ES" },
        { key: "Polish", value: "pl-PL" },
        { key: "Italian", value: "it-IT" },
        { key: "Portuguese", value: "pt-PT" },
        { key: "Portuguese-BR", value: "pt-BR" }
    ];
    const setAppLanguageOnReinstalling = ( arg ) => {
        let transLanguage = appTranslations.filter ( item => item.key === arg )[0] || { key: "English", value: "en-US" }
        i18n.changeLanguage ( transLanguage.value )
            .then ( () => ( console.log ( "Success changing the language from main!", arg, transLanguage ) ) )
    }
    const handleLogoutAndReinstall = ( e ) => {
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
        localStorage.removeItem ( "firstInstallationDone" )
        localStorage.removeItem ( "appInitialized" );
        const userLoggedOut = "true"
        localStorage.setItem ( "loggedOut", userLoggedOut )
        props.setAppPhase ( 'login' );
        ipcRenderer.send ( 'setInstallingFromWeb' );
        const firstInstallation = {
            webInstallation: true
        }
        localStorage.setItem ( "firstInstallation", JSON.stringify ( firstInstallation ) );
    }

    useEffect ( () => {
        props.setNavigationItem ( 8 );
        setAppLanguageOnReinstalling ( props.appLanguage )
        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, [] );

    return (
        <div className={ "ReinstallScreen" }>
            <Background/>
            <Container fluid className={ "ReinstallScreen__Container h-100" }>
                <Row className="ReinstallScreen__Box h-100">
                    <Col xs={ 6 } className={ "ReinstallScreen__SideLogo" }>
                        <div>
                            <img src={ newLogo } alt={ "Werfen" }/>
                        </div>
                    </Col>
                    <Col xs={ 6 }
                         className={ "ReinstallScreen__Main" }
                    >
                        <div className={ "ReinstallScreen__Content" }>
                            <div className={ "ReinstallScreen__Message" }>
                                <p className="ReinstallScreen__Message--title">
                                    { t ( "Reinstalling content" ) }<br/>
                                </p>
                            </div>
                            <Button
                                className={ "ReinstallScreen__Submit submit-generic" }
                                onClick={ ( e ) => handleLogoutAndReinstall ( e ) }>
                                { t ( 'Confirm' ) }</Button>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );

};

const mapStateToProps = ( state ) => ( {
    navigationItem: state.navigation.navigationItem,
    appLanguage: state.settings.appLanguage
} )

const mapDispatchToProps = ( dispatch ) => {
    return {
        setNavigationItem: ( navigationItem ) => dispatch ( setNavigationItem ( navigationItem ) ),
        setAppPhase: ( appPhase ) => dispatch ( setAppPhase ( appPhase ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( ReinstallScreen );
