import React, { useEffect, useState } from 'react';
import { Col } from "react-bootstrap";
import Icon from "../Icon/Icon";
import { withRouter } from "react-router-dom";
import { DocumentsFolder } from "../../constants/AppData";
import { addToAttachments, removeFromAttachments } from "../../redux/actions/visitEditor";
import { addToMailAttachments, removeFromMailAttachments } from "../../redux/actions/emailEditor";
import { connect } from "react-redux";
import CheckIcon from "../../assets/svgsymbols/check-circle";
import CircleIcon from "../../assets/svgsymbols/circle";
import MailAttachment from "../../assets/svgsymbols/mail-attachment";
import ContentUpdated from "../../assets/svgsymbols/content_updated";
import { useTranslation } from "react-i18next";
import { setInsideViewer } from "../../redux/actions/navigation";
import { getTileData, lastInstallationOverHourAgo, sendToLogs, verifyIfItemInQueue } from "../../constants/functions";
import ReactMarkdown from "react-markdown";
import IconUpdating from "../../assets/svgsymbols/update";
import IconPending from "../../assets/svgsymbols/pending";
import { alert } from "react-custom-alert";
import 'react-custom-alert/dist/index.css';
import isElectron from "is-electron"; // import css file from root.
let electron;
if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;


const SearchTile = ( props ) => {
    const { t } = useTranslation ();
    const tileInDownload = verifyIfItemInQueue ( props.downloadQueue, props.dataObject.tile );
    const tileInBuffer = verifyIfItemInQueue ( props.bufferQueue, props.dataObject.tile );
    const tileInUnzip = verifyIfItemInQueue ( props.unzipQueue, props.dataObject.tile );
    const [ selectedMailIcon, setSelectedMailIcon ] = useState ( props.dataObject.isEmailSelected );
    const itemsExcludedFromSending = [ "pr", "calc", "mp", "d", "vd" ];
    const [ attachmentNotification, setAttachmentNotification ] = useState ( false );
    const [ emailDraft, setEmailDraft ] = useState ( false );
    const [ checkSelected, setCheckSelected ] = useState ( props.dataObject.isVisitSelected );
    const emails = "emails",
        visits = "visits";
    const alertPDFAttached = ( data ) => alert ( { message: data.message, type: data.type } );

    const _handleCheckClick = ( e, destiny ) => {
        e.preventDefault ();
        let itemToAttach = {}
        itemToAttach.uuid = props.dataObject.tile.uuid;
        itemToAttach.name = props.dataObject.tile.title;
        itemToAttach.id = props.dataObject.tile.id;
        itemToAttach.gid = props.dataObject.tile.gid;
        itemToAttach.icon = props.dataObject.tile.ct_sortingKey.toUpperCase ();
        itemToAttach.type = props.dataObject.tile.ct_name.toLowerCase ().split ( " " ).join ( "-" );
        itemToAttach.path = DocumentsFolder + "search/" + props.dataObject.tile.route;
        checkIfSelected ( itemToAttach, itemToAttach.uuid, destiny )
    }


    const _handleToggleUpdate = ( e, destiny ) => {
        e.preventDefault ();
        let itemToAttach = {}
        itemToAttach.uuid = props.dataObject.tile.uuid;
        itemToAttach.name = props.dataObject.tile.title;
        itemToAttach.id = props.dataObject.tile.id;
        itemToAttach.gid = props.dataObject.tile.gid;
        itemToAttach.icon = props.dataObject.tile.ct_sortingKey.toUpperCase ();
        itemToAttach.type = props.dataObject.tile.ct_name.toLowerCase ().split ( " " ).join ( "-" );
        itemToAttach.path = DocumentsFolder + "search/" + props.dataObject.tile.route;
        checkIfSelected ( itemToAttach, itemToAttach.uuid, destiny )

    }

    const checkIfSelected = ( item, uuid, destiny ) => {

        if ( destiny === "visits" ) {
            let attachedDocs = props.attachments
            if ( attachedDocs.filter ( element => element.uuid === uuid ).length === 1 ) {
                props.removeFromAttachments ( item.uuid )
                // const logEntry = {
                //     profileId : localStorage.getItem("tokenProfile"),
                //     userId : localStorage.getItem("userEmail"),
                //     category : "visit",
                //     action : "detach",
                //     value : item.uuid,
                //     severity : "log",
                //     visitId : props.startedVisitId
                // }
                // sendToLogs ( logEntry,  props.networkOnline )
            } else {
                if ( props.newEmail === false && props.appPhase !== "visitActive" ) {
                    const createNewVisit = new Event ( 'createNewVisitDraft' );
                    window.dispatchEvent ( createNewVisit );
                }
                props.addToAttachments ( item )
                // const logEntry = {
                //     profileId : localStorage.getItem("tokenProfile"),
                //     userId : localStorage.getItem("userEmail"),
                //     category : "visit",
                //     action : "attach",
                //     value : item.uuid,
                //     severity : "log",
                //     visitId : props.startedVisitId
                // }
                // sendToLogs ( logEntry,  props.networkOnline )
            }
            setCheckSelected ( !checkSelected )
        } else if ( destiny === "emails" ) {
            let attachedDocs = props.mailAttachments;
            if ( attachedDocs.some( element => element.uuid === uuid ) ) {
                handleDeleteItem(uuid)
                // const logEntry = {
                //     profileId : localStorage.getItem("tokenProfile"),
                //     userId : localStorage.getItem("userEmail"),
                //     category : "email",
                //     action : "remove attachment",
                //     value : item.uuid,
                //     severity : "log",
                //     visitId : props.startedVisitId
                // }
                // sendToLogs ( logEntry,  props.networkOnline )
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
                // sendToLogs ( logEntry,  props.networkOnline )
            }
            setSelectedMailIcon ( !selectedMailIcon )
            setAttachmentNotification ( true )
        }
    }

    const handleDeleteItem = (  uuid ) => {
        props.removeFromMailAttachments ( uuid )
    }

   /* const handleAlertNotSendable = ( e ) => {
        e.preventDefault ();
        alert ( t ( "Content not sendable by mail" ) );
    }

    const handleVisitsAlert = ( e ) => {
        e.preventDefault ();
        alert ( t ( "Visit alert" ) );
    }
    const handleEmailsAlert = ( e ) => {
        e.preventDefault ();
        alert ( t ( "Email alert" ) );
    }*/

    const handleSettingAppOriginPathname = () => {
        let appOriginPathname
        switch ( props.navigationItem.toString () ) {
            case "0":
                appOriginPathname = "all#" + "ItemsList" + "-" + props.dataObject.tile.gid + "-" + props.dataObject.tile.cid;
                break;
            case "1":
                appOriginPathname = "visitsearch#" + "ItemsList" + "-" + props.dataObject.tile.gid + "-" + props.dataObject.tile.cid;
                break;
            default:
                break;
        }
        return appOriginPathname;
    }

    const _handleOnClick = ( event ) => {
        event.preventDefault ();

            localStorage.setItem ( 'currentTileGroup', props.dataObject.tile.group_id );
            localStorage.setItem ( 'currentTileCategory', props.dataObject.tile.category_id );
            if ( ( localStorage.getItem ( "lastValidUrl" ) === null ) || ( localStorage.getItem ( "lastValidUrl" ).indexOf ( "hypeviewer" ) === -1 ) ) {

                let itemUrl = window.location.href;
                localStorage.setItem ( "lastValidUrl", itemUrl );
                let appOriginPathname = ""
                if ( props.appPhase === "readyToUse" ) {
                    appOriginPathname = "search#" + "ItemsList" + "-" + props.dataObject.tile.gid + "-" + props.dataObject.tile.cid;
                }
                if ( props.appPhase === "visitActive" ) {
                    appOriginPathname = handleSettingAppOriginPathname ();
                }
                localStorage.setItem ( "appOriginPathname", appOriginPathname );
            }
        let itemUrl = props.dataObject.tile.route;
        let logEntry = {
            profileId: props.dataObject.tile.profile_id,
            userId: localStorage.getItem ( "userEmail" ),
            contentId: props.dataObject.tile.uuid,
            contentName: props.dataObject.tile.title,
            contentType: "presentation",
            category: "content",
            action: "view",
            value: "ACCESS",
            severity: "log",
            visitId: props.startedVisitId ? props.startedVisitId : "",
            parentContentId: props.dataObject.tile.parentContentId,
            businessUnitId: props.dataObject.tile.businessUnitId
        };
        let navRoute = "";
        switch ( true ) {
            case ( ( props.dataObject.tile.type === "visuals" ) && ( props.dataObject.tile.ct_sortingKey !== "calc" ) ):
                navRoute = "/hypeviewer/" + itemUrl;
                break;
            case ( ( props.dataObject.tile.type === "visuals" ) && ( props.dataObject.tile.ct_sortingKey === "calc" ) ):
                navRoute = "/hypeviewer/" + itemUrl;
                localStorage.setItem ( 'calcUuid', props.dataObject.tile.uuid );
                break;
            case ( props.dataObject.tile.type === "library" ):
                logEntry.contentType = "document";
                navRoute = "/pdfviewer/" + itemUrl;
                break;
            default:
                break;
        }
        props.history.push ( navRoute );
        sendToLogs ( logEntry, props.networkOnline );
        props.setInsideViewer ( true );
        if ( props.dataObject.tile.updated ) {
            const data = getTileData ( props.dataObject.tile );
            ipcRenderer.send ( "setItemAsNotNew", data )
        }
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
            setAttachmentNotification ( false );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ attachmentNotification ] );
    return (
        <Col xs={ { span: 5, offset: 1 } } className={ "SearchTile" }
             id={ "itemList-" + props.dataObject.idx + "-" + props.dataObject.num }>
            { ( tileInDownload.length > 0 ) &&
                <div className="SearchTile__Wrapper">
                    <div className={ "SearchTile__Item--installing" }>
                        <div className={ "SearchTile__Meta--installing" }>
                            <Icon
                                SvgSymbol={ IconUpdating }/>
                            <div className={ "SearchTile__Title--installing" }>
                                { t ( 'Updating content' ) }
                            </div>
                        </div>
                    </div>
                    <div className={ "SearchTile__Item" }>
                        <div className={ "SearchTile__Meta" }>
                            <div
                                className={ "SearchTile__Image " + props.dataObject.tile.ct_sortingKey }>{ props.dataObject.tile.ct_sortingKey.toUpperCase () }</div>
                            <div className={ "SearchTile__Title" }>
                                <ReactMarkdown
                                    className={ "marked" }>{ props.dataObject.tile.title }</ReactMarkdown>

                            </div>
                        </div>
                        <div className={ "SearchTile__ActionHolder" }>
                            { ( !itemsExcludedFromSending.includes ( props.dataObject.tile.ct_sortingKey ) && props.dataObject.isEmailSelectable ) &&
                                <div
                                    className={ "actionButton actionButton--mail" + ( selectedMailIcon ? " selected" : "" ) }
                                >
                                    <Icon
                                        SvgSymbol={ MailAttachment }/>
                                </div> }
                            { ( props.dataObject.isVisitSelectable === true && props.dataObject.tile.visible === 1 && props.dataObject.tile.type === "visuals" ) &&
                                <div
                                    className={ "actionButton actionButton--check" + ( checkSelected ? " selected" : "" ) }
                                    /*onClick={ ( e ) =>
                                        _handleCheckClick ( e, visits )
                                    }*/
                                >
                                    {/* { checkSelected ? <Icon
                                SvgSymbol={ CheckIcon }/> :
                            <Icon
                                SvgSymbol={ CircleIcon }/> }*/ }
                                </div> }
                        </div>
                    </div>
                </div>
            }
            { ( tileInBuffer.length > 0 ) &&
                <div className="SearchTile__Wrapper">
                    <div className={ "SearchTile__Item--installing" }>
                        <div className={ "SearchTile__Meta--installing" }>
                            <Icon
                                SvgSymbol={ IconUpdating }/>
                            <div className={ "SearchTile__Title--installing" }>
                                { t ( 'Updating content' ) }
                            </div>
                        </div>
                    </div>
                    <div className={ "SearchTile__Item" }>
                        <div className={ "SearchTile__Meta" }>
                            <div
                                className={ "SearchTile__Image " + props.dataObject.tile.ct_sortingKey }>{ props.dataObject.tile.ct_sortingKey.toUpperCase () }</div>
                            <div className={ "SearchTile__Title" }>
                                <ReactMarkdown
                                    className={ "marked" }>{ props.dataObject.tile.title }</ReactMarkdown>

                            </div>
                        </div>
                        <div className={ "SearchTile__ActionHolder" }>
                            { ( !itemsExcludedFromSending.includes ( props.dataObject.tile.ct_sortingKey ) && props.dataObject.isEmailSelectable ) &&
                                <div
                                    className={ "actionButton actionButton--mail" + ( selectedMailIcon ? " selected" : "" ) }
                                >
                                    <Icon
                                        SvgSymbol={ MailAttachment }/>
                                </div> }
                            { ( props.dataObject.isVisitSelectable === true && props.dataObject.tile.visible === 1 && props.dataObject.tile.type === "visuals" ) &&
                                <div
                                    className={ "actionButton actionButton--check" + ( checkSelected ? " selected" : "" ) }
                                    /*onClick={ ( e ) =>
                                        _handleCheckClick ( e, visits )
                                    }*/
                                >
                                    {/* { checkSelected ? <Icon
                                SvgSymbol={ CheckIcon }/> :
                            <Icon
                                SvgSymbol={ CircleIcon }/> }*/ }
                                </div> }
                        </div>
                    </div>
                </div>
            }
            { ( tileInUnzip.length > 0 ) &&
                <div className="SearchTile__Wrapper">
                    <div className={ "SearchTile__Item--installing" }>
                        <div className={ "SearchTile__Meta--installing" }>
                            <Icon
                                SvgSymbol={ IconUpdating }/>
                            <div className={ "SearchTile__Title--installing" }>
                                { t ( 'Updating content' ) }
                            </div>
                        </div>
                    </div>
                    <div className={ "SearchTile__Item" }>
                        <div className={ "SearchTile__Meta" }>
                            <div
                                className={ "SearchTile__Image " + props.dataObject.tile.ct_sortingKey }>{ props.dataObject.tile.ct_sortingKey.toUpperCase () }</div>
                            <div className={ "SearchTile__Title" }>
                                <ReactMarkdown
                                    className={ "marked" }>{ props.dataObject.tile.title }</ReactMarkdown>

                            </div>
                        </div>
                        <div className={ "SearchTile__ActionHolder" }>
                            { ( !itemsExcludedFromSending.includes ( props.dataObject.tile.ct_sortingKey ) && props.dataObject.isEmailSelectable ) &&
                                <div
                                    className={ "actionButton actionButton--mail" + ( selectedMailIcon ? " selected" : "" ) }
                                >
                                    <Icon
                                        SvgSymbol={ MailAttachment }/>
                                </div> }
                            { ( props.dataObject.isVisitSelectable === true && props.dataObject.tile.visible === 1 && props.dataObject.tile.type === "visuals" ) &&
                                <div
                                    className={ "actionButton actionButton--check" + ( checkSelected ? " selected" : "" ) }
                                    /*onClick={ ( e ) =>
                                        _handleCheckClick ( e, visits )
                                    }*/
                                >
                                    {/* { checkSelected ? <Icon
                                SvgSymbol={ CheckIcon }/> :
                            <Icon
                                SvgSymbol={ CircleIcon }/> }*/ }
                                </div> }
                        </div>
                    </div>
                </div>
            }
            { ( tileInDownload.length === 0 && tileInBuffer.length === 0 && tileInUnzip.length === 0 && props.appPhase === "readyToUse" ) && ( props.dataObject.tile.status !== 'Installed' ) &&
                <div className={ "SearchTile__Wrapper" }>
                    <div className={ "SearchTile__Item--pending" }>
                        <div className={ "SearchTile__Meta--pending" }>
                            <Icon
                                SvgSymbol={ IconPending }/>
                            <div className={ "SearchTile__Title--pending" }>
                                { t ( 'Pending installation' ) }
                            </div>
                        </div>
                    </div>
                    <div className={ "SearchTile__Item" }>
                        <div className={ "SearchTile__Meta" }>
                            <div
                                className={ "SearchTile__Image " + props.dataObject.tile.ct_sortingKey }>{ props.dataObject.tile.ct_sortingKey.toUpperCase () }</div>
                            <div className={ "SearchTile__Title" }>
                                <ReactMarkdown
                                    className={ "marked" }>{ props.dataObject.tile.title }</ReactMarkdown>

                            </div>
                        </div>
                        <div className={ "SearchTile__ActionHolder" }>
                            { ( !itemsExcludedFromSending.includes ( props.dataObject.tile.ct_sortingKey ) && props.dataObject.isEmailSelectable ) &&
                                <div
                                    className={ "actionButton actionButton--mail" + ( selectedMailIcon ? " selected" : "" ) }
                                >
                                    <Icon
                                        SvgSymbol={ MailAttachment }/>
                                </div> }
                            { ( props.dataObject.isVisitSelectable === true && props.dataObject.tile.visible === 1 && props.dataObject.tile.type === "visuals" ) &&
                                <div
                                    className={ "actionButton actionButton--check" + ( checkSelected ? " selected" : "" ) }
                                    /*onClick={ ( e ) =>
                                        _handleCheckClick ( e, visits )
                                    }*/
                                >
                                    {/* { checkSelected ? <Icon
                                SvgSymbol={ CheckIcon }/> :
                            <Icon
                                SvgSymbol={ CircleIcon }/> }*/ }
                                </div> }
                        </div>
                    </div>
                </div> }
            { ( tileInDownload.length === 0 && tileInBuffer.length === 0 && tileInUnzip.length === 0 && props.appPhase === "readyToUse" ) && ( props.dataObject.tile.status === 'Installed' ) &&
                <div className={ "SearchTile__Item" }>
                    { props.dataObject.tile.updated && <div className={ "updated" }>
                        <Icon SvgSymbol={ ContentUpdated }/>
                    </div> }
                    <div className={ "SearchTile__Meta" } onClick={ _handleOnClick }>
                        <div
                            className={ "SearchTile__Image " + props.dataObject.tile.ct_sortingKey }>{ props.dataObject.tile.ct_sortingKey.toUpperCase () }</div>
                        <div className={ "SearchTile__Title" }>
                            <ReactMarkdown
                                className={ "marked" }>{ props.dataObject.tile.title }</ReactMarkdown>

                        </div>
                    </div>
                    <div className={ "SearchTile__ActionHolder" }>
                        { ( !itemsExcludedFromSending.includes ( props.dataObject.tile.ct_sortingKey ) && props.dataObject.isEmailSelectable ) &&
                            <div
                                className={ "actionButton actionButton--mail" + ( selectedMailIcon ? " selected" : "" ) }
                                onClick={ ( e ) =>
                                    _handleCheckClick ( e, emails )
                                }
                            >
                                <Icon
                                    SvgSymbol={ MailAttachment }/>
                            </div> }
                        { ( props.dataObject.isVisitSelectable === true && props.dataObject.tile.visible === 1 && props.dataObject.tile.type === "visuals" ) &&
                            <div
                                className={ "actionButton actionButton--check" + ( checkSelected ? " selected" : "" ) }
                                /*onClick={ ( e ) =>
                                    _handleCheckClick ( e, visits )
                                }*/
                            >
                                {/* { checkSelected ? <Icon
                                SvgSymbol={ CheckIcon }/> :
                            <Icon
                                SvgSymbol={ CircleIcon }/> }*/ }
                            </div> }
                    </div>
                </div> }
            { ( tileInDownload.length === 0 && tileInBuffer.length === 0 && tileInUnzip.length === 0 && props.appPhase === "visitActive" ) &&
                <div className={ "SearchTile__Item" }>
                    <div className={ "SearchTile__Meta" } onClick={ _handleOnClick }>
                        <div
                            className={ "SearchTile__Image " + props.dataObject.tile.ct_sortingKey }>{ props.dataObject.tile.ct_sortingKey.toUpperCase () }</div>
                        <div className={ "SearchTile__Title" }>
                            { props.dataObject.tile.title.includes ( "*" ) ? <ReactMarkdown
                                className={ "marked" }>{ props.dataObject.tile.title }</ReactMarkdown> : <> { props.dataObject.tile.title }</> }

                        </div>
                    </div>
                <div className={ "SearchTile__ActionHolder" }>
                    <div
                        className={ "actionButton actionButton--check" + ( checkSelected ? " selected" : "" ) }
                        onClick={ ( e ) =>
                            _handleToggleUpdate ( e, visits )
                        }
                    >
                        { checkSelected ? <Icon
                                SvgSymbol={ CheckIcon }/> :
                            <Icon
                                SvgSymbol={ CircleIcon }/> }
                    </div>
                </div>
            </div> }
        </Col>
    );
};

const mapStateToProps = ( state ) => ( {
    attachments: state.visitEditor.attachments,
    mailAttachments: state.emailEditor.attachments,
    downloadQueue: state.manageDownloading.downloadQueue,
    bufferQueue: state.manageDownloading.bufferQueue,
    unzipQueue: state.manageDownloading.unzipQueue,
    userEmail: state.settings.userEmail,
    userProfile: state.settings.userProfile,
    appPhase: state.settings.appPhase,
    newEmail: state.emailEditor.newEmail,
    navigationItem: state.navigation.navigationItem,
    networkOnline: state.sensors.networkAvailable
} )
const mapDispatchToProps = ( dispatch ) => {
    return {
        addToAttachments: ( doc ) => dispatch ( addToAttachments ( doc ) ),
        removeFromAttachments: ( uuid ) => dispatch ( removeFromAttachments ( uuid ) ),
        addToMailAttachments: ( doc ) => dispatch ( addToMailAttachments ( doc ) ),
        removeFromMailAttachments: ( uuid ) => dispatch ( removeFromMailAttachments ( uuid ) ),
        setInsideViewer: ( insideViewer ) => dispatch ( setInsideViewer ( insideViewer ) )
    }
}

export default withRouter( connect( mapStateToProps, mapDispatchToProps )( SearchTile ) );
