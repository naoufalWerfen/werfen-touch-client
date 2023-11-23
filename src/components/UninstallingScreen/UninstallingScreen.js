import React, { useEffect } from 'react';
import Background from "../Background/Background";
import './UninstallingScreen.scss';
import Loader from "../Loader/Loader";
import { Col, Container, Row } from "react-bootstrap";
import { setNavigationItem } from "../../redux/actions/navigation";
import { connect } from "react-redux";
import { useTranslation } from 'react-i18next';
import isElectron from "is-electron";
import newLogo from "../../assets/logos/New_Werfen_logo.jpg";

let electron;

if ( isElectron() ) {
    electron = window.require( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const UninstallingScreen = ( props ) => {
    const { t, i18n } = useTranslation ();
    const appTranslations = [
        { key: "English", value: "en-US" },
        { key: "English-GB", value: "en-GB" },
        { key: "Spanish", value: "es-ES" },
        { key: "Polish", value: "pl-PL" },
        { key: "Italian", value: "it-IT" },
        { key: "Portuguese", value: "pt-PT" },
        { key: "Portuguese-BR", value: "pt-BR" },
    ];
    const setAppLanguageOnUninstalling = ( event, arg ) => {
        let transLanguage = appTranslations.filter ( item => item.key === arg )[0] || { key: "English", value: "en-US" }
        i18n.changeLanguage ( transLanguage.value )
            .then ( () => ( console.log ( "Success changing the language from main!", arg, transLanguage ) ) )
    }
    useEffect ( () => {
        props.setNavigationItem ( 8 );
        ipcRenderer.on ( 'setUninstallingLang', setAppLanguageOnUninstalling );
        //console.log("Web installation is set to: ", props.webInstallation, props)
        return () => {
            ipcRenderer.off('setUninstallingLang', setAppLanguageOnUninstalling );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.webInstallation, props.appLanguage] );

    return (
        <div className={ "UninstallingScreen" }>
            <Background/>
            <Container fluid className={ "UninstallingScreen__Container h-100" }>
                <Row className="UninstallingScreen__Box h-100">
                    <Col xs={ 6 } className={ "UninstallingScreen__SideLogo" }>
                        <div>
                            <img src={ newLogo } alt={ "Werfen" }/>
                        </div>
                    </Col>
                    <Col xs={ 6 }
                         className={ "UninstallingScreen__Main" }
                    >
                        { ( props.phase === 'uninstallingApp' ) &&
                            <div className={ "UninstallingScreen__Content" }>
                                <div className={ "UninstallingScreen__Message" }>
                                    <p className="UninstallingScreen__Message--title">
                                        { t ( "Uninstalling content" ) }<br/>
                                    </p>
                                </div>
                                <Loader/>
                            </div> }
                        { ( props.phase === 'uninstallingAppFinished' ) &&
                            <div className={ "UninstallingScreen__Content" }>

                                <div className={ "UninstallingScreen__Message" }>
                                    <p className="UninstallingScreen__Message--title">
                                        { t ( "Content uninstalled" ) }<br/>
                                    </p>
                                </div>
                            </div> }
                    </Col>
                </Row>
            </Container>
        </div>
    );

};

const mapStateToProps = ( state ) => ({
    navigationItem: state.navigation.navigationItem,
    downloadQueue: state.manageDownloading.downloadQueue,
    webInstallation: state.settings.webInstallation,
    appLanguage: state.settings.appLanguage
})

const mapDispatchToProps = ( dispatch ) => {
    return {
        setNavigationItem: ( navigationItem ) => dispatch( setNavigationItem( navigationItem ) )
    }
}

export default connect( mapStateToProps, mapDispatchToProps )( UninstallingScreen );
