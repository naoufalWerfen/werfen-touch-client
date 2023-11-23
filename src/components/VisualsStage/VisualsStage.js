import React from 'react';
import SideBar from "../SideBar/SideBar";
import Visuals from "../Visuals/Visuals";
import { Col, Container, Row } from "react-bootstrap";
import Logo from "../Logo/Logo";
import './VisualsStage.scss';
// TODO: Verify that logo is on top of everything
const VisualsStage = () => {
    return (
        <Container fluid className={ "VisualsStage component" }>
            <Row className={ "h-100" }>
                <Col xs={ 3 } className={ "VisualsStage__left h-100" }>
                    <Logo/>
                    <SideBar/>
                </Col>
                <Col xs={ 9 } className={ "VisualsStage__right h-100" }>
                    <Visuals/>
                </Col>
            </Row>
        </Container>
    );
};

export default VisualsStage;
