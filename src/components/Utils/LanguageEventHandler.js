import { useEffect } from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import isElectron from "is-electron";
import { setAppLanguage } from "../../redux/actions/settings";

let electron;
if ( isElectron() ) {
    electron = window.require( "electron" );
}
const ipcRenderer = electron && electron.ipcRenderer;
const LanguageEventHandler = (props) => {
    const appTranslations = [
        { key: "English", value: "en-US" },
        { key: "English-GB", value: "en-GB" },
        { key: "Spanish", value: "es-ES" },
        { key: "Polish", value: "pl-PL" },
        { key: "Italian", value: "it-IT" },
        { key: "Portuguese", value: "pt-PT" },
        { key: "Portuguese-BR", value: "pt-BR" },
    ]
    const { i18n } = useTranslation ();

    useEffect( () => {
        ipcRenderer.on( 'gotAppLanguage', onSetAppLanguage );
        ipcRenderer.on( 'appLanguageReset',  onResetAppLanguage );

        return () => {
            ipcRenderer.off( 'gotAppLanguage', onSetAppLanguage );
            ipcRenderer.off( 'appLanguageReset', onResetAppLanguage );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    const onSetAppLanguage = ( event, info ) => {
        let transLanguage = appTranslations.filter ( item => item.key === info.value )[0]
        i18n.changeLanguage ( transLanguage.value )
            .then ( () => {
                props.setAppLanguage ( info.value );
                console.log ( "Success changing the language!", transLanguage.value )
            }  );
    }

    const onResetAppLanguage = ( langReady ) => {
        localStorage.removeItem ( 'firstTimeLogin' )
        props.setAppLanguage ( langReady.value )
        let transLanguage = appTranslations.filter ( item => item.key === langReady.value )[0] || "en-US";
        i18n.changeLanguage ( transLanguage.value )
            .then ( () => {
                console.log ( "Success resetting the language!" );
            } )
    }

    return null
}
const mapStateToProps = ( state ) => ({
    networkOnline: state.sensors.networkAvailable
})

function mapDispatchToProps(dispatch) {
    return{
        setAppLanguage: (item) => dispatch(setAppLanguage(item))
    }
}
export default connect(mapStateToProps, mapDispatchToProps) (LanguageEventHandler)
