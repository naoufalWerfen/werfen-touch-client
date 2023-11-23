import isElectron from "is-electron";
import { connect } from "react-redux";
import { useEffect } from "react";
import { setAppPhase } from "../../redux/actions/settings";
let electron;
if ( isElectron() ) {
    electron = window.require( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const PinEventHandler = (/*props*/) => {
    const token = localStorage.getItem( "token" );
    // let pinTimeout
    // const setToPinScreen = () => {
    //     props.setAppPhase( "lockedScreen" );
    // }

    // const setPinTimeout = () => {
    //     pinTimeout = setTimeout( setToPinScreen, 1800000 )
    // }
    //
    // const unsetPinTimeout = () => {
    //     if ( pinTimeout !== undefined ) {
    //         clearTimeout( pinTimeout )
    //     }
    // }

    const doOnLoginFinished = () => {
        //setPinTimeout();
    }
    useEffect( () => {
        if(token !== null && token !== ""){
            //setPinTimeout()
        }
        return () => {
            //unsetPinTimeout()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ ] );

    useEffect( () => {
        ipcRenderer.on( 'onLoginFinished', doOnLoginFinished );
        return () => {
            ipcRenderer.off( 'onLoginFinished', doOnLoginFinished );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ ] );

    return null
}
const mapStateToProps = ( state ) => ({
    appPhase: state.settings.appPhase
})

function mapDispatchToProps(dispatch) {
    return{
        setAppPhase: (appPhase) => dispatch(setAppPhase(appPhase))
    }
}
export default connect(mapStateToProps, mapDispatchToProps) (PinEventHandler)
