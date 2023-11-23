import React, { useEffect, useState } from 'react';
import { Col } from "react-bootstrap";
import Icon from "../Icon/Icon";
import { withRouter } from "react-router-dom";
import { DocumentsFolder } from "../../constants/AppData";
import { addToMailAttachments, removeFromMailAttachments } from "../../redux/actions/emailEditor";
import { connect } from "react-redux";
import MailAttachment from "../../assets/svgsymbols/mail-attachment";
import { useTranslation } from "react-i18next";
import { getTileData, lastInstallationOverHourAgo, sendToLogs, verifyIfItemInQueue } from "../../constants/functions";
import ReactMarkdown from "react-markdown";
import IconUpdating from "../../assets/svgsymbols/update";
import IconPending from "../../assets/svgsymbols/pending";
import { alert } from "react-custom-alert";
import 'react-custom-alert/dist/index.css';
import isElectron from "is-electron";
import ContentUpdated from "../../assets/svgsymbols/content_updated"; // import css file from root.
//
// let docsFolder = "//localhost:9990/"
//
// if(window.location.protocol === "file:"){
//     docsFolder = "file://" + DocumentsFolder;
// }

let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const LibraryTile = ( props ) => {
    const { t } = useTranslation ();
    const [ attachmentNotification, setAttachmentNotification ] = useState ( false );
    const tileInDownload = verifyIfItemInQueue ( props.downloadQueue, props.dataObject.tile );
    const tileInBuffer = verifyIfItemInQueue ( props.bufferQueue, props.dataObject.tile );
    const tileInUnzip = verifyIfItemInQueue ( props.unzipQueue, props.dataObject.tile );
    const [ selectedMailIcon, setSelectedMailIcon ] = useState ( props.dataObject.isEmailSelected );
    const [ emailDraft, setEmailDraft ] = useState ( false );
    // const [ selectedMailIcon, setSelectedMailIcon ] = useState( false );
    const alertPDFAttached = ( data ) => alert ( { message: data.message, type: data.type } );
    const _handleCheckClick = ( event ) => {
        event.preventDefault ();
        let itemToAttach = {}
        itemToAttach.uuid = props.dataObject.tile.uuid;
        itemToAttach.name = props.dataObject.tile.title;
        itemToAttach.id = props.dataObject.tile.id;
        itemToAttach.icon = props.dataObject.tile.ct_sortingKey.toUpperCase ();
        itemToAttach.type = props.dataObject.tile.ct_name.toLowerCase ().split ( " " ).join ( "-" );
        itemToAttach.path = DocumentsFolder + "library/" + props.dataObject.tile.route;
        checkIfSelected ( itemToAttach, itemToAttach.uuid )
    }

    const checkIfSelected = ( item, uuid ) => {
        //console.log("Tile in download ",tileInDownload);
        //console.log("Tile in unzipQueue ",tileInUnzip);
        let attachedDocs = props.mailAttachments;
        if ( attachedDocs.some( element => element.uuid === uuid ) ) {
            handleDeleteItem(uuid);
            // const logEntry = {
            //     profileId : localStorage.getItem("tokenProfile"),
            //     userId : localStorage.getItem("userEmail"),
            //     category : "email",
            //     action : "remove attachment",
            //     value : item.uuid,
            //     severity : "log",
            //     visitId : props.startedVisitId
            // }
            // sendToLogs ( logEntry, props.networkOnline  )
        } else {
            if (props.newEmail === false) {
                const createNewEmail = new Event('createNewEmailDraft');
                window.dispatchEvent ( createNewEmail );
                setEmailDraft ( true );
            }
            props.addToMailAttachments ( item )
            // const logEntry = {
            //     profileId : localStorage.getItem("tokenProfile"),
            //     userId : localStorage.getItem("userEmail"),
            //     category : "email",
            //     action : "add attachment",
            //     value : item.uuid,
            //     severity : "log",
            //     visitId : props.startedVisitId
            // }
            // sendToLogs ( logEntry, props.networkOnline  )

        }
        setAttachmentNotification ( true );
        setSelectedMailIcon ( !selectedMailIcon )
    }

    const handleDeleteItem = (  uuid ) => {
        props.removeFromMailAttachments ( uuid )
    }

    const _handleOnClick = ( event ) => {
        event.preventDefault ();
        const itemUrl = props.dataObject.tile.route
        //console.log(props.dataObject.tile)
        if ( props.dataObject.tile.route !== "#" ) {
            if ( localStorage.getItem ( "lastValidUrl" ) === null || localStorage.getItem ( "lastValidUrl" ).indexOf ( "hypeviewer" ) === -1 ) {
                let itemUrl = window.location.href;
                localStorage.setItem ( "lastValidUrl", itemUrl );
                let appOriginPathname = "library#" + "ItemsList" + "-" + props.dataObject.tile.gid + "-" + props.dataObject.tile.cid;
                localStorage.setItem ( "appOriginPathname", appOriginPathname );
                localStorage.setItem ( 'currentTileGroup', props.dataObject.tile.group_id );
                localStorage.setItem ( 'currentTileCategory', props.dataObject.tile.category_id );
            }
            const logEntry = {
                profileId: props.dataObject.tile.profile_id,
                userId: localStorage.getItem ( "userEmail" ),
                contentId: props.dataObject.tile.uuid,
                contentName: props.dataObject.tile.title,
                contentType: "document",
                category: "content",
                action: "view",
                severity: "log",
                value: "ACCESS",
                visitId: props.startedVisitId ? props.startedVisitId : "",
                parentContentId: props.dataObject.tile.parentContentId,
                businessUnitId: props.dataObject.tile.businessUnitId
            }
            if ( props.dataObject.tile.updated ) {
                const data = getTileData ( props.dataObject.tile );
                ipcRenderer.send ( "setItemAsNotNew", data )
            }
            sendToLogs ( logEntry, props.networkOnline )
            props.history.push ( "/pdfviewer/" + itemUrl );

        } else {
            window.alert ( "This tile is just a demo!" );
        }

    }

    const handleVisitsAlert = ( e ) => {
        e.preventDefault ();
        alert ( t ( 'Visit alert' ) );
    }

    useEffect ( () => {
        const lastInstallationAnHourAgo = lastInstallationOverHourAgo ( props.dataObject.tile.installationDate );
        if ( lastInstallationAnHourAgo && props.dataObject.tile.updated ) {
            const data = getTileData ( props.dataObject.tile );
            ipcRenderer.send ( "setItemAsNotNew", data );
        }
    }, [] );

    useEffect ( () => {
        if ( attachmentNotification ) {
            let data = {},
                message = "",
                type = ""
            if ( selectedMailIcon ) {
                emailDraft ? message = t ( "New email draft with document attached" ) : message = t ( "Document attached to email draft" );
                emailDraft ? type = "success" : type = "info";
            } else {
                message = t ( "Document removed from attachments" );
                type = "warning";
            }
            data.message = message;
            data.type = type;
            alertPDFAttached ( data );
            setEmailDraft ( false );
            setAttachmentNotification ( false );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ attachmentNotification ] );

    return (
        <Col xs={ { span: 5, offset: 1 } } className={ "LibraryTile" }
             id={ "itemList-" + props.dataObject.idx + "-" + props.dataObject.num }>
            { ( tileInDownload.length > 0 ) &&
                <div className="LibraryTile__Wrapper">
                    <div className={ "LibraryTile__Item--installing" }>
                        <div className={ "LibraryTile__Meta--installing" }>
                            <Icon
                                SvgSymbol={ IconUpdating }/>
                            <div className={ "LibraryTile__Title--installing" }>
                                { t ( 'Updating content' ) }
                            </div>
                        </div>
                    </div>
                    <div className={ "LibraryTile__Item" }>
                        <div className={ "LibraryTile__Meta" }>
                            <div
                                className={ "LibraryTile__Image " + props.dataObject.tile.ct_sortingKey }>{ props.dataObject.tile.ct_sortingKey.toUpperCase () }</div>
                            <div className={ "LibraryTile__Title" }>
                                <ReactMarkdown
                                    className={ "marked" }>{ props.dataObject.tile.title }</ReactMarkdown>
                            </div>
                        </div>
                        <div className={ "LibraryTile__ActionHolder" }>
                            {/* <div
                        className={ "actionButton actionButton--check" + (props.mailAttachments.some( element => element.id === props.dataObject.tile.id ) ? " selected" : "") }
                        onClick={ _handleCheckClick }
                    >
                        <Icon
                            SvgSymbol={ CircleCheck }
                        />
                    </div>*/ }
                            { props.dataObject.isEmailSelectable &&
                                <div
                                    className={ "actionButton actionButton--mail" + ( props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) ? " selected" : "" ) }
                                >
                                    {/*   { !props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) &&
                                <Icon
                                    SvgSymbol={ MailAttachment }/> }
                            { props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) && <Icon
                                SvgSymbol={ MailAttachment }/> }*/ }
                                    <Icon
                                        SvgSymbol={ MailAttachment }/>
                                </div>
                            }
                        </div>

                    </div>
                </div>
            }
            { ( tileInBuffer.length > 0 ) &&
                <div className="LibraryTile__Wrapper">
                    <div className={ "LibraryTile__Item--installing" }>
                        <div className={ "LibraryTile__Meta--installing" }>
                            <Icon
                                SvgSymbol={ IconUpdating }/>
                            <div className={ "LibraryTile__Title--installing" }>
                                { t ( 'Updating content' ) }
                            </div>
                        </div>
                    </div>
                    <div className={ "LibraryTile__Item" }>
                        <div className={ "LibraryTile__Meta" }>
                            <div
                                className={ "LibraryTile__Image " + props.dataObject.tile.ct_sortingKey }>{ props.dataObject.tile.ct_sortingKey.toUpperCase () }</div>
                            <div className={ "LibraryTile__Title" }>
                                <ReactMarkdown
                                    className={ "marked" }>{ props.dataObject.tile.title }</ReactMarkdown>
                            </div>
                        </div>
                        <div className={ "LibraryTile__ActionHolder" }>
                            {/* <div
                        className={ "actionButton actionButton--check" + (props.mailAttachments.some( element => element.id === props.dataObject.tile.id ) ? " selected" : "") }
                        onClick={ _handleCheckClick }
                    >
                        <Icon
                            SvgSymbol={ CircleCheck }
                        />
                    </div>*/ }
                            { props.dataObject.isEmailSelectable &&
                                <div
                                    className={ "actionButton actionButton--mail" + ( selectedMailIcon ? " selected" : "" ) }
                                >
                                    {/*   { !props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) &&
                                <Icon
                                    SvgSymbol={ MailAttachment }/> }
                            { props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) && <Icon
                                SvgSymbol={ MailAttachment }/> }*/ }
                                    <Icon
                                        SvgSymbol={ MailAttachment }/>
                                </div>
                            }
                        </div>

                    </div>
                </div>
            }
            { ( tileInUnzip.length > 0 ) &&
                <div className="LibraryTile__Wrapper">
                    <div className={ "LibraryTile__Item--installing" }>
                        <div className={ "LibraryTile__Meta--installing" }>
                            <Icon
                                SvgSymbol={ IconUpdating }/>
                            <div className={ "LibraryTile__Title--installing" }>
                                { t ( 'Updating content' ) }
                            </div>
                        </div>
                    </div>
                    <div className={ "LibraryTile__Item" }>
                        <div className={ "LibraryTile__Meta" }>
                            <div
                                className={ "LibraryTile__Image " + props.dataObject.tile.ct_sortingKey }>{ props.dataObject.tile.ct_sortingKey.toUpperCase () }</div>
                            <div className={ "LibraryTile__Title" }>
                                <ReactMarkdown
                                    className={ "marked" }>{ props.dataObject.tile.title }</ReactMarkdown>
                            </div>
                        </div>
                        <div className={ "LibraryTile__ActionHolder" }>
                            {/* <div
                        className={ "actionButton actionButton--check" + (props.mailAttachments.some( element => element.id === props.dataObject.tile.id ) ? " selected" : "") }
                        onClick={ _handleCheckClick }
                    >
                        <Icon
                            SvgSymbol={ CircleCheck }
                        />
                    </div>*/ }
                            { props.dataObject.isEmailSelectable &&
                                <div
                                    className={ "actionButton actionButton--mail" + ( props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) ? " selected" : "" ) }
                                >
                                    {/*   { !props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) &&
                                <Icon
                                    SvgSymbol={ MailAttachment }/> }
                            { props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) && <Icon
                                SvgSymbol={ MailAttachment }/> }*/ }
                                    <Icon
                                        SvgSymbol={ MailAttachment }/>
                                </div>
                            }
                        </div>

                    </div>
                </div>
            }
            { ( tileInDownload.length === 0 && tileInBuffer.length === 0 && tileInUnzip.length === 0 ) && ( props.dataObject.tile.status !== 'Installed' ) &&
                <div className="LibraryTile__Wrapper">
                    <div className={ "LibraryTile__Item--pending" }>
                        <div className={ "LibraryTile__Meta--pending" }>
                            <Icon
                                SvgSymbol={ IconPending }/>
                            <div className={ "LibraryTile__Title--pending" }>
                                { t ( 'Pending installation' ) }
                            </div>
                        </div>
                    </div>
                    <div className={ "LibraryTile__Item" }>
                        <div className={ "LibraryTile__Meta" }>
                            <div
                                className={ "LibraryTile__Image " + props.dataObject.tile.ct_sortingKey }>{ props.dataObject.tile.ct_sortingKey.toUpperCase () }</div>
                            <div className={ "LibraryTile__Title" }>
                                <ReactMarkdown
                                    className={ "marked" }>{ props.dataObject.tile.title }</ReactMarkdown>
                            </div>
                        </div>
                        <div className={ "LibraryTile__ActionHolder" }>
                            {/* <div
                        className={ "actionButton actionButton--check" + (props.mailAttachments.some( element => element.id === props.dataObject.tile.id ) ? " selected" : "") }
                        onClick={ _handleCheckClick }
                    >
                        <Icon
                            SvgSymbol={ CircleCheck }
                        />
                    </div>*/ }
                            { props.dataObject.isEmailSelectable &&
                                <div
                                    className={ "actionButton actionButton--mail" + ( props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) ? " selected" : "" ) }
                                >
                                    {/*   { !props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) &&
                                <Icon
                                    SvgSymbol={ MailAttachment }/> }
                            { props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) && <Icon
                                SvgSymbol={ MailAttachment }/> }*/ }
                                    <Icon
                                        SvgSymbol={ MailAttachment }/>
                                </div>
                            }
                        </div>

                    </div>
                </div>
            }
            { ( tileInDownload.length === 0 && tileInBuffer.length === 0 && tileInUnzip.length === 0 ) && ( props.dataObject.tile.status === 'Installed' ) &&
                <div className={ "LibraryTile__Item" }>
                    { props.dataObject.tile.updated && <div className={ "updated" }>
                        <Icon SvgSymbol={ ContentUpdated }/>
                    </div> }
                    <div className={ "LibraryTile__Meta" } onClick={ _handleOnClick }>
                        <div
                            className={ "LibraryTile__Image " + props.dataObject.tile.ct_sortingKey }>{ props.dataObject.tile.ct_sortingKey.toUpperCase () }</div>
                        <div className={ "LibraryTile__Title" }>
                            <ReactMarkdown
                                className={ "marked" }>{ props.dataObject.tile.title }</ReactMarkdown>
                        </div>
                    </div>
                    <div className={ "LibraryTile__ActionHolder" }>
                        {/* <div
                        className={ "actionButton actionButton--check" + (props.mailAttachments.some( element => element.id === props.dataObject.tile.id ) ? " selected" : "") }
                        onClick={ _handleCheckClick }
                    >
                        <Icon
                            SvgSymbol={ CircleCheck }
                        />
                    </div>*/ }
                    { props.dataObject.isEmailSelectable &&
                        <div
                            className={ "actionButton actionButton--mail" + ( selectedMailIcon ? " selected" : "" ) }
                            onClick={ _handleCheckClick }
                        >
                            {/*   { !props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) &&
                                <Icon
                                    SvgSymbol={ MailAttachment }/> }
                            { props.mailAttachments.some ( element => element.id === props.dataObject.tile.id ) && <Icon
                                SvgSymbol={ MailAttachment }/> }*/ }
                            <Icon
                                SvgSymbol={ MailAttachment }/>
                        </div>
                    }
                    </div>

                </div> }

        </Col>
    );
};

const mapStateToProps = ( state ) => ( {
    mailAttachments: state.emailEditor.attachments,
    downloadQueue: state.manageDownloading.downloadQueue,
    bufferQueue: state.manageDownloading.bufferQueue,
    unzipQueue: state.manageDownloading.unzipQueue,
    userEmail: state.settings.userEmail,
    userProfile: state.settings.userProfile,
    appPhase: state.settings.appPhase,
    newEmail: state.emailEditor.newEmail,
    networkOnline: state.sensors.networkAvailable,
})
const mapDispatchToProps = ( dispatch ) => {
    return {
        addToMailAttachments: ( doc ) => dispatch ( addToMailAttachments ( doc ) ),
        removeFromMailAttachments: ( uuid ) => dispatch ( removeFromMailAttachments ( uuid ) )
    }
}

export default withRouter( connect( mapStateToProps, mapDispatchToProps )( LibraryTile ) );
