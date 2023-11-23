// noinspection JSUnusedGlobalSymbols

export const LOAD_GROUPS = 'dataProcessor/LOAD_GROUPS';
export const RESET_GROUPS = 'dataProcessor/RESET_GROUPS';
export const SET_ALL_GROUPS_FOR_PROFILE = 'dataProcessor/SET_ALL_GROUPS_FOR_PROFILE';
export const RESET_CONTENT_VISUALS = 'dataProcessor/RESET_CONTENT_VISUALS ';
export const RESET_CONTENT_LIBRARY = 'dataProcessor/RESET_CONTENT_LIBRARY ';
export const RESET_CONTENT_SEARCH = 'dataProcessor/RESET_CONTENT_SEARCH';
export const LOAD_CONTENT_SEARCH = 'dataProcessor/LOAD_CONTENT_SEARCH';
export const LOAD_ALL_SEARCH_CONTENT = 'dataProcessor/LOAD_ALL_SEARCH_CONTENT';
export const LOAD_CONTENT_VISUALS = 'dataProcessor/LOAD_CONTENT_VISUALS';
export const LOAD_CONTENT_LIBRARY = 'dataProcessor/LOAD_CONTENT_LIBRARY';
export const SET_RESULT_SEARCH = 'dataProcessor/SET_RESULT_SEARCH';
export const SET_SEARCH_VALUE = 'dataProcessor/SET_SEARCH_VALUE';
export const SET_CONTENT_TYPES = 'dataProcessor/SET_CONTENT_TYPES';
export const SET_ALL_CONTENT_TYPES_FOR_PROFILE = 'dataProcessor/SET_ALL_CONTENT_TYPES_FOR_PROFILE';
export const RELOAD_CONTENT_TYPES = 'dataProcessor/RELOAD_CONTENT_TYPES';
export const SET_BUSINESS_UNITS = 'dataProcessor/SET_BUSINESS_UNITS';
export const RELOAD_BUSINESS_UNITS = 'dataProcessor/RELOAD_BUSINESS_UNITS';
export const RESET_ALL_SEARCH_CONTENT = 'dataProcessor/RESET_ALL_SEARCH_CONTENT';
export const RESET_SEARCH_VALUE = 'dataProcessor/RESET_SEARCH_VALUE';

export const loadGroups = ( dataGroups ) => {
    return {
        type: LOAD_GROUPS,
        dataGroups
    }
}

export const loadVisuals = (dataVisuals) => {
    return {
        type: LOAD_CONTENT_VISUALS,
        dataVisuals
    }
}

export const loadSearch = (dataSearch) => {
    return {
        type: LOAD_CONTENT_SEARCH,
        dataSearch
    }
}

export const loadLibrary = (dataLibrary) => {
    return {
        type: LOAD_CONTENT_LIBRARY,
        dataLibrary
    }
}

export const loadAllSearchContent = (dataSearchContent) => {
    return {
        type: LOAD_ALL_SEARCH_CONTENT,
        dataSearchContent
    }
}

export const resetGroups = () => {
    return {
        type: RESET_GROUPS
    }
}

export const resetVisuals = () => {
    return {
        type: RESET_CONTENT_VISUALS
    }
}

export const resetLibrary = () => {
    return {
        type: RESET_CONTENT_LIBRARY
    }
}

export const resetSearch = () => {
    return {
        type: RESET_CONTENT_SEARCH
    }
}

export const resetAllSearchContent = () => {
    return {
        type: RESET_ALL_SEARCH_CONTENT
    }
}

export const setResultSearch = (resultSearch) => {
    return {
        type: SET_RESULT_SEARCH,
        resultSearch
    }
}

export const resetSearchValue = () => {
    return {
        type: RESET_SEARCH_VALUE
    }
}

export const setSearchValue = (searchValue) => {
    return {
        type: SET_SEARCH_VALUE,
        searchValue
    }
}


export const setContentType = ( contentType ) => {
    return {
        type: SET_CONTENT_TYPES,
        contentType
    }
}

export const reloadContentTypes = ( contentTypes ) => {
    return {
        type: RELOAD_CONTENT_TYPES,
        contentTypes
    }
}

export const setBusinessUnit = ( businessUnit ) => {
    return {
        type: SET_BUSINESS_UNITS,
        businessUnit
    }
}
export const reloadBusinessUnits = ( businessUnits ) => {
    return {
        type: RELOAD_BUSINESS_UNITS,
        businessUnits
    }
}

export const setAllContentTypesForProfile = ( allContentTypes ) => {
    return {
        type: SET_ALL_CONTENT_TYPES_FOR_PROFILE,
        allContentTypes
    }
}

export const setAllGroupsForProfile = ( allGroups ) => {
    return {
        type: SET_ALL_GROUPS_FOR_PROFILE,
        allGroups
    }
}

