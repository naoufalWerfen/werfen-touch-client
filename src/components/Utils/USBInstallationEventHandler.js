import isElectron from "is-electron";
import { connect } from "react-redux";
import { useEffect } from "react";
import { setAppPhase, setWebInstallation } from "../../redux/actions/settings";

let electron;
if ( isElectron() ) {
    electron = window.require( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;
export const USBInstallationEventHandler = (props) => {
    const onInstallFromUSBStarted = () => {
        let webInstallation = false;
        props.setWebInstallation ( webInstallation );
        props.setAppPhase ( 'firstContentInstallation' );
    }
    useEffect( () => {
        ipcRenderer.on( 'installFromUSBStarted', onInstallFromUSBStarted )
        return () => {
            ipcRenderer.off( 'installFromUSBStarted', onInstallFromUSBStarted )
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ ] );
    return null
}
const mapStateToProps = (state) => ({
    appPhase: state.settings.appPhase
})

function mapDispatchToProps(dispatch) {
    return {
        setWebInstallation: ( webInstallation ) => dispatch( setWebInstallation( webInstallation ) ),
        setAppPhase: (appPhase) => dispatch(setAppPhase(appPhase))
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(USBInstallationEventHandler)

