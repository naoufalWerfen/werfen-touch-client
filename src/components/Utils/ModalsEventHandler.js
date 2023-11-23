import isElectron from "is-electron";
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { setNotificationData } from "../../redux/actions/notifications";
import { Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog";
import { requestUpdates, setAppPhase } from "../../redux/actions/settings";

let electron;
if ( isElectron() ) {
    electron = window.require( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

export const ModalsEventHandler = (props) => {

    const { t } = useTranslation ();
    const [ dataForInstallation, setDataForInstallation ] = useState ( [] );
    const [ confDialogsArray, setConfDialogsArray ] = useState ( [] );
    const [ localHashData, setHashDataLocally ] = useState ( [] );

    const [ modalType, setModalType ] = useState ( "" )

    const titleUpdates = t ( "Updates modal title" )
    const messageArrayUpdates = [
        t ( "Updates modal question" )
    ]

    const titleNewProfile = t ( "New profile modal title" )
    const messageArrayNewProfile = [
        t ( "New profile modal question" )
    ]
    const titleRequest = t ( "Request modal title" )
    const messageArrayRequests = [
        t ( "Request modal notification" )
    ]

    const titleRemoved = t ( "Removed profile modal title" )
    const messageArrayRemoved = [
        t ( "Removed profile modal notification" )
    ]

    const titleReinstalling = t ( "Reinstalling modal title" )
    const messageArrayReinstalling = [
        t ( "Reinstalling content" )
    ]

    const titleRestartNotification = t ( "Restart modal title" )
    const messageRestartArrayNotification = [
        t ( "Restarting app" )
    ]

    const saveUpdatedHashDataForProfile = ( event, hashData ) => {
        setHashDataLocally ( hashData );
    }

    const delayShowingModal = () => {
        setTimeout ( showModal, 1000 );
    }

    const delayShowingNewProfileModal = () => {
        setTimeout ( showNewProfileModal, 1000 );
    }
    const showModal = () => {
        setModalType ( 'updates' );
    }

    const showNewProfileModal = () => {
        setModalType ( 'newProfile' );
    }

    const delayShowingReinstallingModal = () => {
        setTimeout ( showReinstallModal, 500 );
    }

    const defineModalTypesForUpdatesAndProcessData = ( notificationDataList ) => {

        const reinstallAfterMigration = localStorage.getItem ( 'reinstallAfterMigration' ) || "false";
        const dataIncludesNewProfile = notificationDataList.filter ( ( data ) => data.newProfile === true ).length > 0;
        switch ( true ) {
            case ( dataIncludesNewProfile ):
                delayShowingNewProfileModal ();
                break;
            case ( reinstallAfterMigration === "true" ):
                delayShowingReinstallingModal ();
                break;
            default:
                delayShowingModal ();
                break;
        }

        let installingListAccumulator = [];
        for ( const notificationData of notificationDataList ) {
            props.setNotificationData ( notificationData );
            const infoForInstalling = {};
            infoForInstalling.packages = ( notificationData.data && notificationData.data.packages ) ? notificationData.data.packages : [];
            infoForInstalling.groups = ( notificationData.data && notificationData.data.groups ) ? notificationData.data.groups : [];
            infoForInstalling.categories = ( notificationData.data && notificationData.data.categories ) ? notificationData.data.categories : [];
            infoForInstalling.profile = notificationData.profile ? notificationData.profile : "";
            infoForInstalling.newProfile = ( reinstallAfterMigration === "true" ) ? true : notificationData.newProfile;
            infoForInstalling.postpone = false;
            infoForInstalling.hash = ( notificationData.data && notificationData.data.hash ) ? notificationData.data.hash : "";

            if ( installingListAccumulator.length === notificationDataList.length - 1 ) {
                setDataForInstallation ( [ ...installingListAccumulator, infoForInstalling ] );
            } else {
                installingListAccumulator = [ ...installingListAccumulator, infoForInstalling ];
            }
        }
    }

    const handleDownloadingModal = ( event, notificationDataList ) => {
        setTimeout (
            defineModalTypesForUpdatesAndProcessData
            , 1000, notificationDataList )
    }

    const handleConfirmationDialog = ( event, info ) => {
        if ( info === "requestedByUser" ) {
            setModalType ( "noPendingUpdates" );
        }
    }

    const handleProfileRemoved = () => {
        setModalType ( "profileRemoved" );
    }

    const doNotifyUserAboutRestarting = () => {
        setModalType ( 'restart' );
    }

    const showReinstallModal = () => {
        setModalType ( 'migrationWithReinstalling' )
    }

    const handleDownloadLater = ( e ) => {
        e.preventDefault ()
        setModalType ( "" );
        setDataForInstallation ( [] );
        props.requestUpdates ( false );
    }

    const handleDownloadNow = ( e ) => {
        localStorage.removeItem ( 'profilesBeforeUpdatingStore' );
        e.preventDefault ()
        ipcRenderer.send ( 'processServerNotificationPayload', dataForInstallation );
        ipcRenderer.send ( "updateProfilesDataOnHashChange", localHashData );
        localStorage.setItem ( 'profilesBeforeUpdatingStore', JSON.stringify ( localHashData ) );
        setModalType ( "" );
        setDataForInstallation ( [] );
        props.requestUpdates ( false );
    }

    const handleDownloadNewProfileLater = ( event ) => {
        event.preventDefault ()
        setModalType ( "" );
        setDataForInstallation ( [] );
    }

    const handleDownloadNewProfileNow = ( event ) => {
        if ( event ) {
            event.preventDefault ();
        }
        localStorage.removeItem ( 'profilesBeforeUpdatingStore' );
        ipcRenderer.send ( 'processServerNotificationPayload', dataForInstallation );
        ipcRenderer.send ( "updateProfilesDataOnHashChange", localHashData );
        localStorage.setItem ( 'profilesBeforeUpdatingStore', JSON.stringify ( localHashData ) );
        setModalType ( "" );
        setDataForInstallation ( [] );
        props.setAppPhase ( 'firstContentInstallation' );
        const firstInstallation = {
            webInstallation: true
        }
        localStorage.setItem ( "firstInstallation", JSON.stringify ( firstInstallation ) );
        localStorage.removeItem ( 'afterFirstInstallation' );
        localStorage.removeItem ( ( 'firstInstallationDone' ) );
        const reinstallAfterMigration = localStorage.getItem ( 'reinstallAfterMigration' )
        if ( reinstallAfterMigration === "true" ) {
            localStorage.removeItem ( 'reinstallAfterMigration' );
        }
    }

    const handleCloseDialog = () => {
        setDataForInstallation ( [] );
        setModalType ( "" );
        props.requestUpdates ( false );
        const profileRemoved = JSON.parse ( localStorage.getItem ( "profileRemoved" ) ) || {};
        if ( profileRemoved && ( profileRemoved.done === true ) ) {
            localStorage.removeItem ( "profileRemoved" );
        }
    }


    const handleCloseNewProfileDialog = () => {
        setModalType ( "" );
        setDataForInstallation ( [] );
    }

    const handleClose = () => {
        setModalType ( "" );
        props.requestUpdates ( false );
    }

    const handleCloseRestartPopUp = () => {
        const uninstallationInCourse = "true";
        localStorage.setItem ( "uninstallationInCourse", uninstallationInCourse );
        setModalType ( "" );
        ipcRenderer.send ( "doRestartApp" );
    }

    const modals = [
        {
            type: "updates",
            onHide: handleClose,
            handleOnCancel: handleDownloadLater,
            handleOnAccept: handleDownloadNow,
            labelCancel: t ( "Install later" ),
            labelAccept: t ( "Install automatically now" ),
            title: titleUpdates,
            messageArray: messageArrayUpdates,
            key: "handleUpdatesInstallation",
            contentClassName: 'updates',
        },
        {
            type: "newProfile",
            onHide: handleCloseNewProfileDialog,
            handleOnCancel: handleDownloadNewProfileLater,
            handleOnAccept: handleDownloadNewProfileNow,
            labelCancel: t ( "Install later" ),
            labelAccept: t ( "Install automatically now" ),
            title: titleNewProfile,
            messageArray: messageArrayNewProfile,
            key: "handleNewProfilesInstallation",
            contentClassName: 'new-profile',
        },
        {
            type: "noPendingUpdates",
            onHide: handleCloseDialog,
            handleOnAccept: handleCloseDialog,
            handleOnCancel: {},
            labelCancel: "",
            labelAccept: t ( "Close dialog" ),
            title: titleRequest,
            messageArray: messageArrayRequests,
            key: "handleNoPendingUpdatesDialog",
            contentClassName: 'no-updates',
        },
        {
            type: "profileRemoved",
            onHide: handleCloseDialog,
            handleOnAccept: handleCloseDialog,
            handleOnCancel: {},
            labelCancel: "",
            labelAccept: t ( "Close dialog" ),
            title: titleRemoved,
            messageArray: messageArrayRemoved,
            key: "handleProfileRemoved",
            contentClassName: 'no-updates',
        },
        {
            type: "migrationWithReinstalling",
            onHide: handleDownloadNewProfileNow,
            handleOnAccept: handleDownloadNewProfileNow,
            handleOnCancel: {},
            labelCancel: "",
            labelAccept: t ( "Close dialog" ),
            title: titleReinstalling,
            messageArray: messageArrayReinstalling,
            key: "handleMigrationWithReinstalling",
            contentClassName: 'reinstall',
        },
        {
            type: "restart",
            onHide: handleCloseRestartPopUp,
            handleOnAccept: handleCloseRestartPopUp,
            handleOnCancel: {},
            labelCancel: "",
            labelAccept: t ( "Close dialog" ),
            title: titleRestartNotification,
            messageArray: messageRestartArrayNotification,
            key: "handleRestartAppNotification",
            contentClassName: 'no-updates',
        },


    ]

    const handleUpdatesInstallation = modalType !== "" ? {
        show: true,
        onHide: modals.filter ( ( item ) => item.type === modalType )[0].onHide,
        contentClassName: modals.filter ( ( item ) => item.type === modalType )[0].contentClassName,
        title: modals.filter ( ( item ) => item.type === modalType )[0].title,
        messageArray: modals.filter ( ( item ) => item.type === modalType )[0].messageArray,
        handleOnCancel: modals.filter ( ( item ) => item.type === modalType )[0].handleOnCancel,
        handleOnAccept: modals.filter ( ( item ) => item.type === modalType )[0].handleOnAccept,
        labelCancel: modals.filter ( ( item ) => item.type === modalType )[0].labelCancel,
        labelAccept: modals.filter ( ( item ) => item.type === modalType )[0].labelAccept,
        key: modals.filter ( ( item ) => item.type === modalType )[0].key
    } : {}


    useEffect ( () => {
        console.log ( { updatedModalType: modalType } );
        setConfDialogsArray ( [ handleUpdatesInstallation ] );
    }, [ modalType ] );


    useEffect ( () => {

        ipcRenderer.on ( 'resentNotificationData', handleDownloadingModal );
        ipcRenderer.on ( 'resentNoPendingUpdatesData', handleConfirmationDialog );
        ipcRenderer.on ( 'resentProfileRemoved', handleProfileRemoved );
        ipcRenderer.on ( 'resentUpdatedHashDataForProfile', saveUpdatedHashDataForProfile );
        ipcRenderer.on ( 'notifyUserAboutRestarting', doNotifyUserAboutRestarting );

        return () => {
            ipcRenderer.off ( 'resentNotificationData', handleDownloadingModal );
            ipcRenderer.off ( 'resentNoPendingUpdatesData', handleConfirmationDialog );
            ipcRenderer.on ( 'resentProfileRemoved', handleProfileRemoved );
            ipcRenderer.off ( 'resentUpdatedHashDataForProfile', saveUpdatedHashDataForProfile );
            ipcRenderer.off ( 'notifyUserAboutRestarting', doNotifyUserAboutRestarting );

        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props ] );

    useEffect ( () => {
        ipcRenderer.on ( 'resentUpdatesData', handleDownloadingModal );

        return () => {
            ipcRenderer.off ( 'resentUpdatesData', handleDownloadingModal );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props ] );



    if ( props.appPhase !== 'readyToUse' ) {
        return null
    } else {
        return (
            <>
                { ( props.appPhase === 'readyToUse' && confDialogsArray[0].hasOwnProperty ( 'key' ) ) && <Row>
                    { confDialogsArray.map ( ( dialog ) =>
                        < ConfirmationDialog
                            key={ dialog.key }
                            show={ dialog.show }
                            onHide={ dialog.onHide }
                            contentClassName={ dialog.contentClassName }
                            title={ dialog.title || "" }
                            messageArray={ dialog.messageArray || [] }
                            handleOnCancel={ dialog.handleOnCancel }
                            handleOnAccept={ dialog.handleOnAccept }
                            labelCancel={ dialog.labelCancel || "" }
                            labelAccept={ dialog.labelAccept || "" }
                            displayConfirmationInput={ dialog.displayConfirmationInput || false }
                            confirmationInputType={ dialog.confirmationInputType || "" }
                        />
                    ) }
                </Row> }
            </>
        )
    }
}

const mapStateToProps = ( state ) => ({
    notificationData: state.notificationsReducer.notificationData,
    appPhase: state.settings.appPhase
})
function mapDispatchToProps( dispatch) {
    return {
        setNotificationData: ( notificationData ) => dispatch ( setNotificationData ( notificationData ) ),
        requestUpdates: ( updatesRequested ) => dispatch ( requestUpdates ( updatesRequested ) ),
        setAppPhase: ( appPhase ) => dispatch ( setAppPhase ( appPhase ) )
    }
}

export default connect(mapStateToProps, mapDispatchToProps) (ModalsEventHandler)

