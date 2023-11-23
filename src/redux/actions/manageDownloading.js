export const ADD_DOWNLOAD = 'manageDownloading/ADD_DOWNLOAD';
export const DELETE_FROM_DOWNLOAD = 'manageDownloading/DELETE_FROM_DOWNLOAD';
export const ADD_TO_BUFFER = 'manageDownloading/ADD_TO_BUFFER';
export const DELETE_FROM_UNZIP = 'manageDownloading/DELETE_FROM_UNZIP';
export const SWITCH_QUEUE = 'manageDownloading/SWITCH_QUEUE';
export const RESET_INSTALL = 'manageDownloading/RESET_INSTALL';
export const ADD_SELECTED = 'manageDownloading/ADD_SELECTED';
export const DELETE_FROM_SELECTED = 'manageDownloading/DELETE_SELECTED';
export const ADD_ALL_SELECTED = 'manageDownloading/ADD_ALL_SELECTED';
export const DELETE_ALL_SELECTED = 'manageDownloading/DELETE_ALL_SELECTED';
export const ADD_UPDATES_PENDING = 'manageDownloading/ADD_UPDATES_PENDING';
export const SET_BUFFER_QUEUE = 'manageDownloading/SET_BUFFER_QUEUE,';
export const addSelectedQueue = ( selected ) => {
    return {
        type: ADD_SELECTED,
        selected
    }
}

export const deleteFromSelectedQueue = ( row ) => {
    return {
        type: DELETE_FROM_SELECTED,
        row
    }
}

export const addAllSelectedQueue = ( selectedArray ) => {
    return {
        type: ADD_ALL_SELECTED,
        selectedArray
    }
}

export const deleteAllFromSelectedQueue = ( ) => {
    return {
        type: DELETE_ALL_SELECTED,
    }
}

export const addDownloadQueue = ( arrayQueue ) => {
    return {
        type: ADD_DOWNLOAD,
        arrayQueue
    }
}

export const deleteFromDownloadQueue = ( doc ) => {
    return {
        type: DELETE_FROM_DOWNLOAD,
        doc
    }
}

export const addToBufferQueue = ( doc ) => {
    return {
        type: ADD_TO_BUFFER,
        doc
    }
}

export const setAsBufferQueue = ( list ) => {
    return {
        type: SET_BUFFER_QUEUE,
        list
    }
}

export const deleteFromUnzipQueue = ( doc ) => {
    return {
        type: DELETE_FROM_UNZIP,
        doc
    }
}

export const switchQueue = () => {
    return {
        type: SWITCH_QUEUE,
    }
}

export const resetBufferQueue = () => {
    return {
        type: RESET_INSTALL,
    }
}

export const addAllUpdatesPending = (updates) => {
    return {
        type: ADD_UPDATES_PENDING,
        updates
    }
}
