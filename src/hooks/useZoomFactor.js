import { useEffect, useState } from "react"

function debounce ( func, wait, immediate ) {
    let timeout
    return function () {
        const context = this;
        const args = arguments;
        const later = function () {
            timeout = null
            if ( !immediate ) {
                func.apply ( context, args )
            }
        }
        const callNow = immediate && !timeout
        clearTimeout ( timeout )
        timeout = setTimeout ( later, wait )
        if ( callNow ) {
            func.apply ( context, args )
        }
    }
}

export default function useZoomFactor () {
    function detectZoom () {
        let ratio = 0;
        // const screen = window.screen;
        // const ua = navigator.userAgent.toLowerCase();

        if ( window.devicePixelRatio !== undefined ) {
            ratio = window.devicePixelRatio;
        }
            // else if (~ua.indexOf('msie')) {
            //     if (screen.deviceXDPI && screen.logicalXDPI) {
            //         ratio = screen.deviceXDPI / screen.logicalXDPI;
            //     }
        // }
        else if ( window.outerWidth !== undefined && window.innerWidth !== undefined ) {
            ratio = window.outerWidth / window.innerWidth;
        }

        if ( ratio ) {
            ratio = Math.round ( ratio * 100 );
        }

        return { zoomFactor: ratio };
    }

    const [ zoomFactor, setZoomFactor ] = useState ( detectZoom )

    useEffect ( () => {
        const handleResizeDebounced = debounce ( function handleResize () {
            setZoomFactor ( detectZoom () )
        }, 250 )

        window.addEventListener ( "resize", handleResizeDebounced )
        return () => window.removeEventListener ( "resize", handleResizeDebounced )
    }, [] )

    return zoomFactor
}