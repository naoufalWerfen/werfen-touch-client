import { SET_SHOW } from "../actions/modals";

const initialState = {
    show: false
}

export default function modalsReducer(state= initialState, action) {
    switch(action.type){
        case SET_SHOW:
            return {
                ...state, show: action.show
            }
        default:
            return state;
    }
}
