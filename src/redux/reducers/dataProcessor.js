import {
    LOAD_ALL_SEARCH_CONTENT,
    LOAD_CONTENT_LIBRARY,
    LOAD_CONTENT_SEARCH,
    LOAD_CONTENT_VISUALS,
    LOAD_GROUPS,
    RELOAD_BUSINESS_UNITS,
    RELOAD_CONTENT_TYPES,
    RESET_ALL_SEARCH_CONTENT,
    RESET_CONTENT_LIBRARY,
    RESET_CONTENT_SEARCH,
    RESET_CONTENT_VISUALS,
    RESET_GROUPS,
    RESET_SEARCH_VALUE,
    SET_ALL_CONTENT_TYPES_FOR_PROFILE,
    SET_ALL_GROUPS_FOR_PROFILE,
    SET_BUSINESS_UNITS,
    SET_CONTENT_TYPES,
    SET_RESULT_SEARCH,
    SET_SEARCH_VALUE
} from "../actions/processData";

const initialState = {
    searchValue: "",
    contentTypes: [ "all" ],
    businessUnits: [ "all" ],
    dataGroups: [],
    dataVisuals: [],
    dataLibrary: [],
    dataSearch: [],
    dataSearchContent: [],
    resultSearchExist: null,
    allGroupsForProfile: [],
    allContentTypesForProfile: []
}

export default function dataProcessor(state = initialState, action) {
    switch ( action.type ) {
        case LOAD_GROUPS:
            return {
                ...state, dataGroups: action.dataGroups
            }
        case LOAD_CONTENT_VISUALS:
            return {
                ...state, dataVisuals: action.dataVisuals
            }
        case LOAD_CONTENT_LIBRARY:
            return {
                ...state, dataLibrary: action.dataLibrary
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
        case RESET_CONTENT_VISUALS:
            return {
                ...state, dataVisuals: []
            }
        case RESET_CONTENT_LIBRARY:
            return {
                ...state, dataLibrary: []
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
        case    RESET_SEARCH_VALUE:
            return {
                ...state, searchValue: ""
            }
        case SET_CONTENT_TYPES:
            return {
                ...state, contentTypes: action.contentType
            }
        case RELOAD_CONTENT_TYPES:
            return {
                ...state, contentTypes: action.contentTypes
            }
        case SET_BUSINESS_UNITS:
            return {
                ...state, businessUnits: action.businessUnit
            }
        case RELOAD_BUSINESS_UNITS:
            return {
                ...state, businessUnits: action.businessUnits
            }
        case SET_ALL_CONTENT_TYPES_FOR_PROFILE:
            return {
                ...state, allContentTypesForProfile: action.allContentTypes
            }
        case SET_ALL_GROUPS_FOR_PROFILE:
            return {
                ...state, allGroupsForProfile: action.allGroups
            }
        default:
            return state;
    }
}
