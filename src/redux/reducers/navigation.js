import {
    RESET_SIDEBAR,
    SELECTED_NAVIGATION_ITEM,
    SELECTED_SIDEBAR_ITEM,
    SELECTED_SIDEBAR_KEY,
    SET_CLICKED,
    SET_INSIDE_VIEWER
} from "../actions/navigation";


const initialState = {
    navigationItem: -1,
    selectedKey: 0,
    selectedItem: "",
    clicked: false,
    insideViewer: false
}

export default function navigationReducer ( state = initialState, action ) {
    switch ( action.type ) {
        case SELECTED_NAVIGATION_ITEM:
            return {
                ...state, navigationItem: action.navigationItem
            }
        case SELECTED_SIDEBAR_KEY:
            return {
                ...state, selectedKey: action.selectedKey
            }
        case SELECTED_SIDEBAR_ITEM:
            return {
                ...state, selectedItem: action.selectedItem
            }
        case RESET_SIDEBAR:
            return {
                ...state, selectedKey: 0, selectedItem: "", clicked: false
            }
        case SET_CLICKED:
            return {
                ...state, clicked: action.clicked
            }
        case SET_INSIDE_VIEWER:
            return {
                ...state, insideViewer: action.insideViewer
            }
        default:
            return state;
    }
}