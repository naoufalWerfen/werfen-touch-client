import React from 'react';
import SideBar from "../SideBar/SideBar";
import { Col, Container, Row } from "react-bootstrap";
import Logo from "../Logo/Logo";
import './VisitAllStage.scss';
import VisitAll from "../VisitAll/VisitAll";

const VisitAllStage = ( props ) => {
    return (
        <Container fluid className={ "VisitAllStage component" }>
            <Row>
                <Col xs={ 3 } className={ "VisitAllStage__left" }>
                    <Logo/>
                    <SideBar/>
                </Col>
                <Col xs={ 9 } className={ "VisitAllStage__right" }>
                    <VisitAll content={ props.content }/>
                </Col>
            </Row>
        </Container>
    );
};

export default VisitAllStage;
