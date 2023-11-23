import React from 'react';
import SideBar from "../SideBar/SideBar";
import { Col, Container, Row } from "react-bootstrap";
import Logo from "../Logo/Logo";
import './VisitSearchStage.scss';
import VisitSearch from "../VisitSearch/VisitSearch";

const VisitSearchStage = ( props ) => {
    return (
        <Container fluid className={ "SearchStage component" }>
            <Row>
                <Col xs={ 3 } className={ "SearchStage__left" }>
                    <Logo/>
                    <SideBar/>
                </Col>
                <Col xs={ 9 } className={ "SearchStage__right" }>
                    <VisitSearch/>
                </Col>
            </Row>
        </Container>
    );
};

export default VisitSearchStage;
