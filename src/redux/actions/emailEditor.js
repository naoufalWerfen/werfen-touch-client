export const ADD_T0_ATTACHMENTS = 'emailEditor/ADD_TO_ATTACHMENTS';
export const REMOVE_FROM_ATTACHMENTS ='emailEditor/REMOVE_FROM_ATTACHMENTS'
export const REMOVE_ALL_FROM_ATTACHMENTS = 'emailEditor/REMOVE_ALL_FROM_ATTACHMENTS';
export const ADD_TO_EMAILS_LIST = 'emailEditor/ADD_TO_EMAILS_LIST';
export const REMOVE_FROM_EMAIL_LIST = 'emailEditor/REMOVE_TO_EMAILS_LIST';
export const CLEAN_EMAILS_LIST = 'emailEditor/CLEAN_EMAILS_LIST';
export const ADD_CLIENT_NAME = 'emailEditor/ADD_CLIENT_NAME';
export const ADD_CLIENT_EMAIL = 'emailEditor/ADD_CLIENT_EMAIL';
export const REMOVE_CLIENT_NAME = 'emailEditor/REMOVE_CLIENT_NAME';
export const ADD_CLIENT_ENTITY =  'emailEditor/ADD_CLIENT_ENTITY';
export const REMOVE_CLIENT_ENTITY =  'emailEditor/REMOVE_CLIENT_ENTITY';
export const ADD_EMAIL_MESSAGE =  'emailEditor/ADD_EMAIL_MESSAGE';
export const RESET_EMAIL_MESSAGE =  'emailEditor/RESET_EMAIL_MESSAGE';
export const ADD_TO_CREATED_EMAILS = 'emailEditor/ADD_TO_CREATED_EMAILS';
export const SET_NEW_EMAIL = 'emailEditor/SET_NEW_EMAIL';
export const SET_MAIL_ATTACHMENTS = 'emailEditor/SET_MAIL_ATTACHMENTS';
export const SET_NEW_SUPPORT_EMAIL = 'emailEditor/SET_NEW_SUPPORT_EMAIL'


export const addToMailAttachments = ( doc ) => {
    return {
        type: ADD_T0_ATTACHMENTS,
        doc
    }
}

export const removeFromMailAttachments = ( uuid ) => {
    return {
        type: REMOVE_FROM_ATTACHMENTS,
        uuid
    }
}

export const removeAllFromMailAttachments = () => {
    return {
        type: REMOVE_ALL_FROM_ATTACHMENTS
    }
}


// export const setMailAttachments = ( attachments ) => {
//     return {
//         type: SET_MAIL_ATTACHMENTS,
//         attachments
//     }
// }

export const addToEmailsList = (email) => {
    return {
        type: ADD_TO_EMAILS_LIST,
        email
    }
}

export const removeFromEmailList = (email) => {
    return {
        type: REMOVE_FROM_EMAIL_LIST,
        email
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

export const addClientEmail = ( email ) => {
    return {
        type: ADD_CLIENT_EMAIL,
        email
    }
}

export const addClientEnity = ( entity ) => {
    return {
        type: ADD_CLIENT_ENTITY,
        entity
    }
}

export const addEmailMessage = ( message ) => {
    return {
        type: ADD_EMAIL_MESSAGE,
        message
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

export const resetEmailMessage = () => {
    return {
        type: RESET_EMAIL_MESSAGE,
    }
}

export const addToCreatedEmails = (email) =>  {
    return {
        type: ADD_TO_CREATED_EMAILS,
        email
    }
}

export const setNewEmail = ( newEmail ) => {
    return {
        type: SET_NEW_EMAIL,
        newEmail
    }
}
export const setNewSupportEmail = ( newSupportEmail ) => {
    return {
        type: SET_NEW_SUPPORT_EMAIL,
        newSupportEmail
    }
}
