import React from 'react';

const Icon = ( { SvgSymbol, iconClass, viewBox } ) => {
    return (
        <svg
            className={ iconClass }
            xmlns="http://www.w3.org/2000/svg"
            viewBox={ viewBox }
        >
            <SvgSymbol/>
        </svg>
    )
};

export default Icon;