import React, { useEffect } from 'react';
import Background from "../Background/Background";
import './UpdateScreen.scss';
import { Col, Container, ProgressBar, Row } from "react-bootstrap";
import { setNavigationItem } from "../../redux/actions/navigation";
import { connect } from "react-redux";
import newLogo from "../../assets/logos/New_Werfen_logo.jpg"
import { useTranslation } from 'react-i18next';
import Loader from "../Loader/Loader";
import { getDownloadingPercentage } from "../../constants/functions";

const UpdateScreen = ( props ) => {
    const { t } = useTranslation ();
    const getNumberFiles = ( numberFiles, downloadLength ) => {
        let result;
        if ( numberFiles === undefined || downloadLength === undefined ) {
            result = "1/1";
        } else {
            result = ( numberFiles - downloadLength ).toString () + "/" + numberFiles.toString ();
        }
        return result;
    }
    const appInInitialSetup = ( props.phase === 'initialSetup' && !props.userLoggedOut );
    const appLoggingOut = ( props.phase === 'initialSetup' && props.userLoggedOut );
    const webAndFirstInstallation = ( props.phase === "firstContentInstallation" && props.webInstallation );
    const usbAndFirstInstallation = ( props.phase === "firstContentInstallation" && !props.webInstallation );
    const normalUpdatesByWeb = ( props.phase === "readyToUse" );

    const appPreparingContent = ( props.subphase && props.subphase === "preparingData" ) ||
        ( props.downloadQueue.length === 0 && props.unzipQueue.length === 0 ) ||
        ( props.downloadQueue.length === 0 && props.unzipQueue.length === 0 && props.bufferQueue.length === 0 );

    const appDownloadingContent = ( props.downloadQueue.length > 0 ) ||
        ( props.subphase && props.subphase === "downloading" && props.downloadQueue.length > 0 ) ||
        ( props.subphase && props.subphase === "downloading" && ( props.downloadQueue.length > 0 && props.downloadData.filesNumber > 0 ) );

    const appDownloadingFiles = ( props.downloadQueue.length > 0 && props.downloadData.filesNumber > 0 );

    const appInstallingContent = ( props.subphase && props.subphase === "installing" && props.unzipQueue.length > 0 ) ||
        ( props.unzipQueue.length > 0 ) ||
        ( props.downloadQueue.length === 0 );

    const appInProduction = ( process.env.NODE_ENV === 'production' );


    useEffect ( () => {
        props.setNavigationItem ( 8 );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.webInstallation ] );

    return (
        <div className={ "UpdateScreen" }>
            <Background/>
            <Container fluid className={ "UpdateScreen__Container h-100" }>
                <Row className={ "UpdateScreen__Box h-100" }>
                    <Col xs={ 6 } className={ "UpdateScreen__SideLogo" }>
                        <div>
                            <img alt="Werfen Logo" src={ newLogo }/>
                        </div>
                    </Col>
                    <Col className={ "UpdateScreen__Main" } xs={ 6 }>
                        { appInInitialSetup &&
                            <div className={ "UpdateScreen__Dependencies" }>
                                <div className={ "UpdateScreen__Message" }>
                                    <p className="UpdateScreen__Message--title">
                                        { t ( "Installing dependencies" ) }...
                                    </p>
                                    <p className="UpdateScreen__Message--info">
                                        { t ( "Files" ) }: <span>{ getNumberFiles ( props.downloadData.filesNumber, props.downloadQueue.length ) }</span>
                                    </p>
                                    <p className="UpdateScreen__Message--info">
                                        { t ( "Download speed" ) }: <span>{ props.downloadData.speed } </span>
                                    </p>
                                    <p className="UpdateScreen__Message--info">
                                        { t ( "Total Size" ) }: { ( props.downloadData.received_bytes ) &&
                                        <span>{ ( props.downloadData.received_bytes / 1000000 ).toFixed ( 2 ) / ( props.downloadData.total_bytes / 1000000 ).toFixed ( 2 ) || 0 } MB  </span> }
                                    </p>
                                </div>
                            </div> }
                        { appLoggingOut &&
                            <div className={ "UpdateScreen__Dependencies" }>
                                <div className={ "UpdateScreen__Message" }>
                                    <p className="UpdateScreen__Message--title">
                                        { t ( "Logging out" ) }...
                                    </p>
                                </div>
                            </div> }
                        { ( webAndFirstInstallation || normalUpdatesByWeb ) &&
                            <div className={ "UpdateScreen__Content" }>
                                <div className={ "UpdateScreen__Message" }>
                                    { appPreparingContent &&
                                        <div className={ "installing-spinner" }>
                                            <Loader/>
                                            <span
                                                className={ appInProduction ? "UpdateScreen__Message--title build" : "UpdateScreen__Message--title dev" }>
                                                { t ( "Preparing content" ) }
                                            </span>
                                        </div> }
                                    { appDownloadingContent &&
                                        <p className={ appInProduction ? "UpdateScreen__Message--title build" : "UpdateScreen__Message--title dev" }>
                                            { t ( "Downloading content" ) }...
                                        </p> }
                                    { ( appInstallingContent && !appPreparingContent ) &&
                                        <p className={ appInProduction ? "UpdateScreen__Message--title build" : "UpdateScreen__Message--title dev" }>
                                            { t ( "Installing content" ) }...
                                        </p> }
                                    { appDownloadingFiles && <>
                                        <p className={ appInProduction ? "UpdateScreen__Message--info__build" : "UpdateScreen__Message--info" }>
                                            { t ( "Files" ) }: <span>{ getNumberFiles ( props.downloadData.filesNumber, props.downloadQueue.length ) }</span>
                                        </p>
                                        <p className={ appInProduction ? "UpdateScreen__Message--info__build" : "UpdateScreen__Message--info" }>
                                            { t ( "Total Size" ) }: { ( props.downloadData.received_bytes ) &&
                                            <span>{ ( props.downloadData.received_bytes / 1000000 ).toFixed ( 2 ) } / { ( props.downloadData.total_bytes / 1000000 ).toFixed ( 2 ) } MB  </span> }
                                        </p>
                                        <p className={ appInProduction ? "UpdateScreen__Message--info__build" : "UpdateScreen__Message--info" }>
                                            { t ( "Download speed" ) }: <span>{ props.downloadData.speed } </span>
                                        </p>
                                    </>
                                    }
                                </div>
                                <div className={ "UpdateScreen__Progress" }>
                                    { appDownloadingFiles &&
                                        <div className="UpdateScreen__Progress--bars">
                                            <p className={ "UpdateScreen__Progress--info" }>{ t ( "Content downloading progress" ) }</p>
                                            <ProgressBar
                                                now={ props.downloadData.progress.toFixed ( 2 ) }
                                                label={ `${ props.downloadData.progress.toFixed ( 2 ) }%` }
                                                variant={ "download-progress__content" }
                                                className={ "progress__content" }
                                            />
                                            <p className="UpdateScreen__Progress--info">{ t ( "The whole downloading progress" ) } </p>
                                            <ProgressBar
                                                now={ getDownloadingPercentage ( props.downloadData.filesNumber, props.downloadQueue.length ) }
                                                label={ `${ getDownloadingPercentage ( props.downloadData.filesNumber, props.downloadQueue.length ) }%` }
                                                variant={ "download-progress" }
                                            />

                                        </div> }

                                    { ( appInstallingContent && !appPreparingContent ) &&
                                        <div className={ "installing-spinner" }>
                                            <Loader/>
                                            <span>{ t ( "Installing" ) } { props.unzipQueue.length } { t ( "file(s), please wait" ) }...</span>
                                        </div>
                                    }
                                </div>
                            </div> }
                        { usbAndFirstInstallation &&
                            <div className={ "UpdateScreen__Content" }>
                                <div className={ "UpdateScreen__Message" }>
                                    { appPreparingContent &&
                                        <div className={ "installing-spinner" }>
                                            <Loader/>
                                            <span
                                                className={ appInProduction ? "UpdateScreen__Message--title build" : "UpdateScreen__Message--title dev" }>
                                                { t ( "Preparing content" ) }
                                            </span>
                                        </div> }
                                    { appDownloadingContent &&
                                        <p className={ appInProduction ? "UpdateScreen__Message--title build" : "UpdateScreen__Message--title dev" }>
                                            { t ( "Downloading content" ) }...
                                        </p> }
                                    { ( appInstallingContent && !appPreparingContent ) &&
                                        <p className={ appInProduction ? "UpdateScreen__Message--title build" : "UpdateScreen__Message--title dev" }>
                                            { t ( "Installing content" ) }...
                                        </p> }
                                </div>
                                <div className={ "UpdateScreen__Progress" }>
                                    { appDownloadingFiles &&
                                        <div className="UpdateScreen__Progress--bars">
                                            <p className="UpdateScreen__Progress--info">The whole installation
                                                progress</p>
                                            <ProgressBar
                                                now={ getDownloadingPercentage ( props.downloadData.filesNumber, props.downloadQueue.length ) }
                                                label={ `${ getDownloadingPercentage ( props.downloadData.filesNumber, props.downloadQueue.length ) }%` }
                                                variant={ "download-progress" }
                                            />
                                        </div> }
                                    { appInstallingContent && <div className={ "installing-spinner" }>
                                        <Loader/>
                                        { appInstallingContent > 0 &&
                                            <span>{ t ( "Installing" ) } { props.unzipQueue.length } { t ( "file(s), please wait" ) }...</span> }
                                    </div> }
                                </div>
                            </div> }
                    </Col>
                </Row>
            </Container>
        </div>
    );

};

const mapStateToProps = ( state ) => ( {
    navigationItem: state.navigation.navigationItem,
    downloadQueue: state.manageDownloading.downloadQueue,
    bufferQueue: state.manageDownloading.bufferQueue,
    unzipQueue: state.manageDownloading.unzipQueue,
    webInstallation: state.settings.webInstallation
} )

const mapDispatchToProps = ( dispatch ) => {
    return {
        setNavigationItem: ( navigationItem ) => dispatch ( setNavigationItem ( navigationItem ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( UpdateScreen );
