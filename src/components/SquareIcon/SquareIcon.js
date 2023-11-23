import React from 'react';

const SquareIcon = ( { squareClass, squareColor } ) => {
    return (
        <svg
            className={ squareClass }
            fill={ squareColor }
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
        >
            <path d="M24 0h-24v24h24v-24z"/>
        </svg>
    )
};

export default SquareIcon;