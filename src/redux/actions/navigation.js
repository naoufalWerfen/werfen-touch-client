export const SELECTED_NAVIGATION_ITEM = "navigation/SELECTED_NAVIGATION_ITEM";
export const SELECTED_SIDEBAR_KEY = "navigation/SELECTED_SIDEBAR_KEY";
export const SELECTED_SIDEBAR_ITEM = "navigation/SELECTED_SIDEBAR_ITEM";
export const RESET_SIDEBAR = "navigation/RESET_SIDEBAR";
export const SET_CLICKED = "navigation/SET_CLICKED";
export const SET_INSIDE_VIEWER = "navigation/SET_INSIDE_VIEWER";

export const setNavigationItem = ( navigationItem ) => {
    return {
        type: SELECTED_NAVIGATION_ITEM,
        navigationItem
    }
}

export const setActiveKey = ( selectedKey ) => {
    return {
        type: SELECTED_SIDEBAR_KEY,
        selectedKey
    }
}

export const setClicked = ( clicked ) => {
    return {
        type: SET_CLICKED,
        clicked
    }
}

export const resetSidebar = () => {
    return {
        type: RESET_SIDEBAR,
    }
}

export const setSelectedItem = ( selectedItem ) => {
    return {
        type: SELECTED_SIDEBAR_ITEM,
        selectedItem
    }
}

export const setInsideViewer = ( insideViewer ) => {
    return {
        type: SET_INSIDE_VIEWER,
        insideViewer
    }
}