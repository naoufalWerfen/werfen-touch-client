import isElectron from "is-electron";
import pkg from '../../package.json'
import { v4 as uuidv4 } from "uuid";

let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

export const calculateGroups = ( results ) => {
    // noinspection JSUnresolvedVariable
    let uniqueGroupsIds = [ ...new Set ( results.map ( item => item.group_sorting_id ) ) ]

    // noinspection JSUnresolvedVariable
    let uniqueGroups = uniqueGroupsIds.map ( ( item ) => {
        return results.filter ( doc =>
            doc.group_sorting_id === item
        )
    } )

    // noinspection JSUnresolvedVariable
    let calculatedGroups = uniqueGroups.map ( ( uniqueGroup ) => {
        let output = {};
        output.id = uniqueGroup[0].group_sorting_id;
        output.groupTitle = uniqueGroup[0].group_title;
        output.color = uniqueGroup[0].group_color;
        // noinspection JSUnresolvedVariable
        let cats = uniqueGroup.map ( ( category ) => {
            let result = {};
            result.cid = category.cat_sorting_id;
            result.title = category.category_title;
            return result;
        } ).sort ( ( a, b ) => a.cid - b.cid )

        function removeDuplicates ( originalArray, objKey ) {
            const trimmedArray = [];
            const values = [];
            let value;

            for ( let i = 0; i < originalArray.length; i++ ) {
                value = originalArray[i][objKey];

                if ( values.indexOf ( value ) === -1 ) {
                    trimmedArray.push ( originalArray[i] );
                    values.push ( value );
                }
            }

            return trimmedArray;

        }

        output.categories = removeDuplicates ( cats, 'cid' )
        return output;
    } ).sort ( ( a, b ) => a.id - b.id )
    return calculatedGroups;
}
export const calculateContent = ( data ) => {
    const { results, origin } = data;
    let uniqueCatsIds = [ ...new Set ( results.map ( item => item.cat_sorting_id ) ) ];
    let uniqueCategories = uniqueCatsIds.map ( ( item ) => {
        return results.filter ( doc =>
            doc.cat_sorting_id === item
        )
    } )

    // noinspection JSUnresolvedVariable
    let calculatedContent = uniqueCategories.map ( ( uniqueCategory ) => {
        let output = {};
        output.id = uniqueCategory[0].cat_sorting_id;
        output.gid = uniqueCategory[0].group_sorting_id;
        output.groupTitle = uniqueCategory[0].group_title
        output.catTitle = uniqueCategory[0].category_title;
        output.image = uniqueCategory[0].category_image;
        output.elements = uniqueCategory.map ( ( element ) => {
            let result = {};
            result.uuid = element.uuid;
            result.id = element.id;
            result.title = element.title;
            result.cid = element.cat_sorting_id;
            result.gid = element.group_sorting_id;
            result.route = element.route;
            result.image = element.image;
            result.type = element.type;
            result.sortingNumber = element.sorting_number;
            result.tid = element.tid;
            result.parentContentId = element.parent_content_id;
            result.businessUnitId = element.business_unit_id;
            result.visible = element.visible;
            result.ct_name = element.ct_name;
            result.ct_color = element.ct_color;
            result.ct_sortingKey = element.ct_sortingKey;
            result.category_id = element.cid;
            result.group_id = element.group_id;
            result.profile_id = element.profile_id;
            result.sorting_name = element.sorting_name;
            result.status = element.status;
            result.installationDate = element.dm_installationDate;
            result.updated = checkIfItemUpdatedOrNew ( element.dm_packageDate );
            result.imageRoute = element.imageRoute || "";
            return result;
        } ).sort ( ( a, b ) => {
            if ( origin === "visuals" ) {
                return a.sortingNumber - b.sortingNumber
            } else {
                return a.title.localeCompare ( b.title )
            }
        } )
        return output;
    } ).sort ( ( a, b ) => a.id - b.id )
    return calculatedContent
}

export const getContentTypesAfterSearching = ( searchResults ) => {
    const contentTypes = searchResults.map ( ( result ) => result.tid );
    const uniqueContentTypes = removeDuplicates ( contentTypes ).sort ( ( a, b ) => a.localeCompare ( b ) );
    return uniqueContentTypes;
}

const checkIfItemUpdatedOrNew = ( packageDate ) => {
    if ( packageDate !== "" ) {
        const packageDateValue = JSON.parse ( packageDate );
        return packageDateValue.accessed === 0;
    } else {
        return false
    }
}

export const stringToArray = ( element ) => {
    return [].concat ( element );
}
export const convertToArray = ( element ) => {
    return Array.from ( element )
}

export const convertToSet = ( element ) => {
    return new Set ( element )
}

export const removeDuplicates = ( element ) => {
    return [ ...convertToSet ( element ) ]
}

export const sortThis = ( arr ) => {
    let arrayToSort;
    if ( Array.isArray ( arr ) ) {
        arrayToSort = arr;
    } else {
        arrayToSort = convertToArray ( arr )
    }

    return arrayToSort.sort ( ( a, b ) => {
        if ( a < b ) {
            return -1
        }
        if ( a > b ) {
            return 1
        }
        return 0
    } )
}

export async function fetchWithTimeout ( resource, options ) {
    const { timeout = 6000 } = options;

    const controller = new AbortController ();
    const id = setTimeout ( () => controller.abort (), timeout );
    const response = await fetch ( resource, {
        ...options,
        signal: controller.signal
    } );

    clearTimeout ( id );
    console.log ( "Response from fetchWithTimeout: ", response )
    return response;
}

export function setIntervalAndExecute ( callback, delay, repetitions, data ) {
    callback ( data );

    let x = 0;
    let intervalID = window.setInterval ( function () {
        callback ( data );
        if ( ++x === repetitions && repetitions !== undefined ) {
            window.clearInterval ( intervalID );
        }
    }, delay );
}

export const getDataFromServer = ( info ) => {

    fetch ( info.url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ info.token }`
        }
        // body: JSON.stringify ( dataForUpdates )
    } )
        .then ( ( response ) => {
            if ( response.status >= 200 && response.status < 300 ) {
                return response.json ();
            } else {
                let errorToShow = {
                    status: response.status,
                    message: 'Error getting data for ' + info.errorMessage
                }
                console.error ( errorToShow );
            }
        } )
        .then ( ( data ) => {
            console.info ( { data } )
            if ( data.hasOwnProperty ( 'data' ) ) {
                let infoToSend = {
                    selectedQueue: info.selectedUpdatesQueue,
                    data,
                    profile: info.profile || ""
                }
                ipcRenderer.send ( info.message, infoToSend );
            }
        } )
        .catch ( ( error ) => {
            console.error ( "Error fetching data for user", error );
        } )
}
export const getDataFromAPI = ( info ) => {
    const { token, url } = info;
    return new Promise ( ( resolve, reject ) => {
        fetch ( url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ token }`
            }
            // body: JSON.stringify ( dataForUpdates )
        } )
            .then ( ( response ) => {
                if ( ( response.status >= 200 ) && ( response.status < 300 ) ) {
                    return response.json ();
                } else {
                    reject ( response.error );
                }
            } )
            .then ( ( data ) => {
                resolve ( data );
            } )
            .catch ( ( error ) => {
                console.error ( "Error fetching data for user", error );
                reject ( error );
            } )
    } )
}

export const getAllUserProfiles = ( info ) => {
    const { url, token } = info;

    return new Promise ( ( resolve, reject ) => {
        fetch ( url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ token }`
            }
        } )
            .then ( ( response ) => {
                if ( response.status >= 200 && response.status < 300 ) {
                    return response.json ();
                } else {
                    let message = "";
                    if ( ( response.status === 401 ) || ( response.status === 403 ) ) {
                        response.status === 401 ? message = "Invalid JWT Token" : message = "Wrong user profile(s) in the app";
                    }
                    reject ( message );
                }
            } )
            .then ( ( data ) => {
                resolve ( data );
            } )
            .catch ( ( error ) => {
                console.log ( "Error fetching profiles for user", error );
                reject ( error );
            } )
    } )
}

export const getDataForProfiles = ( requiredDataItems ) => {
    for ( const requiredDataItem of requiredDataItems ) {
        const { message, selectedUpdatesQueue } = requiredDataItem;
        ipcRenderer.send ( message, selectedUpdatesQueue );
    }
}

export const updateProfiles = async ( infoRequestedBy ) => {
    const url = process.env.REACT_APP_GET_PROFILES;
    const token = localStorage.getItem ( "token" );
    const info = {
        url,
        token,
    }
    localStorage.setItem ( 'infoRequestedBy', infoRequestedBy );

    // get Profiles form Backend.
    const usersProfilesFromBackend = await getAllUserProfiles ( info );

    if ( Array.isArray ( usersProfilesFromBackend ) ) {
        const tokenProfile = localStorage.getItem ( "tokenProfile" );
        const profileExists = usersProfilesFromBackend.find ( item => item.id === tokenProfile );
        if ( !profileExists ) {
            const newTokenProfile = ( usersProfilesFromBackend && Array.isArray ( usersProfilesFromBackend ) && ( usersProfilesFromBackend.length > 0 ) ) ? usersProfilesFromBackend[0].id : '';
            localStorage.setItem ( "tokenProfile", newTokenProfile );
        }
        const dataProfiles = {
            profiles: usersProfilesFromBackend,
            infoRequestedBy
        }
        ipcRenderer.send ( "processUpdateProfiles", dataProfiles );
    } else {
        return usersProfilesFromBackend;
    }
}
export const logoutOnUpdateProfilesError = ( info ) => {
    const { alertData, error, displayAlert, isOnline, setAppToLogin } = info;
    displayAlert ( alertData );
    setTimeout ( () => {
        setAppToLogin ();
        doLogoutOnTokenProfilesError ( error, isOnline );
    }, 5000 );
}


export const doLogoutOnTokenProfilesError = ( message, isOnline ) => {
    let error;
    message === "Invalid JWT Token" ? error = "token error" : error = "profile error";
    const logEntry = {
        profileId: localStorage.getItem ( "tokenProfile" ),
        userId: localStorage.getItem ( "userEmail" ),
        category: "login",
        action: "log out on " + error,
        severity: "log",
        visitId: "",
    }
    sendToLogs ( logEntry, isOnline );
    localStorage.removeItem ( "tokenProfile" );
    localStorage.removeItem ( "token" );
    localStorage.removeItem ( "appInitialized" );
    const userLoggedOut = "true";
    localStorage.setItem ( "loggedOut", userLoggedOut );
}


export const sendToLogs = ( data, isOnline ) => {
    const userIdExistsAndIsValid = ( data.userId !== null && data.userId !== "" );
    const userProfileExistsAndIsValid = ( data.profileId !== null && data.profileId !== "" );
    const salesOrgExistsAndIsValid = ( data.salesOrganizationId !== null && data.salesOrganizationId !== "" );
    const conditionsToSendToBackend = isOnline && userIdExistsAndIsValid && userProfileExistsAndIsValid && salesOrgExistsAndIsValid;
    data.id = uuidv4 ();
    data.appVersion = pkg.version;
    data.dateTime = Date.now ();
    data.salesOrganizationId = localStorage.getItem ( 'salesOrganizationId' );
    const { contentId, contentName, contentType, action, value, parentContentId, businessUnitId } = data;
    if ( contentId && ( action === "view" ) && ( value !== "EXIT" ) ) {
        const lastContentLog = {
            contentId,
            contentName,
            contentType,
            parentContentId,
            businessUnitId
        }
        localStorage.setItem ( 'lastContentLog', JSON.stringify ( lastContentLog ) );
    }
    if ( value === "EXIT" ) {
        const lastContentLogFromStore = JSON.parse ( localStorage.getItem ( 'lastContentLog' ) );
        data.contentId = lastContentLogFromStore.contentId;
        data.contentName = lastContentLogFromStore.contentName;
        data.contentType = lastContentLogFromStore.contentType;
        data.parentContentId = lastContentLogFromStore.parentContentId;
        data.businessUnitId = lastContentLogFromStore.businessUnitId;
    }
    if ( conditionsToSendToBackend ) {
        const token = localStorage.getItem ( "token" )
        fetch ( process.env.REACT_APP_SAVE_LOGS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${ token }`
            },
            body: JSON.stringify ( [ data ] ),
        } )
            .then( ( response ) => {
                let dataToPass = {};
                if ( response.ok ) {
                    dataToPass.synced = 1;
                    dataToPass.message = "Logs have been received by backend";
                    dataToPass.status = response.status;

                } else {
                    dataToPass.synced = 0;
                    dataToPass.message = "Backend hasn't received logs";
                    dataToPass.status = response.status;
                }
                return dataToPass;
            } )
            .then ( ( dataToPass ) => {
                data.synced = dataToPass.synced;
                ipcRenderer.send ( "sendToLogs", data );
            } )
            .catch(error=> {
                data.synced = 0;
                ipcRenderer.send ( "sendToLogs", data );

            })
    } else {
        data.synced = 0;
        ipcRenderer.send ( "sendToLogs", data );
    }
}

export const sendPendingLogsToBackend = ( data ) => {
    if(data.length > 0){
        const token = localStorage.getItem ( "token" )
        fetch ( process.env.REACT_APP_SAVE_LOGS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Authorization': `Bearer ${ token }`
            },
            body: JSON.stringify ( data ),
        } )
            .then ( ( response ) => {
                if ( response.ok ) {
                    return response.json ();
                } else {
                    console.error ( "Error on response while sending logs to backend ", response )
                }
            } )
            .then ( (r) => {
                if(r) {
                    const syncedIds = data.map ( item => item.id );
                    ipcRenderer.send ( "updateSyncedLogs", syncedIds );
                }
            } )
    }
}

export const sendEmailsToBackend = async ( receivedData ) => {
    const { unsentEmails, displayConfirmation, alertMessages } = receivedData;

    const alertEmailSent = receivedData.alertEmailSent || {};
    const alertMessageSent = alertMessages.filter ( ( message ) => message.id === "confirmation-message" )[0].text;
    const alertMessageError = alertMessages.filter ( ( message ) => message.id === "error-message" )[0].text
    let emails;
    if ( Array.isArray ( unsentEmails ) ) {
        emails = unsentEmails
    } else {
        emails = [].concat ( unsentEmails )
    }

    if ( emails.length > 0 ) {

        const token = localStorage.getItem ( "token" );
        for ( const email of emails ) {
            const myHeaders = new Headers ();
            const forSupport = email.forSupport;
            myHeaders.append ( "Authorization", `Bearer ${ token }` );
            const formData = new FormData ();
            let attachments = [];
            let clientEmails = [];

            if ( email.hasOwnProperty ( "uuid" ) ) {
                email.id = email.uuid;
                delete email.uuid;
                formData.append ( "id", email.id );
            }

            if ( email.hasOwnProperty ( "mailAttachments" ) ) {
                delete email.mailAttachments;
            }

            if ( email.hasOwnProperty ( "attachments" ) ) {
                if ( Array.isArray ( email.attachments ) ) {
                    attachments = email.attachments;
                } else {
                    attachments = JSON.parse ( email.attachments );
                }
                formData.append ( "attachments", JSON.stringify ( attachments ) );
            }

            if ( email.hasOwnProperty ( "clientEmails" ) ) {
                if ( Array.isArray ( email.clientEmails ) ) {
                    clientEmails = email.clientEmails;
                } else {
                    clientEmails = JSON.parse ( email.clientEmails );
                }
                formData.append ( "clientEmails", JSON.stringify ( clientEmails ) );
            }

            if ( email.hasOwnProperty ( "extraFiles" ) ) {
                if ( email.extraFiles.length > 0 ) {
                    const extraFiles = email.extraFiles;
                    for ( const extraFile of extraFiles ) {
                        const extraFileKeyNumber = Number ( extraFiles.indexOf ( extraFile ) + 1 );
                        const extraFileKey = "extraFile" + extraFileKeyNumber.toString ();
                        const fileBlob = b64toBlob ( extraFile.b64, "application/pdf" );
                        formData.append ( extraFileKey, fileBlob, extraFile.filename );
                    }
                }
            }
            email.createdOn = ( email.createdOn ) / 1000;

            formData.append ( "cc", JSON.stringify ( email.cc ) );
            formData.append ( "clientEntity", email.clientEntity );
            formData.append ( "clientName", email.clientName );
            formData.append ( "createdOn", email.createdOn );
            formData.append ( "message", email.message );

            delete email.sentOn;
            delete email.status;

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: formData,
                redirect: "follow"
            }
            const response = await fetch ( process.env.REACT_APP_DEV_EMAILS, requestOptions )
                .catch ( ( error ) => {
                    console.error ( "Error on fetching", error );
                } )
            return new Promise ( ( resolve, reject ) => {
                let logEntry = {
                    profileId: localStorage.getItem ( "tokenProfile" ),
                    userId: localStorage.getItem ( "userEmail" ),
                    category: "email",
                    value: email.id,
                    severity: "log",
                    visitId: receivedData.visitId
                }
                if ( response.status === 200 ) {
                    ipcRenderer.send ( "changeEmailStatus", { uuid: email.id, status: 'Sent' } );
                    if ( forSupport ) {
                        ipcRenderer.send ( 'setDownloadsErrorsAsReported' );
                    }
                    if ( displayConfirmation ) {
                        const data = {
                            message: alertMessageSent,
                            type: "success"
                        }
                        alertEmailSent ( data );
                    }

                    logEntry.category = "email";
                    logEntry.action = "send";

                    sendToLogs ( logEntry, receivedData.networkOnline )
                    return true;

                } else {
                    console.error ( "Error on response", response )
                    let message;
                    if ( forSupport === true ) {
                        ipcRenderer.send ( "deleteEmailWithLogs", { uuid: email.id, tableName: "emails_manager" } );
                    } else {
                        ipcRenderer.send ( "changeEmailStatus", { uuid: email.id, status: 'Error' } );
                    }
                    const data = {
                        message: alertMessageError,
                        type: "error"
                    }
                    alertEmailSent ( data );
                    logEntry.category = "email";
                    logEntry.action = "error";
                    sendToLogs ( logEntry, receivedData.networkOnline )
                    if ( ( response.status === 401 ) || ( response.status === 403 ) ) {
                        response.status === 401 ? message = "Invalid JWT Token" : message = "Wrong user profile(s) in the app";
                        reject ( message );
                    }
                }
            } )

        }

        }
}

export const b64toBlob = ( b64Data, contentType = '', sliceSize = 512 ) => {
    const byteCharacters = atob ( b64Data );
    const byteArrays = [];

    for ( let offset = 0; offset < byteCharacters.length; offset += sliceSize ) {
        const slice = byteCharacters.slice ( offset, offset + sliceSize );

        const byteNumbers = new Array ( slice.length );
        for ( let i = 0; i < slice.length; i++ ) {
            byteNumbers[i] = slice.charCodeAt ( i );
        }

        const byteArray = new Uint8Array ( byteNumbers );
        byteArrays.push ( byteArray );
    }

    const blob = new Blob ( byteArrays, { type: contentType } );
    return blob;
}

export const verifyIfItemInQueue = ( queue, tile ) => {
    const itemInQueueList = queue.filter ( ( item ) =>
        item.route === tile.sorting_name && item.profile_id === tile.profile_id && item.category_id === tile.category_id
    );
    return itemInQueueList;
}

export const getDownloadingPercentage = ( numberFiles, downloadLength ) => {
    const percentage = ( ( ( numberFiles - downloadLength ) / numberFiles ) * 100 ).toFixed ()
    let result;
    percentage && percentage >= 3 ? result = percentage : result = 3;
    return result;
}

export const lastInstallationOverHourAgo = ( lastInstallationDate ) => {
    return ( ( Date.now () - lastInstallationDate ) / 1000 ) > 3600;
}

export const getTileData = ( tile ) => {
    const packageDate = {
        date: Date.now (),
        accessed: 1
    }
    return {
        category_id: tile.category_id,
        profile_id: tile.profile_id,
        uuid: tile.uuid,
        package_date: JSON.stringify ( packageDate )
    }
}

export const prepareEmailToSend = ( emailsInfo ) => {
    const { emailsToPrepare, createdEmail, origin } = emailsInfo;
    const dataOrigin = [ "emailEditor", "background" ];
    const excludedAttachmentsIcon = [ 'CALC', 'LOG' ];
    for ( const emailToPrepare of emailsToPrepare ) {
        if ( dataOrigin.includes ( origin ) ) {
            emailToPrepare.clientEmails = createdEmail.clientEmails;
            emailToPrepare.id = createdEmail.uuid;
            emailToPrepare.extraFiles = createdEmail.extraFiles;
            emailToPrepare.cc = createdEmail.cc;
            emailToPrepare.attachments = createdEmail.mailAttachments.filter ( ( attachment ) => !excludedAttachmentsIcon.includes ( attachment.icon ) );
            emailToPrepare.createdOn = createdEmail.createdOn;
            emailToPrepare.forSupport = createdEmail.mailAttachments.filter ( ( attachment ) => attachment.icon === "LOG" ).length > 0;
        }
        if ( origin === "database" ) {
            const emailsAttachmentFromDB = JSON.parse ( emailToPrepare.attachments );
            emailToPrepare.clientEmails = JSON.parse ( emailToPrepare.clientEmails );
            emailToPrepare.id = emailToPrepare.uuid;
            emailToPrepare.extraFiles = [];
            emailToPrepare.cc = [ localStorage.getItem ( "userEmail" ) ];
            emailToPrepare.attachments = emailsAttachmentFromDB.filter ( ( attachment ) => !excludedAttachmentsIcon.includes ( attachment.icon ) );
            emailToPrepare.createdOn = JSON.stringify ( emailToPrepare.createdOn );
            emailToPrepare.forSupport = emailsAttachmentFromDB.filter ( ( attachment ) => attachment.icon === "LOG" ).length > 0 ? true : false;
        }
        delete emailToPrepare.sentOn;
        delete emailToPrepare.status;
        delete emailToPrepare.mailAttachments;
    }
    const dataToSendToBackend = {
        unsentEmails: emailsToPrepare,
        displayConfirmation: origin === "database" ? false : emailsToPrepare[0].extraFiles.length > 0 || origin === "background",
        visitId: "",
        networkOnline: true
    }
    return dataToSendToBackend
}

export const calculateAllOptions = ( info, callback ) => {
    const { data, origin } = info;
    const allSelectedOptionsForProfileFromDB = data.map ( ( searchContent ) => {
        const groupFromDB = {
            key: origin === "businessUnit" ? searchContent.id : searchContent.tid,
            value: origin === "businessUnit" ? searchContent.name : searchContent.name + " (" + searchContent.sorting_key.toUpperCase () + ")"
        }
        return groupFromDB;
    } );

    const allSelectedOptionsForSearchView = allSelectedOptionsForProfileFromDB;
    const allSelectedOptionsWithCheckboxes = allSelectedOptionsForSearchView.map ( ( item ) => {
        item.id = item.key;
        return item;
    } )
    callback ( allSelectedOptionsWithCheckboxes );
}

export const listsContainTheSameElements = ( info ) => {
    const { a, b } = info;
    const firstList = Array.isArray ( a ) ? a : [];
    const secondList = Array.isArray ( b ) ? b : [];
    return firstList.length === secondList.length && firstList.every ( el => secondList.includes ( el ) );
}

export const checkOnlineStatus = async ( checkerUrl ) => {
    try {
        const online = await fetch ( checkerUrl );
        return online.status >= 200 && online.status < 300; // either true or false
    } catch ( err ) {
        return false; // definitely offline
    }
};
