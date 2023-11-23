import React, { useEffect } from 'react';
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { setWebInstallation } from "../../redux/actions/settings";
import { connect } from "react-redux";
import './InitialSettings.scss';
import Background from "../Background/Background";
import { setNavigationItem } from "../../redux/actions/navigation";
import Icon from "../Icon/Icon";
import WebIcon from "../../assets/svgsymbols/web";
import UsbIcon from "../../assets/svgsymbols/usb";
import { useTranslation } from 'react-i18next';
import newLogo from "../../assets/logos/New_Werfen_logo.jpg";

const InitialSettings = (props) => {

    const { t } = useTranslation ()
    useEffect( () => {
        props.setNavigationItem ( 1 );
        let previousAppPhase = 'installLobby';
        localStorage.setItem ( 'previousAppPhase', previousAppPhase );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    return (

        <div className={ "InitialSettings" }>
            <Background/>
            <Container fluid className={ "InitialSettings__Menu h-100" }>
                <Row className={ "InitialSettings__Box h-100" }>
                    <Col xs={ 6 } className={ "Login__SideLogo" }>
                        <div>
                            <img src={ newLogo } alt={ "Werfen" }/>
                        </div>
                    </Col>
                    <Col className={ "InitialSettings__Main" } xs={ 6 }>
                        <span
                            className={ "InitialSettings__Title" }>{ t ( "Download and install content from" ) }</span>
                        <div className={ "InitialSettings__Body" }>
                            <Form className={ "InitialSettings__Form" }>
                                <Form.Group controlId="formUsername" className={ "InitialSettings__Form--group" }>
                                    <Icon
                                        SvgSymbol={ WebIcon }
                                        viewBox={ "0 0 24 24" }
                                    />
                                    <Button className={ "InitialSettings__Button" } onClick={ ( e ) => {
                                        props.goToLogin ( e, true )
                                    } }>{ t ( "Web" ) }</Button>

                                </Form.Group>
                                <Form.Group controlId="formPassword" className={ "InitialSettings__Form--group" }>
                                    <Icon
                                        SvgSymbol={ UsbIcon }
                                        viewBox={ "0 0 24 24" }
                                    />
                                    <Button className={ "InitialSettings__Button" }
                                            onClick={ props.goToUSB }>{ t ( "Usb" ) }</Button>
                                </Form.Group>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

const mapStateToProps = (state) => ({
    navigationItem: state.navigation.navigationItem,
})
function mapDispatchToProps( dispatch ) {
    return {
        setNavigationItem: ( navigationItem ) => dispatch( setNavigationItem( navigationItem ) ),
        setWebInstallation: ( webInstallation ) => dispatch( setWebInstallation( webInstallation ))
    }
}

export default connect(mapStateToProps, mapDispatchToProps )(InitialSettings);
