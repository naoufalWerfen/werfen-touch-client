import React from 'react';
import Background from "./Background/Background";
import { Route, Switch } from "react-router-dom";
import Navigation from "./Navigation/Navigation";
import "./colorChart.scss";
import './Content.scss';
import VisitAllStage from "./VisitAllStage/VisitAllStage";
import PDFViewer from "./viewers/PDFViewer/PDFViewer";
import PDFJSBackend from "../backends/pdfjs";
import HYPEViewer from "./viewers/HYPEViewer/HYPEViewer";
import HYPEJSBackend from "../backends/hypejs";
import CALCViewer from "./viewers/CALCViewer/CALCViewer";
import CALCJSBackend from "../backends/calcjs";
import VisitSearchStage from "./VisitSearchStage/VisitSearchStage";
import EmailManager from "./EmailManager/EmailManager";

const VisitStage = ( props ) => {
    return (
        <>
            <Background/>
            <div className="Content">
                {/*TODO: Add here a component with null render for processing DB query for content and sidebar values*/ }
                <Switch>
                    <Route exact path='/all'
                           render={ () => <VisitAllStage
                               userProfile={ props.userProfile }
                               class="search"/> }/>
                    <Route path='/visitsearch/:searchString?'
                           render={ () => < VisitSearchStage userProfile={ props.userProfile } class="search"/> }/>
                    <Route path='/visitemail/:id?'
                           render={ () => < EmailManager/> }/>
                    <Route path='/pdfviewer/:id?' render={ () => <PDFViewer backend={ PDFJSBackend }/> }/>
                    <Route path='/hypeviewer/:id?' render={ () => <HYPEViewer backend={ HYPEJSBackend }/> }/>
                    <Route path='/calcviewer/:id?' render={ () => <CALCViewer backend={ CALCJSBackend }/> }/>
                </Switch>
                <Navigation handleFinishVisit={ props.handleFinishVisit }/>
            </div>
        </>
    );
};

export default VisitStage;