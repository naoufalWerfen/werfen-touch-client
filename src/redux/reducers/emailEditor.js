import {
    ADD_CLIENT_EMAIL,
    ADD_CLIENT_ENTITY,
    ADD_CLIENT_NAME,
    ADD_EMAIL_MESSAGE,
    ADD_T0_ATTACHMENTS,
    ADD_TO_CREATED_EMAILS,
    ADD_TO_EMAILS_LIST,
    CLEAN_EMAILS_LIST,
    REMOVE_ALL_FROM_ATTACHMENTS,
    REMOVE_CLIENT_ENTITY,
    REMOVE_CLIENT_NAME,
    REMOVE_FROM_ATTACHMENTS,
    REMOVE_FROM_EMAIL_LIST,
    RESET_EMAIL_MESSAGE,
    SET_MAIL_ATTACHMENTS,
    SET_NEW_EMAIL,
    SET_NEW_SUPPORT_EMAIL
} from "../actions/emailEditor";

const initialState = {
    attachments: [],
    customerEmails: [],
    clientName: "",
    clientEmail: "",
    clientEntity: "",
    emailMessage: "",
    createdEmails: [],
    newEmail: false,
    newSupportEmail: false
}

export default function emailEditor (state= initialState, action) {
    switch (action.type ) {
        case ADD_T0_ATTACHMENTS:
            return {
                ...state, attachments: [...state.attachments, action.doc]
            }
        case REMOVE_FROM_ATTACHMENTS:
            let filteredAttachments = state.attachments.filter(item=> item.uuid !== action.uuid)
            return {
                ...state, attachments: filteredAttachments
            }
        case REMOVE_ALL_FROM_ATTACHMENTS:
            return {
                ...state, attachments: []
            }
        case SET_MAIL_ATTACHMENTS:
            return {
                ...state, attachments: action.attachments
            }
        case ADD_TO_EMAILS_LIST:
            return {
                ...state, customerEmails: [...state.customerEmails, action.email]
            }
        case REMOVE_FROM_EMAIL_LIST:
            let filteredEmails = state.customerEmails.filter(item => item !== action.email)
            return {
                ...state, customerEmails: filteredEmails,
            }
        case CLEAN_EMAILS_LIST:
            return {
                ...state, customerEmails: []
            }
        case ADD_CLIENT_NAME:
            return {
                ...state, clientName: action.name
            }
        case ADD_CLIENT_EMAIL:
            return {
                ...state, clientEmail: action.email
            }
        case ADD_CLIENT_ENTITY:
            return {
                ...state, clientEntity: action.entity
            }
        case ADD_EMAIL_MESSAGE:
            return {
                ...state, emailMessage: action.message
            }
        case REMOVE_CLIENT_NAME:
            return {
                ...state, clientName: ""
            }
        case REMOVE_CLIENT_ENTITY:
            return {
                ...state, clientEntity: ""
            }
        case RESET_EMAIL_MESSAGE:
            return {
                ...state, emailMessage: ""
            }
        case ADD_TO_CREATED_EMAILS:
            return {
                ...state, createdEmails: [...state.createdEmails, action.email]
            }
        case SET_NEW_EMAIL:
            return {
                ...state,
                newEmail: action.newEmail,
                emailMessage: "",
                clientEntity: "",
                clientName: "",
                customerEmails: [],
                attachments: []
            }
        case SET_NEW_SUPPORT_EMAIL:
            return {
                ...state,
                newSupportEmail: action.newSupportEmail,
                customerEmails: [ process.env.REACT_APP_SUPPORT_GENERAL ],
            }
        default:
            return state;
    }
}
