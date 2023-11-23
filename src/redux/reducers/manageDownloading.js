import {
    ADD_ALL_SELECTED,
    ADD_DOWNLOAD,
    ADD_SELECTED,
    ADD_TO_BUFFER,
    ADD_UPDATES_PENDING,
    DELETE_ALL_SELECTED,
    DELETE_FROM_DOWNLOAD,
    DELETE_FROM_SELECTED,
    DELETE_FROM_UNZIP,
    RESET_INSTALL,
    SET_BUFFER_QUEUE,
    SWITCH_QUEUE,
} from "../actions/manageDownloading";

const initialState = {
    selectedQueue: [],
    downloadQueue: [],
    bufferQueue: [],
    unzipQueue: [],
    updatesPending: [],
}

export default function manageDownloading( state = initialState, action ) {
    switch ( action.type ) {
        case ADD_SELECTED:
            return {
                ...state, selectedQueue: [ ...state.selectedQueue, ...action.selected ]
            }
        case ADD_DOWNLOAD:
            return {
                ...state, downloadQueue: action.arrayQueue
            }

        case DELETE_FROM_DOWNLOAD:

            let filteredDownload = state.downloadQueue.filter ( item => item.id !== action.doc.id );
            return {
                ...state, downloadQueue: filteredDownload
            }
        case DELETE_FROM_SELECTED:
            let filteredSelected = state.selectedQueue.filter ( item => !action.row.includes ( item ) );
            return {
                ...state, selectedQueue: filteredSelected
            }
        case ADD_ALL_SELECTED:
            return {
                ...state, selectedQueue: action.selectedArray
            }
        case DELETE_ALL_SELECTED:
            return {
                ...state, selectedQueue: []
            }
        case ADD_TO_BUFFER:
            return {
                ...state, bufferQueue: [ ...state.bufferQueue, action.doc ]
            }

        case SWITCH_QUEUE:
            return {
                ...state, unzipQueue: state.bufferQueue
            }

        case SET_BUFFER_QUEUE:
            return {
                ...state, bufferQueue: action.bufferQueue
            }

        case DELETE_FROM_UNZIP:

            let filteredInstall = state.unzipQueue.filter ( item => item.id !== action.doc.id );
            return {
                ...state, unzipQueue: filteredInstall
            }

        case RESET_INSTALL:
            return {
                ...state, bufferQueue: []
            }
        case ADD_UPDATES_PENDING:
            return {
                ...state, updatesPending: action.updates
            }
        default:
            return state;
    }
}