import React from 'react';

/*
*  @Description:   Stateless component that renders a Clock icon.
*/

const Clock = () => {

    return (
        <g>
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
        </g>
    )

};

export default Clock;