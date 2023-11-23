import React from 'react';

/*
*  @Description:   Stateless component that renders a ArrowBack icon.
*/

const ArrowBack = () => {

    return ( <g id="path">
            <path d="m15 21h4a2 2 0 0 0 2-2v-14a2 2 0 0 0-2-2h-4"/>
            <polyline transform="matrix(-1,0,0,1,24,0)" points="16 17 21 12 16 7"/>
            <line x1="3" x2="15" y1="12" y2="12"/>
        </g>
    )

};

export default ArrowBack;