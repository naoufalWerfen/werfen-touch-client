import React from 'react';

/*
*  @Description:   Stateless component that renders a Circle icon.
*/

const Circle = () => {

    return ( <g id="path">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
        </g>
    )

};

export default Circle;