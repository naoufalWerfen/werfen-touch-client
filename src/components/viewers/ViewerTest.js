import React, { useState } from 'react';
import './ViewerTest.css';
import PDFViewer from "./PDFViewer/PDFViewer";
import PDFJSBackend from "../../backends/pdfjs";
import HYPEViewer from "./HYPEViewer/HYPEViewer";
import HYPEJSBackend from "../../backends/hypejs";
import CALCViewer from "./CALCViewer/CALCViewer";
import CALCJSBackend from "../../backends/calcjs";

function ViewerTest() {
    const [ menuOption, setMenuOption ] = useState( 0 );
    const _handleOnClick = ( event, value ) => {
        event.preventDefault();
        setMenuOption( value )
    }
    return (
        <div className="ViewerTest">
            <div className={ "tempButtonMenu" }>
                <span className={ menuOption === 0 ? "selected" : "" }
                      onClick={ ( event ) => _handleOnClick( event, 0 ) }>⓪</span>
                <span className={ menuOption === 1 ? "selected" : "" }
                      onClick={ ( event ) => _handleOnClick( event, 1 ) }>①</span>
                <span className={ menuOption === 2 ? "selected" : "" }
                      onClick={ ( event ) => _handleOnClick( event, 2 ) }>②</span>
            </div>
            { menuOption === 0 && <PDFViewer
                backend={ PDFJSBackend }
                src='/test.pdf'
            /> }
            { menuOption === 1 && <HYPEViewer
                backend={ HYPEJSBackend }
                src='/index.html'
            /> }
            { menuOption === 2 && <CALCViewer
                backend={ CALCJSBackend }
                src='/index.html'
            /> }
        </div>
    );
}

//export default ViewerTest;
