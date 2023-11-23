// noinspection JSUnusedGlobalSymbols

export const LOAD_GROUPS = 'visitDataProcessor/LOAD_GROUPS';
export const RESET_GROUPS = 'visitDataProcessor/RESET_GROUPS';
export const RESET_CONTENT_VISUALS = 'visitDataProcessor/RESET_CONTENT_VISUALS ';
export const RESET_CONTENT_LIBRARY = 'visitDataProcessor/RESET_CONTENT_LIBRARY ';
export const RESET_CONTENT_SEARCH = 'visitDataProcessor/RESET_CONTENT_SEARCH';
export const LOAD_CONTENT_SEARCH = 'visitDataProcessor/LOAD_CONTENT_SEARCH';
export const LOAD_ALL_SEARCH_CONTENT = 'visitDataProcessor/LOAD_ALL_SEARCH_CONTENT';
export const LOAD_ALL_VISIT_CONTENT = 'visitDataProcessor/LOAD_ALL_VISIT_CONTENT';
export const RESET_ALL_VISIT_CONTENT = 'visitDataProcessor/RESET_ALL_VISIT_CONTENT';
export const LOAD_VISIT_PRESENTATIONS = 'visitDataProcessor/LOAD_VISIT_PRESENTATIONS';
export const RESET_VISIT_PRESENTATIONS = 'visitDataProcessor/RESET_VISIT_PRESENTATIONS';
export const LOAD_VISIT_DOCUMENTS = 'visitDataProcessor/LOAD_VISIT_DOCUMENTS';
export const RESET_VISIT_DOCUMENTS = 'visitDataProcessor/RESET_VISIT_DOCUMENTS';
export const RESET_VISIT_CALCULATORS = 'visitDataProcessor/RESET_VISIT_CALCULATORS';
export const LOAD_VISIT_CALCULATORS = 'visitDataProcessor/LOAD_VISIT_CALCULATORS';
export const SET_RESULT_SEARCH = 'visitDataProcessor/SET_RESULT_SEARCH';
export const SET_SEARCH_VALUE = 'visitDataProcessor/SET_SEARCH_VALUE';
export const SET_CONTENT_TYPE = 'visitDataProcessor/SET_CONTENT_TYPE';
export const RESET_ALL_SEARCH_CONTENT = 'visitDataProcessor/RESET_ALL_SEARCH_CONTENT';
export const RESET_SEARCH_VALUE = 'visitDataProcessor/RESET_SEARCH_VALUE';
export const SET_CONTENT_GROUP = 'visitDataProcessor/SET_CONTENT_GROUP';

export const loadGroups = ( dataGroups ) => {
    return {
        type: LOAD_GROUPS,
        dataGroups
    }
}

export const loadPresentations = ( dataPresentations ) => {
    return {
        type: LOAD_VISIT_PRESENTATIONS,
        dataPresentations
    }
}

export const loadSearch = ( dataSearch ) => {
    return {
        type: LOAD_CONTENT_SEARCH,
        dataSearch
    }
}

export const loadDocuments = ( dataDocuments ) => {
    return {
        type: LOAD_VISIT_DOCUMENTS,
        dataDocuments
    }
}


export const loadCalculators = ( dataCalculators ) => {
    return {
        type: LOAD_VISIT_CALCULATORS,
        dataCalculators
    }
}

export const loadVisitAll = ( dataVisitAll ) => {
    return {
        type: LOAD_ALL_VISIT_CONTENT,
        dataVisitAll
    }
}

export const loadAllSearchContent = ( dataSearchContent ) => {
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
export const resetVisitAll = () => {
    return {
        type: RESET_ALL_VISIT_CONTENT
    }
}

export const resetPresentations = () => {
    return {
        type: RESET_VISIT_PRESENTATIONS
    }
}

export const resetDocuments = () => {
    return {
        type: RESET_VISIT_DOCUMENTS
    }
}


export const resetCalculators = () => {
    return {
        type: RESET_VISIT_CALCULATORS
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

export const setResultSearch = ( resultSearch ) => {
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
export const setSearchValue = ( searchValue ) => {
    return {
        type: SET_SEARCH_VALUE,
        searchValue
    }
}

export const setContentType = ( contentType ) => {
    return {
        type: SET_CONTENT_TYPE,
        contentType
    }
}

export const setContentGroup = ( contentGroup ) => {
    return {
        type: SET_CONTENT_GROUP,
        contentGroup
    }
}