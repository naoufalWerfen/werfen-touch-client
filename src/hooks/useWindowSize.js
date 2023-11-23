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

export default function useWindowSize () {
    function getSize () {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
        }
    }

    const [ windowSize, setWindowSize ] = useState ( getSize )

    useEffect ( () => {
        const handleResizeDebounced = debounce ( function handleResize () {
            setWindowSize ( getSize () )
        }, 250 )

        window.addEventListener ( "resize", handleResizeDebounced )
        return () => window.removeEventListener ( "resize", handleResizeDebounced )
    }, [] )

    return windowSize
}