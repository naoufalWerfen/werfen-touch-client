import React from 'react';
import SideBar from "../SideBar/SideBar";
import { Col, Container, Row } from "react-bootstrap";
import Logo from "../Logo/Logo";
import './CalculatorsStage.scss';
import VisitCalculators from "../VisitCalculators/VisitCalculators";


const CalculatorsStage = ( props ) => {
    return (
        <Container fluid className={ "CalculatorsStage component" }>
            <Row>
                <Col xs={ 3 } className={ "CalculatorsStage__left" }>
                    <Logo/>
                    <SideBar/>
                </Col>
                <Col xs={ 9 } className={ "CalculatorsStage__right" }>
                    <VisitCalculators userProfile={ props.userProfile } content={ props.content }/>
                </Col>
            </Row>
        </Container>
    );
};

export default CalculatorsStage;
