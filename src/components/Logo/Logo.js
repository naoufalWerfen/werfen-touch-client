import React from "react";
import "./Logo.scss";
import werfenLogo from '../../assets/logos/AF_WERFEN_BLUE_POS_RGB_1.png';
import { setNavigationItem } from "../../redux/actions/navigation";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";

const Logo = ( props ) => {

    const handleNavigateHome = ( event ) => {
        event.preventDefault ();
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
        props.setNavigationItem ( 0 );
        props.history.push ( "/" );
    }
    return ( <div className="Logo" onClick={ handleNavigateHome }>
        <img src={ werfenLogo } className={ "werfen" } alt="Werfen Logo"/>
    </div> )
}

const mapStateToProps = ( state ) => ( {
    navigationItem: state.navigation.navigationItem
} )

const mapDispatchToProps = ( dispatch ) => {
    return {
        setNavigationItem: ( selectedItem ) => dispatch ( setNavigationItem ( selectedItem ) )
    }
}

export default withRouter ( connect ( mapStateToProps, mapDispatchToProps ) ( Logo ) );

