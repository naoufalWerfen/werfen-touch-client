import isElectron from "is-electron";
import { useEffect } from "react";
import { connect } from "react-redux";
import { useTranslation } from 'react-i18next';
import {
    setAppLangReady,
    setAppLanguage,
    setContentLanguage,
    setEmail,
    setInstallationMethod,
    setProfile,
    setSendingCopyToUser
} from "../../redux/actions/settings";

let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;
export const SettingsEventHandler = ( props ) => {
    const { i18n } = useTranslation ();
    const appTranslations = [
        { key: "English", value: "en-US" },
        { key: "English-GB", value: "en-GB" },
        { key: "Spanish", value: "es-ES" },
        { key: "Polish", value: "pl-PL" },
        { key: "Italian", value: "it-IT" },
        { key: "Portuguese", value: "pt-PT" },
        { key: "Portuguese-BR", value: "pt-BR" },
    ]
    const setDefaultUserSettings = ( event, info ) => {
        console.log ( "Received default user settings from DB ", info )
        info
            .filter ( item => item.key !== 'firstInstalling' )
            .forEach ( item => {
                switch ( item.key ) {
                    case 'appLanguage':
                        if ( props.appPhase === "initialSetup" ) {
                            //console.log ( "we are in initialSetup" )
                            props.setAppLangReady ( item );
                        } else {
                            //console.log ( "This is different app phase: ", props.appPhase )
                            props.setAppLanguage ( item.value )
                            let transLanguage = appTranslations.filter ( element => element.key === item.value )[0]
                            i18n.changeLanguage ( transLanguage.value )
                                .then ( () => ( console.log ( "Success changing the language!" ) ) )
                        }
                        break;
                    case 'contentLanguage':
                        props.setContentLanguage ( item.value );
                        break;
                    case 'userEmail':
                        props.setUserEmail ( item.value )
                        break;
                    case 'sendCopyToUser':
                        props.sendCopyToUser ( item.value );
                        break;
                    case 'appInstallMethod':
                        props.setInstallationMethod ( item.value );
                        break;
                    case 'userProfile' :
                        props.setUserProfile ( item.value );
                        break;
                    default:
                        break;
                }
            } )
    }

    useEffect ( () => {
        ipcRenderer.on ( 'receivedDefaultUserSettings', setDefaultUserSettings )
        return () => {
            ipcRenderer.off ( 'receivedDefaultUserSettings', setDefaultUserSettings );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        props.appLanguage,
        props.sendCopy,
        props.contentLanguage, ] );

    return null
}

const mapStateToProps = ( state ) => ( {
    appLanguage: state.settings.appLanguage,
    sendCopy: state.settings.sendCopy,
    userProfile: state.settings.userProfile,
    contentLanguage: state.settings.contentLanguage,
    appPhase: state.settings.appPhase,
    langReady: state.settings.langReady
} )

function mapDispatchToProps ( dispatch ) {
    return {
        setUserEmail: ( useEmail ) => dispatch ( setEmail ( useEmail ) ),
        setUserProfile: ( profile ) => dispatch ( setProfile ( profile ) ),
        sendCopyToUser: ( sendCopy ) => dispatch ( setSendingCopyToUser ( sendCopy ) ),
        setInstallationMethod: ( instMethod ) => dispatch ( setInstallationMethod ( instMethod ) ),
        setContentLanguage: ( contentLanguage ) => dispatch ( setContentLanguage ( contentLanguage ) ),
        setAppLanguage: ( appLanguage ) => dispatch ( setAppLanguage ( appLanguage ) ),
        setAppLangReady: ( langReady ) => dispatch ( setAppLangReady ( langReady ) ),
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( SettingsEventHandler )
