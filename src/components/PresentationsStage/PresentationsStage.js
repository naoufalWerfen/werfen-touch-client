import React from 'react';
import SideBar from "../SideBar/SideBar";
import { Col, Container, Row } from "react-bootstrap";
import Logo from "../Logo/Logo";
import './PresentationsStage.scss';
import VisitPresentations from "../VisitPresentations/VisitPresentations";

const PresentationsStage = ( props ) => {
    return (
        <Container fluid className={ "PresentationsStage component" }>
            <Row>
                <Col xs={ 3 } className={ "PresentationsStage__left" }>
                    <Logo/>
                    <SideBar/>
                </Col>
                <Col xs={ 9 } className={ "PresentationsStage__right" }>
                    <VisitPresentations userProfile={ props.userProfile } content={ props.content }/>
                </Col>
            </Row>
        </Container>
    );
};

export default PresentationsStage;
