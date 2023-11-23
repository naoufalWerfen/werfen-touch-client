import React from 'react';

/*
*  @Description:   Stateless component that renders a Pending icon.
*/

const Circle = () => {

    return ( <g id="path">
            <circle cx="12" cy="12" r="10"/>
            <g transform="translate(2.25 .5)" strokeWidth="1.5">
                <circle cx="9.75" cy="11.5" r=".75"/>
                <circle cx="15" cy="11.5" r=".75"/>
                <circle cx="4.5" cy="11.5" r=".75"/>
            </g>
        </g>
    )

};

export default Circle;