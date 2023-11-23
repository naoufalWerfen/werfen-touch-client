import { SET_NOTIFICATION_DATA } from "../actions/notifications";

const initialState = {
    notificationData: {}
}

export default function notificationsReducer ( state = initialState, action ) {
    switch(action.type) {
        case SET_NOTIFICATION_DATA:
            return {
                ...state, notificationData: action.notificationData
            }
        default:
            return state;
    }
}
