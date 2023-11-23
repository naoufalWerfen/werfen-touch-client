export const SET_NOTIFICATION_DATA = 'notificationsReducer/SET_NOTIFICATION_DATA';

export const setNotificationData = (notificationData) => {
    return {
        type: SET_NOTIFICATION_DATA,
        notificationData
    }
}
