import React from 'react';
import { connect } from 'react-redux';
import background1 from '../../assets/backgrounds/WT-BG_1921x1052.png';
import background2 from '../../assets/backgrounds/bg-white.jpg'
import background3 from '../../assets/backgrounds/bg-white.jpg'
import './Background.scss';

const Background = ( props ) => {
    const backgrounds = [ background1, background2, background2, background2, background2, background2, background2, background2, background2, background3 ]
    return (
        <div className="Background">
            { ( props.appPhase !== "visitActive" && props.navigationItem !== -1 ) &&
                <img src={ backgrounds[props.navigationItem] } alt="WerfenTouch background"/> }
            { ( props.appPhase !== "visitActive" && props.navigationItem === -1 ) &&
                <img src={ backgrounds[1] } alt="WerfenTouch background"/> }
            { ( props.appPhase === "visitActive" ) &&
            <img src={ backgrounds[1] } alt="WerfenTouch background"/> }
        </div>
    );
};

const mapStateToProps = ( state ) => ( {
    navigationItem: state.navigation.navigationItem,
    appPhase: state.settings.appPhase
})

export default connect( mapStateToProps, {} )( Background );
