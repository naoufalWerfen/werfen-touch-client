import React, { useEffect, useState } from 'react';
import './Navigation.scss';
import Icon from "../Icon/Icon";
import Book from "../../assets/svgsymbols/book";
import Case from "../../assets/svgsymbols/case"
import Home from "../../assets/svgsymbols/home";
import Layout from "../../assets/svgsymbols/layout";
import Mail from "../../assets/svgsymbols/mail-navbar";
import Search from "../../assets/svgsymbols/search";
import Settings from "../../assets/svgsymbols/settings";
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { setNavigationItem } from "../../redux/actions/navigation";
import { useTranslation } from 'react-i18next';
import MenuIcon from "../../assets/icons/more-horizontal.svg";
import Octagon from "../../assets/svgsymbols/x-octagon";
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog";

const Navigation = ( props ) => {
    const { t } = useTranslation ();
    const [ selectedOption, setSelectedOption ] = useState ( 0 );
    const [ visitNavigationMenu, setVisitNavigationMenu ] = useState ( false );
    const [ showConfirmFinish, setShowConfirmFinish ] = useState ( false );

    const title = t ( "Confirm finishing the visit" )
    const messageArray = [
        t ( 'Finish the visit and lost changes' )
    ]


    const _toggleMenuNavigation = ( event ) => {
        event.preventDefault ();
        setVisitNavigationMenu ( !visitNavigationMenu );
    }

    const finishVisit = () => {
        setShowConfirmFinish ( true );
    }

    const handleCloseConfirm = () => setShowConfirmFinish ( false );

    const handleNavigate = ( event, item, index ) => {
        event.preventDefault ();
        setSelectedOption ( index );
        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "navigation",
        //     action : "click",
        //     value : item.name,
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry,  props.networkOnline )
        localStorage.setItem ( 'lastAppPage', JSON.stringify ( index ) );
        props.setNavigationItem ( index );
        props.history.push ( item.route );
    }

    const goTo = ( event, item ) => {
        setSelectedOption ( item.sortingOrder );
        // const logEntry = {
        //     profileId : localStorage.getItem("tokenProfile"),
        //     userId : localStorage.getItem("userEmail"), // TODO: Store user email in localStorage
        //     category : "navigation",
        //     action : "click",
        //     value: item.name,
        //     severity : "log",
        //     visitId : props.startedVisitId
        // }
        // sendToLogs ( logEntry, props.networkOnline  )

        props.setNavigationItem ( item.sortingOrder );
        props.history.push ( item.route );
    }
    const navigationsItems = [
        {
            name: "Home",
            className: "Home",
            icon: Home,
            viewBox: "0 0 24 24",
            sortingOrder: 0,
            route: "/",
        }, {
            name: "explore",
            className: "Visuals",
            icon: Layout,
            viewBox: "0 0 24 24",
            sortingOrder: 1,
            route: "/visuals"
        }, {
            name: "library",
            className: "Library",
            icon: Book,
            viewBox: "0 0 24 24",
            sortingOrder: 2,
            route: "/library"
        },
        /* {
             name: "Calendar",
             className: "Calendar",
             icon: Calendar,
             viewBox: "0 0 24 24",
             sortingOrder: 3,
             route: "/calendar"
         },*/
        {
            name: "Mail",
            className: "Mail",
            icon: Mail,
            viewBox: "0 0 24 24",
            sortingOrder: 4,
            route: "/emailmanager"
        },
       /* {
            name: "Visits",
            className: "Visits",
            icon: Case,
            viewBox: "0 0 24 24",
            sortingOrder: 4,
            route: "/visitmanager"
        },*/
        {
            name: "Search",
            className: "Search",
            icon: Search,
            viewBox: "0 0 24 24",
            sortingOrder: 5,
            route: "/search"
        }, {
            name: "Settings",
            className: "Settings",
            icon: Settings,
            viewBox: "0 0 24 24",
            sortingOrder: 6,
            route: "/settings"
        }
        // ,{
        //     name: "Download",
        //     className: "Download",
        //     icon: Download,
        //     viewBox: "0 0 24 24",
        //     sortingOrder: 7,
        //     route: "/downloadmanager"
        // }
        ]

    const visitItems = [
        {
            name: "Finish",
            className: "Finish",
            icon: Octagon,
            viewBox: "0 0 24 24",
            route: "#"
        },
        {
            name: "All",
            className: "All",
            icon: Case,
            viewBox: "0 0 24 24",
            sortingOrder: 0,
            route: "/all"
        },
        {
            name: "Search",
            className: "VisitSearch",
            icon: Search,
            viewBox: "0 0 24 24",
            sortingOrder: 1,
            route: "/visitsearch"
        },
        {
            name: "Mail",
            className: "Mail",
            icon: Mail,
            viewBox: "0 0 24 24",
            sortingOrder: 2,
            route: "/visitemail"
        }
    ]

    useEffect ( () => {
        let selectInitialOption;
        if ( props.appPhase === "readyToUse" ) {
            selectInitialOption = navigationsItems.findIndex ( item => item.route === props.history.location.pathname )
            props.setNavigationItem ( selectInitialOption );
            setSelectedOption ( selectInitialOption );
        } else if ( props.appPhase === "visitActive" ) {
            selectInitialOption = visitItems.findIndex ( item => item.route === props.history.location.pathname )
            if ( selectInitialOption === -1 ) {
                props.history.push ( '/' );
            }
            props.setNavigationItem ( selectInitialOption );
            setSelectedOption ( selectInitialOption );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.appPhase ] )

    useEffect ( () => {
        setSelectedOption ( props.navigationItem );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ props.navigationItem ] );

    const confirmDiscardVisit = {
        show: showConfirmFinish,
        onHide: handleCloseConfirm,
        contentClassName: "Settings__Modal",
        title: title,
        messageArray: messageArray,
        handleOnCancel: handleCloseConfirm,
        handleOnAccept: props.handleFinishVisit,
        labelCancel: t ( "No" ),
        labelAccept: t ( "Yes" )
    }

    const confDialogsArray = [ confirmDiscardVisit ]

    return (
        <>
            { props.appPhase === "readyToUse" && <div className={ "Navigation menu-generic" }>

                { navigationsItems.map ( ( item, index ) => {
                    return (
                        <div key={ index }
                             className={ ( selectedOption === index ) ? "Navigation__Item active" : "Navigation__Item " }
                             onClick={ ( event ) => handleNavigate ( event, item, index ) }
                    >
                        <div className="Navigation__Icon">
                            <Icon
                                iconClass={ item.className + "__Icon" }
                                SvgSymbol={ item.icon }
                                viewBox={ item.viewBox }
                            />
                        </div>
                            <div className="Navigation__Title">
                                { t ( item.name ) }
                            </div>
                        </div>
                    )
                } ) }
            </div> }
            { ( props.appPhase === "visitActive" && props.insideViewer === false ) && <>
                <div className={ ( visitNavigationMenu ? "menu-open" : "" ) + " menuSwitcher" }
                     onClick={ ( event ) => _toggleMenuNavigation ( event ) }>
                    <img src={ MenuIcon } alt=""/>
                </div>
                { visitNavigationMenu && <div className={ "VisitNavigation" }>
                    { visitItems.map ( ( item, index ) => {
                        return (
                            <>
                                <div key={ index }
                                     className={ ( selectedOption === index ) ? "VisitNavigation__Item active " : "VisitNavigation__Item " }
                                     onClick={ ( event ) => {
                                         ( item.route === "#" ) ? finishVisit () : goTo ( event, item )
                                     } }
                                >
                                    <div className="VisitNavigation__Icon">
                                        <Icon
                                            iconClass={ item.className + "__Icon" }
                                            SvgSymbol={ item.icon }
                                            viewBox={ item.viewBox }
                                        />
                                    </div>
                                </div>
                                { index === 0 && <span className="VisitNavigation__Separation"/> }
                            </>
                        )
                    } ) }
                </div> }
                <div>
                    { confDialogsArray.map ( ( dialog, index ) =>
                        < ConfirmationDialog
                            key={ index }
                            show={ dialog.show }
                            onHide={ dialog.onHide }
                            contentClassName={ dialog.contentClassName }
                            title={ dialog.title }
                            messageArray={ dialog.messageArray }
                            handleOnCancel={ dialog.handleOnCancel }
                            handleOnAccept={ dialog.handleOnAccept }
                            labelCancel={ dialog.labelCancel }
                            labelAccept={ dialog.labelAccept }
                            displayConfirmationInput={ dialog.displayConfirmationInput || false }
                        />
                    ) }
                </div>
            </>
            }
        </>
    );
};

const mapStateToProps = ( state ) => ( {
    navigationItem: state.navigation.navigationItem,
    insideViewer: state.navigation.insideViewer,
    appPhase: state.settings.appPhase,
    userEmail: state.settings.userEmail,
    networkOnline: state.sensors.networkAvailable
} )

const mapDispatchToProps = ( dispatch ) => {
    return {
        setNavigationItem: ( selectedItem ) => dispatch ( setNavigationItem ( selectedItem ) )
    }
}

export default withRouter ( connect ( mapStateToProps, mapDispatchToProps ) ( Navigation ) );
