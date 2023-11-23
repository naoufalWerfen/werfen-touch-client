import React, { useEffect, useState } from 'react';
import { Col, Row } from "react-bootstrap";
import TileChooser from "../TileChooser/TileChooser";
import { resetSidebar, setActiveKey, setClicked, setSelectedItem } from "../../redux/actions/navigation";
import { convertToArray, removeDuplicates, sortThis } from "../../constants/functions";
import { useHistory, useParams } from "react-router-dom";
import { connect } from "react-redux";
import './ItemsList.scss';
import '../VisualsTile/VisualsTile.scss';
import '../LibraryTile/LibraryTile.scss';
import '../SearchTile/SearchTile.scss';
import { useTranslation } from "react-i18next";

const ItemsList = ( props ) => {
    const { t } = useTranslation ();
    const history = useHistory ();
    const id = useParams ().id;
    let attachmentsVisits = props.attachments.map ( item => item.uuid ) || [];
    let attachmentsEmail = props.mailAttachments.map ( item => item.uuid ) || [];
    const [ visibleElements, setVisibleElements ] = useState ( [] );

    useEffect ( () => {
        return () => {
            props.resetSidebar ();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );


    useEffect ( () => {
        const targets = document.querySelectorAll ( '.ItemsList' );
        if ( props.selectedItem === "" ) {
            const firstEntry = convertToArray ( targets ).map ( item => item.id )[0];
            if ( firstEntry !== undefined ) {
                setVisibleElements ( [].concat ( firstEntry ) );
                const theElement = firstEntry.split ( "-" )
                props.setActiveKey ( theElement[1] );
                props.setSelectedItem ( firstEntry );
            }
        } else {
            const selectedItem = document.getElementById ( props.selectedItem );
            if ( selectedItem ) {
                selectedItem.scrollIntoView ();
                setVisibleElements ( [].concat ( props.selectedItem ) );
            }
        }
        let visible = visibleElements;
        const options = {
            threshold: [ 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0 ]
        }

        const handleIntersection = ( entries ) => {
            entries.map ( ( entry ) => {
                if ( entry.isIntersecting ) {
                    visible = [ ...visible, entry.target.id ];
                }
                if ( !entry.isIntersecting || ( entry.isIntersecting && entry.intersectionRatio < 0.3 ) ) {
                    visible = visible.filter ( element => element !== entry.target.id );
                }
            } );

            setVisibleElements ( removeDuplicates ( visible ) );
        }

        const observer = new IntersectionObserver ( handleIntersection, options );

        targets.forEach ( ( target ) => observer.observe ( target ) );

        return () => observer.disconnect ();
    }, [ props.dataGroups, props.selectedItem ] );

    useEffect ( () => {
        if ( visibleElements.length > 0 ) {
            let visibleArray;
            if ( Array.isArray ( visibleElements ) ) {
                visibleArray = visibleElements
            } else {
                visibleArray = [].concat ( visibleElements );
            }

            const elements = visibleArray.map ( item => {
                const elements = item.split ( "-" );
                const key = elements[1];
                const selected = elements[2] < 10 ? "0" + elements[2] : elements[2];
                const combinedKey = key.concat ( selected );
                const numberData = {
                    key,
                    selected,
                    combinedKey
                }
                //return key.concat ( selected )
                return numberData;
            } );

            const clonedElements = [ ...elements ];
            const elementsToSort = clonedElements.map ( ( clonedElement ) => clonedElement.combinedKey )
            const numbersToSort = sortThis ( elementsToSort );
            const topmostNumbers = numbersToSort[0];
            const topMostNumberData = elements.filter ( ( element ) =>
                element.combinedKey === topmostNumbers )

            const sidebarKey = topmostNumbers.replace ( topMostNumberData[0].selected, "" );
            const sidebarSelector = Number ( topmostNumbers.replace ( topMostNumberData[0].key, "" ) )
            const topmostElement = "ItemsList-" + sidebarKey + "-" + sidebarSelector;
            const activeKey = topmostElement.split ( "-" )[1];

            if ( !props.clicked ) {
                props.setActiveKey ( activeKey )
                props.setSelectedItem ( topmostElement );
                props.setClicked ( true );
            } else {
                props.setClicked ( false );
            }

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ visibleElements ] );

    return (
        <>
            {/*{ TODO Fix new image link}*/}
            {
                props.itemsList
                    .map ( ( item, index ) => {

                        const { id, gid, catTitle, groupTitle, elements, image } = item;
                        const groupName = image.split ( "__" )[0];
                        const catTitleToPut = t ( groupTitle ) + " - " + catTitle

                        return (

                            <div
                                className={ ( index !== props.itemsList.length - 1 ) ? "ItemsList col-12" : "ItemsList col-12 last" }
                                id={ "ItemsList-" + gid + "-" + id }
                                key={ index }
                            >
                                <Row className={ "ItemsList__Header" }>
                                    <Col xs={ 12 }>
                                            <div className={ "ItemsList__Header-Title" }>
                                            <span
                                                className={ "ItemTitle-generic" }>
                                                { catTitleToPut + " (" + elements.length + ")" }
                                            </span>
                                            </div>
                                        </Col>
                                    </Row>
                                <Row className={ "ItemsList__Body" }>
                                    {
                                        elements.map ( ( element, iteration ) => {
                                            let dataObject = {
                                                idx: gid,
                                                num: element.cid,
                                                tile: element,
                                                isVisitSelected: attachmentsVisits.includes ( element.uuid ),
                                                isEmailSelected: attachmentsEmail.includes ( element.uuid ),
                                                isVisitSelectable: props.newEmail === false,
                                                isEmailSelectable: props.newVisit === false
                                            }

                                            if ( history.location.pathname === '/visuals' && element.imageRoute ) {
                                                dataObject.pathToImage = element.imageRoute
                                            }

                                            return (
                                                <TileChooser
                                                    key={ iteration }
                                                    dataObject={ dataObject }
                                                    userProfile={ props.userProfile }
                                                />
                                            )
                                        } )
                                    }
                                </Row>
                            </div>
                            )
                        }
                    )
            }
        </>
    )
};

const mapStateToProps = ( state ) => ( {
    selectedKey: state.navigation.selectedKey,
    selectedItem: state.navigation.selectedItem,
    clicked: state.navigation.clicked,
    navigationItem: state.navigation.navigationItem,
    userProfile: state.settings.userProfile,
    dataGroups: state.dataProcessor.dataGroups,
    attachments: state.visitEditor.attachments,
    newVisit: state.visitEditor.newVisit,
    mailAttachments: state.emailEditor.attachments,
    newEmail: state.emailEditor.newEmail
} );

const mapDispatchToProps = ( dispatch ) => {
    return {
        setActiveKey: ( activeKey ) => dispatch ( setActiveKey ( activeKey ) ),
        resetSidebar: () => dispatch ( resetSidebar () ),
        setClicked: ( clicked ) => dispatch ( setClicked ( clicked ) ),
        setSelectedItem: ( selectedItem ) => dispatch ( setSelectedItem ( selectedItem ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( ItemsList );
