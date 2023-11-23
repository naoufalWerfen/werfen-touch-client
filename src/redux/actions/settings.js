export const SET_PROFILE = 'settings/SET_PROFILE';
export const SET_EMAIL = 'settings/SET_EMAIL';
export const SET_SENDING_COPY = 'settings/SET_SENDING_COPY';
export const SET_WEB_INSTALLATION = 'settings/SET_WEB_INSTALLATION';
export const SET_AVAILABLE_PROFILES = 'settings/SET_AVAILABLE_PROFILES'
export const SET_INSTALLATION_METHOD = 'settings/SET_INSTALLATION_METHOD';
export const SET_APP_LANGUAGE = 'settings/SET_APP_LANGUAGE';
export const SET_CONTENT_LANGUAGE = 'settings/SET_CONTENT_LANGUAGE';
export const SET_APP_LANG_READY = 'settings/SET_APP_LANG_READY';
export const SET_APP_PHASE = 'settings/SET_APP_PHASE';
export const REQUEST_UPDATES = 'settings/REQUEST_UPDATES';


export const setAppLangReady = ( langReady ) => {
    return {
        type: SET_APP_LANG_READY,
        langReady
    }
}

export const setAppPhase = ( appPhase ) => {
    return {
        type: SET_APP_PHASE,
        appPhase
    }
}

export const setProfile = (userProfile) => {
    return {
        type: SET_PROFILE,
        userProfile
    }
}

export const setEmail = (userEmail) => {
    return {
        type: SET_EMAIL,
        userEmail
    }
}

export const setSendingCopyToUser = (sendCopy) => {
    return {
        type: SET_SENDING_COPY,
        sendCopy
    }
}

export const setWebInstallation = (webInstallation) => {
    return {
        type: SET_WEB_INSTALLATION,
        webInstallation
    }
}
export const setAvailableProfiles = (availableProfiles) => {
    return {
        type: SET_AVAILABLE_PROFILES,
        availableProfiles
    }
}

export const setInstallationMethod = (method) => {
    return {
        type: SET_INSTALLATION_METHOD,
        method
    }
}

export const setContentLanguage = (contentLanguage) => {
    return {
        type: SET_CONTENT_LANGUAGE,
        contentLanguage
    }
}

export const setAppLanguage = ( appLanguage ) => {
    return {
        type: SET_APP_LANGUAGE,
        appLanguage
    }
}

export const requestUpdates = ( updatesRequested ) => {
    return {
        type: REQUEST_UPDATES,
        updatesRequested
    }
}


