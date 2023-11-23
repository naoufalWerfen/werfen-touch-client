import React, { useEffect } from 'react';
import { Col } from "react-bootstrap";
import { DocumentsFolder } from "../../constants/AppData";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import ReactMarkdown from "react-markdown";
import Icon from "../Icon/Icon";
import IconUpdating from "../../assets/svgsymbols/update";
import IconPending from "../../assets/svgsymbols/pending";
import { useTranslation } from "react-i18next";
import { getTileData, lastInstallationOverHourAgo, sendToLogs, verifyIfItemInQueue } from "../../constants/functions";
import ContentUpdated from "../../assets/svgsymbols/content_updated";
import isElectron from "is-electron";
// TODO: This images will come with their own path from Backend, revise the routing for web.
let docsFolder = "//localhost:9990/"

if ( window.location.protocol === "file:" ) {
    docsFolder = "file://" + DocumentsFolder;
}

let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;


const VisualsTile = ( props ) => {
    const { t } = useTranslation ();
    const tileInDownload = verifyIfItemInQueue ( props.downloadQueue, props.dataObject.tile );
    const tileInBuffer = verifyIfItemInQueue ( props.bufferQueue, props.dataObject.tile );
    const tileInUnzip = verifyIfItemInQueue ( props.unzipQueue, props.dataObject.tile );
    const { dataObject } = props
    const _handleOnClick = ( event ) => {
        event.preventDefault ();
        let itemUrl = props.dataObject.tile.route;
        localStorage.setItem ( "lastValidUrl", itemUrl )
        let appOriginPathname = "visuals#" + "ItemsList" + "-" + props.dataObject.tile.gid + "-" + props.dataObject.tile.cid;
        localStorage.setItem ( "appOriginPathname", appOriginPathname );
        localStorage.setItem ( 'currentTileGroup', props.dataObject.tile.group_id );
        localStorage.setItem ( 'currentTileCategory', props.dataObject.tile.category_id );
        if ( props.dataObject.tile.updated ) {
            const data = getTileData ( props.dataObject.tile );
            ipcRenderer.send ( "setItemAsNotNew", data );
        }
        const logEntry = {
            profileId: props.dataObject.tile.profile_id,
            userId: localStorage.getItem ( "userEmail" ),
            contentId: props.dataObject.tile.uuid,
            contentName: props.dataObject.tile.title,
            contentType: "presentation",
            category: "content",
            action: "view",
            severity: "log",
            visitId: props.startedVisitId ? props.startedVisitId : "",
            value: "ACCESS",
            parentContentId: props.dataObject.tile.parentContentId ? props.dataObject.tile.parentContentId : "",
            businessUnitId: props.dataObject.tile.businessUnitId ? props.dataObject.tile.businessUnitId : ""
        }

        sendToLogs ( logEntry, props.networkOnline )
        props.history.push ( "/hypeviewer/" + itemUrl );
    }

    useEffect ( () => {

        const lastInstallationAnHourAgo = lastInstallationOverHourAgo ( props.dataObject.tile.installationDate );
        if ( lastInstallationAnHourAgo && props.dataObject.tile.updated ) {
            const data = getTileData ( props.dataObject.tile );
            ipcRenderer.send ( "setItemAsNotNew", data );
        }
    }, [] );

    return (

        <>
            { ( tileInDownload.length > 0 ) &&
                <Col xs={ 4 }
                     className={ "VisualsTile" }
                     id={ "itemList-" + dataObject.idx + "-" + dataObject.num + "-" + dataObject.tile.id }
                >
                    <div className={ "VisualsTile__Wrapper--installing" }>
                        <Icon
                            SvgSymbol={ IconUpdating }/>
                        <div
                            className={ "VisualsTile__Title--installing" }>
                            { t ( 'Updating content' ) }
                        </div>
                    </div>
                    <div className={ "VisualsTile__Wrapper" }>
                        <div className={ "VisualsTile__Image" }>
                            <img src={ docsFolder + "image/" + dataObject.pathToImage + "/cover.jpg" } alt="Cover"/>
                        </div>
                        <div
                            className={ "VisualsTile__Title title-generic" }>
                            <ReactMarkdown
                                className={ "marked" }>{ dataObject.tile.title }</ReactMarkdown>
                        </div>
                    </div>
                </Col> }
            { ( tileInBuffer.length > 0 ) &&
                <Col xs={ 4 }
                     className={ "VisualsTile" }
                     id={ "itemList-" + dataObject.idx + "-" + dataObject.num }
                >
                    <div className={ "VisualsTile__Wrapper--installing" }>
                        <Icon
                            SvgSymbol={ IconUpdating }/>
                        <div
                            className={ "VisualsTile__Title--installing" }>
                            { t ( 'Updating content' ) }
                        </div>
                    </div>
                    <div className={ "VisualsTile__Wrapper" }>
                        <div className={ "VisualsTile__Image" }>
                            <img src={ docsFolder + "image/" + dataObject.pathToImage + "/cover.jpg" } alt="Cover"/>
                        </div>
                        <div
                            className={ "VisualsTile__Title title-generic" }>
                            <ReactMarkdown
                                className={ "marked" }>{ dataObject.tile.title }</ReactMarkdown>
                        </div>
                    </div>
                </Col> }
            { ( tileInUnzip.length > 0 ) &&
                <Col xs={ 4 }
                     className={ "VisualsTile" }
                     id={ "itemList-" + dataObject.idx + "-" + dataObject.num }
                >
                    <div className={ "VisualsTile__Wrapper--installing" }>
                        <Icon
                            SvgSymbol={ IconUpdating }/>
                        <div
                            className={ "VisualsTile__Title--installing" }>
                            { t ( 'Updating content' ) }
                        </div>
                    </div>
                    <div className={ "VisualsTile__Wrapper" }>
                        <div className={ "VisualsTile__Image" }>
                            <img src={ docsFolder + "image/" + dataObject.pathToImage + "/cover.jpg" } alt="Cover"/>
                        </div>
                        <div
                            className={ "VisualsTile__Title title-generic" }>
                            <ReactMarkdown
                                className={ "marked" }>{ dataObject.tile.title }</ReactMarkdown>
                        </div>
                    </div>
                </Col> }
            { ( tileInDownload.length === 0 && tileInBuffer.length === 0 && tileInUnzip.length === 0 ) && ( dataObject.tile.status === 'Installed' ) &&
                <Col xs={ 4 }
                     className={ "VisualsTile" }
                     id={ "itemList-" + dataObject.idx + "-" + dataObject.num + "-" + dataObject.tile.id }
                     onClick={ _handleOnClick }>
                    <div className={ "VisualsTile__Wrapper" }>
                        { dataObject.tile.updated && <div className={ "updated" }>
                            <Icon SvgSymbol={ ContentUpdated }/>
                        </div> }
                        <div className={ "VisualsTile__Image" }>
                            <img src={ docsFolder + "image/" + dataObject.pathToImage + "/cover.jpg" } alt="Cover"/>
                        </div>
                        <div
                            className={ "VisualsTile__Title title-generic" }>
                            <ReactMarkdown
                                className={ "marked" }>{ dataObject.tile.title }</ReactMarkdown>
                        </div>
                    </div>
                </Col> }
            { ( tileInDownload.length === 0 && tileInBuffer.length === 0 && tileInUnzip.length === 0 ) && ( dataObject.tile.status !== 'Installed' ) &&

                <Col xs={ 4 }
                     className={ "VisualsTile" }
                     id={ "itemList-" + dataObject.idx + "-" + dataObject.num }
                >
                    <div className={ "VisualsTile__Wrapper--pending" }>
                        <Icon
                            SvgSymbol={ IconPending }/>
                        <div
                            className={ "VisualsTile__Title--pending" }>
                            { t ( 'Pending installation' ) }
                        </div>
                    </div>
                    <div className={ "VisualsTile__Wrapper" }>
                        <div className={ "VisualsTile__Image" }>
                            <img src={ docsFolder + "image/" + dataObject.pathToImage + "/cover.jpg" } alt="Cover"/>
                        </div>
                        <div
                            className={ "VisualsTile__Title title-generic" }>
                            <ReactMarkdown
                                className={ "marked" }>{ dataObject.tile.title }</ReactMarkdown>
                        </div>
                    </div>
                </Col> }
        </>
    )
};

const mapStateToProps = ( state ) => ( {
    downloadQueue: state.manageDownloading.downloadQueue,
    bufferQueue: state.manageDownloading.bufferQueue,
    unzipQueue: state.manageDownloading.unzipQueue,
    userEmail: state.settings.userEmail,
    userProfile: state.settings.userProfile,
    appPhase: state.settings.appPhase,
    networkOnline: state.sensors.networkAvailable
} )


export default withRouter ( connect ( mapStateToProps, {} ) ( VisualsTile ) );
