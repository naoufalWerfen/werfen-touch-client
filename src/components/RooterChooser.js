import React from 'react';
//import ReactPiwik from 'react-piwik';
import { createBrowserHistory } from 'history';
import { HashRouter, Router } from 'react-router-dom'
import isElectron from 'is-electron'
/*
 *  @Description:   Component that will choose between BrowserRouter or HashRouter
 */

const history = createBrowserHistory ();

// const piwik = new ReactPiwik( {
//     url: "//wlpiwik01.werfen.com/piwik",
//     siteId: 555,
//     trackErrors: true,
//     enableLinkTracking: true
// } )

const RouterChooser = ( props ) => {
    /*componentDidMount() {
        ReactPiwik.push(["setDocumentTitle", document.domain])
        ReactPiwik.push(["trackPageView"]);
    }*/
    if ( isElectron () ) {
        return (
            <HashRouter>
                { props.children }
            </HashRouter>
        )
    } else {
        return (
            <Router history={ history }>
                { props.children }
            </Router>
        )
    }
};

export default RouterChooser;



