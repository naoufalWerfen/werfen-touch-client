import isElectron from "is-electron";
import { useEffect } from "react";
import { connect } from "react-redux";
import { setNotificationData } from "../../redux/actions/notifications";
import { setShow } from "../../redux/actions/modals";

let electron;
if ( isElectron() ) {
    electron = window.require( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;
const {
    NOTIFICATION_SERVICE_STARTED,
    NOTIFICATION_SERVICE_ERROR,
    NOTIFICATION_RECEIVED,
    TOKEN_UPDATED,
} = require ( 'electron-push-receiver/src/constants' )
export const NotificationsEventHandler = () => {

    const onNotificationServiceStarted = ( _, token ) => {
        console.log ( 'service successfully started', token );
    }

    const onNotificationServiceError = ( _, error ) => {
        console.log ( 'notification error', error )
    }

    const onNotificationTokenUpdated = ( _, token ) => {
        console.log( 'token updated', token )
    }
    const doOnNotificationDisplay = ( notificationPayload ) => {
        if ( notificationPayload.notification.body ) {
            // payload has a body, so show it to the user
            console.log( 'display notification', notificationPayload )
            // let myNotification = new Notification( notificationPayload.notification.title, {
            //     body: notificationPayload.notification.body
            // } )

            notificationPayload.onclick = () => {
                //console.log('Notification clicked')
            }
        } else {
            // payload has no body, so consider it silent (and just consider the data portion)
            //('do something with the key/value pairs in the data', arg.data)
        }
       ipcRenderer.send('gotNotificationData', notificationPayload.data)
    }
    const onNotificationDisplay = ( _, serverNotificationPayload ) => {
        doOnNotificationDisplay( serverNotificationPayload );
    }
    useEffect( () => {
        ipcRenderer.on( NOTIFICATION_SERVICE_STARTED, onNotificationServiceStarted );
        // Handle notification errors
        ipcRenderer.on( NOTIFICATION_SERVICE_ERROR, onNotificationServiceError );
        // Send FCM token to backend
        ipcRenderer.on( TOKEN_UPDATED, onNotificationTokenUpdated );
        // Display notification
        ipcRenderer.on( NOTIFICATION_RECEIVED, onNotificationDisplay );
        return () => {
            ipcRenderer.off( NOTIFICATION_SERVICE_STARTED, onNotificationServiceStarted );
            ipcRenderer.off( NOTIFICATION_SERVICE_ERROR, onNotificationServiceError );
            ipcRenderer.off( TOKEN_UPDATED, onNotificationTokenUpdated );
            ipcRenderer.off( NOTIFICATION_RECEIVED, onNotificationDisplay )
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    return null
}

const mapStateToProps = ( state ) => ({
    show: state.modalsReducer.show,
    notificationData: state.notificationsReducer.notificationData,
})

function mapDispatchToProps(dispatch) {
    return{
        setNotificationData: (notificationData) => dispatch(setNotificationData(notificationData)),
        setShow: (show) => dispatch(setShow(show)),
    }
}
export default connect(mapStateToProps, mapDispatchToProps) (NotificationsEventHandler)
