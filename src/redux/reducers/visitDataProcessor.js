import {
    LOAD_ALL_SEARCH_CONTENT,
    LOAD_ALL_VISIT_CONTENT,
    LOAD_CONTENT_SEARCH,
    LOAD_GROUPS,
    LOAD_VISIT_CALCULATORS,
    LOAD_VISIT_DOCUMENTS,
    LOAD_VISIT_PRESENTATIONS,
    RESET_ALL_SEARCH_CONTENT,
    RESET_ALL_VISIT_CONTENT,
    RESET_CONTENT_SEARCH,
    RESET_GROUPS,
    RESET_SEARCH_VALUE,
    RESET_VISIT_CALCULATORS,
    RESET_VISIT_DOCUMENTS,
    RESET_VISIT_PRESENTATIONS,
    SET_CONTENT_GROUP,
    SET_CONTENT_TYPE,
    SET_RESULT_SEARCH,
    SET_SEARCH_VALUE
} from "../actions/processStartedVisitData";

const initialState = {
    searchValue: "",
    contentType: "all",
    contentGroup: "all",
    dataGroups: [],
    dataPresentations: [],
    dataDocuments: [],
    dataCalculators: [],
    dataVisitAll: [],
    dataSearch: [],
    dataSearchContent: [],
    resultSearchExist: null,
}

export default function dataProcessor ( state = initialState, action ) {
    switch ( action.type ) {
        case LOAD_GROUPS:
            return {
                ...state, dataGroups: action.dataGroups
            }
        case LOAD_ALL_VISIT_CONTENT:
            return {
                ...state, dataVisitAll: action.dataVisitAll
            }
        case LOAD_VISIT_DOCUMENTS:
            return {
                ...state, dataDocuments: action.dataDocuments
            }
        case LOAD_VISIT_PRESENTATIONS:
            return {
                ...state, dataPresentations: action.dataPresentations
            }
        case LOAD_VISIT_CALCULATORS:
            return {
                ...state, dataCalculators: action.dataCalculators
            }
        case LOAD_CONTENT_SEARCH:
            return {
                ...state, dataSearch: action.dataSearch
            }
        case LOAD_ALL_SEARCH_CONTENT:
            return {
                ...state, dataSearchContent: action.dataSearchContent
            }
        case RESET_GROUPS:
            return {
                ...state, dataGroups: []
            }
        case RESET_VISIT_CALCULATORS:
            return {
                ...state, dataCalculators: []
            }
        case RESET_VISIT_DOCUMENTS:
            return {
                ...state, dataDocuments: []
            }
        case RESET_VISIT_PRESENTATIONS:
            return {
                ...state, dataPresentations: []
            }
        case RESET_ALL_VISIT_CONTENT:
            return {
                ...state, dataVisitAll: []
            }
        case RESET_CONTENT_SEARCH:
            return {
                ...state, dataSearch: []
            }
        case RESET_ALL_SEARCH_CONTENT:
            return {
                ...state, dataSearchContent: []
            }
        case SET_RESULT_SEARCH:
            return {
                ...state, resultSearchExist: action.resultSearch
            }
        case SET_SEARCH_VALUE:
            return {
                ...state, searchValue: action.searchValue
            }
        case  RESET_SEARCH_VALUE:
            return {
                ...state, searchValue: ""
            }
        case SET_CONTENT_TYPE:
            return {
                ...state, contentType: action.contentType
            }
        case SET_CONTENT_GROUP:
            return {
                ...state, contentGroup: action.contentGroup
            }
        default:
            return state;
    }
}