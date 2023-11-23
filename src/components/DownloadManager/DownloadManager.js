import React, { useEffect, useState } from 'react';
import { Col, Row } from "react-bootstrap";
import './DownloadManager.scss';
import { connect } from "react-redux";
import {
    addAllSelectedQueue,
    addAllUpdatesPending,
    addSelectedQueue,
    deleteAllFromSelectedQueue,
    deleteFromSelectedQueue
} from "../../redux/actions/manageDownloading";
import isElectron from "is-electron";
import { useTranslation } from 'react-i18next';
import Icon from "../Icon/Icon";
import Book from "../../assets/svgsymbols/book";
import Layout from "../../assets/svgsymbols/layout";
import Image from "../../assets/svgsymbols/image";
import IconError from "../../assets/svgsymbols/x-octagon";
import IconEmailSent from "../../assets/svgsymbols/circle-check";
import IconPending from "../../assets/svgsymbols/pending";
import IconEdit from "../../assets/svgsymbols/edit";
import IconClock from "../../assets/svgsymbols/clock";
import IconDownload from "../../assets/svgsymbols/download";
import Loader from "../Loader/Loader";
import ReactMarkdown from "react-markdown";

let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;


const DownloadManager = ( props ) => {
    const { t } = useTranslation ();
    const [ searchValue, setSearchValue ] = useState ( props.searchValue );
    const [ packagesData, setPackagesData ] = useState ( [] );
    const [ installable, setInstallable ] = useState ( [] );
    const installableStatuses = [ "Postponed", "Pending" ];
    const currentProfile = localStorage.getItem("tokenProfile")


    useEffect ( () => {
        ipcRenderer.send ( 'queryForPackages', currentProfile );
        ipcRenderer.on ( 'gotPackagesList', processPackagesList );
        ipcRenderer.on ( 'updateDMView', updateDMView );
        return () => {
            ipcRenderer.off ( 'gotPackagesList', processPackagesList );
            ipcRenderer.off ( 'updateDMView', updateDMView );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] )

    const handleOnSelectAll = ( event ) => {
        event.stopPropagation ();

        if ( props.selectedQueue.length !== 0 ) {
            props.deleteAllFromSelected ();
        } else {
            props.addToSelected ( installable );
        }
    }
    const updateDMView = ( event, uuid ) => {
        props.deleteFromSelected ( [ uuid ] )
    }

    useEffect ( () => {
        const selectAllCheckbox = document.getElementById ( "toggleSelectAll" )

        if ( selectAllCheckbox !== null ) {
            if ( installable.length !== props.selectedQueue.length ) {
                selectAllCheckbox.indeterminate = true;
            } else {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            }
            if ( props.selectedQueue.length === 0 ) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = false;

            }
        }
        ipcRenderer.send ( 'queryForPackages', currentProfile );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.selectedQueue ] );



    const handleSelectedRow = ( event ) => {
        const { value, checked } = event.target;
        /*  if ( checked ) {
              let objectToSend = {
                  status: "Pending",
                  value
              }
              props.addToSelected ( [ value ] );
              ipcRenderer.send ( "updateStatusToPending", objectToSend )
          } else {
              let objectToSend = {
                  status: "Postponed",
                  value
              }
              props.deleteFromSelected ( [ value ] )
              ipcRenderer.send ( "restoreStatusToPostponed", objectToSend )
          }*/
    }
    /*/
        const handleInstall = () => {
            if ( props.networkOnline === false ) {
                alert ( t ( "App offline on install" ) )
            } else {
                const selectedUpdatesQueue = packagesData.filter ( item => props.selectedQueue.includes ( item.uuid ) );
                ipcRenderer.send ( 'installSelectedUpdates', selectedUpdatesQueue )
            }
        }
    */

    const processPackagesList = ( event, data ) => {
        const clonedData = data.map ( ( item ) => Object.assign ( {}, item ) )
        // const clonedData = Object.assign ( {}, data );
        const updates = data
            .filter ( item => installableStatuses.includes ( item.status ) )

        const preparedData = clonedData
            .map ( ( item ) => {
                item.installation_date = new Date ( item.installation_date ).toLocaleString ()
                return item;
            } )
        setPackagesData ( preparedData );
        setInstallable ( updates );
        props.addToUpdates ( updates );
    }

    const parseDownloadStatusMessage = ( status ) => {
        let statusMessage;
        switch ( status ) {

            case "Download_Error":
                statusMessage = "Error";
                break
            case "Installing":
            case"Installing_on_Download_Error":
                statusMessage = "Installing"
                break
            case "Installed":
                statusMessage = "Installed"
                break
            case "Updated":
                statusMessage = "Updated";
                break
            case "Pending":
            case "Reinstall":
                statusMessage = "Pending"
            case "Postponed":
                statusMessage = "Postoponed"
                break
        }
        return statusMessage
    }

    const parseDownloadIcon = ( status ) => {
        let statusIcon;
        switch ( status ) {
            case "Download_Error":
                statusIcon = IconError;
                break
            case "Installing":
            case"Installing_on_Download_Error":
                statusIcon = IconDownload
                break
            case "Installed":
                statusIcon = IconEmailSent
                break
            case "Updated":
                statusIcon = IconEdit;
                break
            case "Pending":
            case "Reinstall":
                statusIcon = IconPending
            case "Postponed":
                statusIcon = IconClock
                break
        }
        return statusIcon;
    }

    const setContentIcon = ( classification ) => {
        let iconToReturn;
        switch ( classification ) {
            case "library":
                iconToReturn = Book;
                break
            case "image":
                iconToReturn = Image;
                break
            case "visuals":
                iconToReturn = Layout;
                break
        }
        return iconToReturn;
    }

    // TODO: Figure out how to mark failed row with different color on failure
    return (
        <div className="DownloadManager">
            <Row>
                <Col xs={ 12 } className="DownloadManager__Header">
                    <span className="DownloadManager__Header--title">
                        { t ( "Download Manager" ) }
                    </span>
                </Col>
            </Row>
            <Row className="DownloadManager__Menu">
                <Col xs={ 12 } className={ "filters text-left" }>
                    {/*<FormGroup id="formSearchValue">*/}
                    {/*    <div className={ "filter text-filter search-field" }>*/}
                    {/*        <Form.Label className="text-muted">*/}
                    {/*            { t ( "Search title" ) }*/}
                    {/*            <Form.Control*/}
                    {/*                type="text"*/}
                    {/*                name="searchQuery"*/}
                    {/*                value={ searchValue }*/}
                    {/*                className="text-primary search-text"*/}
                    {/*                onChange={ handleSearchQueryChange }*/}
                    {/*                placeholder={ t ( "Search placeholder" ) }*/}
                    {/*                onKeyDown={ handleKeyDown }*/}
                    {/*            />*/}
                    {/*        </Form.Label>*/}
                    {/*    </div>*/}
                    {/*    <div className="filter type-filter type-select">*/}
                    {/*        <Form.Label className="text-muted">*/}
                    {/*            <span>{ t ( "Filter content" ) }</span>*/}
                    {/*            <Form.Control*/}
                    {/*                as="select"*/}
                    {/*                name="searchType"*/}
                    {/*                onChange={ handleSearchQueryChange }*/}
                    {/*                value={ props.contentType }*/}
                    {/*            >*/}
                    {/*                {*/}
                    {/*                    contentTypes.map ( ( contentType, index ) => {*/}
                    {/*                        return (*/}
                    {/*                            <option key={ index } value={ contentType.key }*/}
                    {/*                            >*/}
                    {/*                                { contentType.value }*/}
                    {/*                            </option>*/}
                    {/*                        )*/}
                    {/*                    } )*/}
                    {/*                }*/}
                    {/*            </Form.Control>*/}
                    {/*        </Form.Label>*/}
                    {/*    </div>*/}
                    {/*    <div className="Search__Buttons action-buttons">*/ }
                    {/*        <Button onClick={ handleClearSearch }*/ }
                    {/*                className="Search__Clear">{ t ( "Clear" ) }</Button>*/ }
                    {/*    </div>*/ }
                    {/*</FormGroup>*/ }
                </Col>
                <Col xs={ 12 } className={ "bulk_actions text-left" }>
                    { props.updatesPending.length === 0 &&
                        <div className="noPendingUpdates">
                            <span>{ t ( "No pending updates to install at the moment" ) }</span>
                        </div> }
                    {/*    props.updatesPending.length !== 0 && }<>*/ }
                    {/*        <div*/ }
                    {/*            className="toggleSelectAll"*/ }
                    {/*            <label>*/ }
                    {/*                <input*/ }
                    {/*                    id="toggleSelectAll"*/ }
                    {/*                    type="checkbox"*/ }
                    {/*                    onClick={ event => handleOnSelectAll ( event ) }*/ }
                    {/*                />*/ }
                    {/*                <span>{ t ( "Toggle select/unselect all" ) }</span>*/ }
                    {/*            </label>*/ }
                    {/*        </div>*/ }
                    {/*        <Button*/ }
                    {/*            className={ "DownloadManager__Button button-generic" }*/ }
                    {/*            onClick={ () => handleInstall () }*/ }
                    {/*            disabled={ props.selectedQueue.length === 0 }*/ }
                    {/*        >*/ }
                    {/*            Install { props.selectedQueue.length } packages*/ }
                    {/*        </Button>*/ }
                    {/*    </>*/ }
                </Col>
            </Row>
            <Row>
                <Col xs={ 12 }
                     className={ "DownloadManager__Table" }>
                    <div className={ ( packagesData.length === 0 ? "loader-inside" : "" ) + " DownloadManager__Table--list" }>
                        {
                            packagesData.length === 0 &&
                            <div className="Loader__Wrapper">
                                <Loader/>
                            </div>
                        }
                        {
                            packagesData.length !== 0 &&
                            packagesData.map ( ( item, index ) => {

                                return (
                                    <div className={ "DownloadManager__Table--card " + item.status } key={ index }>
                                        <div className={ "checkbox" }>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    value={ item.uuid }
                                                    checked={ props.selectedQueue.includes ( item.uuid ) }
                                                    onClick={ ( event ) => {
                                                        handleSelectedRow ( event )
                                                    } }
                                                    disabled={ !installableStatuses.includes ( item.status ) }
                                                />
                                                <span className="sr-only">
                                                    {/* TODO: Add translation to this */}
                                                    { "Toggle selection for " + item.name }
                                                </span>
                                            </label>
                                        </div>
                                        {/* TODO: Use different color for visual or library */}
                                        <div className={ "DownloadManager__Table--typeIcon" + item.classification }>
                                            <Icon
                                                iconClass={ "icon " + item.classification }
                                                SvgSymbol={ setContentIcon ( item.classification ) }
                                                viewBox={ "0 0 24 24" }
                                            />
                                        </div>
                                        <div className="DownloadManager__Table--properties">
                                            <div className="DownloadManager__Table--name">
                                                <ReactMarkdown className={ "marked" }>{ item.name }</ReactMarkdown>
                                            </div>
                                            <div className="DownloadManager__Table--groupAndCategory">
                                                <span>{ t ( item.group_name ) }</span> » <span>{ item.category_name }</span>
                                            </div>
                                        </div>
                                        <div className="DownloadManager__Table--statusData">
                                            <div className="DownloadManager__Table--dateInstalled">
                                                <span>{ new Date(item.installation_date).toLocaleDateString() } { new Date(item.installation_date).toLocaleTimeString() }</span>
                                            </div>
                                            <div className="DownloadManager__Table--status status">
                                                <span
                                                    class={ parseDownloadStatusMessage ( item.status ).toLowerCase () }>{ parseDownloadStatusMessage ( item.status ) }</span>
                                                <Icon
                                                    iconClass={ "icon " + parseDownloadStatusMessage ( item.status ).toLowerCase () }
                                                    SvgSymbol={ parseDownloadIcon ( item.status ) }
                                                    viewBox={ "0 0 24 24" }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            } )
                        }
                    </div>
                </Col>
            </Row>
        </div>
    );
};

const mapStateToProps = ( state ) => ( {
    updatesPending: state.manageDownloading.updatesPending,
    selectedQueue: state.manageDownloading.selectedQueue,
    userProfile: state.settings.userProfile,
    userEmail: state.settings.userEmail,
    networkOnline: state.sensors.networkAvailable
} );

const mapDispatchToProps = ( dispatch ) => {
    return {
        addToSelected: ( selected ) => dispatch ( addSelectedQueue ( selected ) ),
        deleteFromSelected: ( row ) => dispatch ( deleteFromSelectedQueue ( row ) ),
        addAllToSelected: ( selectedAll ) => dispatch ( addAllSelectedQueue ( selectedAll ) ),
        deleteAllFromSelected: () => dispatch ( deleteAllFromSelectedQueue () ),
        addToUpdates: ( updates ) => dispatch ( addAllUpdatesPending ( updates ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( DownloadManager );
