import React from 'react';
import './App.css';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.css';
import { Provider } from 'react-redux';
import createStore from "./redux/store/createStore";
import InitialComponent from "./components/InitialComponent";
import RouterChooser from "./components/RooterChooser";
import NetworkChecker from "./components/NetworkChecker";
import ServerChecker from "./components/ServerChecker";
import LanguageEventHandler from "./components/Utils/LanguageEventHandler";
import DownloadEventHandler from "./components/Utils/DownloadEventHandler";
import ErrorsEventHandler from "./components/Utils/ErrorsEventHandler";
import InstallationEventHandler from "./components/Utils/InstallationEventHandler";
import PendingTasksEventHandler from "./components/Utils/PendingTasksEventHandler";
import USBInstallationEventHandler from "./components/Utils/USBInstallationEventHandler";
import UpdatesEventHandler from "./components/Utils/UpdatesEventHandler";
import NotificationsEventHandler from "./components/Utils/NotificationsEventHandler";
import ModalsEventHandler from "./components/Utils/ModalsEventHandler";
import FirstInstallationEventHandler from "./components/Utils/FirstInstallationEventHandler";
import SettingsEventHandler from "./components/Utils/SettingsEventHandler";
import UninstallingEventHandler from "./components/Utils/UninstallingEventHandler";
import PinEventHandler from "./components/Utils/PinEventHandler";
import VisitEventHandler from "./components/Utils/VisitsEventHandler";
import { SoftwareUpdatesEventHandler } from "./components/Utils/SoftwareUpdatesEventHandler";

const store = createStore ();

function App () {

    return (
        <RouterChooser>
            <Provider store={ store }>
                <div className="App fixed-size">
                    <NetworkChecker/>
                    <ServerChecker/>
                    <ErrorsEventHandler/>
                    <LanguageEventHandler/>
                    <DownloadEventHandler/>
                    <InstallationEventHandler/>
                    <USBInstallationEventHandler/>
                    <InitialComponent/>
                    <PinEventHandler/>
                    <SettingsEventHandler/>
                    <FirstInstallationEventHandler/>
                    <UpdatesEventHandler/>
                    <PendingTasksEventHandler/>
                    <ModalsEventHandler/>
                    <NotificationsEventHandler/>
                    <VisitEventHandler/>
                    <UninstallingEventHandler/>
                    <SoftwareUpdatesEventHandler/>
                </div>
            </Provider>
        </RouterChooser>
    );
}

export default (App);
