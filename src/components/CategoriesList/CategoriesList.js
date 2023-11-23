import React, { useEffect, useState } from "react";
import { Col, Container } from "react-bootstrap";
import Category from "../Category/Category";
import overviewCategory from '../../assets/categories/05-company.png';
import instituzionaleCategory from '../../assets/categories/05-company.png';
//TODO: change the path in the importe once we'll have the new autoimmunity cover so it points to the new image
import autoimmumnityCategory from '../../assets/categories/03-ai.png';
import autoimmunityBNLCategory from '../../assets/categories/bnl-autoimmunity.png'
import hemostasisCategory from '../../assets/categories/01-hdm.png';
import acutecareCategory from '../../assets/categories/02-acd.png';
import onlinelearningCategory from '../../assets/categories/04-learning.png';
import emostasiCategory from '../../assets/categories/cat-emostasi.png';
import acdCategory from '../../assets/categories/cat-acute-care-it.png';
import autoimmunitaCategory from '../../assets/categories/cat-autoimmunita.png';
import chimicaCategory from '../../assets/categories/cat-chimica-clinica.png';
import dmCategory from '../../assets/categories/cat-diagnostica.png';
import heathcareITCategory from '../../assets/categories/cat-soluzioni-informatiche.png';
import ukModulabCategory from '../../assets/categories/cat-lis-uk.jpg';
import ukInfectiousDiseaseCategory from '../../assets/categories/cat-infectious-disease.jpg';
import ukMolecularCategory from '../../assets/categories/cat-molecular.jpg';
import spHemostasia from '../../assets/categories/sp-hemostasia.jpg';
import spAcuteCare from '../../assets/categories/sp-acute-care-it.jpeg';
import spMicro from '../../assets/categories/sp-micro.jpeg';
import spBiotech from '../../assets/categories/sp-applied-science.jpg';
import spHits from '../../assets/categories/sp-lis.jpg';
import FolderIcon from "../../assets/icons/book_white.svg";
import SearchIcon from "../../assets/icons/search_white.svg";
import VisualsIcon from "../../assets/icons/layout_white.svg";
import AllIcon from "../../assets/icons/case_white.svg";
import CalcIcon from "../../assets/icons/calculators_white.svg";

import './CategoriesList.scss';
import isElectron from "is-electron";
import { connect } from "react-redux";
import { setActiveKey, setNavigationItem, setSelectedItem } from "../../redux/actions/navigation";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
// import { sendToLogs } from "../../constants/functions";


let electron;

if ( isElectron () ) {
    electron = window.require ( "electron" )
}
const ipcRenderer = electron && electron.ipcRenderer;

const CategoriesList = ( props ) => {
    const { t, i18n } = useTranslation ()
    const history = useHistory ();
    const [ landings, setLandings ] = useState ( [] );
    const [ scrollValue, setScroll ] = useState ( "" )
    const userProfile = localStorage.getItem ( 'tokenProfile' );
    const landingImages = [
        {
            landingsIds: [ "company", "overview", "company_sp", "company-pt", "company-werfen-co", "colombia" ],
            image: overviewCategory
        },
        {
            landingsIds: [ "hemostasis", "hemostasis-co", "hemostasis-au", "hemostasis-mx" ],
            image: hemostasisCategory
        },
        {
            landingsIds: [ "acute-care", "acute-care-co", "acute-care-au" ],
            image: acutecareCategory
        },
        {
            landingsIds: [ "autoimmunity", 'autoimmunity_eemea', "autoimmunity-au", "autoimmunity-co", 'autoimmunity-de', 'autoimmunity-kr', 'autoimmunity-mx' ],
            image: autoimmumnityCategory
        },
        {
            landingsIds: [ "werfen-academy", "online-learning", "werfen-academy-de", "werfen-academy-pt", "werfen-academy-sp" ],
            image: onlinelearningCategory
        },
        {
            landingsIds: [ "autoimmunity-bnl" ],
            image: autoimmunityBNLCategory
        },
        {
            landingsIds: [ "istituzionale" ],
            image: instituzionaleCategory
        },
        {
            landingsIds: [ "emostasi" ],
            image: emostasiCategory
        },
        {
            landingsIds: [ "acd_it" ],
            image: acdCategory
        },
        {
            landingsIds: [ "ai_it" ],
            image: autoimmunitaCategory
        },
        {
            landingsIds: [ "it-sol", "software-clinico-mx" ],
            image: heathcareITCategory
        },
        {
            landingsIds: [ "quimica", "chimica", "quimica-clinica-mx" ],
            image: chimicaCategory
        },
        {
            landingsIds: [ "dm_it" ],
            image: dmCategory
        },
        {
            landingsIds: [ "biomolecular", "molecular", "autoinmunidad-sp", "autoimmunity-pt", "biomolecular-mx" ],
            image: ukModulabCategory
        },
        {
            landingsIds: [ "infectious-disease" ],
            image: ukInfectiousDiseaseCategory
        },
        {
            landingsIds: [ "lis-uk" ],
            image: ukMolecularCategory
        },
        {
            landingsIds: [ "hemostasia", "hemostasis-pt" ],
            image: spHemostasia
        },
        {
            landingsIds: [ "acute-care-it", "acute-care-pt" ],
            image: spAcuteCare
        },
        {
            landingsIds: [ "business-analytics-sp", "lis-visual-sp", "business-analytics-pt", "lis-pt", ],
            image: spHits
        },
        {
            landingsIds: [ "micro", "micro-pt", "cardiometabolico-mx" ],
            image: spMicro
        },
        {
            landingsIds: [ "genetic-disorders-sp", "applied-science", "genetic-disorders-pt", "applied-science-pt", "library-mx" ],
            image: spBiotech
        },
    ]

    const navigateToContentList = ( item ) => {
        let pathsList = [ "presentations", "documents", "calculators", "all", "visitsearch" ]
        const itemPathname = item.route.replace ( "/", "" ).split ( "#" )[0];
        if ( item.route.includes ( "#" ) ) {
            const values = item.route.split ( "-" );
            const selector = item.route.split ( "#" )[1];
            props.setActiveKey ( parseInt ( values[1] ) );
            props.setSelectedItem ( selector );
        }
        props.setNavigationItem ( pathsList.indexOf ( itemPathname ) + 1 );
        history.push ( item.route );
    }
    const defineLandingImage = ( data ) => {

        const { landingImagesIds, landingImages, groupId, commonGroupId } = data;
        let imageToReturn;

        switch ( true ) {
            case( landingImagesIds.includes ( groupId ) ):
                imageToReturn = landingImages.filter ( ( landing ) => landing.landingsIds.includes ( groupId ) )[0].image;
                break;
            case( landingImagesIds.includes ( commonGroupId ) ):
                imageToReturn = landingImages.filter ( ( landing ) => landing.landingsIds.includes ( commonGroupId ) )[0].image;
                break;
            default:
                imageToReturn = landingImages[landingImages.length - 1].image;
        }

        return imageToReturn
    }
    const setLandingsData = ( event, data ) => {
        const landingImagesIds = landingImages.map ( ( item ) => item.landingsIds ).flat ( 1 );

        const receivedLandingsInfo = data.map ( ( item ) => {
            let element = {}
            const groupId = item.groups_id;
            const basicGroupsIds = [ "company", "overview", "acute-care", "hemostasis", "autoimmunity", "online-learning", "werfen-academy" ]
            const commonGroupId = basicGroupsIds.filter ( ( el ) => groupId.includes ( el ) )[0];
            element.title = item.groups_title;
            const data = {
                landingImagesIds,
                landingImages,
                groupId,
                commonGroupId
            }

            element.image = defineLandingImage ( data )
            element.route = "/visuals#ItemsList-" + item.groups_sorting_number + "-" + item.sorting_number;
            return element;
        } )
        if ( receivedLandingsInfo.length >= 6 ) {
            setScroll ( 'vertical-scroll' )
        }
        setLandings ( receivedLandingsInfo );
    }

    useEffect ( () => {
        ipcRenderer.send ( 'getFirstCategories', userProfile );
        ipcRenderer.on ( 'gotFirstCategories', setLandingsData );
        return () => {
            ipcRenderer.off ( 'gotFirstCategories', setLandingsData );
        };
    }, [] );


    const visitItems = [
        {
            title: "Presentations",
            image: VisualsIcon,
            route: "/presentations"
        }, {
            title: "Documents",
            image: FolderIcon,
            route: "/documents"
        }, {
            title: "Calculators",
            image: CalcIcon,
            route: "/calculators"
        }, {
            title: "All",
            image: AllIcon,
            route: "/all"
        }, {
            title: "Search",
            image: SearchIcon,
            route: "visitsearch#ItemsList-1-1"
        }
    ];

    return (
        <Container className={ "CategoriesList row " + scrollValue + " " + userProfile }>
            {
                props.appPhase === "readyToUse" &&
                <React.Fragment>
                    {
                        landings.map ( ( item, index ) => {
                            return (
                                <Col xs={ 6 } key={ index } className={ "category category-" + index }>
                                    <a href={ ( isElectron () ? "#" : "" ) + item.route }
                                       onClick={ ( event ) => {
                                           event.preventDefault ();
                                           if ( item.route !== "#" ) {
                                               const values = item.route.split ( "-" );
                                               const selector = item.route.split ( "#" )[1];
                                               props.setActiveKey ( parseInt ( values[1] ) );
                                               props.setSelectedItem ( selector );
                                               props.setNavigationItem ( 1 )
                                               history.push ( "visuals" );
                                               history.push ( item.route );

                                               // const logEntry = {
                                               //      profileId : localStorage.getItem("tokenProfile"),
                                               //      userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
                                               //     category : "navigation",
                                               //     action : "visit",
                                               //     value : item.title
                                               //     severity : "info",
                                               //     visitId : props.startedVisitId
                                               // }
                                               // sendToLogs ( logEntry, props.networkOnline )

                                               //console.log(history)
                                           } else {
                                               window.alert ( "For an upcoming feature, your prepared visits will show here." )
                                           }
                                       } }
                                    >
                                        <Category
                                            image={ item.image }
                                            title={ t ( item.title ) }
                                        />
                                    </a>
                                </Col>
                            )
                        } )
                    }
                </React.Fragment>
            }
            {
                props.appPhase === "visitActive" &&
                <React.Fragment>
                    {
                        visitItems.map ( ( item, index ) => {
                            return (
                                <Col xs={ 6 } key={ index } className={ "category category-" + index }>
                                    <a href={ ( isElectron () ? "#" : "" ) + item.route }
                                       onClick={ ( event ) => {
                                           event.preventDefault ();
                                           if ( item.route !== "#" ) {
                                               navigateToContentList ( item )
                                               // const logEntry = {
                                               //      profileId : localStorage.getItem("tokenProfile"),
                                               //      userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
                                               //     category : "navigation",
                                               //     action : "visit",
                                               //     value : item.title
                                               //     severity : "info",
                                               //     visitId : props.startedVisitId
                                               // }
                                               // sendToLogs ( logEntry, props.networkOnline  )
                                           } else {
                                               window.alert ( "For an upcoming feature, your prepared visits will show here." )
                                           }
                                       } }
                                    >
                                        <Category
                                            image={ item.image }
                                            title={ item.title }
                                            appPhase={ props.appPhase }
                                        />
                                    </a>
                                </Col>
                            )
                        } )
                    }
                </React.Fragment>
            }
        </Container>
    );
}
const mapStateToProps = ( state ) => ( {
    selectedKey: state.navigation.selectedKey,
    selectedItem: state.navigation.selectedItem,
    dataGroups: state.dataProcessor.dataGroups,
    dataVisuals: state.dataProcessor.dataVisuals,
    appPhase: state.settings.appPhase,
    userProfile: state.settings.userProfile,
    userEmail: state.settings.userEmail,
    networkOnline: state.sensors.networkAvailable,
} )

const mapDispatchToProps = ( dispatch ) => {
    return {
        setActiveKey: ( activeKey ) => dispatch ( setActiveKey ( activeKey ) ),
        setNavigationItem: ( activeKey ) => dispatch ( setNavigationItem ( activeKey ) ),
        setSelectedItem: ( selectedItem ) => dispatch ( setSelectedItem ( selectedItem ) )
    }
}

export default connect ( mapStateToProps, mapDispatchToProps ) ( CategoriesList )
