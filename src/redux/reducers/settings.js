import {
    REQUEST_UPDATES,
    SET_APP_LANG_READY,
    SET_APP_LANGUAGE,
    SET_APP_PHASE,
    SET_AVAILABLE_PROFILES,
    SET_CONTENT_LANGUAGE,
    SET_EMAIL,
    SET_INSTALLATION_METHOD,
    SET_PROFILE,
    SET_SENDING_COPY,
    SET_WEB_INSTALLATION
} from "../actions/settings";

const initialState = {
    availableProfiles: [],
    userProfile: "corporate_sales",
    userEmail: "some@mail.com",
    sendCopy: 'Yes',
    webInstallation: true,
    installationMethod: 'Manually',
    appLanguage: 'English',
    contentLanguage: 'English',
    langReady: {},
    appPhase: null,
    updatesRequested: false
}

export default function settings( state = initialState, action ) {
    switch ( action.type ) {
        case SET_PROFILE:
            return {
                ...state, userProfile: action.userProfile
            }
        case SET_EMAIL:
            return {
                ...state, userEmail: action.userEmail
            }
        case SET_SENDING_COPY:
            return {
                ...state, sendCopy: action.sendCopy
            }
        case SET_INSTALLATION_METHOD:
            return {
                ...state, installationMethod: action.method
            }
        case SET_APP_LANGUAGE:
            return  {
                ...state, appLanguage: action.appLanguage
            }
        case SET_CONTENT_LANGUAGE:
            return {
                ...state, contentLanguage: action.contentLanguage
            }
        case SET_WEB_INSTALLATION:
            return {
                ...state, webInstallation: action.webInstallation
            }
        case SET_AVAILABLE_PROFILES:
            return {
                ...state, availableProfiles: action.availableProfiles
            }
        case SET_APP_LANG_READY:
            return {
                ...state, langReady: action.langReady
            }
        case SET_APP_PHASE:
            return {
                ...state, appPhase: action.appPhase
            }
        case REQUEST_UPDATES:
            return {
                ...state, updatesRequested: action.updatesRequested
            }
        default:
            return state;
    }
}
