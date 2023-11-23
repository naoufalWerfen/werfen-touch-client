import {
    ADD_CLIENT_ENTITY,
    ADD_CLIENT_NAME,
    ADD_DUE_ON,
    ADD_T0_ATTACHMENTS,
    ADD_TO_CREATED_VISITS,
    ADD_TO_EMAILS_LIST,
    ADD_VISIT_NOTES,
    CLEAN_EMAILS_LIST,
    REMOVE_ALL_FROM_ATTACHMENTS,
    REMOVE_CLIENT_ENTITY,
    REMOVE_CLIENT_NAME,
    REMOVE_FROM_ATTACHMENTS,
    REMOVE_FROM_EMAILS_LIST,
    RESET_DUE_ON,
    RESET_STARTED_VISIT_ID,
    RESET_VISIT_NOTES,
    SET_ATTACHMENTS,
    SET_NEW_VISIT,
    SET_STARTED_VISIT_ID
} from "../actions/visitEditor";

const initialState = {
    attachments: [],
    customerEmails: [],
    clientName: "",
    clientEntity: "",
    emailNotes: "",
    dueOn: "",
    createdVisits: [],
    newVisit: false,
    startedVisitId: ""
}

export default function visitEditor ( state = initialState, action ) {
    switch ( action.type ) {
        case ADD_T0_ATTACHMENTS:
            return {
                ...state, attachments: [ ...state.attachments, action.doc ]
            }
        case REMOVE_FROM_ATTACHMENTS:
            let filteredAttachments = state.attachments.filter ( item => item.uuid !== action.uuid )
            return {
                ...state, attachments: filteredAttachments
            }
        case SET_ATTACHMENTS:
            return {
                ...state, attachments: action.attachments
            }
        case REMOVE_ALL_FROM_ATTACHMENTS:
            return {
                ...state, attachments: []
            }
        case ADD_TO_EMAILS_LIST:
            return {
                ...state, customerEmails: [ ...state.customerEmails, action.clientEmail ]
            }
        case REMOVE_FROM_EMAILS_LIST:
            let filteredEmails = state.customerEmails.filter ( item => item !== action.email )
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
        case ADD_CLIENT_ENTITY:
            return {
                ...state, clientEntity: action.entity
            }
        case ADD_VISIT_NOTES:
            return {
                ...state, visitNotes: action.notes
            }
        case REMOVE_CLIENT_NAME:
            return {
                ...state, clientName: ""
            }
        case REMOVE_CLIENT_ENTITY:
            return {
                ...state, clientEntity: ""
            }
        case RESET_VISIT_NOTES:
            return {
                ...state, visitNotes: ""
            }
        case ADD_TO_CREATED_VISITS:
            return {
                ...state, createdVisits: [ ...state.createdVisits, action.visit ]
            }
        case SET_NEW_VISIT:
            return {
                ...state,
                newVisit: action.newVisit,
                visitNotes: "",
                clientEntity: "",
                clientName: "",
                customerEmails: [],
                attachments: [],
                dueOn: ""
            }
        case ADD_DUE_ON:
            return {
                ...state, dueOn: action.dueOn
            }
        case RESET_DUE_ON:
            return {
                ...state, dueOn: ""
            }
        case SET_STARTED_VISIT_ID:
            return {
                ...state, startedVisitId: action.uuid
            }
        case RESET_STARTED_VISIT_ID:
            return {
                ...state, startedVisitId: ""
            }
        default:
            return state;
    }
}