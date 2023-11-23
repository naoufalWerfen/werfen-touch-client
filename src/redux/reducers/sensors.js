import { SET_LOGIN_ENDPOINT, UPDATE_NETWORK_AVAILABILITY, UPDATE_SERVER_AVAILABILITY } from "../actions/sensors";

const initialState = {
    networkAvailable: true,
    serverAvailable: true,
    loginEndpoint: ''
}

export default function sensors(state = initialState, action){
    switch( action.type ){
        case UPDATE_SERVER_AVAILABILITY:
            return {
                ...state, serverAvailable: action.serverAvailable
            }
        case UPDATE_NETWORK_AVAILABILITY:
            return {
                ...state, networkAvailable: action.networkAvailable
            }
        case SET_LOGIN_ENDPOINT:
                return {
                    ...state, loginEndpoint: action.loginUrl
                }
        default:
            return state;
    }
}
