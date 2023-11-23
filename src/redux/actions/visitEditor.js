export const ADD_T0_ATTACHMENTS = 'visitEditor/ADD_TO_ATTACHMENTS';
export const REMOVE_FROM_ATTACHMENTS = 'visitEditor/REMOVE_FROM_ATTACHMENTS'
export const REMOVE_ALL_FROM_ATTACHMENTS = 'visitEditor/REMOVE_ALL_FROM_ATTACHMENTS';
export const ADD_TO_EMAILS_LIST = 'visitEditor/ADD_TO_EMAILS_LIST';
export const REMOVE_FROM_EMAILS_LIST = 'visitEditor/REMOVE_FROM_EMAILS_LIST';
export const CLEAN_EMAILS_LIST = 'visitEditor/CLEAN_EMAILS_LIST';
export const ADD_CLIENT_NAME = 'visitEditor/ADD_CLIENT_NAME';
export const REMOVE_CLIENT_NAME = 'visitEditor/REMOVE_CLIENT_NAME';
export const ADD_CLIENT_ENTITY = 'visitEditor/ADD_CLIENT_ENTITY';
export const REMOVE_CLIENT_ENTITY = 'visitEditor/REMOVE_CLIENT_ENTITY';
export const ADD_VISIT_NOTES = 'visitEditor/ADD_VISIT_NOTES';
export const RESET_VISIT_NOTES = 'visitEditor/RESET_VISIT_NOTES';
export const ADD_DUE_ON = 'visitEditor/ADD_DUE_ON';
export const RESET_DUE_ON = 'visitEditor/RESET_DUE_ON';
export const ADD_TO_CREATED_VISITS = 'visitEditor/ADD_TO_CREATED_VISITS';
export const SET_NEW_VISIT = 'visitEditor/SET_NEW_VISIT';
export const SET_STARTED_VISIT_ID = 'visitEditor/SET_STARTED_VISIT_ID ';
export const RESET_STARTED_VISIT_ID = 'visitEditor/RESET_STARTED_VISIT_ID ';
export const SET_ATTACHMENTS = 'visitEditor/SET_ATTACHMENTS';


export const addToAttachments = ( doc ) => {
    return {
        type: ADD_T0_ATTACHMENTS,
        doc
    }
}

export const removeFromAttachments = ( uuid ) => {
    return {
        type: REMOVE_FROM_ATTACHMENTS,
        uuid
    }
}

export const removeAllFromAttachments = () => {
    return {
        type: REMOVE_ALL_FROM_ATTACHMENTS
    }
}
export const setAttachments = ( attachments ) => {
    return {
        type: SET_ATTACHMENTS,
        attachments
    }
}

export const addToEmailsList = ( clientEmail ) => {
    return {
        type: ADD_TO_EMAILS_LIST,
        clientEmail
    }
}

export const removeFromEmailsList = ( clientEmail ) => {
    return {
        type: REMOVE_FROM_EMAILS_LIST,
        clientEmail
    }
}

export const cleanEmailsList = () => {
    return {
        type: CLEAN_EMAILS_LIST
    }
}

export const addClientName = ( name ) => {
    return {
        type: ADD_CLIENT_NAME,
        name
    }
}

export const addClientEntity = ( entity ) => {
    return {
        type: ADD_CLIENT_ENTITY,
        entity
    }
}

export const addVisitNotes = ( notes ) => {
    return {
        type: ADD_VISIT_NOTES,
        notes
    }
}

export const removeClientName = () => {
    return {
        type: REMOVE_CLIENT_NAME
    }
}

export const removeClientEntity = () => {
    return {
        type: REMOVE_CLIENT_ENTITY
    }
}

export const resetVisitNotes = () => {
    return {
        type: RESET_VISIT_NOTES,
    }
}

export const addDueOn = ( dueOn ) => {
    return {
        type: ADD_DUE_ON,
        dueOn
    }
}

export const resetDueOn = () => {
    return {
        type: RESET_DUE_ON
    }
}

export const addToCreatedVisits = ( visit ) => {
    return {
        type: ADD_TO_CREATED_VISITS,
        visit
    }
}

export const setNewVisit = ( newVisit ) => {
    return {
        type: SET_NEW_VISIT,
        newVisit
    }
}

export const setStartedVisitId = ( uuid ) => {
    return {
        type: SET_STARTED_VISIT_ID,
        uuid
    }
}

export const resetStartedVisitId = () => {
    return {
        type: SET_STARTED_VISIT_ID,
    }
}