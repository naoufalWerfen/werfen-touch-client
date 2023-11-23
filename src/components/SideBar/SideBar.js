import React, { useContext, useEffect, useState } from 'react';
import { Accordion, Card, useAccordionToggle } from "react-bootstrap";
import AccordionContext from 'react-bootstrap/AccordionContext';
import "./SideBar.scss"
import { useHistory } from "react-router-dom";
import SquareIcon from "../SquareIcon/SquareIcon";
import { connect } from "react-redux";
import { setActiveKey, setClicked, setSelectedItem } from "../../redux/actions/navigation";
import isElectron from "is-electron";
import { useTranslation } from "react-i18next";


function ContextAwareToggle ( { children, eventKey, callback } ) {
    const currentEventKey = useContext ( AccordionContext );

    const decoratedOnClick = useAccordionToggle (
        eventKey,
        () => callback && callback ( eventKey ),
    );
    const isCurrentEventKey = currentEventKey === eventKey;

    return (
        <div
            className={ isCurrentEventKey ? 'headerOpen' : 'headerClose' }
            onClick={ decoratedOnClick }
        >
            { children }
        </div>
    );
}

const SideBar = ( props ) => {
    const history = useHistory ()
    const { t } = useTranslation ();
    const [ selectedSelector, setSelectedSelector ] = useState ( null );
    const selectedKey = props.selectedKey.toString ();
    const groupsColors = [
        {
            groupsIds: [
                "overview",
                "istituzionale",
                'company',
                "molecular", "lis-uk",
                "company_sp",
                "company-pt",
                "company-werfen-co",
                "company-werfen-au",
                "company-werfen-mx",
                "werfen-academy-pt",
                "werfen-academy-sp"
            ],
            color: "#06038D"
        },
        {
            groupsIds: [
                "hemostasis",
                "hemostasis-co",
                "hemostasis-au",
                "hemostasis-mx"
            ]
            ,
            color: "#A7AF47"
        },
        {
            groupsIds: [
                "acute-care",
                "acute-care-co",
                "acute-care-au",
                "acute-care-mx"
            ],
            color: "#A60B41"
        },
        {
            groupsIds: [
                "autoimmunity",
                "autoimmunity-co",
                "autoimmunity-au",
                "autoimmunity-mx"
            ],
            color: "#a72b2a"
        },
        {
            groupsIds: [
                "online-learning",
                "biomolecular-mx"
            ],
            color: "#01A3E0"
        },
        {
            groupsIds: [
                "acd_it"
            ],
            color: "#9C0C39"
        },
        {
            groupsIds: [
                "acute-care-it",
                "acute-care-pt"
            ],
            color: "#882342"
        },
        {
            groupsIds: [
                "ai_it"
            ],
            color: "#FF0001"
        },
        {
            groupsIds: [
                "autoinmunidad-sp",
                "autoimmunity-pt"
            ],
            color: "#982926"
        },
        {
            groupsIds: [
                "chimica",
                "quimica-clinica-mx"
            ],
            color: "#53BDC3"
        },
        {
            groupsIds: [
                "dm_it"
            ],
            color: "#267BB3"
        },
        {
            groupsIds: [
                "emostasi",
                "hemostasia",
                "hemostasis-pt"
            ],
            color: "#AFBC21"
        },
        {
            groupsIds: [
                "it-sol",
                "software-clinico-mx"
            ],
            color: "#0094D2"
        },
        {
            groupsIds: [
                "lis-visual-sp",
                "lis-pt",
                "business-analytics-sp",
                "business-analytics-pt"
            ],
            color: "#7B67BD"
        },
        {
            groupsIds: [
                "infectious-disease"
            ],
            color: "#1590f0"
        },
        {
            groupsIds: [
                "applied-science",
                "applied-science-pt",
                "genetic-disorders-sp",
                "genetic-disorders-pt",
                "library-mx"
            ],
            color: "#3D9980"
        },
        {
            groupsIds: [
                "micro",
                "micro-pt",
                "cardiometabolico-mx"
            ],
            color: "#D39155"
        },
    ]
    const groupColorsIds = groupsColors.map ( ( item ) => item.groupsIds ).flat ( 1 );
    const defaultGroupColor = "#06038D";

    useEffect ( () => {
        setSelectedSelector ( props.selectedItem );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.selectedItem ] );

    useEffect ( () => {
        // if ( props.appPhase === "readyToUse" ) {
        //     if ( props.dataGroups.length > 0 ) {
        //         const firstGroup = props.dataGroups[0];
        //         const id = firstGroup.id;
        //         const cid = firstGroup.categories[0].cid;
        //
        //         setSelectedSelector ( "ItemsList-" + id + "-" + cid );
        //         props.setSelectedItem ( "ItemsList-" + id + "-" + cid );
        //         props.setActiveKey ( cid );
        //     }
        // }
        if ( props.appPhase === "activeVisit" ) {
            if ( props.visitDataGroups.length > 0 ) {
                const firstGroup = props.visitDataGroups[0];
                const id = firstGroup.id;
                const cid = firstGroup.categories[0].cid;

                setSelectedSelector ( "ItemsList-" + id + "-" + cid );
                props.setSelectedItem ( "ItemsList-" + id + "-" + cid );
                props.setActiveKey ( cid );
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.dataGroups, props.appPhase, props.visitDataGroups ] );


    return (
        <>
            {
                ( props.appPhase === "readyToUse" && props.dataGroups.length > 0 ) &&
                <div className={ "SideBar" }>

                    <Accordion
                        defaultActiveKey={ selectedKey }
                        className={ "SideBar__Accordion" }
                        activeKey={ selectedKey }
                    >

                        {
                            props.dataGroups.map ( ( item ) => {
                                const id = item.id.toString ();

                                const { groupTitle, color, categories, image } = item;
                                let iconColor;
                                switch ( true ) {
                                    case( color.includes ( "#" ) ):
                                        iconColor = color;
                                        break;
                                    case( groupColorsIds.includes ( color ) ):
                                        iconColor = groupsColors.filter ( el => el.groupsIds.includes ( color ) )[0].color;
                                        break;
                                    case( groupColorsIds.filter ( ( groupColor ) => color.includes ( groupColor ) ).length > 0 ):
                                        const filterColor = groupColorsIds.filter ( ( groupColor ) => color.includes ( groupColor ) )[0];
                                        iconColor = groupsColors.filter ( el => el.groupsIds.includes ( filterColor ) )[0].color;
                                        break;
                                    default:
                                        iconColor = defaultGroupColor;
                                }

                                return (
                                    <Card className={ "SideBar__Card" } key={ id }>
                                        <Accordion.Toggle
                                            as={ Card.Header }
                                            className={ "SideBar__Header" }
                                            eventKey={ id }
                                            onClick={ () => {
                                                props.setActiveKey ( id )
                                            } }
                                        >
                                            <ContextAwareToggle eventKey={ id }>
                                                <SquareIcon
                                                    squareClass={ groupTitle }
                                                    squareColor={ iconColor }/>
                                                <div className={ "SideBar__Header-Title" }>
                                                    { t ( groupTitle ) }
                                                </div>
                                            </ContextAwareToggle>
                                        </Accordion.Toggle>
                                        <Accordion.Collapse eventKey={ id }>
                                            <Card.Body className={ "SideBar__Body" }>
                                                <ul>
                                                    {
                                                        categories.map ( ( category, index ) => {
                                                            const cid = category.cid.toString ();
                                                            const selector = "ItemsList-" + id + "-" + cid;
                                                            const hash = history.location.hash.split ( '-' );

                                                            return (
                                                                <li key={ index }
                                                                    className={ selector === selectedSelector ? " active" : "" }
                                                                >
                                                                    <a
                                                                        href={ ( isElectron () ? "#" : "" ) +
                                                                        history.location.pathname + "#" + selector }
                                                                        onClick={ ( event ) => {
                                                                            event.preventDefault ();
                                                                            props.setSelectedItem ( selector );
                                                                            props.setClicked ( true );
                                                                            window.document.querySelectorAll ( "#" + selector )[0]
                                                                                .scrollIntoView ();
                                                                        } }
                                                                    >
                                                                        { category.title }
                                                                    </a>
                                                                </li>
                                                            )
                                                        } ) }
                                                </ul>
                                            </Card.Body>
                                        </Accordion.Collapse>
                                    </Card>
                                )
                            } ) }
                    </Accordion>
                </div> }
            {
                ( props.appPhase === "visitActive" && props.visitDataGroups.length > 0 ) &&
                <div className={ "SideBar" }>

                    <Accordion
                        defaultActiveKey={ selectedKey }
                        className={ "SideBar__Accordion" }
                        activeKey={ selectedKey }
                    >

                        {
                            props.visitDataGroups.map ( ( item ) => {
                                const id = item.id.toString ();
                                const { groupTitle, color, categories } = item;

                                return (
                                    <Card className={ "SideBar__Card" } key={ id }>
                                        <Accordion.Toggle
                                            as={ Card.Header }
                                            className={ "SideBar__Header" }
                                            eventKey={ id }
                                            onClick={ () => {
                                                props.setActiveKey ( id )
                                            } }
                                        >
                                            <ContextAwareToggle eventKey={ id }>
                                                <SquareIcon
                                                    squareClass={ groupTitle }
                                                    squareColor={ color }/>
                                                <div className={ "SideBar__Header-Title" }>
                                                    { groupTitle }
                                                </div>
                                            </ContextAwareToggle>
                                        </Accordion.Toggle>
                                        <Accordion.Collapse eventKey={ id }>
                                            <Card.Body className={ "SideBar__Body" }>
                                                <ul>
                                                    {
                                                        categories.map ( ( category, index ) => {
                                                            const cid = category.cid.toString ();
                                                            const selector = "ItemsList-" + id + "-" + cid;
                                                            const hash = history.location.hash.split ( '-' );

                                                            return (
                                                                <li key={ index }
                                                                    className={ selector === selectedSelector ? " active" : "" }
                                                                >
                                                                    <a
                                                                        href={ ( isElectron () ? "#" : "" ) +
                                                                        history.location.pathname + "#" + selector }
                                                                        onClick={ ( event ) => {
                                                                            event.preventDefault ();
                                                                            props.setSelectedItem ( selector );
                                                                            window.document.querySelectorAll ( "#" + selector )[0]
                                                                                .scrollIntoView ( { behavior: "smooth" } );
                                                                        } }
                                                                    >
                                                                        { category.title }
                                                                    </a>
                                                                </li>
                                                            )
                                                        } ) }
                                                </ul>
                                            </Card.Body>
                                        </Accordion.Collapse>
                                    </Card>
                                )
                            } ) }
                    </Accordion>
                </div> }
        </>
    );
}
const mapStateToProps = ( state ) => ( {
    selectedKey: state.navigation.selectedKey,
    selectedItem: state.navigation.selectedItem,
    navigationItem: state.navigation.navigationItem,
    dataGroups: state.dataProcessor.dataGroups,
    visitDataGroups: state.visitDataProcessor.dataGroups,
    appPhase: state.settings.appPhase
} )

const mapDispatchToProps = ( dispatch ) => {
    return {
        setActiveKey: ( activeKey ) => dispatch ( setActiveKey ( activeKey ) ),
        setClicked: ( clicked ) => dispatch ( setClicked ( clicked ) ),
        setSelectedItem: ( selectedItem ) => dispatch ( setSelectedItem ( selectedItem ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( SideBar );
