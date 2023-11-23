import React from 'react';
import ReactDOM from 'react-dom';
import './i18n';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AlertContainer } from 'react-custom-alert';
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init ( {
    dsn: "https://d7da4fe3bb1f4ebc95f767cc1c3e137a@o4504638641471488.ingest.sentry.io/4504638974132224",
    integrations: [ new BrowserTracing () ],

    // Set tracesSampleRate to 1.0 to capture 100%
    tracesSampleRate: 1.0,
} );


ReactDOM.render (
    <React.StrictMode>
        <App/>
        <AlertContainer floatingTime={ 5000 }/>
    </React.StrictMode>,
    document.getElementById ( 'root' )
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
