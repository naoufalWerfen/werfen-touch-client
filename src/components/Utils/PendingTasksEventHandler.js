import { useEffect } from 'react';
import isElectron from "is-electron";
import {
    getDataForProfiles,
    prepareEmailToSend,
    sendEmailsToBackend,
    sendPendingLogsToBackend
} from "../../constants/functions";
import { alert } from "react-custom-alert";
import 'react-custom-alert/dist/index.css'; // import css file from root.
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";

let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" );
}
const ipcRenderer = electron && electron.ipcRenderer;

const PendingTasksEventHandler = () => {
    const { t } = useTranslation ();

    const doExecutePendingLogs = ( event, logs ) => {
        sendPendingLogsToBackend ( logs );
    }

    const alertMessages = [
        {
            id: "confirmation-message",
            text: t ( "Email sent" )
        },
        {
            id: "error-message",
            text: t ( "Error sending email" )
        }
    ]

    const alertEmailSent = ( data ) => alert ( { message: data.message, type: data.type } );
    const alertPendingDownload = ( data ) => alert ( { message: data.message, type: data.type } )
    const doExecutePendingTasks = async ( event, tasks ) => {
        let preparedDataToSend = {};
        ipcRenderer.send ( 'sendPendingLogs' );

        for ( const task of tasks ) {

            switch ( task.key ) {
                case"failedDownloads":
                    if ( task.value.length > 0 ) {

                        //TODO: Add workflow for sending this information to backend, either via email directed to support users (add support users as env variable(s)
                        //Maybe also add an alert saying that there are items that could not be downloaded and the application will send an email to support user with these items data.
                        const supportEmails = [ process.env.REACT_APP_SUPPORT_GENERAL ];
                        const today = new Date ();
                        const todayParsed = Date.parse ( today );

                        const attachments = [
                            {
                                icon: "LOG",
                                name: task.value[0].filename,
                                type: "logger",
                                uuid: uuidv4 ()
                            }
                        ]

                        const myMessageTitle = "Dear Werfen Touch 3.0 Team: " + "\n " +
                            "\n " +
                            "I send you attached to this very email the main.log file that includes logs of errors related to dowloading process." + "\n " +
                            "Thank you very much for your prompt answer and help in this regard." + "\n " +
                            "\n " +
                            "Kind regards, ";

                        const createdEmail = {
                            id: 0,
                            uuid: uuidv4 (),
                            clientEmails: supportEmails,
                            clientName: "",
                            clientEntity: "Werfen Touch 3.0 Support Team",
                            mailAttachments: attachments,
                            extraFiles: task.value,
                            cc: [ localStorage.getItem ( 'userEmail' ) ],
                            createdOn: todayParsed.toString (),
                            sentOn: "",
                            status: 'Not sent',
                            message: myMessageTitle,
                        }
                        if ( createdEmail.hasOwnProperty ( 'message' ) ) {
                            await sendToCreatedEmails ( createdEmail )
                                .catch ( ( error ) => {
                                    console.error ( "Error sending email for support to created Emails ", error );
                                } )

                            const emailsInfo = {
                                emailsToPrepare: [ createdEmail ],
                                createdEmail,
                                origin: "background",
                            }

                            const dataToSend = prepareEmailToSend ( emailsInfo );
                            preparedDataToSend = dataToSend;
                            dataToSend.alertMessages = alertMessages;
                            dataToSend.alertEmailSent = alertEmailSent;
                            const pendingEmails = tasks.filter ( ( item ) => item.key === "emails" )[0].value;
                            preparedDataToSend.done = pendingEmails.length > 0 ? false : true;
                        }
                    }
                    break;
                case "emails":
                    if ( task.value.length > 0 ) {
                        const emailsInfo = {
                            emailsToPrepare: task.value,
                            createdEmail: {},
                            origin: "database",
                        }
                        const dataToSend = prepareEmailToSend ( emailsInfo );
                        dataToSend.alertEmailSent = alertEmailSent;
                        dataToSend.alertMessages = alertMessages;
                        if ( preparedDataToSend.hasOwnProperty ( 'unsentEmails' ) ) {
                            preparedDataToSend.unsentEmails = [ ...preparedDataToSend.unsentEmails, ...dataToSend.unsentEmails ]
                            preparedDataToSend.done = true;
                        } else {
                            preparedDataToSend.unsentEmails = dataToSend.unsentEmails;
                            preparedDataToSend.displayConfirmation = origin === "database" ? false : dataToSend.unsentEmails[0].extraFiles.length > 0 || origin === "background";
                            preparedDataToSend.visitId = "";
                            preparedDataToSend.done = true;
                            preparedDataToSend.alertEmailSent = alertEmailSent;
                            preparedDataToSend.alertMessages = alertMessages;
                            preparedDataToSend.networkOnline = true;
                        }
                    }
                    break;
                case"firstInstallationContent":
                    if ( task.value.length > 0 ) {
                        const url = process.env.REACT_APP_DEV_UPDATES;//+ "/" + task.profile
                        const errorMessage = "for items pending from the 1st installation.";
                        const message = "installSelectedUpdates";
                        let token = localStorage.getItem ( "token" );
                        const availableProfiles = localStorage.getItem ( 'availableProfiles' );
                        const userProfiles = JSON.parse ( availableProfiles );
                        const requiredDataItems = userProfiles.map ( profile => {
                            return {
                                selectedUpdatesQueue: task.value,
                                url: url + "/" + profile.id,
                                errorMessage,
                                message,
                                token
                            }
                        } )
                        const data = {
                            message: "The app will try to install content pending from the installation",
                            type: "warning"
                        }
                        if ( requiredDataItems.length > 0 ) {
                            alertPendingDownload ( data );
                            getDataForProfiles ( requiredDataItems );
                        }
                    }
                    break;
                default:
                    break;
            }
        }

        if ( preparedDataToSend.hasOwnProperty ( 'done' ) && preparedDataToSend.done === true ) {
            await sendEmailsToBackend ( preparedDataToSend )
                .catch ( ( error ) => console.error ( error ) );
        }
    }

    const sendToCreatedEmails = async ( emailObject ) => {
        ipcRenderer.send ( "createdEmail", emailObject );
    }

    useEffect ( () => {
        ipcRenderer.on ( 'gotPendingTaskList', doExecutePendingTasks );
        ipcRenderer.on ( 'gotPendingLogs', doExecutePendingLogs );
        return () => {
            ipcRenderer.off ( 'gotPendingTaskList', doExecutePendingTasks );
            ipcRenderer.off ( 'gotPendingLogs', doExecutePendingLogs );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );


    return null;
}
export default PendingTasksEventHandler
