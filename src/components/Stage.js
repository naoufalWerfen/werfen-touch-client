import React from 'react';
import Background from "./Background/Background";
import { Route, Switch } from "react-router-dom";
import Home from "./Home/Home";
import VisualsStage from "./VisualsStage/VisualsStage";
import LibraryStage from "./LibraryStage/LibraryStage";
import PDFViewer from "./viewers/PDFViewer/PDFViewer";
import PDFJSBackend from "../backends/pdfjs";
import HYPEViewer from "./viewers/HYPEViewer/HYPEViewer";
import CALCViewer from "./viewers/CALCViewer/CALCViewer";
import CALCJSBackend from "../backends/calcjs";
import Navigation from "./Navigation/Navigation";
import "./colorChart.scss";
import './Content.scss';
import DownloadManager from "./DownloadManager/DownloadManager";
import Settings from "./Settings/Settings";
import EmailManager from "./EmailManager/EmailManager";
import USBScreen from "./USBScreen/USBScreen";
import VisitManager from "./VisitlManager/VisitManager";
import SearchStage from "./SearchStage/SearchStage";

const Stage = (props) => {
    return (
        <>
            <Background/>
            <div className="Content">
                {/*TODO: Add here a component with null render for processing DB query for content and sidebar values*/}
                <Switch>
                    <Route exact path='/' render={ () => <Home/> }/>
                    <Route exact path='/visuals/:id?' render={ () => <VisualsStage/> }/>
                    <Route exact path='/library/:id?' render={ () => <LibraryStage/> }/>
                    <Route exact path='/calendar/:id?' render={ () => <div className="calendar"/> }/>
                    <Route exact path='/mail' render={ () => < EmailManager/> }/>
                    <Route exact path='/search/:searchString?' render={ () => <SearchStage class="search"/> }/>
                    <Route exact path='/settings/:id?' render={ () => <Settings/> }/>
                    <Route path='/downloadmanager' render={ () => <DownloadManager/> }/>
                    <Route path='/emailmanager/:id?'
                           render={ () => <EmailManager/> }/>
                    <Route path='/visitmanager/:id?'
                           render={ () => <VisitManager/> }/>
                    <Route exact path='/usbmanager' render={ () => <USBScreen/> }/>
                    <Route exact path='/pdfviewer/:id?'
                           render={ () => <PDFViewer backend={ PDFJSBackend }/> }/>
                    <Route exact path='/hypeviewer/:id?' render={ () => <HYPEViewer/> }/>
                    <Route path='/calcviewer/:id?' render={ () => <CALCViewer backend={ CALCJSBackend }/> }/>
                </Switch>
                <Navigation/>
            </div>
        </>
    );
};

export default Stage;
