export const  UPDATE_NETWORK_AVAILABILITY = 'sensors/UPDATE_NETWORK_AVAILABILITY';
export const  UPDATE_SERVER_AVAILABILITY = 'sensors/UPDATE_SERVER_AVAILABILITY';
export const SET_LOGIN_ENDPOINT = 'sensors/SET_LOGIN_ENDPOINT';

export const updateNetworkAvailability = (networkAvailable)=> {
    return {
        type: UPDATE_NETWORK_AVAILABILITY,
        networkAvailable
    }
}

export const updateServerAvailability = (serverAvailable) => {
    return {
        type: UPDATE_SERVER_AVAILABILITY,
        serverAvailable
    }
}

export const setLoginEndpoint = (loginUrl) => {
    return {
        type: SET_LOGIN_ENDPOINT,
        loginUrl
    }
}
