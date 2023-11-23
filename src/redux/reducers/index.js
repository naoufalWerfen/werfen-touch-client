// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import navigation from './navigation';
import manageDownloading from "./manageDownloading";
import dataProcessor from "./dataProcessor";
import settings from "./settings";
import emailEditor from "./emailEditor";
import sensors from "./sensors"
import notificationsReducer from "./notificationsReducer";
import modalsReducer from "./modalsReducer";
import visitEditor from "./visitEditor";
import visitDataProcessor from "./visitDataProcessor"

const rootReducer = combineReducers( {
    navigation,
    manageDownloading,
    dataProcessor,
    settings,
    emailEditor,
    sensors,
    notificationsReducer,
    modalsReducer,
    visitEditor,
    visitDataProcessor,
    router,
} );


export default rootReducer;
